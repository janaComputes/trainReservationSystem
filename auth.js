// --- SIGN UP LOGIC ---
document.getElementById("signupForm").onsubmit = function(e) {
    e.preventDefault();

    const name = document.getElementById("newUsername").value;
    const pass = document.getElementById("newPassword").value;
    
    // Grab the value from the ROUND radio buttons
    const roleElement = document.querySelector('input[name="newRole"]:checked');
    
    if (!roleElement) {
        alert("Please select a role!");
        return;
    }

    const role = roleElement.value;
    let users = JSON.parse(localStorage.getItem("systemUsers")) || [];

    if (users.find(u => u.username === name)) {
        alert("Username already taken!");
        return;
    }

    users.push({ username: name, password: pass, role: role });
    localStorage.setItem("systemUsers", JSON.stringify(users));

    alert("Account created! You can now log in.");
    showLogin();
};

// --- LOGIN LOGIC ---
document.getElementById("loginForm").onsubmit = function(e) {
    e.preventDefault();

    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    
    let users = JSON.parse(localStorage.getItem("systemUsers")) || [];

    // Find a match for name AND password
    const validUser = users.find(u => u.username === userIn && u.password === passIn);

    if (validUser) {
        // IMPORTANT: Save the role from the DATABASE, not the radio button
        localStorage.setItem("role", validUser.role);
        window.location.href = "admin.html";
    } else {
        document.getElementById("error").innerText = "Invalid ID or Password!";
        document.getElementById("error").style.color = "red";
    }
};