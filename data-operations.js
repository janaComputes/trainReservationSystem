// Uses only the existing tables and columns. No RPC or schema changes.
// These browser-side operations are NOT a database transaction. Inventory
// comparisons detect some conflicts, but cannot guarantee cross-client integrity.
async function requireRow(query, message) {
    const { data, error } = await query.select().single();
    if (error) throw new Error(message + ": " + error.message);
    return data;
}

async function changeInventory(trainId, standardDelta, vipDelta) {
    const train = await requireRow(supabaseClient.from("trains").select("*").eq("id", trainId), "Could not load train");
    const standard = Number(train.available_standard_seats) + standardDelta;
    const vip = Number(train.available_vip_seats) + vipDelta;
    if (standard < 0 || vip < 0) throw new Error("Not enough seats available.");
    if (standard > Number(train.standard_seats) || vip > Number(train.vip_seats)) throw new Error("Seat totals are inconsistent. Reload and check the reservation before retrying.");
    const next = { available_standard_seats: standard, available_vip_seats: vip, status: standard + vip > 0 ? "Available" : "Full" };
    await requireRow(supabaseClient.from("trains").update(next).eq("id", trainId)
        .eq("available_standard_seats", train.available_standard_seats).eq("available_vip_seats", train.available_vip_seats)
        .eq("standard_seats", train.standard_seats).eq("vip_seats", train.vip_seats), "Inventory changed or could not be updated; reload before retrying");
    return train;
}

async function saveExistingTrain(id, payload) {
    const train = await requireRow(supabaseClient.from("trains").select("*").eq("id", id), "Could not load train");
    const standard = payload.standard_seats - (Number(train.standard_seats) - Number(train.available_standard_seats));
    const vip = payload.vip_seats - (Number(train.vip_seats) - Number(train.available_vip_seats));
    if (standard < 0 || vip < 0) throw new Error("Capacity cannot be smaller than booked seats.");
    return requireRow(supabaseClient.from("trains").update({ ...payload, available_standard_seats: standard,
        available_vip_seats: vip, status: standard + vip > 0 ? "Available" : "Full" }).eq("id", id)
        .eq("standard_seats", train.standard_seats).eq("vip_seats", train.vip_seats)
        .eq("available_standard_seats", train.available_standard_seats).eq("available_vip_seats", train.available_vip_seats), "Could not update train; reload before retrying");
}

async function writeReservationHistory(reservation, train, passenger) {
    const history = { reservation_id: reservation.id, passenger_name: passenger.name, train_name: train.name,
        ticket_type: reservation.ticket_type, route: train.route, seats: reservation.seats,
        price: reservation.price, reservation_date: reservation.reservation_date, status: reservation.status };
    const { data, error } = await supabaseClient.from("history").select("id").eq("reservation_id", reservation.id);
    if (error) throw error;
    const result = data.length
        ? await supabaseClient.from("history").update(history).eq("reservation_id", reservation.id).select("id")
        : await supabaseClient.from("history").insert(history).select("id");
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error("History write affected no visible rows.");
}

async function saveExistingReservation(id, payload) {
    const old = id ? await requireRow(supabaseClient.from("reservations").select("*").eq("id", id), "Could not load reservation") : null;
    if (old && old.status === "Canceled") throw new Error("Canceled reservations cannot be edited.");
    const train = await requireRow(supabaseClient.from("trains").select("*").eq("id", payload.train_id), "Could not load train");
    const passenger = await requireRow(supabaseClient.from("passengers").select("*").eq("id", payload.passenger_id), "Could not load passenger");
    const seats = old ? Number(old.seats) : 1;
    if (!Number.isInteger(seats) || seats <= 0) throw new Error("Invalid reservation seat quantity.");
    const sameInventory = old && old.train_id === payload.train_id && old.ticket_type === payload.ticket_type;
    const price = sameInventory ? Number(old.price) : Number(payload.ticket_type === "VIP" ? train.vip_price : train.standard_price);
    const record = { ...payload, seats, price, status: "Confirmed" };
    let inventoryChanged = false;
    if (!sameInventory) {
        await changeInventory(payload.train_id, payload.ticket_type === "Standard" ? -seats : 0, payload.ticket_type === "VIP" ? -seats : 0);
        inventoryChanged = true;
    }
    let reservation;
    try {
        const query = id ? supabaseClient.from("reservations").update(record).eq("id", id)
            .eq("status", old.status).eq("train_id", old.train_id).eq("ticket_type", old.ticket_type).eq("seats", old.seats)
            : supabaseClient.from("reservations").insert(record);
        reservation = await requireRow(query, "Could not save reservation");
    } catch (error) {
        // A failed/network-interrupted write may have committed remotely. Do not
        // blindly refund or retry: either could create a second inconsistency.
        throw new Error(error.message + (inventoryChanged ? " Inventory was updated first; reservation outcome may be uncertain. Check both records before retrying." : ""));
    }
    const warnings = [];
    if (old && !sameInventory) {
        try { await changeInventory(old.train_id, old.ticket_type === "Standard" ? seats : 0, old.ticket_type === "VIP" ? seats : 0); }
        catch (error) { warnings.push("Old train inventory needs review: " + error.message); }
    }
    try { await writeReservationHistory(reservation, train, passenger); }
    catch (error) { warnings.push("Reservation saved, but history was not updated: " + error.message); }
    return { warning: warnings.join("\n") };
}

async function cancelExistingReservation(id) {
    const reservation = await requireRow(supabaseClient.from("reservations").select("*").eq("id", id), "Could not load reservation");
    if (reservation.status === "Canceled") return { warning: "" };
    await requireRow(supabaseClient.from("reservations").update({ status: "Canceled" }).eq("id", id)
        .eq("status", reservation.status).eq("train_id", reservation.train_id).eq("ticket_type", reservation.ticket_type).eq("seats", reservation.seats), "Could not cancel reservation; reload before retrying");
    const warnings = [];
    try {
        const seats = Number(reservation.seats);
        if (!Number.isInteger(seats) || seats <= 0) throw new Error("Invalid seat quantity");
        await changeInventory(reservation.train_id, reservation.ticket_type === "Standard" ? seats : 0, reservation.ticket_type === "VIP" ? seats : 0);
    } catch (error) { warnings.push("Reservation canceled, but seat refund needs review: " + error.message); }
    try {
        const { data, error } = await supabaseClient.from("history").update({ status: "Canceled" }).eq("reservation_id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("No matching history row");
    } catch (error) { warnings.push("Reservation canceled, but history needs review: " + error.message); }
    return { warning: warnings.join("\n") };
}
