document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createMediaForm");
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
    document.getElementById("webLink").value = data.webLink || "";
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
    console.log("🆕 Creating a new media entry — blank form mode.");
  }

  setupSubmissionView({
    category: "mediaVC",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // Save as Draft → Send to backend (allows incomplete data)
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
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
      webLink: document.getElementById("webLink")?.value.trim() || "",
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
          category: "MediaVC",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Media entry saved as draft successfully!");
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
    const harvardRef = document.getElementById("harvardRef")?.value.trim();

    // Check for required fields before submitting
    if (!name || !harvardRef) {
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
      webLink: document.getElementById("webLink")?.value.trim() || "",
      harvardRef,
      photo: photoUrl,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "mediaVC",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Media entry submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
