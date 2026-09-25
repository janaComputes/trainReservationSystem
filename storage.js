// storage.js
// Loads/persists trains, passengers, reservations and history from Supabase.
// Row-level Supabase writes now happen at the point of each add/edit/delete
// action in admin.html, so saveAllData() is kept only so existing call sites
// don't need to change, and clearAllSystemData() wipes the operational tables.

async function loadAllData() {
    const trainTable = document.getElementById("trainTable");
    const passengerTable = document.getElementById("passengerTable");
    const reservationTable = document.getElementById("reservationTable");
    const historyTable = document.getElementById("historyTable");

    if (trainTable) {
        const { data: trains, error } = await supabaseClient.from("trains").select("*").order("created_at");
        if (error) { console.error("Could not load trains:", error.message); }
        trainTable.innerHTML = "";
        currentTable = "Train";
        (trains || []).forEach((t, idx) => {
            const total = t.standard_seats + t.vip_seats;
            const available = t.available_standard_seats + t.available_vip_seats;
            const row = insertNewRow([
                "T" + (idx + 10), t.name, t.route, total, available,
                t.status, t.departure_time, t.arrival_time,
                `STD ${t.standard_price} / VIP ${t.vip_price}`
            ], t.id);
            row.cells[5].style.color = t.status === "Full" ? "red" : "green";
            row.dataset.standardAvailable = t.available_standard_seats;
            row.dataset.vipAvailable = t.available_vip_seats;
            row.dataset.standardPrice = t.standard_price;
            row.dataset.vipPrice = t.vip_price;
            row.dataset.standardSeats = t.standard_seats;
            row.dataset.vipSeats = t.vip_seats;
        });
    }

    if (passengerTable) {
        const { data: passengers, error } = await supabaseClient.from("passengers").select("*").order("created_at");
        if (error) { console.error("Could not load passengers:", error.message); }
        passengerTable.innerHTML = "";
        currentTable = "Passenger";
        (passengers || []).forEach((p, idx) => {
            insertNewRow(["P" + (idx + 10), p.name, p.email, p.phone], p.id);
        });
    }

    if (reservationTable) {
        const { data: reservations, error } = await supabaseClient
            .from("reservations")
            .select("*, passengers(name), trains(name)")
            .order("created_at");
        if (error) { console.error("Could not load reservations:", error.message); }
        reservationTable.innerHTML = "";
        currentTable = "Reservation";
        (reservations || []).forEach((r, idx) => {
            const passengerName = r.passengers ? r.passengers.name : "Unknown";
            const trainName = r.trains ? r.trains.name : "Unknown";
            const row = insertNewRow([
                "R" + (idx + 10), passengerName, trainName, r.ticket_type, r.seats, r.reservation_date, r.status
            ], r.id);
            if (r.status === "Canceled") {
                row.cells[6].innerHTML = "<span style='color:red'>Canceled</span>";
                const delBtn = row.querySelector(".action-delete");
                if (delBtn) delBtn.style.display = "none";
            }
        });
    }

    if (historyTable) {
        const { data: history, error } = await supabaseClient
            .from("history")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) { console.error("Could not load history:", error.message); }
        historyTable.innerHTML = "";
        (history || []).forEach(h => {
            const row = historyTable.insertRow();
            row.dataset.dbId = h.id;
            if (h.reservation_id) row.dataset.reservationDbId = h.reservation_id;
            row.innerHTML = `
                <td>${h.id.slice(0, 8)}</td>
                <td>${h.reservation_date}</td>
                <td>${h.passenger_name}</td>
                <td>${h.train_name}</td>
                <td>${h.ticket_type === "VIP" ? "<span class='vip'>VIP</span>" : "Standard"}</td>
                <td>${h.route}</td>
                <td>${h.seats}</td>
                <td>${h.price}</td>
                <td><span style="color:${h.status === "Confirmed" ? "green" : "red"}">${h.status}</span></td>
            `;
        });
    }

    // Final touch: Refresh the cards after loading
    if (typeof updateReportAnalytics === "function") {
        updateReportAnalytics();
    }
}

function saveAllData() {
    // No-op: every add/edit/delete action already writes straight to Supabase
    // at the point it happens, so there's nothing left to bulk-persist here.
}

async function clearAllSystemData() {
    if (confirm("Are you sure you want to wipe all system data (trains, passengers, reservations, history)? This cannot be undone.")) {
        await supabaseClient.from("history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabaseClient.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabaseClient.from("trains").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabaseClient.from("passengers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        location.reload();
    }
}
