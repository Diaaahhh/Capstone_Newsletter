document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createResearchForm");
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
  validateDates();

  const requiredFields = [
    "researchTitle",
    "researchType",
    "researchArea",
    "startDate",
    "endDate",
    "researchers",
    "abstract",
    "fullArticle",
    "publicationStatus",
    "keywords",
  ];

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = getFormData();

      if (requiredFields.some((field) => !formData[field])) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }

      Toast.success("Research article submitted for review!");
      try {
        const res = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "Research",
            formData,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        form.reset();
        window.location.href = "drafts.html";
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
            category: "ResearchArticle",
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

  function getFormData() {
    if (!form) return {};

    const data = {};
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;

      const fieldName = field.name;

      if (field.type === "checkbox") {
        if (!data[fieldName]) data[fieldName] = [];
        if (field.checked) {
          data[fieldName].push(field.value);
        }
      } else if (field.type !== "radio") {
        data[fieldName] = field.value.trim();
      } else if (field.checked) {
        data[fieldName] = field.value;
      }
    });

    data.date = new Date().toISOString();
    return data;
  }

  function loadDraftData() {
    const savedDraft = localStorage.getItem("currentDraft");
    const isEditMode = localStorage.getItem("isEditingDraft") === "true";

    if (isEditMode && savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const data = draft.formData || draft;

        Object.entries(data).forEach(([name, value]) => {
          const elements = document.querySelectorAll(`[name="${name}"]`);
          if (!elements.length) return;

          const fieldType = elements[0].type;

          if (fieldType === "checkbox" && Array.isArray(value)) {
            elements.forEach((element) => {
              element.checked = value.includes(element.value);
            });
          } else if (fieldType === "radio") {
            elements.forEach((element) => {
              element.checked = element.value === value;
            });
          } else if (typeof value === "string") {
            elements[0].value = value;
          }
        });

        console.log("✅ Draft loaded into form for editing.");
      } catch (err) {
        console.error("Failed to load draft:", err);
        Toast.error("Error loading draft. Please try again.");
      }
    }
  }

  function validateDates() {
    const startDateInput = document.getElementById("startDate");
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
});
