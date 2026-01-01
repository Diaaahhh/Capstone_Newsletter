// frontend/majorEvents.js
console.log("majorEvents.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded for major events page");
  // Form submission logic removed as it is handled in CreateMajorEvent.js

  // ===============================
  // ELEMENT SELECTION
  // ===============================
  const filterToggle = document.getElementById("filterToggle");
  const filterDropdown = document.getElementById("filterDropdown");
  const userBtn = document.getElementById("userBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutLink = document.getElementById("logoutLink");
  // const form = document.getElementById("majorEventForm");
  // const draftBtn = document.getElementById("saveDraftBtn");
  // const submitBtn = document.getElementById("submitBtn");

  // const API_URL = "http://localhost:5000/api/majorevents";
  // const userId = localStorage.getItem("userId") || "67f1234567890abcdef0001";

  console.log("Elements found:", {
    filterToggle,
    filterDropdown,
    userBtn,
    dropdownMenu,
    logoutLink,
  });

  // ===============================
  // PROFILE DROPDOWN LOGIC
  // ===============================
  if (userBtn && dropdownMenu) {
    userBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      // Toggle dropdown visibility
      if (dropdownMenu.style.display === "block") {
        dropdownMenu.style.display = "none";
        dropdownMenu.style.opacity = "0";
        dropdownMenu.style.visibility = "hidden";
        dropdownMenu.style.transform = "translateY(-10px)";
        dropdownMenu.style.pointerEvents = "none";
      } else {
        dropdownMenu.style.display = "block";
        dropdownMenu.style.opacity = "1";
        dropdownMenu.style.visibility = "visible";
        dropdownMenu.style.transform = "translateY(0)";
        dropdownMenu.style.pointerEvents = "auto";
      }
    });
  } else {
    console.error("User button or dropdown menu not found");
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    if (
      dropdownMenu &&
      userBtn &&
      !userBtn.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
      dropdownMenu.style.opacity = "0";
      dropdownMenu.style.visibility = "hidden";
      dropdownMenu.style.transform = "translateY(-10px)";
      dropdownMenu.style.pointerEvents = "none";
    }
  });

  // ===============================
  // LOGOUT FUNCTIONALITY
  // ===============================
  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");

      dropdownMenu.style.display = "none";
      dropdownMenu.style.opacity = "0";
      dropdownMenu.style.visibility = "hidden";
      dropdownMenu.style.transform = "translateY(-10px)";
      dropdownMenu.style.pointerEvents = "none";

      window.location.href = "loginPage.html";
    });
  }

  // ===============================
  // FILTER DROPDOWN LOGIC
  // ===============================
  if (filterToggle && filterDropdown) {
    filterToggle.addEventListener("click", function () {
      filterToggle.classList.toggle("active");
      filterDropdown.classList.toggle("active");
    });

    document.addEventListener("click", function (event) {
      // prevent closing when clicking profile dropdown
      if (dropdownMenu && dropdownMenu.classList.contains("active")) return;

      if (
        !filterToggle.contains(event.target) &&
        !filterDropdown.contains(event.target)
      ) {
        filterToggle.classList.remove("active");
        filterDropdown.classList.remove("active");
      }
    });
  }

  // ===============================
  // BACKEND CONNECTION (SAVE + SUBMIT)
  // ===============================
  // Backend connection for creation is handled in CreateMajorEvent.js
});
