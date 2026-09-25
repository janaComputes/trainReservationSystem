
(async function () {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
  }
})();

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function calculateOccupancy() {
  const occupancyEl = document.getElementById("occupancyRate");
  if (!occupancyEl) return;

  const { count: trainsCount } = await supabaseClient.from("trains").select("*", { count: "exact", head: true });
  const { count: reservationsCount } = await supabaseClient.from("reservations").select("*", { count: "exact", head: true });

  if (!trainsCount) {
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

async function updateDashboardStats(){
  const { count: trainCount } = await supabaseClient.from("trains").select("*", { count: "exact", head: true });
  const { count: reservationCount } = await supabaseClient.from("reservations").select("*", { count: "exact", head: true });
  const { count: passengerCount } = await supabaseClient.from("passengers").select("*", { count: "exact", head: true });

  document.getElementById("totalTrains").innerText = trainCount || 0;
  document.getElementById("totalReservations").innerText = reservationCount || 0;
  document.getElementById("totalPassengers").innerText = passengerCount || 0;
}

window.addEventListener("load", updateDashboardStats);
