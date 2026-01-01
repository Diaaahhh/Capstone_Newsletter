document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createConferencePresentationForm");
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
    document.getElementById("authors").value = data.authors || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("paperTitle").value = data.paperTitle || "";
    document.getElementById("conferenceName").value =
      data.conferenceName || "";
    document.getElementById("conferencePlace").value =
      data.conferencePlace || "";
    document.getElementById("presentationDate").value =
      data.presentationDate || "";
    document.getElementById("organizer").value = data.organizer || "";

    // Populate Harvard Reference if it exists, otherwise generate it
    const harvardRefField = document.getElementById("harvardReference");
    if (harvardRefField) {
      if (data.harvardReference) {
        harvardRefField.innerHTML = data.harvardReference;
      } else {
        updateHarvardReference();
      }
    }
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
    console.log("🆕 Creating a new conference presentation — blank form mode.");
  }

  setupSubmissionView({
    category: "conferencePresentation",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // --------------------------
  // Harvard Reference Generator
  // Format: Authors (Year), "Paper Title," paper presented at Conference Name, Place, Date.
  // --------------------------
  function updateHarvardReference() {
    const harvardRefField = document.getElementById("harvardReference");
    if (!harvardRefField) return;

    const authors = document.getElementById("authors").value.trim();
    const year = document.getElementById("year").value.trim();
    const paperTitle = document.getElementById("paperTitle").value.trim();
    const conferenceName = document.getElementById("conferenceName").value.trim();
    const conferencePlace = document.getElementById("conferencePlace").value.trim();
    const presentationDate = document.getElementById("presentationDate").value.trim();

    if (!authors && !year && !paperTitle && !conferenceName && !conferencePlace) {
      harvardRefField.innerHTML = "";
      return;
    }

    // Format: Authors (Year), "Paper Title," paper presented at Conference Name, Place, Date.
    let reference = "";

    // Authors (Year)
    if (authors) {
      reference += authors;
    }

    if (year) {
      reference += ` (${year})`;
    }

    // Add comma after year if we have authors or year
    if (reference) {
      reference += ",";
    }

    // "Paper Title"
    if (paperTitle) {
      reference += ` "${paperTitle},"`;
    }

    // paper presented at Conference Name (italicized)
    if (conferenceName) {
      reference += ` paper presented at <i>${conferenceName}</i>`;
    }

    // Place
    if (conferencePlace) {
      reference += `, ${conferencePlace}`;
    }

    // Date (format the date if provided)
    if (presentationDate) {
      // Convert YYYY-MM-DD to readable format like "23-25 May"
      const dateObj = new Date(presentationDate);
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString('en-US', { month: 'long' });
      reference += `, ${day} ${month}`;
    }

    // End with period
    if (reference && !reference.endsWith(".")) {
      reference += ".";
    }

    harvardRefField.innerHTML = reference;
  }

  // Update Harvard reference on input changes
  [
    "authors",
    "year",
    "paperTitle",
    "conferenceName",
    "conferencePlace",
    "presentationDate",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateHarvardReference);
  });

  // Save as Draft → Send to backend (allows incomplete data)
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
    // Collect form data (drafts can be incomplete)
    const authors = document.getElementById("authors")?.value.trim() || "";
    const year = document.getElementById("year")?.value.trim() || "";
    const paperTitle =
      document.getElementById("paperTitle")?.value.trim() || "";
    const conferenceName =
      document.getElementById("conferenceName")?.value.trim() || "";
    const conferencePlace =
      document.getElementById("conferencePlace")?.value.trim() || "";
    const presentationDate =
      document.getElementById("presentationDate")?.value.trim() || "";
    const organizer = document.getElementById("organizer")?.value.trim() || "";

    // Read innerHTML for contenteditable div
    const harvardReference = document.getElementById("harvardReference")?.innerHTML.trim() || "";

    const formData = {
      authors,
      year,
      paperTitle,
      conferenceName,
      conferencePlace,
      presentationDate,
      organizer,
      harvardReference,
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
          category: "ConferencePresentation",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Conference Presentation draft saved successfully!");
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
      "authors",
      "year",
      "paperTitle",
      "conferenceName",
      "conferencePlace",
      "presentationDate",
    ];

    // Check for required fields before submitting
    for (let id of requiredFields) {
      const field = document.getElementById(id);
      if (!field || !field.value.trim()) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }
    }

    const authors = document.getElementById("authors").value.trim();
    const year = document.getElementById("year").value.trim();
    const paperTitle = document.getElementById("paperTitle").value.trim();
    const conferenceName = document
      .getElementById("conferenceName")
      .value.trim();
    const conferencePlace = document
      .getElementById("conferencePlace")
      .value.trim();
    const presentationDate = document
      .getElementById("presentationDate")
      .value.trim();
    const organizer = document.getElementById("organizer")?.value.trim() || "";

    // Read innerHTML for contenteditable div
    const harvardReference = document.getElementById("harvardReference").innerHTML.trim();

    const formData = {
      authors,
      year,
      paperTitle,
      conferenceName,
      conferencePlace,
      presentationDate,
      organizer,
      harvardReference,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "conferencePresentation",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Conference Presentation submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
      // Reset Harvard Ref manually
      const harvardRefField = document.getElementById("harvardReference");
      if(harvardRefField) harvardRefField.innerHTML = "";
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
