
(async function () {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) { alert("Could not check session: " + error.message); return; }
  if (!session) {
    window.location.href = "index.html";
  }
})();

async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) { alert(error.message); return; }
  window.location.href = "index.html";
}

async function calculateOccupancy() {
  if (document.getElementById("trainTable")) return;
  const occupancyEl = document.getElementById("occupancyRate");
  if (!occupancyEl) return;

  const { data, error } = await supabaseClient.from("trains").select("standard_seats,vip_seats,available_standard_seats,available_vip_seats");
  if (error) { occupancyEl.textContent = "Unavailable"; console.error(error); return; }
  const trainsCount = data.reduce((n, t) => n + Number(t.standard_seats) + Number(t.vip_seats), 0);
  const free = data.reduce((n, t) => n + Number(t.available_standard_seats) + Number(t.available_vip_seats), 0);
  const reservationsCount = trainsCount - free;

  if (!trainsCount) {
    occupancyEl.innerText = "0%";
    return;
  }

  let rate = Math.min(100, Math.round((reservationsCount / trainsCount) * 100));
  occupancyEl.innerText = rate + "%";
}

window.addEventListener("load", calculateOccupancy);

function openBookingConfirm(passenger, train, date){
if (!document.getElementById("bookingDetails") || !document.getElementById("bookingConfirmModal")) return;

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
  // Only the persisted reservation operation can confirm a booking.
}

async function updateDashboardStats(){
  if (document.getElementById("trainTable")) return;
  for (const [id, table] of [["totalTrains", "trains"], ["totalReservations", "reservations"], ["totalPassengers", "passengers"]]) {
    const target = document.getElementById(id);
    if (!target) continue;
    const { count, error } = await supabaseClient.from(table).select("*", { count: "exact", head: true });
    target.textContent = error ? "Unavailable" : count;
    if (error) console.error(error);
  }
}

window.addEventListener("load", updateDashboardStats);
