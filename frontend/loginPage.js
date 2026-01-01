// frontend/loginPage.js

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitButton = document.querySelector(".btn-primary");

  const API_BASE = "http://localhost:5000/api/auth/login";

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      Toast.error("Please fill in all fields.");
      return;
    }

    // 🔥 RESTRICTION: Block admins from here
    if (email === "admin@ewubd.edu") {
      Toast.warning("Admins must login from the Admin Login Page.");
      setTimeout(() => {
        window.location.href = "adminLoginPage.html";
      }, 1500);
      return;
    }

    // 🔥 RESTRICTION: Block outsiders (non-EWU emails)
    if (
      !email.endsWith("@std.ewubd.edu") &&
      !email.endsWith("@ewubd.edu")
    ) {
      Toast.error("Only EWU students or faculty can login.");
      return;
    }

    // 🔥 RESTRICTION: If faculty tries email without @ewubd.edu
    if (email.endsWith("@ewubd.edu") && !email.endsWith("@std.ewubd.edu")) {
      // This is faculty → allowed
    }

    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // EXTRA SECURITY: Double-check role from backend
        if (data.role === "admin") {
          Toast.warning("Admins cannot login from this page.");
          setTimeout(() => {
            window.location.href = "adminLoginPage.html";
          }, 1500);
          return;
        }

        // Save session
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("isLoggedIn", "true");

        Toast.success("Login successful! Redirecting...", 2000);

        // Student or Faculty → homepage
        setTimeout(() => {
          window.location.href = "homepage.html";
        }, 1000);
      } else {
        Toast.error(data.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      Toast.error("Server connection failed. Make sure backend is running.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign in";
    }
  });
});
