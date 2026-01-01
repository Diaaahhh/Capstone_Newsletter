document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createSeminarForm");
  const draftBtn = document.querySelector(".draft-btn");
  const API_BASE = "http://localhost:5000/api/drafts";
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    alert("You need to be logged in to save a draft.");
    window.location.href = "loginPage.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("new") === "true") {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  loadDraftData();

  // Date validation - ensure end date is after start date
  function validateDates() {
    const startDateInput = document.getElementById("seminarDate");
    const endDateInput = document.getElementById("endDate");

    if (startDateInput && endDateInput) {
      startDateInput.addEventListener("change", function () {
        if (
          endDateInput.value &&
          new Date(endDateInput.value) < new Date(this.value)
        ) {
          endDateInput.value = this.value;
        }
        endDateInput.min = this.value;
      });

      endDateInput.addEventListener("change", function () {
        if (
          startDateInput.value &&
          new Date(this.value) < new Date(startDateInput.value)
        ) {
          Toast.error("End date cannot be before start date.");
          this.value = startDateInput.value;
        }
      });
    }
  }

  // Form submission handling
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const draft = getFormData();

      // Validation for required fields
      const requiredFields = [
        "seminarTitle",
        "seminarDate",
        "seminarTime",
        "venue",
        "organizer",
        "seminarType",
        "shortSummary",
        "fullArticle",
      ];
      if (requiredFields.some((field) => !draft[field])) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }

      // Send form data to backend
      Toast.success("Seminar submitted for review!");
      try {
        const res = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "Seminar",
            formData: draft,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        form.reset(); // Reset the form
        window.location.href = "drafts.html"; // Redirect
      } catch (err) {
        console.error("Error submitting draft:", err);
        Toast.error("Failed to submit draft. Check your server connection.");
      }
    });
  }

  if (draftBtn) {
    draftBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (form) {
        form.noValidate = true;
      }

      const formData = getFormData();

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
            category: "Seminar",
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

  // Add speaker button functionality
  const addSpeakerBtn = document.getElementById("add-speaker");
  const speakersContainer = document.getElementById("speakers-container");

  if (addSpeakerBtn && speakersContainer) {
    addSpeakerBtn.addEventListener("click", function () {
      const speakerEntry = document.createElement("div");
      speakerEntry.className = "speaker-entry mb-3";
      speakerEntry.innerHTML = `
        <div class="row">
          <div class="col-md-4 mb-2">
            <input type="text" class="form-control speaker-name" placeholder="Name">
          </div>
          <div class="col-md-4 mb-2">
            <input type="text" class="form-control speaker-designation" placeholder="Designation">
          </div>
          <div class="col-md-4 mb-2">
            <input type="text" class="form-control speaker-affiliation" placeholder="Affiliation">
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 text-end">
            <button type="button" class="btn btn-outline-danger btn-sm remove-speaker">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
        </div>
      `;
      speakersContainer.appendChild(speakerEntry);

      // Add event listener to the remove button of the new speaker entry
      const removeBtn = speakerEntry.querySelector(".remove-speaker");
      removeBtn.addEventListener("click", function () {
        speakersContainer.removeChild(speakerEntry);
      });
    });
  }

  // Initialize date validation
  validateDates();

  function getFormData() {
    const data = {};
    if (!form) return data;

    Array.from(form.elements).forEach((field) => {
      if (!field.name || field.type === "file") return;

      if (field.type === "checkbox") {
        if (field.checked) {
          if (!Array.isArray(data[field.name])) data[field.name] = [];
          data[field.name].push(field.value);
        }
      } else if (field.type === "radio") {
        if (field.checked) data[field.name] = field.value;
      } else {
        data[field.name] = field.value.trim();
      }
    });

    data.date = new Date().toISOString();
    return data;
  }

  function populateForm(data) {
    if (!form || !data) return;

    Array.from(form.elements).forEach((field) => {
      if (!field.name || field.type === "file") return;

      const value = data[field.name];
      if (value === undefined || value === null) return;

      if (field.type === "checkbox" && Array.isArray(value)) {
        field.checked = value.includes(field.value);
      } else if (field.type === "radio") {
        field.checked = field.value === value;
      } else {
        field.value = value;
      }
    });
  }

  function loadDraftData() {
    const savedDraft = localStorage.getItem("currentDraft");
    const isEditMode = localStorage.getItem("isEditingDraft") === "true";

    if (isEditMode && savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        populateForm(draft.formData || draft);
        console.log("✅ Seminar draft loaded for editing.");
      } catch (err) {
        console.error("Failed to load draft:", err);
        Toast.error("Error loading draft. Please try again.");
      }
    }
  }
});
