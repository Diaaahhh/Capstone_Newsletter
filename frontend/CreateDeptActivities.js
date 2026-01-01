// CreateCCCEvents.js - Simplified to match Major Events pattern
document.addEventListener("DOMContentLoaded", () => {
  const createDeptActivitiesForm = document.getElementById("createDeptActivitiesForm");
  const draftBtn = document.querySelector(".draft-btn");

  const API_BASE = "http://localhost:5000/api/drafts";
  const SUBMIT_ENDPOINT = "http://localhost:5000/api/submissions/submit";

  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    Toast.warning("You need to be logged in.");
    window.location.href = "loginPage.html";
    return;
  }

  // Hide submission status on page load
  const statusDiv = document.getElementById("submissionStatus");
  if (statusDiv) {
    statusDiv.style.display = "none";
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
  function getFormData() {
    const formData = {
      title: document.getElementById("deptActivitiesTitle")?.value.trim() || "",
      fullArticle: document.getElementById("fullArticle")?.value.trim() || "",
      featuredImage: document.getElementById("featuredImage")?.value.trim() || "",
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
          document.getElementById("deptActivitiesTitle").value = data.title;

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
    if (data.title) document.getElementById("deptActivitiesTitle").value = data.title;
    if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle;
  }

  // Setup read-only view if viewing a submission
  if (typeof setupSubmissionView === "function") {
    const isSubmissionView = setupSubmissionView({
      category: "deptActivities",
      onDataReady: populateFormFromData,
      formElement: createDeptActivitiesForm,
      extraDisableElements: [draftBtn],
    });

    if (isSubmissionView) {
      console.log("📖 Viewing Dept Activities submission in read-only mode.");
    }
  }

  // Handle form submission
  if (createDeptActivitiesForm) {
    createDeptActivitiesForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const title = document.getElementById("deptActivitiesTitle")?.value.trim() || "";
      const fullArticle = document.getElementById("fullArticle")?.value.trim() || "";

      // Form validation
      if (!title || !fullArticle) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }

      // Upload image if selected
      let imageUrl = "";
      try {
        imageUrl = await uploadImageFromInput("featuredImage") || "";
      } catch (error) {
        console.error("Image upload failed:", error);
        Toast.error("Image upload failed. Please try again.");
        return;
      }

      const formData = {
        title,
        fullArticle,
        featuredImage: imageUrl,
        date: new Date().toISOString(),
      };

      // Send form data to backend
      try {
        const res = await fetch(
          SUBMIT_ENDPOINT,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "deptActivities",
              formData,
              createdBy: userEmail,
            }),
          }
        );

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        // Show success status
        const statusDiv = document.getElementById("submissionStatus");
        if (statusDiv) {
          statusDiv.style.display = "block";
          statusDiv.scrollIntoView({ behavior: "smooth" });
        }

        Toast.success("Dept Activities submitted for review!");

        // Clear any draft data
        localStorage.removeItem("currentDraftId");
        localStorage.removeItem("currentDraft");
        localStorage.removeItem("isEditingDraft");

        createDeptActivitiesForm.reset();

        // Delay redirect to allow status and toast to be visible
        setTimeout(() => {
          window.location.href = "deptActivities.html";
        }, 2000);
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

      if (createDeptActivitiesForm) {
        createDeptActivitiesForm.noValidate = true;
      }

      // Upload image if selected
      let imageUrl = "";
      try {
        imageUrl = await uploadImageFromInput("featuredImage") || "";
      } catch (error) {
        console.error("Image upload failed:", error);
        Toast.warning("Image upload failed, but draft will be saved without the image.");
      }

      const formData = {
        title: document.getElementById("deptActivitiesTitle")?.value.trim() || "",
        fullArticle: document.getElementById("fullArticle")?.value.trim() || "",
        featuredImage: imageUrl,
        date: new Date().toISOString(),
      };

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
            category: "deptActivities",
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
