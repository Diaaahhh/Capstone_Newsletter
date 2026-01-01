document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createBooksForm");
  const harvardRefDiv = document.getElementById("harvardRef");
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    Toast.error("You need to be logged in to save a draft.");
    window.location.href = "loginPage.html";
    return;
  }

  // ============================================================
  // AUTO-FILL FUNCTIONALITY USING ISBN
  // ============================================================
  
  const autoFillBtn = document.getElementById("autoFillBtn");
  const isbnInput = document.getElementById("isbn");
  const loadingIndicator = document.getElementById("autoFillLoading");
  const successIndicator = document.getElementById("autoFillSuccess");
  const errorIndicator = document.getElementById("autoFillError");

  if (autoFillBtn && isbnInput) {
    autoFillBtn.addEventListener("click", async () => {
      const isbn = isbnInput.value.trim();

      // Validate ISBN input
      if (!isbn) {
        Toast.warning("Please enter an ISBN first");
        return;
      }

      // Basic ISBN format validation
      if (!isValidISBN(isbn)) {
        showAutoFillStatus("error", "Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13");
        Toast.error("Invalid ISBN format");
        return;
      }

      // Show loading state
      showAutoFillStatus("loading");
      autoFillBtn.disabled = true;
      autoFillBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

      try {
        // Call auto-fill API
        const response = await fetch("http://localhost:5000/api/autofill/book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isbn }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Populate form with fetched data
          populateFormWithAutoFillData(result.data);

          // Show success message
          const sources = result.sources ? result.sources.join(" + ") : "Google Books";
          let message = `Data loaded from ${sources}. Please review and edit if needed.`;
          
          // Add warning about missing fields
          message += " Note: Publication Place must be entered manually.";
          
          showAutoFillStatus("success", message);
          Toast.success("Form auto-filled successfully!");

          // Update Harvard reference
          updateHarvardReference();
        } else {
          // Handle API error
          const errorMsg = result.message || "Book not found. Please enter details manually.";
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
        autoFillBtn.innerHTML = '<i class="bi bi-magic"></i>';
      }
    });
  }

  /**
   * Validate ISBN format
   * ISBN format: 10 or 13 digits (with or without hyphens)
   */
  function isValidISBN(isbn) {
    if (!isbn || typeof isbn !== 'string') return false;
    
    // Remove hyphens, spaces, and keep only digits and X
    const cleaned = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
    
    // Valid ISBN must be 10 or 13 characters
    return cleaned.length === 10 || cleaned.length === 13;
  }

  /**
   * Populate form fields with auto-filled data from API
   * Maps Google Books/Open Library data to book form fields
   */
  function populateFormWithAutoFillData(data) {
    if (!data) return;

    // Populate each field if data exists
    if (data.title) {
      document.getElementById("bookTitle").value = data.title;
    }
    
    if (data.authors) {
      document.getElementById("authors").value = data.authors;
    }
    
    if (data.publisher) {
      document.getElementById("publisher").value = data.publisher;
    }
    
    if (data.year) {
      document.getElementById("year").value = data.year;
    }
    
    if (data.isbn) {
      document.getElementById("isbn").value = data.isbn;
    }

    // Note: Publication Place is NOT available from book APIs
    // User must enter this manually

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
      // Auto-hide after 10 seconds (longer for ISBN due to warning message)
      setTimeout(() => {
        successIndicator.style.display = "none";
      }, 10000);
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


  // Clear leftover draft data if creating new
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

  function populateFormFromData(data = {}) {
    document.getElementById("authors").value = data.authors || "";
    document.getElementById("year").value = data.year || "";
    document.getElementById("bookTitle").value = data.bookTitle || "";
    document.getElementById("publicationPlace").value = data.publicationPlace || "";
    document.getElementById("publisher").value = data.publisher || "";
    document.getElementById("isbn").value = data.isbn || "";
    document.getElementById("criteria").value = data.criteria || "";

    // Populate Harvard Reference if it exists, otherwise generate it
    const harvardRefDiv = document.getElementById("harvardRef");
    if (harvardRefDiv) {
      if (data.harvardRef) {
        harvardRefDiv.innerHTML = data.harvardRef;
      } else {
        updateHarvardReference();
      }
    }
  }

  // Load existing draft if editing
  if (isEditMode && savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      populateFormFromData(draft.formData || {});
      console.log("✅ Draft loaded into form for editing.");
    } catch (err) {
      console.error("Failed to load draft:", err);
      Toast.error("Error loading draft. Please try again.");
    }
  }

  setupSubmissionView({
    category: "booksAndEditedBooks",
    formElement: form,
    extraDisableElements: [draftButton],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // --------------------------
  // Harvard Reference Generator
  // --------------------------
  function updateHarvardReference() {
    const authors = document.getElementById("authors")?.value.trim() || "";
    const year = document.getElementById("year")?.value.trim() || "";
    const bookTitle = document.getElementById("bookTitle")?.value.trim() || "";
    const place = document.getElementById("publicationPlace")?.value.trim() || "";
    const publisher = document.getElementById("publisher")?.value.trim() || "";
    const criteria = document.getElementById("criteria")?.value.trim() || "";

    if (!authors && !year && !bookTitle && !place && !publisher) {
      harvardRefDiv.innerHTML = "";
      return;
    }

    // Format: Authors (ed.) (Year). <i>Book Title</i>. Place: Publisher.
    let reference = "";

    // Authors with (ed.) if Edited Book
    if (authors) {
      if (criteria === "Edited Book") {
        reference += `${authors} (ed.)`;
      } else {
        reference += authors;
      }
    }

    // Year in parentheses
    if (year) {
      reference += ` (${year})`;
    }

    // Add comma after year
    if (reference) {
      reference += ",";
    }

    // Book title in italics with period after
    if (bookTitle) {
      reference += ` <i>${bookTitle}</i>.`;
    }

    // Place: Publisher with period at end
    if (place && publisher) {
      reference += ` ${place}: ${publisher}.`;
    } else if (place) {
      reference += ` ${place}.`;
    } else if (publisher) {
      reference += ` ${publisher}.`;
    }

    harvardRefDiv.innerHTML = reference;
  }

  ["authors", "year", "bookTitle", "publicationPlace", "publisher", "criteria"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateHarvardReference);
  });

  // --------------------------
  // Save Draft
  // --------------------------
  if (draftButton) {
    draftButton.addEventListener("click", async () => {
      const authors = document.getElementById("authors")?.value.trim() || "";
      const year = document.getElementById("year")?.value.trim() || "";
      const bookTitle = document.getElementById("bookTitle")?.value.trim() || "";
      const publicationPlace = document.getElementById("publicationPlace")?.value.trim() || "";
      const publisher = document.getElementById("publisher")?.value.trim() || "";
      const isbn = document.getElementById("isbn")?.value.trim() || "";
      const criteria = document.getElementById("criteria")?.value.trim() || "";

      const formData = {
        authors,
        year,
        bookTitle,
        publicationPlace,
        publisher,
        isbn,
        criteria,
        harvardRef: harvardRefDiv.innerHTML,
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
          body: JSON.stringify({ category: "BooksAndEditedBooks", formData, createdBy: userEmail }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);
        Toast.success("Book/Edited Book draft saved successfully!");
        setTimeout(() => {
          window.location.href = "draftsVC.html";
        }, 1500);
      } catch (err) {
        console.error("Error saving draft:", err);
        Toast.error("Failed to save draft. Check your server connection.");
      }
    });
  }

  // --------------------------
  // Submit for Review
  // --------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requiredFields = ["authors", "year", "bookTitle", "publisher", "criteria"];
    for (let id of requiredFields) {
      const field = document.getElementById(id);
      if (!field || !field.value.trim()) {
        Toast.error("Please fill in all required fields marked with *");
        return;
      }
    }

    const formData = {
      authors: document.getElementById("authors").value.trim(),
      year: document.getElementById("year").value.trim(),
      bookTitle: document.getElementById("bookTitle").value.trim(),
      publicationPlace: document.getElementById("publicationPlace").value.trim(),
      publisher: document.getElementById("publisher").value.trim(),
      isbn: document.getElementById("isbn").value.trim(),
      criteria: document.getElementById("criteria").value.trim(),
      harvardRef: harvardRefDiv.innerHTML,
    };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "booksAndEditedBooks", formData, createdBy: userEmail, draftId: draftId || undefined }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Book/Edited Book submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
      harvardRefDiv.innerHTML = "";
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });
});
