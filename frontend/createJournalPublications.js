// ============================================================
// JOURNAL METRICS DISPLAY FUNCTIONS
// ============================================================

/**
 * Display journal metrics badges
 * @param {object} metrics - { ranking, citationCount, impactFactor }
 */
function displayJournalMetrics(metrics) {
  const metricsContainer = document.getElementById('journalMetrics');
  const rankingBadge = document.getElementById('rankingBadge');
  const rankingValue = document.getElementById('rankingValue');
  const citationBadge = document.getElementById('citationBadge');
  const citationValue = document.getElementById('citationValue');
  const impactBadge = document.getElementById('impactBadge');
  const impactValue = document.getElementById('impactValue');
  
  // Store in hidden fields
  document.getElementById('journalRanking').value = metrics.ranking || '';
  document.getElementById('citationCount').value = metrics.citationCount || 0;
  document.getElementById('impactFactor').value = metrics.impactFactor || 0;
  
  // Show metrics container
  if (metricsContainer) {
    metricsContainer.style.display = 'block';
  }
  
  // Display ranking badge with color coding
  if (rankingBadge && rankingValue) {
    if (metrics.ranking) {
      rankingValue.textContent = metrics.ranking;
      rankingBadge.style.display = 'inline-block';
      
      // Remove all ranking classes
      rankingBadge.classList.remove('q1', 'q2', 'q3', 'q4');
      // Add appropriate class
      rankingBadge.classList.add(metrics.ranking.toLowerCase());
    } else {
      // Show "Not Available" if no ranking
      rankingValue.textContent = 'Not Available';
      rankingBadge.style.display = 'inline-block';
      rankingBadge.classList.remove('q1', 'q2', 'q3', 'q4');
      rankingBadge.style.background = '#9CA3AF';
      rankingBadge.style.color = '#fff';
    }
  }
  
  // Display citation count (always show, even if 0)
  if (citationBadge && citationValue) {
    citationValue.textContent = metrics.citationCount || 0;
    citationBadge.style.display = 'inline-block';
  }
  
  // Display impact factor (only if > 0)
  if (metrics.impactFactor && metrics.impactFactor > 0 && impactBadge && impactValue) {
    impactValue.textContent = metrics.impactFactor;
    impactBadge.style.display = 'inline-block';
  }
  
  console.log('📊 Journal metrics displayed:', metrics);
}

/**
 * Hide journal metrics badges
 */
function hideJournalMetrics() {
  const metricsContainer = document.getElementById('journalMetrics');
  if (metricsContainer) {
    metricsContainer.style.display = 'none';
  }
  
  // Clear hidden fields
  document.getElementById('journalRanking').value = '';
  document.getElementById('citationCount').value = 0;
  document.getElementById('impactFactor').value = 0;
}

/**
 * Fetch journal metrics manually (when user types journal name)
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 */
async function fetchJournalMetricsManually(journalName, year) {
  if (!journalName || !year) return;
  
  const metricsLoading = document.getElementById('metricsLoading');
  
  try {
    // Show loading indicator
    if (metricsLoading) {
      metricsLoading.style.display = 'block';
    }
    
    const response = await fetch('http://localhost:5000/api/journal/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ journalName, year })
    });
    
    const result = await response.json();
    
    // Hide loading
    if (metricsLoading) {
      metricsLoading.style.display = 'none';
    }
    
    if (response.ok && result.success && result.data) {
      if (result.data.journalRanking || result.data.citationCount > 0 || result.data.impactFactor > 0) {
        displayJournalMetrics({
          ranking: result.data.journalRanking,
          citationCount: result.data.citationCount,
          impactFactor: result.data.impactFactor
        });
        console.log('✅ Journal metrics fetched manually');
      } else {
        console.log('ℹ️ No metrics available for this journal');
        hideJournalMetrics();
      }
    } else {
      console.log('⚠️ Could not fetch journal metrics');
      hideJournalMetrics();
    }
  } catch (error) {
    console.error('Error fetching journal metrics:', error);
    if (metricsLoading) {
      metricsLoading.style.display = 'none';
    }
    hideJournalMetrics();
  }
}

// Debounce function to avoid excessive API calls
let journalLookupTimeout = null;
function debounceJournalLookup(journalName, year) {
  clearTimeout(journalLookupTimeout);
  journalLookupTimeout = setTimeout(() => {
    fetchJournalMetricsManually(journalName, year);
  }, 2000); // Wait 2 seconds after user stops typing
}

// ============================================================
// END OF JOURNAL METRICS FUNCTIONS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createJournalForm");
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    Toast.error("You need to be logged in to save a draft.");
    window.location.href = "loginPage.html";
    return;
  }

  // ============================================================
  // AUTO-FILL FUNCTIONALITY USING DOI
  // ============================================================
  
  const autoFillBtn = document.getElementById("autoFillBtn");
  const doiInput = document.getElementById("doi");
  const loadingIndicator = document.getElementById("autoFillLoading");
  const successIndicator = document.getElementById("autoFillSuccess");
  const errorIndicator = document.getElementById("autoFillError");

  if (autoFillBtn && doiInput) {
    autoFillBtn.addEventListener("click", async () => {
      const doi = doiInput.value.trim();

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
          if (typeof updateHarvardRef === "function") {
            updateHarvardRef();
          }
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
   * Populate form fields with auto-filled data
   */
  function populateFormWithAutoFillData(data) {
    if (!data) return;

    // Populate each field if data exists
    if (data.title) {
      document.getElementById("publicationName").value = data.title;
    }
    
    if (data.authors) {
      document.getElementById("authors").value = data.authors;
    }
    
    if (data.journal || data.journalName) {
      document.getElementById("journalName").value = data.journal || data.journalName;
    }
    
    if (data.year) {
      document.getElementById("year").value = data.year;
    }
    
    if (data.volume) {
      const volumeField = document.getElementById("volume");
      if (volumeField) {
        volumeField.value = data.volume;
      }
    }
    
    if (data.issue || data.issueNumber) {
      document.getElementById("issueNumber").value = data.issue || data.issueNumber;
    }
    
    if (data.pages || data.pageNumber) {
      document.getElementById("pageNumber").value = data.pages || data.pageNumber;
    }
    
    if (data.doi) {
      document.getElementById("doi").value = data.doi;
    }

    // Populate journal metrics if available (check for existence, not truthy values)
    if (data.journalRanking || data.citationCount !== undefined || data.impactFactor) {
      console.log('📊 Auto-fill received metrics:', {
        ranking: data.journalRanking,
        citations: data.citationCount,
        impact: data.impactFactor
      });
      
      displayJournalMetrics({
        ranking: data.journalRanking,
        citationCount: data.citationCount || 0,
        impactFactor: data.impactFactor || 0
      });
    } else {
      console.log('ℹ️ No metrics received from auto-fill');
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


  const urlParams = new URLSearchParams(window.location.search);
  const isNewDraft = urlParams.get("new") === "true";

  if (isNewDraft) {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  const savedDraft = localStorage.getItem("currentDraft");
  const isEditMode = localStorage.getItem("isEditingDraft") === "true";
  const draftButton = document.querySelector(".draft-btn");

  // Helper to populate form
  function populateFormFromData(data = {}) {
    document.getElementById("authors").value = data.authors || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("publicationName").value =
      data.publicationName || "";
    document.getElementById("journalName").value = data.journalName || "";

    // Map volumeNumber from data to volume input
    const volumeField = document.getElementById("volume");
    if (volumeField) {
      volumeField.value = data.volumeNumber || data.volume || "";
    }

    document.getElementById("issueNumber").value = data.issueNumber || "";
    document.getElementById("pageNumber").value = data.pageNumber || "";
    document.getElementById("doi").value = data.doi || "";

    // Populate Harvard Reference if it exists, otherwise generate it
    const harvardRefField = document.getElementById("harvardReference");
    if (harvardRefField) {
      if (data.harvardReference) {
        harvardRefField.innerHTML = data.harvardReference;
      } else {
        updateHarvardRef();
      }
    }
  }

  // Explicitly remove required attribute to prevent browser validation issues
  const volumeInput = document.getElementById("volume");
  if (volumeInput) {
    volumeInput.required = false;
    volumeInput.removeAttribute("required");
  }

  function updateHarvardRef() {
    const harvardRefField = document.getElementById("harvardReference");
    if (!harvardRefField) return;

    const authors = document.getElementById("authors").value.trim();
    const year = document.getElementById("year").value.trim();
    const publicationName = document.getElementById("publicationName").value.trim();
    const journalName = document.getElementById("journalName").value.trim();
    const volume = document.getElementById("volume").value.trim();
    const issueNumber = document.getElementById("issueNumber").value.trim();
    const pageNumber = document.getElementById("pageNumber").value.trim();

    // Format: Authors (Year), "Publication Name", <i>Journal Name</i>, vol. V, no. N, pp. P.

    let parts = [];

    // Authors
    if (authors) parts.push(authors);

    // Year
    if (year) parts.push(`(${year})`);

    // Title
    if (publicationName) parts.push(`"${publicationName}"`);

    // Journal (Italicized)
    if (journalName) parts.push(`<i>${journalName}</i>`);

    // Volume
    if (volume) parts.push(`vol. ${volume}`);

    // Issue
    if (issueNumber) parts.push(`no. ${issueNumber}`);

    // Pages
    if (pageNumber) {
      if (/^\d+-\d+$/.test(pageNumber)) {
        parts.push(`pp. ${pageNumber}`);
      } else if (/^\d+$/.test(pageNumber)) {
        parts.push(`p. ${pageNumber}`);
      } else {
        parts.push(pageNumber);
      }
    }

    if (parts.length === 0) {
      harvardRefField.innerHTML = "";
      return;
    }

    // Join logic - simplified
    // We already built the parts in order, so we can just join them with commas.
    // But we need to handle the Authors (Year) case which usually has no comma between them?
    // Actually, standard Harvard is: Authors (Year) "Title", Journal...
    // My previous logic was:
    // if (authors) built += authors;
    // if (year) built += ` (${year})`;
    // then comma.

    // Let's stick to the previous logic but ensure volume is in the middle array.

    let built = "";
    if (authors) built += authors;
    if (year) built += ` (${year})`;

    let middle = [];
    if (publicationName) middle.push(`"${publicationName}"`);
    if (journalName) middle.push(`<i>${journalName}</i>`);
    if (volume) middle.push(`vol. ${volume}`);
    if (issueNumber) middle.push(`no. ${issueNumber}`);
    if (pageNumber) {
      if (/^\d+-\d+$/.test(pageNumber)) middle.push(`pp. ${pageNumber}`);
      else if (/^\d+$/.test(pageNumber)) middle.push(`p. ${pageNumber}`);
      else middle.push(pageNumber);
    }

    if (built && middle.length > 0) built += ", ";
    built += middle.join(", ");

    if (built && !built.endsWith(".")) built += ".";

    harvardRefField.innerHTML = built;
  }

  // Load draft if in edit mode
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
    console.log("🆕 Creating a new journal publication — blank form mode.");
  }

  setupSubmissionView({
    category: "journalPublications",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // Update Harvard reference on input changes
  [
    "authors",
    "year",
    "publicationName",
    "journalName",
    "volume",
    "issueNumber",
    "pageNumber",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateHarvardRef);
  });

  // Add event listeners for manual journal metrics lookup
  const journalNameField = document.getElementById("journalName");
  const yearField = document.getElementById("year");
  
  if (journalNameField && yearField) {
    // Trigger lookup when journal name changes
    journalNameField.addEventListener("input", () => {
      const journalName = journalNameField.value.trim();
      const year = yearField.value.trim();
      
      if (journalName && year) {
        debounceJournalLookup(journalName, year);
      } else {
        hideJournalMetrics();
      }
    });
    
    // Trigger lookup when year changes
    yearField.addEventListener("input", () => {
      const journalName = journalNameField.value.trim();
      const year = yearField.value.trim();
      
      if (journalName && year) {
        debounceJournalLookup(journalName, year);
      } else {
        hideJournalMetrics();
      }
    });
  }

  // Save as Draft
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
      const authors = document.getElementById("authors")?.value.trim() || "";
      const year = document.getElementById("year")?.value.trim() || "";
      const publicationName =
        document.getElementById("publicationName")?.value.trim() || "";
      const journalName =
        document.getElementById("journalName")?.value.trim() || "";
      // HTML uses "volume" but we'll store as volumeNumber
      const volumeField = document.getElementById("volume");
      const volumeNumber = volumeField ? volumeField.value.trim() : "";
      const issueNumber =
        document.getElementById("issueNumber")?.value.trim() || "";
      const pageNumber =
        document.getElementById("pageNumber")?.value.trim() || "";
      const doi = document.getElementById("doi")?.value.trim() || "";

      // Read innerHTML for contenteditable div
      const harvardReference = document.getElementById("harvardReference")?.innerHTML.trim() || "";
      
      // Get journal metrics from hidden fields
      const journalRanking = document.getElementById("journalRanking")?.value || "";
      const citationCount = parseInt(document.getElementById("citationCount")?.value) || 0;
      const impactFactor = parseFloat(document.getElementById("impactFactor")?.value) || 0;

      // Upload photo
      let photoUrl = "";
      try {
        photoUrl = await uploadImageFromInput("relatedPhoto") || "";
      } catch (error) {
        console.error("Photo upload failed:", error);
      }

      const formData = {
        authors,
        year,
        publicationName,
        journalName,
        volumeNumber, // Store as volumeNumber
        issueNumber,
        pageNumber,
        doi,
        harvardReference,
        photo: photoUrl,
        journalRanking,
        citationCount,
        impactFactor,
        date: new Date().toISOString(),
      };

      try {
        const currentDraftId = localStorage.getItem("currentDraftId");
        if (isEditMode && currentDraftId) {
          try {
            await fetch(`${API_BASE}/${currentDraftId}`, { method: "DELETE" });
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
            category: "JournalPublications",
            formData,
            createdBy: userEmail,
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        Toast.success("Journal Publication draft saved successfully!");
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
      "journalName",
    ];


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
    const journalName = document.getElementById("journalName").value.trim();
    const volumeField = document.getElementById("volume");
    const volumeNumber = volumeField ? volumeField.value.trim() : "";
    const issueNumber = document.getElementById("issueNumber").value.trim();
    const pageNumber = document.getElementById("pageNumber").value.trim();
    const doi = document.getElementById("doi").value.trim();

    // Read innerHTML for contenteditable div
    const harvardReference = document.getElementById("harvardReference").innerHTML.trim();
    
    // Get journal metrics from hidden fields
    const journalRanking = document.getElementById("journalRanking")?.value || "";
    const citationCount = parseInt(document.getElementById("citationCount")?.value) || 0;
    const impactFactor = parseFloat(document.getElementById("impactFactor")?.value) || 0;

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
      authors,
      year,
      publicationName,
      journalName,
      volumeNumber, // Store as volumeNumber
      issueNumber,
      pageNumber,
      doi,
      harvardReference,
      photo: photoUrl,
      journalRanking,
      citationCount,
      impactFactor,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "journalPublications",
          formData,
          createdBy: userEmail,
          draftId: draftId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Journal Publication submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
      // Reset Harvard Ref manually
      const harvardRefField = document.getElementById("harvardReference");
      if (harvardRefField) harvardRefField.innerHTML = "";
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
