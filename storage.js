// storage.js

/**
 * Saves all current table data to the browser's LocalStorage.
 * This includes raw HTML for the main tables and an Object array for History.
 */
function saveAllData() {
    // 1. Save main management tables as HTML strings
    const trainTable = document.getElementById("trainTable");
    const passengerTable = document.getElementById("passengerTable");
    const reservationTable = document.getElementById("reservationTable");

    if (trainTable) localStorage.setItem("trains", trainTable.innerHTML);
    if (passengerTable) localStorage.setItem("passengers", passengerTable.innerHTML);
    if (reservationTable) localStorage.setItem("reservations", reservationTable.innerHTML);

    // 2. Save History Table as a JSON array to preserve specific data
    const history = [];
    const historyRows = document.querySelectorAll("#historyTable tr");
    
    historyRows.forEach(row => {
        // Skip rows that don't have enough cells (like empty placeholders)
        if (row.cells.length >= 8) {
            history.push({
                id: row.cells[0].innerText,
                date: row.cells[1].innerText,
                passenger: row.cells[2].innerText,
                train: row.cells[3].innerText,
                route: row.cells[4].innerText,
                seats: row.cells[5].innerText,
                price: row.cells[6].innerText,
                status: row.cells[7].innerHTML // Preservation of the color <span>
            });
        }
    });
    
    localStorage.setItem("trainHistory", JSON.stringify(history));
}

/**
 * Loads all data from LocalStorage back into the UI.
 * This should be called inside window.onload in admin.html.
 */
function loadAllData() {
    // 1. Load main management tables
    const savedTrains = localStorage.getItem("trains");
    const savedPassengers = localStorage.getItem("passengers");
    const savedReservations = localStorage.getItem("reservations");

    if (savedTrains) document.getElementById("trainTable").innerHTML = savedTrains;
    if (savedPassengers) document.getElementById("passengerTable").innerHTML = savedPassengers;
    if (savedReservations) document.getElementById("reservationTable").innerHTML = savedReservations;

    // 2. Load History Table
    const hTable = document.getElementById("historyTable");
    if (hTable) {
        const savedHistory = JSON.parse(localStorage.getItem("trainHistory") || "[]");
        
        // Only clear and rebuild if we actually have saved data
        if (savedHistory.length > 0) {
            hTable.innerHTML = ""; 
            savedHistory.forEach(item => {
                const row = hTable.insertRow();
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.date}</td>
                    <td>${item.passenger}</td>
                    <td>${item.train}</td>
                    <td>${item.route}</td>
                    <td>${item.seats}</td>
                    <td>${item.price}</td>
                    <td>${item.status}</td>
                `;
            });
        }
    }
}

/**
 * Helper function to clear all data (useful for testing)
 */
function clearAllSystemData() {
    if (confirm("Are you sure you want to wipe all system data? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}