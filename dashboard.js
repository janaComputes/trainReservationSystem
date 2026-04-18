
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function calculateOccupancy() {
  const occupancyEl = document.getElementById("occupancyRate");
  if (!occupancyEl) return;

  let trainsHTML = localStorage.getItem("trains");
  let reservationsHTML = localStorage.getItem("reservations");

  if (!trainsHTML || !reservationsHTML) {
    occupancyEl.innerText = "0%";
    return;
  }

  let trainsCount = (trainsHTML.match(/<tr>/g) || []).length;
  let reservationsCount = (reservationsHTML.match(/<tr>/g) || []).length;

  if (trainsCount === 0) {
    occupancyEl.innerText = "0%";
    return;
  }

  let rate = Math.min(100, Math.round((reservationsCount / trainsCount) * 100));
  occupancyEl.innerText = rate + "%";
}

window.addEventListener("load", calculateOccupancy);

function openBookingConfirm(passenger, train, date){

document.getElementById("bookingDetails").innerText =
"Passenger: " + passenger +
"\nTrain: " + train +
"\nDate: " + date;

document.getElementById("bookingConfirmModal").style.display = "block";

}

function closeBookingModal() {
  const modal = document.getElementById("bookingConfirmModal");
  if (modal) modal.style.display = "none";
}

function confirmBooking() {
  closeBookingModal();
  alert("Booking confirmed successfully!");
}
function updateDashboardStats(){

let trains = localStorage.getItem("trains") || "";
let reservations = localStorage.getItem("reservations") || "";

let trainCount = (trains.match(/<tr>/g) || []).length;
let reservationCount = (reservations.match(/<tr>/g) || []).length;

let passengerCount = reservationCount;

document.getElementById("totalTrains").innerText = trainCount;
document.getElementById("totalReservations").innerText = reservationCount;
document.getElementById("totalPassengers").innerText = passengerCount;

}

window.addEventListener("load", updateDashboardStats);