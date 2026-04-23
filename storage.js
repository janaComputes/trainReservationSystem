// storage.js

function saveAllData() {
    const trainTable = document.getElementById("trainTable");
    const passengerTable = document.getElementById("passengerTable");
    const reservationTable = document.getElementById("reservationTable");

    if (trainTable) localStorage.setItem("trains", trainTable.innerHTML);
    if (passengerTable) localStorage.setItem("passengers", passengerTable.innerHTML);
    if (reservationTable) localStorage.setItem("reservations", reservationTable.innerHTML);

    const history = [];
    const historyRows = document.querySelectorAll("#historyTable tr");

    historyRows.forEach(row => {
        // We check for 9 because that's our full report structure
        if (row.cells.length >= 9) {
            history.push({
                id: row.cells[0].innerText,
                date: row.cells[1].innerText,
                passenger: row.cells[2].innerText,
                train: row.cells[3].innerText,
                type: row.cells[4].innerText,
                route: row.cells[5].innerText,
                seats: row.cells[6].innerText,
                price: row.cells[7].innerText,
                status: row.cells[8].innerText
            });
        }
    });

    localStorage.setItem("trainHistory", JSON.stringify(history));
}

function loadAllData() {
    const savedTrains = localStorage.getItem("trains");
    const savedPassengers = localStorage.getItem("passengers");
    const savedReservations = localStorage.getItem("reservations");

    if (savedTrains) document.getElementById("trainTable").innerHTML = savedTrains;
    if (savedPassengers) document.getElementById("passengerTable").innerHTML = savedPassengers;
    if (savedReservations) document.getElementById("reservationTable").innerHTML = savedReservations;

    const hTable = document.getElementById("historyTable");
    if (hTable) {
        const savedHistory = JSON.parse(localStorage.getItem("trainHistory") || "[]");

        if (savedHistory.length > 0) {
            hTable.innerHTML = "";
            savedHistory.forEach(item => {
                // Inside storage.js -> loadAllData loop
                const row = hTable.insertRow();
                row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.date}</td>
    <td>${item.passenger}</td>
    <td>${item.train}</td>
    <td>${item.type}</td>   <td>${item.route}</td>  <td>${item.seats}</td>  <td>${item.price}</td>  <td>${item.status}</td> `;
            });
        }
    }

    // Final touch: Refresh the cards after loading
    if (typeof updateReportAnalytics === "function") {
        updateReportAnalytics();
    }
}

function clearAllSystemData() {
    if (confirm("Are you sure you want to wipe all system data? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

setTimeout(updateReportAnalytics, 150);