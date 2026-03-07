// --- SIGN UP LOGIC ---
document.getElementById("signupForm").onsubmit = function(e) {
    e.preventDefault(); // Stop page from refreshing

    const name = document.getElementById("newUsername").value;
    const pass = document.getElementById("newPassword").value;

    // 1. Get current users from memory or start empty list
    let users = JSON.parse(localStorage.getItem("systemUsers")) || [];

    // 2. Check if username already exists
    if (users.find(u => u.username === name)) {
        alert("Username already taken!");
        return;
    }

    // 3. Add the new user (Defaulting to "staff" for signup, or you can add a select)
    users.push({ username: name, password: pass, role: "staff" });

    // 4. Save to memory
    localStorage.setItem("systemUsers", JSON.stringify(users));

    alert("Account created! Switching to login...");
    showLogin(); // Switch back to login form
};

// --- LOGIN LOGIC ---
document.getElementById("loginForm").onsubmit = function(e) {
    e.preventDefault();

    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    
    // Get the radio button role (Staff or Admin)
    const roleIn = document.querySelector('input[name="role"]:checked').parentElement.innerText.trim().toLowerCase();

    // 1. Get the list of real users
    let users = JSON.parse(localStorage.getItem("systemUsers")) || [];

    // 2. Find a match for name AND password
    const validUser = users.find(u => u.username === userIn && u.password === passIn);

    if (validUser) {
        // 3. Save the role to memory so admin.html knows what to do
        localStorage.setItem("role", validUser.role);
        window.location.href = "admin.html";
    } else {
        document.getElementById("error").innerText = "Invalid ID or Password!";
        document.getElementById("error").style.color = "red";
    }
};