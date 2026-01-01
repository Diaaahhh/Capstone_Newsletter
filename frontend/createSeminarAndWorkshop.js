document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createSeminarForm");
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
    document.getElementById("names").value = data.names || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("workTitle").value = data.workTitle || "";
    document.getElementById("seminarPlace").value = data.seminarPlace || "";
    document.getElementById("date").value = data.date || "";
    document.getElementById("seminarSeries").value = data.seminarSeries || "";
    document.getElementById("briefDescription").value = data.briefDescription || "";
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
    console.log("🆕 Creating a new seminar/workshop — blank form mode.");
  }

  setupSubmissionView({
    category: "seminarAndWorkshop",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });


  // Save as Draft → Send to backend (allows incomplete data)
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
    // Upload image if selected
    let imageUrl = "";
    try {
      imageUrl = await uploadImageFromInput("image") || "";
    } catch (error) {
      console.error("Image upload failed:", error);
      Toast.warning("Image upload failed, but draft will be saved without the image.");
    }

    // Read brief description
    const briefDescription = document.getElementById("briefDescription")?.value.trim() || "";

    const formData = {
      names: document.getElementById("names")?.value.trim() || "",
      year: document.getElementById("year")?.value.trim() || "",
      workTitle: document.getElementById("workTitle")?.value.trim() || "",
      seminarPlace: document.getElementById("seminarPlace")?.value.trim() || "",
      date: document.getElementById("date")?.value.trim() || "",
      seminarSeries:
        document.getElementById("seminarSeries")?.value.trim() || "",
      image: imageUrl,
      briefDescription,
      savedAt: new Date().toISOString(),
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
          category: "SeminarAndWorkshop",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Seminar/Workshop draft saved successfully!");
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

    const requiredFields = [
      "names",
      "year",
      "workTitle",
      "seminarPlace",
      "date",
    ];

    // Check for required fields before submitting
    for (let id of requiredFields) {
      const field = document.getElementById(id);
      if (!field || !field.value.trim()) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }
    }

    // Upload image if selected
    let imageUrl = "";
    try {
      imageUrl = await uploadImageFromInput("image") || "";
    } catch (error) {
      console.error("Image upload failed:", error);
      Toast.error("Image upload failed. Please try again.");
      return;
    }

    // Read brief description
    const briefDescription = document.getElementById("briefDescription").value.trim();

    const formData = {
      names: document.getElementById("names").value.trim(),
      year: document.getElementById("year").value.trim(),
      workTitle: document.getElementById("workTitle").value.trim(),
      seminarPlace: document.getElementById("seminarPlace").value.trim(),
      date: document.getElementById("date").value.trim(),
      seminarSeries:
        document.getElementById("seminarSeries")?.value.trim() || "",
      image: imageUrl,
      briefDescription,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "seminarAndWorkshop",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Seminar/Workshop submitted for review!");
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
