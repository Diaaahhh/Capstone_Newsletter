// Profile Dropdown & Logout
console.log("profileDropdown.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing profile dropdown");

  const userBtn = document.getElementById("userBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutLink = document.getElementById("logoutLink");

  // Toggle dropdown
  if (userBtn && dropdownMenu) {
    userBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      // Toggle the 'active' class on the dropdown menu
      dropdownMenu.classList.toggle("active");
    });
  }

  // Close dropdown if clicking outside
  document.addEventListener("click", function (event) {
    if (
      dropdownMenu &&
      userBtn &&
      !userBtn.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      // Remove the 'active' class to hide the dropdown
      dropdownMenu.classList.remove("active");
    }
  });

  // Logout
  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      window.location.href = "loginPage.html";
    });
  }
});

