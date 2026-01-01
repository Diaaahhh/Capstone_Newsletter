document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createConferenceForm");
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
    document.getElementById("publicationName").value =
      data.publicationName || "";
    document.getElementById("conferenceName").value =
      data.conferenceName || "";
    document.getElementById("conferencePlace").value =
      data.conferencePlace || "";
    document.getElementById("conferenceDate").value =
      data.conferenceDate || "";
    document.getElementById("pageRange").value = data.pageRange || "";
    document.getElementById("doi").value = data.doi || "";

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
    console.log("🆕 Creating a new conference proceeding — blank form mode.");
  }

  setupSubmissionView({
    category: "conferenceProceeding",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // --------------------------
  // Harvard Reference Generator
  // Format: Authors (Year), "Publication Name" in proceedings of Conference Name, Place, Date, pp. XX-YY.
  // --------------------------
  function updateHarvardReference() {
    const harvardRefField = document.getElementById("harvardReference");
    if (!harvardRefField) return;

    const authors = document.getElementById("authors").value.trim();
    const year = document.getElementById("year").value.trim();
    const publicationName = document.getElementById("publicationName").value.trim();
    const conferenceName = document.getElementById("conferenceName").value.trim();
    const conferencePlace = document.getElementById("conferencePlace").value.trim();
    const conferenceDate = document.getElementById("conferenceDate").value.trim();
    const pageRange = document.getElementById("pageRange").value.trim();

    if (!authors && !year && !publicationName && !conferenceName && !conferencePlace) {
      harvardRefField.innerHTML = "";
      return;
    }

    // Format: Authors (Year), "Publication Name" in proceedings of Conference Name, Place, Date, pp. XX-YY.
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

    // "Publication Name"
    if (publicationName) {
      reference += ` "${publicationName}"`;
    }

    // in proceedings of Conference Name (italicized)
    if (conferenceName) {
      reference += ` in proceedings of <i>${conferenceName}</i>`;
    }

    // Place
    if (conferencePlace) {
      reference += `, ${conferencePlace}`;
    }

    // Date (format the date if provided)
    if (conferenceDate) {
      // Convert YYYY-MM-DD to readable format like "2-4 May 2024"
      const dateObj = new Date(conferenceDate);
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString('en-US', { month: 'long' });
      const yearFromDate = dateObj.getFullYear();
      reference += `, ${day} ${month}`;
    }

    // Page range
    if (pageRange) {
      reference += `, pp. ${pageRange}`;
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
    "publicationName",
    "conferenceName",
    "conferencePlace",
    "conferenceDate",
    "pageRange",
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
    const publicationName =
      document.getElementById("publicationName")?.value.trim() || "";
    const conferenceName =
      document.getElementById("conferenceName")?.value.trim() || "";
    const conferencePlace =
      document.getElementById("conferencePlace")?.value.trim() || "";
    const conferenceDate =
      document.getElementById("conferenceDate")?.value.trim() || "";
    const pageRange = document.getElementById("pageRange")?.value.trim() || "";
    const doi = document.getElementById("doi")?.value.trim() || "";

    // Read innerHTML for contenteditable div
    const harvardReference = document.getElementById("harvardReference")?.innerHTML.trim() || "";

    const formData = {
      authors,
      year,
      publicationName,
      conferenceName,
      conferencePlace,
      conferenceDate,
      pageRange,
      doi,
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
          category: "ConferenceProceeding",
          formData,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Conference Proceeding draft saved successfully!");
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
      "publicationName",
      "conferenceName",
      "conferencePlace",
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
    const publicationName = document
      .getElementById("publicationName")
      .value.trim();
    const conferenceName = document
      .getElementById("conferenceName")
      .value.trim();
    const conferencePlace = document
      .getElementById("conferencePlace")
      .value.trim();
    const conferenceDate =
      document.getElementById("conferenceDate")?.value.trim() || "";
    const pageRange = document.getElementById("pageRange")?.value.trim() || "";
    const doi = document.getElementById("doi")?.value.trim() || "";

    // Read innerHTML for contenteditable div
    const harvardReference = document.getElementById("harvardReference").innerHTML.trim();

    const formData = {
      authors,
      year,
      publicationName,
      conferenceName,
      conferencePlace,
      conferenceDate,
      pageRange,
      doi,
      harvardReference,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "conferenceProceeding",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Conference Proceeding submitted for review!");
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
