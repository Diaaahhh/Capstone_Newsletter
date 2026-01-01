// Profile Dropdown and Filter Functionality

// Function to check if user has access to create/draft buttons
function hasCreateAccess() {
  // Check if user is logged in
  if (!localStorage.getItem("isLoggedIn")) {
    return false;
  }

  // Get user email from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // If no email found, deny access
  if (!userEmail) {
    return false;
  }

  // Check if email ends with valid domains for create access
  // Students have emails ending with "@std.ewubd.edu"
  // Faculty/Admin have emails ending with "@ewubd.edu" (but not "@std.ewubd.edu")
  if (
    userEmail.endsWith("@std.ewubd.edu") ||
    userEmail.endsWith("@ewubd.edu")
  ) {
    return true;
  }

  // For all other email domains, deny create access
  return false;
}

// Profile Dropdown and Filter Functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded for category pages");
  try {
    // Check if user has access to create/draft buttons and hide/show accordingly
    const actionButtons = document.getElementById("actionButtons");
    if (actionButtons) {
      if (!hasCreateAccess()) {
        // Hide the action buttons for users without create access
        actionButtons.style.display = "none";
      }
    }

    const filterToggle = document.getElementById("filterToggle");
    const filterDropdown = document.getElementById("filterDropdown");
    const userBtn = document.getElementById("userBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const logoutLink = document.getElementById("logoutLink");

    console.log("Elements found:", {
      actionButtons,
      filterToggle,
      filterDropdown,
      userBtn,
      dropdownMenu,
      logoutLink,
    });

    // Profile dropdown is handled by profileDropdown.js
    // Removed duplicate code to prevent conflicts

    // Handle logout
    if (logoutLink) {
      logoutLink.addEventListener("click", function (event) {
        event.preventDefault();

        // Perform logout operations
        // For example, clear any stored session data
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");

        // Close dropdown menu
        if (dropdownMenu) {
          dropdownMenu.classList.remove("active");
        }

        // Redirect to login page
        window.location.href = "loginPage.html";
      });
    }

    // Filter dropdown toggle
    if (filterToggle && filterDropdown) {
      filterToggle.addEventListener("click", function (event) {
        event.stopPropagation(); // Prevent event from bubbling to document
        const isActive = !filterDropdown.classList.contains("active");
        filterToggle.classList.toggle("active");
        filterDropdown.classList.toggle("active");

        // Dynamically position the dropdown so it sits directly beneath the
        // visible `.filter-container` with no visual gap. This calculates the
        // container's bottom relative to the viewport and places the dropdown
        // exactly there. When closing, clear inline styles.
        // Use the filter toggle button's bounding rect so the dropdown sits
        // immediately at the bottom edge of the button with no visual gap.
        const btnRect = filterToggle.getBoundingClientRect();
        if (isActive && btnRect) {
          // `filterDropdown` is `position: fixed`, so use viewport coordinates
          const topPx = btnRect.bottom; // viewport bottom of the button
          filterDropdown.style.top = topPx + 'px';
          // Full viewport width for the dropdown (spanning entire page width)
          filterDropdown.style.left = '0';
          filterDropdown.style.width = '100%';
          filterDropdown.style.right = '0';
        } else {
          // Clear any inline positioning when closing
          filterDropdown.style.top = '';
          filterDropdown.style.left = '';
          filterDropdown.style.width = '';
          filterDropdown.style.right = '';
        }

        // For VC newsletter page, no need to scroll since filter is now fixed
      });

      // Close filter dropdown when clicking outside
      document.addEventListener("click", function (event) {
        if (
          !filterToggle.contains(event.target) &&
          !filterDropdown.contains(event.target)
        ) {
          filterToggle.classList.remove("active");
          filterDropdown.classList.remove("active");
          // Also clear inline styles so next open re-calculates position
          filterDropdown.style.top = '';
          filterDropdown.style.left = '';
          filterDropdown.style.width = '';
          filterDropdown.style.right = '';
        }
      });
    }

    // Handle "Create new" button click for different pages
    const createBtn = document.querySelector(".create-btn");
    if (createBtn) {
      // Check if we're on the CCC Events page
      if (window.location.pathname.includes("cccEvents.html")) {
        // For CCC Events page, redirect to createcccEvents.html
        createBtn.addEventListener("click", function () {
          window.location.href = "createcccEvents.html";
        });
      }
      // Check if we're on the Seminars page
      else if (window.location.pathname.includes("seminars.html")) {
        // For Seminars page, redirect to createseminars.html
        createBtn.addEventListener("click", function () {
          window.location.href = "createseminars.html";
        });
      }
      // For other pages, the onclick attribute in HTML will handle the redirect
      // We don't add another event listener to avoid conflicts
    }

    // Handle "Generate PDF" button click (skip for VC newsletter page as it has its own handler)
    const generatePdfBtn = document.querySelector(".generate-pdf-btn");
    if (generatePdfBtn && !window.location.pathname.includes("vcNewsletter.html")) {
      generatePdfBtn.addEventListener("click", function () {
        // Show a message that PDF generation is not implemented yet
        alert("PDF generation functionality would be implemented here.");

        // In a real implementation, you would:
        // 1. Collect the filtered data
        // 2. Send it to a server-side PDF generation service
        // 3. Or use a client-side library like jsPDF to generate the PDF
        // 4. Trigger the download of the generated PDF
      });
    }

    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarCheckbox = document.getElementById("sidebar-toggle-checkbox");

    if (sidebarToggle && sidebarCheckbox) {
      sidebarToggle.addEventListener("click", function (event) {
        event.preventDefault();
        sidebarCheckbox.checked = !sidebarCheckbox.checked;
      });
    }

    // Close sidebar when clicking the close button
    const closeSidebar = document.getElementById("closeSidebar");
    if (closeSidebar && sidebarCheckbox) {
      closeSidebar.addEventListener("click", function (event) {
        event.preventDefault();
        sidebarCheckbox.checked = false;
      });
    }
  } catch (error) {
    console.error("Error in DOMContentLoaded for category pages:", error);
  }
});
