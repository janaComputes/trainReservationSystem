
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// if(!currentUser){
// window.location.href = "login.html";
// }


// if(window.location.pathname.includes("admin.html") && currentUser.role !== "ADMIN"){
//  window.location.href = "staff.html";



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
