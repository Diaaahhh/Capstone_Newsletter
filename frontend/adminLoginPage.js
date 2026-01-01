// frontend/adminLoginPage.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".form");
  const emailInput = document.getElementById("admin-email");
  const passwordInput = document.getElementById("admin-password");
  const submitButton = document.querySelector(".btn-primary");
  const toggle = document.querySelector(".toggle");
  const API_URL = "http://localhost:5000/api/auth/login";

  // Password toggle logic
  if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
      const isPass = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPass ? "text" : "password");
      toggle.textContent = isPass ? "◼" : "●";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Reset validation classes
      emailInput.classList.remove("is-invalid", "is-valid");
      passwordInput.classList.remove("is-invalid", "is-valid");

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value.trim();

      // Simple validation
      if (!email || !password) {
        if (!email) emailInput.classList.add("is-invalid");
        if (!password) passwordInput.classList.add("is-invalid");
        Toast.error("Please fill in all fields.");
        return;
      }

      // Email validation regex (basic check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInput.classList.add("is-invalid");
        Toast.error("Please enter a valid email address.");
        return;
      }

      // Add loading state
      submitButton.classList.add("btn-loading");
      const originalBtnText = submitButton.textContent;
      submitButton.textContent = "Signing in...";
      submitButton.disabled = true;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        // 🔥 Very strict check — only real admin enters
        if (res.ok && data.role === "admin") {
          // Success UI
          emailInput.classList.add("is-valid");
          passwordInput.classList.add("is-valid");

          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", data.email);
          localStorage.setItem("userRole", data.role);
          localStorage.setItem("isLoggedIn", "true");

          Toast.success("Welcome Admin! Redirecting...", 2000);
          setTimeout(() => {
            window.location.href = "homepage.html";
          }, 1000);
        } else {
          // Failure UI
          emailInput.classList.add("is-invalid");
          passwordInput.classList.add("is-invalid");
          Toast.error(data.message || "Invalid admin credentials.");
        }
      } catch (err) {
        console.error("Login error:", err);
        Toast.error("Cannot connect to server. Please check your connection.");
      } finally {
        // Remove loading state
        submitButton.classList.remove("btn-loading");
        submitButton.textContent = originalBtnText;
        submitButton.disabled = false;
      }
    });
  }
});
