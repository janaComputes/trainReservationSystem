
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if(!currentUser){
window.location.href = "login.html";
}


if(window.location.pathname.includes("admin.html") && currentUser.role !== "ADMIN"){
window.location.href = "staff.html";
}

function logout(){
localStorage.removeItem("currentUser");
window.location.href = "login.html";
}
