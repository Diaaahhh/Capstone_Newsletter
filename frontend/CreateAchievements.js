// CreateCCCEvents.js - Simplified to match Major Events pattern
document.addEventListener("DOMContentLoaded", () => {
  const createAchievementsForm = document.getElementById("createAchievementsForm");
  const draftBtn = document.querySelector(".draft-btn");
  
  const API_BASE = "http://localhost:5000/api/drafts";
  const SUBMIT_ENDPOINT = "http://localhost:5000/api/submissions/submit";
  
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    Toast.warning("You need to be logged in.");
    window.location.href = "loginPage.html";
    return;
  }

  // Clear draft data if "new" parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("new") === "true") {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  // Load draft data if editing
  loadDraftData();

  // Get form data
  async function getFormData() {
    // Upload image if selected
    let imageUrl = "";
    try {
      imageUrl = await uploadImageFromInput("featuredImage") || "";
    } catch (error) {
      console.error("Image upload failed:", error);
    }

    const formData = {
      title: document.getElementById("achievementsTitle")?.value.trim() || "",
      fullArticle: document.getElementById("fullArticle")?.value.trim() || "",
      featuredImage: imageUrl,
      date: new Date().toISOString(),
    };
    return formData;
  }

  // Load draft data from localStorage
  function loadDraftData() {
    const savedDraft = localStorage.getItem("currentDraft");
    const isEditMode = localStorage.getItem("isEditingDraft") === "true";

    if (isEditMode && savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const data = draft.formData || draft;

        // Pre-fill form fields
        if (data.title)
          document.getElementById("achievementsTitle").value = data.title;
       
        if (data.fullArticle)
          document.getElementById("fullArticle").value = data.fullArticle;
       
        if (data.featuredImage)
          document.getElementById("featuredImage").value = data.featuredImage;

        console.log("✅ Draft loaded into form for editing.");
      } catch (err) {
        console.error("Failed to load draft:", err);
        Toast.error("Error loading draft. Please try again.");
      }
    }
  }

  // Populate form from data object
  function populateFormFromData(data = {}) {
    if (data.title) document.getElementById("achievementsTitle").value = data.title;
    if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle;
  }

  // Setup read-only view if viewing a submission
  if (typeof setupSubmissionView === "function") {
    const isSubmissionView = setupSubmissionView({
      category: "achievements",
      onDataReady: populateFormFromData,
      formElement: createAchievementsForm,
      extraDisableElements: [draftBtn],
    });

    if (isSubmissionView) {
      console.log("📖 Viewing Achievements submission in read-only mode.");
    }
  }

  // Handle form submission
  if (createAchievementsForm) {
    createAchievementsForm.addEventListener("submit", async function (e) {
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
          SUBMIT_ENDPOINT,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "achievements",
              formData,
              createdBy: userEmail,
            }),
          }
        );

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        Toast.success("Achievements submitted for review!");
        
        // Clear any draft data
        localStorage.removeItem("currentDraftId");
        localStorage.removeItem("currentDraft");
        localStorage.removeItem("isEditingDraft");
        
        createAchievementsForm.reset();
        
        // Delay redirect to allow toast to be visible
        setTimeout(() => {
          window.location.href = "achievements.html";
        }, 1500);
      } catch (err) {
        console.error("Error submitting:", err);
        Toast.error("Failed to submit. Check your server connection.");
      }
    });
  }

  // Handle draft button click (allows incomplete data)
  if (draftBtn) {
    draftBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (createAchievementsForm) {
        createAchievementsForm.noValidate = true;
      }

      const formData = await getFormData();

      try {
        const currentDraftId = localStorage.getItem("currentDraftId");
        const isEditMode =
          localStorage.getItem("isEditingDraft") === "true" && currentDraftId;

        if (isEditMode) {
          try {
            await fetch(`${API_BASE}/${currentDraftId}`, {
              method: "DELETE",
            });
          } catch (err) {
            console.warn("Could not delete old draft:", err);
          }
          localStorage.removeItem("isEditingDraft");
          localStorage.removeItem("currentDraft");
          localStorage.removeItem("currentDraftId");
        }

        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "achievements",
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
});
