document.getElementById("loginForm").addEventListener("submit", function(e){

e.preventDefault();

const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

const user = users.find(u =>
u.username === username && u.password === password
);

if(user){
localStorage.setItem("currentUser", JSON.stringify(user));
if (user.role==="ADMIN") {
    window.location.href="admin.html";
} else {
    window.location.href = "staff.html";
}

}else{
document.getElementById("error").textContent = "Invalid login credentials";
}

});

