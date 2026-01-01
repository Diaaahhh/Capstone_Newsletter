// CreateAlumniStories.js - Simplified to match Major Events pattern
document.addEventListener("DOMContentLoaded", () => {
  const createAlumniStoriesForm = document.getElementById("createAlumniStoriesForm");
  const draftBtn = document.querySelector(".draft-btn");
  
  const API_BASE = "http://localhost:5000/api/drafts";
  const SUBMIT_ENDPOINT = "http://localhost:5000/api/submissions/submit";
  
  const userEmail = localStorage.getItem("userEmail");

  // Check if Bootstrap and Toast are loaded
  if (typeof bootstrap === 'undefined') {
    console.error("Bootstrap is not loaded!");
  }
  if (typeof Toast === 'undefined') {
    console.error("Toast is not defined!");
  }

  if (!userEmail) {
    if (typeof Toast !== 'undefined') {
      Toast.warning("You need to be logged in.");
    } else {
      alert("You need to be logged in.");
    }
    setTimeout(() => {
      window.location.href = "loginPage.html";
    }, 1500);
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
      title: document.getElementById("eventTitle")?.value.trim() || "",
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
          document.getElementById("eventTitle").value = data.title;
       
        if (data.fullArticle)
          document.getElementById("fullArticle").value = data.fullArticle;
       
        if (data.featuredImage)
          document.getElementById("featuredImage").value = data.featuredImage;

        console.log("✅ Draft loaded into form for editing.");
      } catch (err) {
        console.error("Failed to load draft:", err);
        if (typeof Toast !== 'undefined') Toast.error("Error loading draft. Please try again.");
      }
    }
  }

  // Populate form from data object
  function populateFormFromData(data = {}) {
    if (data.title) document.getElementById("eventTitle").value = data.title;
    if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle;
  }

  // Setup read-only view if viewing a submission
  if (typeof setupSubmissionView === "function") {
    const isSubmissionView = setupSubmissionView({
      category: "alumniStories",
      onDataReady: populateFormFromData,
      formElement: createAlumniStoriesForm,
      extraDisableElements: [draftBtn],
    });

    if (isSubmissionView) {
      console.log("📖 Viewing Alumni Story submission in read-only mode.");
    }
  }

  // Handle form submission
  if (createAlumniStoriesForm) {
    createAlumniStoriesForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = await getFormData();

      // Form validation
      if (
        !formData.title ||
        !formData.fullArticle
      ) {
        if (typeof Toast !== 'undefined') {
          Toast.error("Please fill in all required fields marked with *");
        } else {
          alert("Please fill in all required fields marked with *");
        }
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
              category: "alumniStories",
              formData,
              createdBy: userEmail,
            }),
          }
        );

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        if (typeof Toast !== 'undefined') {
          Toast.success("Alumni Story submitted for review!");
        } else {
          alert("Alumni Story submitted for review!");
        }
        
        // Clear any draft data
        localStorage.removeItem("currentDraftId");
        localStorage.removeItem("currentDraft");
        localStorage.removeItem("isEditingDraft");
        
        createAlumniStoriesForm.reset();
        setTimeout(() => {
          window.location.href = "alumniStories.html";
        }, 1500);
      } catch (err) {
        console.error("Error submitting:", err);
        if (typeof Toast !== 'undefined') {
          Toast.error("Failed to submit. Check your server connection.");
        } else {
          alert("Failed to submit. Check your server connection.");
        }
      }
    });
  }

  // Handle draft button click (allows incomplete data)
  if (draftBtn) {
    draftBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (createAlumniStoriesForm) {
        createAlumniStoriesForm.noValidate = true;
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
            category: "alumniStories",
            formData,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        
        if (typeof Toast !== 'undefined') {
          Toast.success("Draft saved successfully!");
        } else {
          alert("Draft saved successfully!");
        }
        
        setTimeout(() => {
          window.location.href = "drafts.html";
        }, 1500);
      } catch (err) {
        console.error("Error saving draft:", err);
        if (typeof Toast !== 'undefined') {
          Toast.error("Failed to save draft. Check your server connection.");
        } else {
          alert("Failed to save draft. Check your server connection.");
        }
      }
    });
  }
});
