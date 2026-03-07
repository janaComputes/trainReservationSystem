
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
    window.location.replace("login.html");
}



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
