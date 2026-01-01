// Utility functions for handling "under review" submissions
console.log("underReview.js loaded");

// Function to save submitted content to localStorage
function saveSubmittedContent(content, contentType) {
  // Get existing submissions from localStorage
  const submissionsJson = localStorage.getItem("underReviewSubmissions");
  const submissions = submissionsJson ? JSON.parse(submissionsJson) : [];

  // Add new submission with a unique ID and status
  const submission = {
    id: Date.now(), // Simple unique ID
    type: contentType,
    status: "under review",
    date: new Date().toISOString(),
    ...content,
  };

  submissions.push(submission);

  // Save updated submissions to localStorage
  localStorage.setItem("underReviewSubmissions", JSON.stringify(submissions));

  // Dispatch event to notify other parts of the application
  window.dispatchEvent(
    new CustomEvent("underReviewUpdated", { detail: submission })
  );

  return submission.id;
}

// Function to display "under review" content on a page
function displayUnderReviewContent(containerId, contentType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Get submissions from localStorage
  const submissionsJson = localStorage.getItem("underReviewSubmissions");
  const submissions = submissionsJson ? JSON.parse(submissionsJson) : [];

  // Filter submissions by type and status
  const underReviewItems = submissions.filter(
    (item) => item.type === contentType && item.status === "under review"
  );

  // Clear container
  container.innerHTML = "";

  // Display each under review item
  underReviewItems.forEach((item) => {
    const itemElement = createUnderReviewItemElement(item);
    container.appendChild(itemElement);
  });

  // If no items, show a message
  if (underReviewItems.length === 0) {
    container.innerHTML =
      '<p class="no-under-review">No content currently under review.</p>';
  }
}

// Function to create HTML element for an under review item
function createUnderReviewItemElement(item) {
  const itemDiv = document.createElement("div");
  itemDiv.className = "under-review-item";

  // Create content based on item type
  let content = "";

  switch (item.type) {
    case "majorEvent":
      content = `
        <h3>${item.title || "Untitled Event"}</h3>
        <p><strong>Dates:</strong> ${item.startDate || ""} to ${
        item.endDate || ""
      }</p>
        <p><strong>Location:</strong> ${item.location || "Not specified"}</p>
        <p>${
          item.shortSummary ||
          (item.fullArticle && item.fullArticle.substring(0, 100) + "...") ||
          ""
        }</p>
      `;
      break;

    case "alumniStory":
      content = `
        <h3>${item.alumnusName || "Unnamed Alumnus"}</h3>
        <p><strong>Degree/Year:</strong> ${
          item.degreeYear || "Not specified"
        }</p>
        <p><strong>Department:</strong> ${
          item.department || "Not specified"
        }</p>
        <p>${
          item.shortSummary ||
          (item.fullStory && item.fullStory.substring(0, 100) + "...") ||
          ""
        }</p>
      `;
      break;

    default:
      content = `
        <h3>Submitted Content</h3>
        <p>This content is currently under review.</p>
      `;
  }

  itemDiv.innerHTML = `
    <div class="under-review-content">
      ${content}
      <div class="under-review-status">
        <span class="badge bg-warning text-dark">Under Review</span>
      </div>
    </div>
  `;

  return itemDiv;
}

// Function to initialize under review display on a page
function initUnderReviewDisplay(containerId, contentType) {
  // Display existing under review items
  displayUnderReviewContent(containerId, contentType);

  // Set up listener for new submissions
  window.addEventListener("storage", function (e) {
    if (e.key === "underReviewSubmissions") {
      displayUnderReviewContent(containerId, contentType);
    }
  });

  // Set up listener for local updates
  window.addEventListener("underReviewUpdated", function (e) {
    if (e.detail.type === contentType) {
      displayUnderReviewContent(containerId, contentType);
    }
  });
}

// Export functions for use in other files
window.saveSubmittedContent = saveSubmittedContent;
window.displayUnderReviewContent = displayUnderReviewContent;
window.initUnderReviewDisplay = initUnderReviewDisplay;
