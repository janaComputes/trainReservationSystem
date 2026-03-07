function saveData(key,data){};

function saveAllData() {
    localStorage.setItem("trains", document.getElementById("trainTable").innerHTML);
    localStorage.setItem("passengers", document.getElementById("passengerTable").innerHTML);
    localStorage.setItem("reservations", document.getElementById("reservationTable").innerHTML);
}


function loadAllData() {
    if (localStorage.getItem("trains")) {
        document.getElementById("trainTable").innerHTML = localStorage.getItem("trains");
    }
    if (localStorage.getItem("passengers")) {
        document.getElementById("passengerTable").innerHTML = localStorage.getItem("passengers");
    }
    if (localStorage.getItem("reservations")) {
        document.getElementById("reservationTable").innerHTML = localStorage.getItem("reservations");
    }
}
