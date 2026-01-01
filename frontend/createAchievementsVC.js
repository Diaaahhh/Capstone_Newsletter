document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createAchievementsForm");
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    Toast.error("You need to be logged in to save a draft.");
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

  // Check if we are editing an existing draft
  const savedDraft = localStorage.getItem("currentDraft");
  const isEditMode = localStorage.getItem("isEditingDraft") === "true";

  const draftButton = document.querySelector(".draft-btn");

  function populateFormFromData(data = {}) {
    document.getElementById("name").value = data.name || "";
    document.getElementById("optionType").value = data.optionType || "";
    document.getElementById("harvardRef").value = data.harvardRef || "";
  }

  // If in edit mode, load the saved draft data into the form
  if (isEditMode && savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      const data = draft.formData || {};

      populateFormFromData(data);
      console.log("✅ Draft loaded into form for editing.");
    } catch (err) {
      console.error("Failed to load draft:", err);
      Toast.error("Error loading draft. Please try again.");
    }
  } else {
    console.log("🆕 Creating a new achievement — blank form mode.");
  }

  setupSubmissionView({
    category: "achievementsVC",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // Save as Draft → Send to backend (allows incomplete data)
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
    // Collect form data (drafts can be incomplete)
    const optionType =
      document.getElementById("optionType")?.value.trim() || "";
    const achievementText =
      document.getElementById("achievementText")?.value.trim() || "";
    
    // Upload photo if selected
    let photoUrl = "";
    try {
      photoUrl = await uploadImageFromInput("photo") || "";
    } catch (error) {
      console.error("Photo upload failed:", error);
      Toast.warning("Photo upload failed, but draft will be saved without the photo.");
    }

    const formData = {
      name: document.getElementById("name")?.value.trim() || "",
      optionType,
      harvardRef: document.getElementById("harvardRef")?.value.trim() || "",
      photo: photoUrl,
      date: new Date().toISOString(),
    };

    try {
      // If editing, delete the old draft first
      const currentDraftId = localStorage.getItem("currentDraftId");
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
          category: "AchievementsVC",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Achievement draft saved successfully!");
        setTimeout(() => {
          window.location.href = "draftsVC.html";
        }, 1500);
    } catch (err) {
      console.error("Error saving draft:", err);
      Toast.error("Failed to save draft. Check your server connection.");
    }
    });
  }

  // Submit for Review
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const optionType = document.getElementById("optionType")?.value.trim();
    const harvardRef = document.getElementById("harvardRef")?.value.trim();

    // Check for required fields before submitting
    if (!name || !optionType || !harvardRef) {
      Toast.error("Please fill in all required fields marked with *");
      return;
    }

    // Upload photo if selected
    let photoUrl = "";
    try {
      photoUrl = await uploadImageFromInput("photo") || "";
    } catch (error) {
      console.error("Photo upload failed:", error);
      Toast.error("Photo upload failed. Please try again.");
      return;
    }

    const formData = {
      name,
      optionType,
      harvardRef,
      photo: photoUrl,
    };

    try {
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "achievementsVC",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Achievement submitted for review!");
      form.reset();
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
