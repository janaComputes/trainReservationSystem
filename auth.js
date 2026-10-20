let signingUp = false;
document.getElementById("signupForm").onsubmit = async function(e) {
    e.preventDefault();
    const button = e.submitter;
    if (signingUp) return;
    signingUp = true;
    if (button) button.disabled = true;
    try {

    const name = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const pass = document.getElementById("newPassword").value;

    const roleElement = document.querySelector('input[name="newRole"]:checked');
    if (!roleElement) {
        alert("Please select a role!");
        return;
    }

    // ✅ تحقق الموافقة على الخصوصية
    const privacyAccepted = document.getElementById("privacyCheck").checked;
    if (!privacyAccepted) {
        alert("You must agree to the Privacy Policy first.");
        return;
    }

    // ✅ تحقق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById("signupError").innerText = "Please enter a valid email address.";
        return;
    }

    // ✅ تحقق قوة كلمة المرور
    // على الأقل 8 خانات + رقم + حرف كبير + رمز
    const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passRegex.test(pass)) {
        document.getElementById("signupError").innerText = 
            "Password must be at least 8 characters, include a number, a symbol, and a capital letter.";
        return;
    }

    // ✅ إنشاء الحساب عبر Supabase Auth
    document.getElementById("signupError").innerText = "";

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: pass,
        options: {
            data: { username: name, role: roleElement.value.toUpperCase() }
        }
    });

    if (error) {
        document.getElementById("signupError").innerText = error.message;
        return;
    }

    alert(data.session ? "Account created! You can now log in." : "Check your email for a confirmation link before signing in.");
    showLogin();
    } catch (error) {
        document.getElementById("signupError").textContent = "Could not create account: " + error.message;
    } finally { signingUp = false; if (button) button.disabled = false; }
};
