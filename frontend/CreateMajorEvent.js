document.addEventListener("DOMContentLoaded", function () {
  const createEventForm = document.getElementById("createEventForm");
  const draftBtn = document.querySelector(".draft-btn");
  const API_BASE = "http://localhost:5000/api/drafts";
  const userEmail = localStorage.getItem("userEmail");

  // Check if Bootstrap and Toast are loaded
  if (typeof bootstrap === 'undefined') {
    console.error("Bootstrap is not loaded!");
  }
  if (typeof Toast === 'undefined') {
    console.error("Toast is not defined!");
  } else {
    console.log("Toast object is available:", Toast);
  }

  if (!userEmail) {
    if (typeof Toast !== 'undefined') {
      Toast.error("You need to be logged in to save a draft.");
    } else {
      alert("You need to be logged in to save a draft.");
    }
    window.location.href = "loginPage.html";
    return;
  }

  // Clear any leftover draft data if not in edit mode
  // This ensures "Create New" opens a blank form
  const urlParams = new URLSearchParams(window.location.search);
  const isNewDraft = urlParams.get("new") === "true";

  if (isNewDraft) {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  // Load draft data if editing
  loadDraftData();

  // Function to get form data
  async function getFormData() {
    // Upload image if selected
    let imageUrl = "";
    try {
      imageUrl = await uploadImageFromInput("featuredImages") || "";
    } catch (error) {
      console.error("Image upload failed:", error);
    }

    const formData = {
      title: document.getElementById("eventTitle")?.value.trim() || "",
      fullArticle: document.getElementById("fullArticle")?.value.trim() || "",
      featuredImages: imageUrl,
      date: new Date().toISOString(),
    };
    return formData;
  }

  // Load draft data if editing an existing draft
  function loadDraftData() {
    const savedDraft = localStorage.getItem("currentDraft");
    const isEditMode = localStorage.getItem("isEditingDraft") === "true";

    if (isEditMode && savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const data = draft.formData || draft; // Support both structures

        populateFormFromData(data); // Use centralized population function

        console.log("✅ Draft loaded into form for editing.");
      } catch (err) {
        console.error("Failed to load draft:", err);
        Toast.error("Error loading draft. Please try again.");
      }
    }
  }

  // Populate form from data object
  // Populate form from data object
  function populateFormFromData(data = {}) {
    if (data.title) document.getElementById("eventTitle").value = data.title;
    if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle;

    // Handle Image Preview if image exists (url or base64)
    // We cannot set file input value, so we show a preview instead
    const imageInput = document.getElementById("featuredImages");
    if (imageInput) {
      const imageContainer = imageInput.parentNode;
      const existingPreview = imageContainer.querySelector(".image-preview-container");
      if (existingPreview) existingPreview.remove();

      const imgUrl = data.featuredImages || data.image || data.photo;

      // Don't try to display if it's just a filename (unless it's a relative path that works)
      if (imgUrl && imgUrl.length > 5) {
        const previewDiv = document.createElement("div");
        previewDiv.className = "image-preview-container mt-2";
        previewDiv.innerHTML = `
                <label class="form-label">Current Image:</label>
                <div>
                    <img src="${getImageUrl(imgUrl)}" alt="Event Image" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #ddd;">
                </div>
            `;
        imageContainer.appendChild(previewDiv);
      }
    }
  }

  // Setup read-only view if viewing a submission
  if (typeof setupSubmissionView === "function") {
    setupSubmissionView({
      category: "majorEvent",
      formElement: createEventForm,
      extraDisableElements: [draftBtn],
      onDataReady: (submission) => {
        populateFormFromData(submission.formData || {});
      },
    });
  }

  // Date validation - ensure end date is after start date


  // Handle form submission
  if (createEventForm) {
    createEventForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = await getFormData();

      // Form validation
      if (
        !formData.title ||
        !formData.fullArticle
      ) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }

      // Send form data to backend
      try {
        const res = await fetch(
          "http://localhost:5000/api/submissions/submit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "majorEvent",
              formData,
              createdBy: userEmail,
            }),
          }
        );

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        console.log("Form submission successful, showing toast...");
        if (typeof Toast !== 'undefined') {
          Toast.success("Event submitted for review!");
        } else {
          console.error("Toast is undefined at submission success!");
          alert("Event submitted for review!");
        }

        // Clear any draft data
        localStorage.removeItem("currentDraftId");
        localStorage.removeItem("currentDraft");
        localStorage.removeItem("isEditingDraft");

        createEventForm.reset();

        // Delay redirect to allow toast to show
        setTimeout(() => {
          window.location.href = "majorEvents.html";
        }, 1500);
      } catch (err) {
        console.error("Error submitting:", err);
        if (typeof Toast !== 'undefined') {
          Toast.error("Failed to submit. Check your server connection.");
        } else {
          console.error("Toast is undefined at submission error!");
          alert("Failed to submit. Check your server connection.");
        }
      }
    });
  }

  // Handle draft button click (allows incomplete data)
  if (draftBtn) {
    draftBtn.addEventListener("click", async function (e) {
      e.preventDefault(); // Prevent any form submission or validation
      e.stopPropagation(); // Stop event bubbling

      // Temporarily disable form validation
      if (createEventForm) {
        createEventForm.noValidate = true;
      }

      const formData = await getFormData();

      try {
        // If editing, delete the old draft first
        const currentDraftId = localStorage.getItem("currentDraftId");
        const isEditMode = localStorage.getItem("isEditingDraft") === "true";

        if (isEditMode && currentDraftId) {
          try {
            await fetch(`${API_BASE}/${currentDraftId}`, {
              method: "DELETE",
            });
          } catch (err) {
            console.warn("Could not delete old draft:", err);
          }
          // Clear edit mode flags
          localStorage.removeItem("isEditingDraft");
          localStorage.removeItem("currentDraft");
          localStorage.removeItem("currentDraftId");
        }

        // Save new draft to backend
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "majorEvent",
            formData,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        Toast.success("Draft saved successfully!");
        setTimeout(() => {
          window.location.href = "drafts.html";
        }, 1500);
      } catch (err) {
        console.error("Error saving draft:", err);
        Toast.error("Failed to save draft. Check your server connection.");
      }
    });
  }

  validateDate();
});
