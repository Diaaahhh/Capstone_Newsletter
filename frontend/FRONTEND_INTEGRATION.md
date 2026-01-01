# Frontend Integration Guide

This guide explains how to integrate the existing frontend pages with the new backend API for authentication.

## API Endpoints

The backend provides the following authentication endpoints:

1. **Register User**: `POST /api/auth/register`

   - Request body: `{ id, name, email, password }`
   - Response: `{ _id, id, name, email, role, token }`

2. **Login User**: `POST /api/auth/login`

   - Request body: `{ email, password }`
   - Response: `{ _id, id, name, email, role, token }`

3. **Get User Profile**: `GET /api/auth/me`
   - Headers: `Authorization: Bearer <token>`
   - Response: `{ _id, id, name, email, role, createdAt, updatedAt }`

## Integration Steps

### 1. Update Registration Page (registerPage.html)

Replace the existing form submission logic with API calls:

```javascript
// Form validation and registration
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.querySelector(".form");
  const idInput = document.getElementById("id");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitButton = document.querySelector(".btn-primary");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Reset validation classes
      idInput.classList.remove("is-invalid", "is-valid");
      nameInput.classList.remove("is-invalid", "is-valid");
      emailInput.classList.remove("is-invalid", "is-valid");
      passwordInput.classList.remove("is-invalid", "is-valid");

      // Get input values
      const id = idInput.value.trim();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Simple validation
      if (!id || !name || !email || !password) {
        if (!id) idInput.classList.add("is-invalid");
        if (!name) nameInput.classList.add("is-invalid");
        if (!email) emailInput.classList.add("is-invalid");
        if (!password) passwordInput.classList.add("is-invalid");
        alert("Please fill in all fields.");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInput.classList.add("is-invalid");
        alert("Please enter a valid email address.");
        return;
      }

      // Password validation
      if (password.length < 6) {
        passwordInput.classList.add("is-invalid");
        alert("Password must be at least 6 characters long.");
        return;
      }

      // Add loading state to submit button
      submitButton.classList.add("btn-loading");
      submitButton.disabled = true;

      try {
        // Send registration request to backend
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Add success validation
          idInput.classList.add("is-valid");
          nameInput.classList.add("is-valid");
          emailInput.classList.add("is-valid");
          passwordInput.classList.add("is-valid");

          // Store token and user data in localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data));

          // Redirect to appropriate homepage based on role
          if (data.role === "faculty") {
            window.location.href = "facultyHomepage.html";
          } else {
            window.location.href = "homepage.html";
          }
        } else {
          // Add error validation
          if (data.message.includes("User already exists")) {
            emailInput.classList.add("is-invalid");
          }
          alert(data.message || "Registration failed. Please try again.");
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration. Please try again.");
      } finally {
        // Remove loading state
        submitButton.classList.remove("btn-loading");
        submitButton.disabled = false;
      }
    });
  }
});
```

### 2. Update Login Page (loginPage.html)

Replace the existing form submission logic with API calls:

```javascript
// Form validation and authentication
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitButton = document.querySelector(".btn-primary");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Reset validation classes
      emailInput.classList.remove("is-invalid", "is-valid");
      passwordInput.classList.remove("is-invalid", "is-valid");

      // Get input values
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Simple validation
      if (!email || !password) {
        if (!email) emailInput.classList.add("is-invalid");
        if (!password) passwordInput.classList.add("is-invalid");
        alert("Please fill in all fields.");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInput.classList.add("is-invalid");
        alert("Please enter a valid email address.");
        return;
      }

      // Add loading state to submit button
      submitButton.classList.add("btn-loading");
      submitButton.disabled = true;

      try {
        // Send login request to backend
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Add success validation
          emailInput.classList.add("is-valid");
          passwordInput.classList.add("is-valid");

          // Store token and user data in localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data));

          // Redirect to appropriate homepage based on role
          if (data.role === "faculty") {
            window.location.href = "facultyHomepage.html";
          } else {
            window.location.href = "homepage.html";
          }
        } else {
          // Add error validation
          emailInput.classList.add("is-invalid");
          passwordInput.classList.add("is-invalid");
          alert(data.message || "Invalid email or password. Please try again.");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
      } finally {
        // Remove loading state
        submitButton.classList.remove("btn-loading");
        submitButton.disabled = false;
      }
    });
  }
});
```

### 3. Update Admin Login Page (adminLoginPage.html)

Replace the existing form submission logic with API calls:

```javascript
// Form validation and authentication
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".form");
  const emailInput = document.getElementById("admin-email");
  const passwordInput = document.getElementById("admin-password");
  const submitButton = document.querySelector(".btn-primary");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Reset validation classes
      emailInput.classList.remove("is-invalid", "is-valid");
      passwordInput.classList.remove("is-invalid", "is-valid");

      // Get input values
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Simple validation
      if (!email || !password) {
        if (!email) emailInput.classList.add("is-invalid");
        if (!password) passwordInput.classList.add("is-invalid");
        alert("Please fill in all fields.");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInput.classList.add("is-invalid");
        alert("Please enter a valid email address.");
        return;
      }

      // Add loading state to submit button
      submitButton.classList.add("btn-loading");
      submitButton.disabled = true;

      try {
        // Send login request to backend
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Check if user is admin
          if (data.role !== "admin") {
            emailInput.classList.add("is-invalid");
            passwordInput.classList.add("is-invalid");
            alert("Access denied. Admin credentials required.");
            return;
          }

          // Add success validation
          emailInput.classList.add("is-valid");
          passwordInput.classList.add("is-valid");

          // Store token and user data in localStorage
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data));

          // Redirect to admin homepage
          window.location.href = "adminHomepage.html";
        } else {
          // Add error validation
          emailInput.classList.add("is-invalid");
          passwordInput.classList.add("is-invalid");
          alert(
            data.message || "Invalid admin email or password. Please try again."
          );
        }
      } catch (error) {
        console.error("Admin login error:", error);
        alert("An error occurred during admin login. Please try again.");
      } finally {
        // Remove loading state
        submitButton.classList.remove("btn-loading");
        submitButton.disabled = false;
      }
    });
  }
});
```

### 4. Update Session Management

Update the session check scripts in all pages to use the new token-based authentication:

```javascript
// Check if user is logged in
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (token && user) {
  // User is logged in
  // You can verify the token with the backend if needed
  // For now, we'll trust the stored token
} else {
  // User is not logged in
  // Redirect to login page if accessing protected pages
  // Example for pages that require authentication:
  /*
  if (!window.location.href.includes("loginPage.html") && 
      !window.location.href.includes("registerPage.html") && 
      !window.location.href.includes("adminLoginPage.html")) {
    window.location.href = "loginPage.html";
  }
  */
}
```

### 5. Logout Functionality

Add this logout function to clear the session:

```javascript
function logout() {
  // Clear session data
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Redirect to login page
  window.location.href = "loginPage.html?logout=true";
}
```

## Testing the Integration

1. Make sure the backend server is running (`npm run dev`)
2. Update the frontend pages with the new code
3. Test the registration flow with a new user
4. Test the login flow with existing credentials
5. Verify that the role-based redirection works correctly

## Notes

- The backend automatically determines the user role based on their email domain:
  - `@std.ewubd.edu` = Student
  - `@ewubd.edu` (but not @std.ewubd.edu) = Faculty
  - `admin@ewubd.edu` = Admin
- Passwords are securely hashed using bcrypt
- Authentication tokens are JWTs with a 7-day expiration
- All communication between frontend and backend should happen over HTTPS in production
