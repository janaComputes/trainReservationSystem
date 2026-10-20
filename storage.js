// storage.js
// Loads/persists trains, passengers, reservations and history from Supabase.
// Row-level Supabase writes now happen at the point of each add/edit/delete
// action in admin.html using the existing Supabase table operations.

async function loadAllData() {
    const errors = [];
    const trainTable = document.getElementById("trainTable");
    const passengerTable = document.getElementById("passengerTable");
    const reservationTable = document.getElementById("reservationTable");
    const historyTable = document.getElementById("historyTable");

    if (trainTable) {
        const { data: trains, error } = await supabaseClient.from("trains").select("*").order("created_at");
        if (error) { errors.push("Could not load trains: " + error.message); }
        else {
        trainTable.innerHTML = "";
        (trains || []).forEach((t, idx) => {
            const total = Number(t.standard_seats) + Number(t.vip_seats);
            const available = Number(t.available_standard_seats) + Number(t.available_vip_seats);
            t.status = available > 0 ? "Available" : "Full";
            const row = insertNewRow([
                "T" + (idx + 10), t.name, t.route, total, available,
                t.status, t.departure_time, t.arrival_time,
                `STD ${t.standard_price} / VIP ${t.vip_price}`
            ], t.id, "Train");
            row.cells[5].style.color = t.status === "Full" ? "red" : "green";
            row.dataset.standardAvailable = t.available_standard_seats;
            row.dataset.vipAvailable = t.available_vip_seats;
            row.dataset.standardPrice = t.standard_price;
            row.dataset.vipPrice = t.vip_price;
            row.dataset.standardSeats = t.standard_seats;
            row.dataset.vipSeats = t.vip_seats;
        });
        }
    }

    if (passengerTable) {
        const { data: passengers, error } = await supabaseClient.from("passengers").select("*").order("created_at");
        if (error) { errors.push("Could not load passengers: " + error.message); }
        else {
        passengerTable.innerHTML = "";
        (passengers || []).forEach((p, idx) => {
            insertNewRow(["P" + (idx + 10), p.name, p.email, p.phone], p.id, "Passenger");
        });
        }
    }

    if (reservationTable) {
        const { data: reservations, error } = await supabaseClient
            .from("reservations")
            .select("*, passengers(name), trains(name)")
            .order("created_at");
        if (error) { errors.push("Could not load reservations: " + error.message); }
        else {
        reservationTable.innerHTML = "";
        (reservations || []).forEach((r, idx) => {
            const passengerName = r.passengers ? r.passengers.name : "Unknown";
            const trainName = r.trains ? r.trains.name : "Unknown";
            const row = insertNewRow([
                "R" + (idx + 10), passengerName, trainName, r.ticket_type, r.seats, r.reservation_date, r.status
            ], r.id, "Reservation");
            row.dataset.passengerId = r.passenger_id;
            row.dataset.trainId = r.train_id;
            row.dataset.price = r.price;
            if (r.status === "Canceled") {
                row.cells[6].innerHTML = "<span style='color:red'>Canceled</span>";
                const delBtn = row.querySelector(".action-delete");
                if (delBtn) delBtn.style.display = "none";
            }
        });
        }
    }

    if (historyTable) {
        const { data: history, error } = await supabaseClient
            .from("history")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) { errors.push("Could not load history: " + error.message); }
        else {
        historyTable.innerHTML = "";
        (history || []).forEach(h => {
            const row = historyTable.insertRow();
            row.dataset.dbId = h.id;
            if (h.reservation_id) row.dataset.reservationDbId = h.reservation_id;
            [String(h.id).slice(0, 8), h.reservation_date, h.passenger_name, h.train_name, h.ticket_type, h.route, h.seats, h.price, h.status].forEach(value => { row.insertCell().textContent = value; });
            row.cells[8].style.color = h.status === "Confirmed" ? "green" : "red";
            if (h.ticket_type === "VIP") row.cells[4].classList.add("vip");
        });
        }
    }

    if (typeof updateDashboard === "function") updateDashboard();
    // Final touch: Refresh the cards after loading
    if (typeof updateReportAnalytics === "function") {
        updateReportAnalytics();
    }
    if (errors.length) throw new Error(errors.join("\n"));
}

function saveAllData() {
    // No-op: every add/edit/delete action already writes straight to Supabase
    // at the point it happens, so there's nothing left to bulk-persist here.
}

let clearingSystemData = false;
async function clearAllSystemData() {
    if (clearingSystemData) return;
    if (confirm("Are you sure you want to wipe all system data (trains, passengers, reservations, history)? This cannot be undone.")) {
        try {
            clearingSystemData = true;
            for (const table of ["history", "reservations", "trains", "passengers"]) {
                const { error } = await supabaseClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
                if (error) throw new Error(table + ": " + error.message);
            }
            location.reload();
        } catch (error) { alert("Clearing stopped; earlier tables may already be cleared. Reload to check current data. " + error.message); }
        finally { clearingSystemData = false; }
    }
}
