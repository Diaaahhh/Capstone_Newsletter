// ============================================================
// GLOBAL SEARCH FUNCTIONALITY
// Reusable search component for all pages
// ============================================================

// Global modal function (accessible from anywhere)
window.openNewsModal = function (item) {
  // Remove existing modal if any
  const existingModal = document.querySelector(".news-modal");
  if (existingModal) {
    existingModal.remove();
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, (m) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }

  function formatCategoryLabel(raw) {
    const CATEGORY_LABELS = {
      cccEvents: "CCC Events",
      alumniStories: "Alumni Stories",
      clubActivities: "Club Activities",
      scholarships: "Scholarships",
      library: "Library",
      research: "Research",
      recreation: "Recreation",
      degreeReview: "Degree Review",
      seminars: "Seminars",
      memberships: "Memberships",
      trainingProgram: "Training Program",
      achievements: "Achievements",
      map: "Map",
      deptActivities: "Department Activities",
      others: "Others",
      researchGrant: "Research Grant",
      journalPublications: "Journal Publications",
      bookChapters: "Book Chapters",
      booksAndEditedBooks: "Books and Edited Books",
      conferenceProceeding: "Conference Proceeding",
      conferencePresentation: "Conference Presentation",
      seminarAndWorkshop: "Seminar and Workshop",
      media: "Media",
      achievementsVC: "Achievements",
    };

    if (!raw) return "General";
    if (CATEGORY_LABELS[raw]) return CATEGORY_LABELS[raw];
    const spaced = raw.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  // Create modal
  const modal = document.createElement("div");
  modal.className = "news-modal";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "news-modal-close";
  closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
  closeBtn.setAttribute("aria-label", "Close");

  // Modal content container
  const modalContent = document.createElement("div");
  modalContent.className = "news-modal-content";

  // Header section
  const header = document.createElement("div");
  header.className = "news-modal-header";

  const categoryBadge = document.createElement("div");
  categoryBadge.className = "news-modal-category";
  categoryBadge.textContent = formatCategoryLabel(item.category || "General");
  header.appendChild(categoryBadge);

  // Extract title from fullText (first line)
  const fullText = item.fullText || "";
  const firstLine = (fullText.split(/\r?\n/)[0] || "").trim();
  const titleText = firstLine || "News Update";

  const title = document.createElement("h1");
  title.className = "news-modal-title";
  title.textContent = titleText;
  header.appendChild(title);

  // Meta info
  const meta = document.createElement("div");
  meta.className = "news-modal-meta";

  const createdAt = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "Unknown date";

  const dateDiv = document.createElement("div");
  dateDiv.innerHTML = `<i class="bi bi-calendar3"></i>${createdAt}`;
  meta.appendChild(dateDiv);

  const authorDiv = document.createElement("div");
  authorDiv.innerHTML = `<i class="bi bi-person-circle"></i>${escapeHtml(
    item.createdBy || "Unknown"
  )}`;
  meta.appendChild(authorDiv);

  header.appendChild(meta);
  modalContent.appendChild(header);

  // Image if available
  if (item.image) {
    const imageDiv = document.createElement("div");
    imageDiv.className = "news-modal-image";
    const img = document.createElement("img");
    img.src = typeof getImageUrl === 'function' ? getImageUrl(item.image) : item.image;
    img.alt = titleText;
    imageDiv.appendChild(img);
    modalContent.appendChild(imageDiv);
  }

  // Body content
  const body = document.createElement("div");
  body.className = "news-modal-body";

  // Initially display fullText
  const paragraphs = fullText.split(/\n\n+/);
  paragraphs.forEach(para => {
    if (para.trim()) {
      const p = document.createElement("p");
      p.textContent = para.trim();
      body.appendChild(p);
    }
  });

  modalContent.appendChild(body);
  modal.appendChild(closeBtn);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Show modal with animation
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);

  // Close handlers
  const closeModal = () => {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  };

  closeBtn.addEventListener("click", closeModal);

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
};

// Initialize global search
(function () {
  const searchInput = document.querySelector(".search-input");
  const searchContainer = document.querySelector(".search-container");

  if (!searchInput || !searchContainer) return;

  const API_GENERAL_NEWS = "http://localhost:5000/api/newsfeed-general";
  const API_VC_NEWS = "http://localhost:5000/api/newsfeedvc";

  let allNewsItems = [];
  let searchTimeout = null;
  let searchDropdown = null;

  // Detect current page category from URL or page title
  const currentCategory = detectCurrentCategory();

  // Create search dropdown if it doesn't exist
  if (!document.getElementById("searchDropdown")) {
    searchDropdown = document.createElement("div");
    searchDropdown.className = "search-dropdown";
    searchDropdown.id = "searchDropdown";
    searchContainer.appendChild(searchDropdown);
  } else {
    searchDropdown = document.getElementById("searchDropdown");
  }

  // Category labels for display
  const CATEGORY_LABELS = {
    cccEvents: "CCC Events",
    alumniStories: "Alumni Stories",
    clubActivities: "Club Activities",
    scholarships: "Scholarships",
    library: "Library",
    research: "Research",
    recreation: "Recreation",
    degreeReview: "Degree Review",
    seminars: "Seminars",
    memberships: "Memberships",
    trainingProgram: "Training Program",
    achievements: "Achievements",
    map: "Map",
    deptActivities: "Department Activities",
    others: "Others",
    researchGrant: "Research Grant",
    journalPublications: "Journal Publications",
    bookChapters: "Book Chapters",
    booksAndEditedBooks: "Books and Edited Books",
    conferenceProceeding: "Conference Proceeding",
    conferencePresentation: "Conference Presentation",
    seminarAndWorkshop: "Seminar and Workshop",
    media: "Media",
    achievementsVC: "Achievements",
  };

  function formatCategoryLabel(raw) {
    if (!raw) return "General";
    if (CATEGORY_LABELS[raw]) return CATEGORY_LABELS[raw];
    const spaced = raw.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  // Load all news items for search (both general and VC newsletter)
  async function loadNewsForSearch() {
    try {
      // Fetch both general and VC newsletter items
      const [generalRes, vcRes] = await Promise.all([
        fetch(API_GENERAL_NEWS),
        fetch(API_VC_NEWS)
      ]);

      let items = [];

      // Add general news items
      if (generalRes.ok) {
        const generalItems = await generalRes.json();
        if (Array.isArray(generalItems)) {
          items = items.concat(generalItems.filter(item => !isMediaCategory(item.category)));
        }
      }

      // Add VC newsletter items
      if (vcRes.ok) {
        const vcItems = await vcRes.json();
        if (Array.isArray(vcItems)) {
          items = items.concat(vcItems);
        }
      }

      allNewsItems = items;
    } catch (err) {
      console.error("Error loading news for search:", err);
    }
  }

  function isMediaCategory(category) {
    if (!category) return false;
    const c = String(category).toLowerCase();
    return c === "media" || c === "mediavc" || c === "mediageneral";
  }

  // Detect current page category
  function detectCurrentCategory() {
    const path = window.location.pathname.toLowerCase();
    const pageTitle = document.querySelector('.page-title')?.textContent.toLowerCase() || '';

    // Map of page patterns to categories
    const categoryMap = {
      'majorevents': 'majorevent',
      'cccevents': 'cccevent',
      'alumnistories': 'alumnistories',
      'clubactivities': 'clubactivities',
      'scholarships': 'scholarships',
      'library': 'library',
      'research': 'research',
      'recreation': 'recreation',
      'degreereview': 'degreereview',
      'seminars': 'seminars',
      'memberships': 'memberships',
      'trainingprogram': 'trainingprogram',
      'achievements': 'achievements',
      'map': 'map',
      'deptactivities': 'deptactivities',
      'others': 'others',
      'researchgrant': 'researchgrant',
      'journalpublications': 'journalpublications',
      'bookchapters': 'bookchapters',
      'booksandeditedbooks': 'booksandeditedbooks',
      'conferenceproceeding': 'conferenceproceeding',
      'conferencepresentation': 'conferencepresentation',
      'seminarandworkshop': 'seminarandworkshop',
      'mediavc': 'media',
      'achievementsvc': 'achievementsvc'
    };

    // Check URL path
    for (const [key, value] of Object.entries(categoryMap)) {
      if (path.includes(key)) {
        return value;
      }
    }

    // Check page title
    for (const [key, value] of Object.entries(categoryMap)) {
      if (pageTitle.includes(key.replace(/([A-Z])/g, ' $1').toLowerCase())) {
        return value;
      }
    }

    // Homepage or VC Newsletter page - search all
    if (path.includes('homepage') || path.includes('vcnewsletter') || path.includes('printpage')) {
      return null; // null means search all categories
    }

    return null;
  }

  // Normalize category for comparison
  function normalizeCategory(category) {
    if (!category) return '';
    return String(category).toLowerCase().replace(/[\s_-]+/g, '');
  }

  // Search function - searches by ID, title, and content (filtered by current category if applicable)
  function performSearch(query) {
    if (!query || query.trim().length < 2) {
      searchDropdown.classList.remove("active");
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    let results = allNewsItems.filter(item => {
      // Get the title (first line of fullText)
      const title = (item.fullText || "").split(/\r?\n/)[0].trim().toLowerCase();
      // Get the full content
      const content = (item.fullText || "").toLowerCase();
      // Get the ID
      const itemId = (item._id || "").toLowerCase();
      // Get the category
      const category = (item.category || "").toLowerCase();

      // Check if matches search term
      const matchesSearch = title.includes(searchTerm) ||
        content.includes(searchTerm) ||
        itemId.includes(searchTerm) ||
        category.includes(searchTerm);

      if (!matchesSearch) return false;

      // If on a category page, filter by that category
      if (currentCategory) {
        const itemCategory = normalizeCategory(item.category);
        const pageCategory = normalizeCategory(currentCategory);

        // Handle variations of category names
        return itemCategory === pageCategory ||
          itemCategory.includes(pageCategory) ||
          pageCategory.includes(itemCategory);
      }

      return true;
    });

    displaySearchResults(results, query);
  }

  // Display search results in dropdown
  function displaySearchResults(results, query) {
    if (results.length === 0) {
      searchDropdown.innerHTML = `
        <div class="search-dropdown-empty">
          No results found for "${escapeHtml(query)}"
        </div>
      `;
      searchDropdown.classList.add("active");
      return;
    }

    // Limit to top 10 results
    const limitedResults = results.slice(0, 10);
    const totalCount = results.length;
    const showing = limitedResults.length;

    // Build header with result count
    let headerHTML = `
      <div class="search-dropdown-header">
        ${showing} ${showing === 1 ? 'Result' : 'Results'} ${totalCount > showing ? `(${totalCount} total)` : ''}
        ${currentCategory ? `in ${formatCategoryLabel(currentCategory)}` : ''}
      </div>
    `;

    // Build results
    let resultsHTML = limitedResults.map((item, index) => {
      const firstLine = (item.fullText || "").split(/\r?\n/)[0].trim() || "Newsletter entry";
      const truncatedText = firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine;
      const createdAt = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : "Unknown date";

      return `
        <a href="#" class="search-dropdown-item" data-id="${item._id || ''}" style="animation-delay: ${index * 0.03}s">
          <div class="search-dropdown-title">${escapeHtml(truncatedText)}</div>
          <div>
            <span class="search-dropdown-category">${formatCategoryLabel(item.category)}</span>
            <span class="search-dropdown-date">${createdAt}</span>
          </div>
        </a>
      `;
    }).join("");

    searchDropdown.innerHTML = headerHTML + resultsHTML;

    // Add click handlers to search results
    searchDropdown.querySelectorAll(".search-dropdown-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const itemId = e.currentTarget.dataset.id;
        openSearchResultModal(itemId);
        searchDropdown.classList.remove("active");
        searchInput.value = "";
      });
    });

    searchDropdown.classList.add("active");
  }

  // Open search result in modal
  function openSearchResultModal(itemId) {
    // Find the item in allNewsItems
    const item = allNewsItems.find(i => i._id === itemId);
    if (!item) {
      console.error("Item not found:", itemId);
      return;
    }

    // Open the modal with the item data using global function
    window.openNewsModal(item);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, (m) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  // Event listeners
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 300); // Debounce search
  });

  searchInput.addEventListener("focus", (e) => {
    if (e.target.value.trim().length >= 2) {
      performSearch(e.target.value);
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove("active");
    }
  });

  // Load news items when page loads
  document.addEventListener("DOMContentLoaded", () => {
    loadNewsForSearch();
  });

  // Also load immediately if DOM is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    loadNewsForSearch();
  }
})();