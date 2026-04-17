
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
let editingRow = null;
// if (!currentUser) {
// window.location.replace("login.html");
// }


if(!currentUser){
window.location.href = "login.html";
}

if(currentUser.role === "STAFF"){

document.getElementById("addTrain").style.display = "none";
document.getElementById("addPassenger").style.display = "none";

}
function logout(){
localStorage.removeItem("currentUser");
window.location.href = "login.html";
}

// Calculate Seat Occupancy
function calculateOccupancy() {

let trainsHTML = localStorage.getItem("trains");
let reservationsHTML = localStorage.getItem("reservations");

if(!trainsHTML || !reservationsHTML){
document.getElementById("occupancyRate").innerText = "0%";
return;
}

let trainsCount = (trainsHTML.match(/<tr>/g) || []).length;
let reservationsCount = (reservationsHTML.match(/<tr>/g) || []).length;

if(trainsCount === 0){
document.getElementById("occupancyRate").innerText = "0%";
return;
}

let rate = Math.min(100, Math.round((reservationsCount / trainsCount) * 100));

document.getElementById("occupancyRate").innerText = rate + "%";

}

window.onload = calculateOccupancy;

function editTrain(btn) {

    const row = btn.parentElement.parentElement;

    const trainName = row.cells[1].innerText;
    const route = row.cells[2].innerText;
    const seats = row.cells[3].innerText;

    document.getElementById("input1").value = trainName;
    document.getElementById("input2").value = route;
    document.getElementById("inputStandardSeats").value = seats;
}