// createBookChapters.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const userEmail = localStorage.getItem("userEmail") || "guest@example.com";
  const form = document.getElementById("createBookChapterForm");

  const authorsEl = document.getElementById("authors");
  const yearEl = document.getElementById("year");
  const chapterTitleEl = document.getElementById("chapterTitle");
  const bookNameEl = document.getElementById("bookName");
  const volumeNumberEl = document.getElementById("volumeNumber");
  const pageRangeEl = document.getElementById("pageRange");
  const editorsEl = document.getElementById("editors");
  const publisherEl = document.getElementById("publisher");
  const doiEl = document.getElementById("doi");
  const harvardRefEl = document.getElementById("harvardRef");

  // ============================================================
  // AUTO-FILL FUNCTIONALITY USING DOI
  // ============================================================
  
  const autoFillBtn = document.getElementById("autoFillBtn");
  const loadingIndicator = document.getElementById("autoFillLoading");
  const successIndicator = document.getElementById("autoFillSuccess");
  const errorIndicator = document.getElementById("autoFillError");

  if (autoFillBtn && doiEl) {
    autoFillBtn.addEventListener("click", async () => {
      const doi = doiEl.value.trim();

      // Validate DOI input
      if (!doi) {
        Toast.warning("Please enter a DOI first");
        return;
      }

      // Basic DOI format validation
      if (!isValidDOI(doi)) {
        showAutoFillStatus("error", "Invalid DOI format. Please enter a valid DOI (e.g., 10.1234/example.2023.123456)");
        Toast.error("Invalid DOI format");
        return;
      }

      // Show loading state
      showAutoFillStatus("loading");
      autoFillBtn.disabled = true;
      autoFillBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Fetching...';

      try {
        // Call auto-fill API
        const response = await fetch("http://localhost:5000/api/autofill/publication", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ doi }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Populate form with fetched data
          populateFormWithAutoFillData(result.data);

          // Show success message
          const sources = result.sources ? result.sources.join(" + ") : "CrossRef";
          showAutoFillStatus("success", `Data loaded from ${sources}. Please review and edit if needed.`);
          Toast.success("Form auto-filled successfully!");

          // Update Harvard reference
          harvardAuto = true;
          maybeUpdateHarvardRef();
        } else {
          // Handle API error
          const errorMsg = result.message || "Publication not found. Please enter details manually.";
          showAutoFillStatus("error", errorMsg);
          Toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Auto-fill error:", error);
        
        // Check if it's a network error
        if (error.message.includes("fetch")) {
          showAutoFillStatus("error", "Cannot connect to server. Please check your connection and try again.");
          Toast.error("Network error. Please try again.");
        } else {
          showAutoFillStatus("error", "An unexpected error occurred. Please try again or enter details manually.");
          Toast.error("Failed to fetch data. Please try again.");
        }
      } finally {
        // Reset button state
        autoFillBtn.disabled = false;
        autoFillBtn.innerHTML = '<i class="bi bi-magic"></i> Auto-Fill';
      }
    });
  }

  /**
   * Validate DOI format
   * DOI format: 10.xxxx/xxxxx or https://doi.org/10.xxxx/xxxxx
   */
  function isValidDOI(doi) {
    // Remove common prefixes
    const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, "").trim();
    
    // DOI regex pattern: starts with 10. followed by numbers, then /, then any characters
    const doiPattern = /^10\.\d{4,}(\.\d+)*\/[^\s]+$/;
    return doiPattern.test(cleanDOI);
  }

  /**
   * Populate form fields with auto-filled data from API
   * Maps CrossRef/Google Scholar data to book chapter form fields
   */
  function populateFormWithAutoFillData(data) {
    if (!data) return;

    // Populate each field if data exists
    if (data.title) {
      chapterTitleEl.value = data.title;
    }
    
    if (data.authors) {
      authorsEl.value = data.authors;
    }
    
    // For book chapters, the journal field from CrossRef is actually the book title
    if (data.journal || data.containerTitle || data.bookName) {
      bookNameEl.value = data.journal || data.containerTitle || data.bookName;
    }
    
    if (data.year) {
      yearEl.value = data.year;
    }
    
    if (data.volume) {
      volumeNumberEl.value = data.volume;
    }
    
    if (data.pages || data.pageRange) {
      pageRangeEl.value = data.pages || data.pageRange;
    }
    
    if (data.publisher) {
      publisherEl.value = data.publisher;
    }

    // Format editors if available
    if (data.editor || data.editors) {
      editorsEl.value = data.editor || data.editors;
    }
    
    if (data.doi) {
      doiEl.value = data.doi;
    }

    // Log success for debugging
    console.log("✅ Form auto-filled with data:", data);
  }

  /**
   * Show auto-fill status indicators
   * @param {string} status - 'loading', 'success', or 'error'
   * @param {string} message - Message to display
   */
  function showAutoFillStatus(status, message = "") {
    // Hide all indicators first
    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (successIndicator) successIndicator.style.display = "none";
    if (errorIndicator) errorIndicator.style.display = "none";

    // Show appropriate indicator
    if (status === "loading" && loadingIndicator) {
      loadingIndicator.style.display = "block";
      // Scroll to indicator
      loadingIndicator.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (status === "success" && successIndicator) {
      successIndicator.style.display = "block";
      document.getElementById("successMessage").textContent = message;
      // Auto-hide after 8 seconds
      setTimeout(() => {
        successIndicator.style.display = "none";
      }, 8000);
      // Scroll to indicator
      successIndicator.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (status === "error" && errorIndicator) {
      errorIndicator.style.display = "block";
      document.getElementById("errorMessage").textContent = message;
      // Scroll to indicator
      errorIndicator.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ============================================================
  // END OF AUTO-FILL FUNCTIONALITY
  // ============================================================


  // --- Harvard reference auto-generate control flag ---
  let harvardAuto = true;

  if (harvardRefEl) {
    harvardRefEl.addEventListener("input", () => {
      // User manually edited -> stop auto overwrite
      harvardAuto = false;
    });
  }

  // --- Helper: Build Harvard-style reference string ---
  // Target pattern (book chapter style, based on your examples):
  // Authors (Year), "Chapter title" in Editors, Book title, Publisher, pp. xx–yy. DOI
  function buildHarvardReference() {
    const authors = (authorsEl?.value || "").trim();
    const year = (yearEl?.value || "").trim();
    const chapterTitle = (chapterTitleEl?.value || "").trim();
    const bookName = (bookNameEl?.value || "").trim();
    const pageRange = (pageRangeEl?.value || "").trim();
    const editors = (editorsEl?.value || "").trim();
    const publisher = (publisherEl?.value || "").trim();
    const doi = (doiEl?.value || "").trim();

    let parts = [];

    // Authors (Year),
    if (authors && year) parts.push(`${authors} (${year}),`);
    else if (authors) parts.push(authors);
    else if (year) parts.push(`(${year}),`);

    // "Chapter title",
    if (chapterTitle) parts.push(`"${chapterTitle}",`);

    let middleBits = [];

    // in Editors (ed.), Book title,
    if (bookName) {
      let inString = "in ";
      if (editors) {
        // Check if multiple editors to decide (ed.) vs (eds.)? 
        // User asked for "(ed.)" specifically, but usually it depends.
        // I'll stick to "(ed.)" as requested for simplicity unless I detect "&" or "and".
        // Let's just append (ed.) for now.
        const suffix = editors.includes("&") || editors.toLowerCase().includes(" and ") ? "(eds.)" : "(ed.)";
        inString += `${editors} ${suffix}, `;
      }
      inString += `<i>${bookName}</i>`; // REAL italic
      middleBits.push(inString);
    }

    if (publisher) middleBits.push(publisher);
    if (pageRange) middleBits.push(`pp. ${pageRange}`);

    if (middleBits.length > 0) parts.push(middleBits.join(", "));

    // Join main parts with space
    let mainRef = parts.join(" ");

    // Ensure it ends with a period (if not empty)
    if (mainRef && !mainRef.endsWith(".")) {
      mainRef += ".";
    }

    // DOI on next line
    if (doi) {
      mainRef += `<br>${doi}`;
    }

    return mainRef;
  }
  // --- When any of the core fields change, regenerate Harvard reference (if still auto mode) ---
  function maybeUpdateHarvardRef() {
    if (!harvardRefEl || !harvardAuto) return;
    const ref = buildHarvardReference();
    harvardRefEl.innerHTML = ref;
  }

  const watchedFields = [
    authorsEl,
    yearEl,
    chapterTitleEl,
    bookNameEl,
    pageRangeEl,
    editorsEl,
    publisherEl,
    doiEl,
  ];

  watchedFields.forEach((el) => {
    if (el) {
      el.addEventListener("input", maybeUpdateHarvardRef);
      el.addEventListener("blur", maybeUpdateHarvardRef);
    }
  });

  // Clear any leftover draft data if not in edit mode
  // This ensures "Create New" opens a blank form
  const urlParams = new URLSearchParams(window.location.search);
  const isNewDraft = urlParams.get("new") === "true";

  if (isNewDraft) {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  const draftButton = document.querySelector(".draft-btn");

  function populateFormFromData(data = {}) {
    authorsEl.value = data.authors || "";
    yearEl.value = data.year || "";
    chapterTitleEl.value = data.chapterTitle || "";
    bookNameEl.value = data.bookName || "";
    volumeNumberEl.value = data.volumeNumber || "";
    pageRangeEl.value = data.pageRange || "";
    editorsEl.value = data.editors || "";
    publisherEl.value = data.publisher || "";
    doiEl.value = data.doi || "";

    if (harvardRefEl) {
      if (data.harvardReference) {
        harvardRefEl.value = data.harvardReference;
        harvardAuto = false;
      } else {
        harvardAuto = true;
        maybeUpdateHarvardRef();
      }
    }
  }

  // --- Check if user is editing an existing draft ---
  const savedDraft = localStorage.getItem("currentDraft");
  const isEditMode = localStorage.getItem("isEditingDraft") === "true";

  if (isEditMode && savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      const data = draft.formData || {};

      // Fill the fields from saved draft
      populateFormFromData(data);

      console.log("✅ Draft loaded into form for editing.");
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  } else {
    console.log("🆕 Creating a new book chapter — blank form mode.");
    // For a brand new form, auto is ON; if basic fields present, generate once
    maybeUpdateHarvardRef();
  }

  setupSubmissionView({
    category: "bookChapters",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // Save as Draft → Send to backend
  if (draftButton) {
    draftButton.addEventListener("click", async () => {

      // Upload photo
      let photoUrl = "";
      try {
        photoUrl = await uploadImageFromInput("relatedPhoto") || "";
      } catch (error) {
        console.error("Photo upload failed:", error);
      }

      const formData = {
        authors: authorsEl.value,
        year: yearEl.value,
        chapterTitle: chapterTitleEl.value,
        bookName: bookNameEl.value,
        volumeNumber: volumeNumberEl.value,
        pageRange: pageRangeEl.value,
        editors: editorsEl.value,
        publisher: publisherEl.value,
        doi: doiEl.value,
        harvardReference: harvardRefEl ? harvardRefEl.value : "",
        photo: photoUrl,
        date: new Date().toISOString(),
      };

      try {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "BookChapters",
            formData,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        Toast.success("Book Chapter draft saved successfully!");
        setTimeout(() => {
          window.location.href = "draftsVC.html";
        }, 1500);
      } catch (err) {
        console.error("Error saving draft:", err);
        Toast.error("Failed to save draft. Check your server connection.");
      }
    });
  }

  // Submit for Review (sends to /api/submissions)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requiredFields = [
      "authors",
      "year",
      "chapterTitle",
      "bookName",
    ];

    for (let id of requiredFields) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }
    }

    // Upload photo
    let photoUrl = "";
    try {
      photoUrl = await uploadImageFromInput("relatedPhoto") || "";
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("❌ Photo upload failed. Please try again.");
      return;
    }

    const formData = {
      authors: authorsEl.value,
      year: yearEl.value,
      chapterTitle: chapterTitleEl.value,
      bookName: bookNameEl.value,
      volumeNumber: volumeNumberEl.value,
      pageRange: pageRangeEl.value,
      editors: editorsEl.value,
      publisher: publisherEl.value,
      doi: doiEl.value,
      harvardReference: harvardRefEl ? harvardRefEl.innerHTML : "",
      photo: photoUrl,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "bookChapters",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Book Chapter submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
      // After reset, re-enable auto mode and clear harvardRef
      harvardAuto = true;
      if (harvardRefEl) {
        harvardRefEl.value = "";
      }
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
