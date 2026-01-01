// vcNewsletterTimeline.js
// VC Newsletter page: fetch from /api/newsfeedvc and render as responsive card grid

console.log("🔵 vcNewsletterTimeline.js STARTED LOADING");

// State
let allItems = [];
let filteredItems = [];
let autoScrollInterval = null;
let isUserScrolling = false;
let userScrollTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  const timelineRoot = document.getElementById("cardsGrid");
  if (!timelineRoot) return;

  const API_NEWSFEED_VC = "http://localhost:5000/api/newsfeedvc";
  const userRole = localStorage.getItem("userRole") || "user";

  init();

  async function init() {
    timelineRoot.innerHTML =
      '<div class="vc-news-state">Loading VC newsletter...</div>';

    try {
      const res = await fetch(API_NEWSFEED_VC);
      if (!res.ok) throw new Error("Failed to load VC newsfeed");

      const items = await res.json();

      if (!Array.isArray(items) || !items.length) {
        timelineRoot.innerHTML =
          '<div class="vc-news-state">No items found in VC Newsfeed.</div>';
        return;
      }

      // Store globally
      allItems = items;
      filteredItems = [...allItems];

      // Export for PDF generation
      window.vcNewsletterAllItems = [...allItems];

      // Initial Sort (Newest first)
      sortItems("date");

      // Export filtered items for PDF generation
      window.vcNewsletterFilteredItems = [...filteredItems];

      // Render
      renderGrid(filteredItems);

      // Setup Filter Listeners
      setupFilters();

      // Start auto-scrolling
      startAutoScroll();
    } catch (err) {
      console.error("VC timeline load error:", err);
      timelineRoot.innerHTML =
        '<div class="vc-news-state">Error loading VC Newsfeed timeline.</div>';
    }
  }

  function setupFilters() {
    // Buttons
    const btnApply = document.querySelector(".apply-filters");
    const btnClear = document.querySelector(".clear-filters");
    const sortSelect = document.querySelector(
      ".filter-group select.filter-select:not([multiple])"
    );

    // Search Input (in header)
    const searchInput = document.querySelector(".search-input");

    // Let's find inputs by their container context to be safe
    const filterContainer = document.querySelector(".filter-dropdown");
    if (!filterContainer) return;

    // Date Inputs
    const dateInputs = filterContainer.querySelectorAll(".date-input");
    const dateFrom = dateInputs[0];
    const dateTo = dateInputs[1];

    // Category Checkboxes
    const categoryCheckboxes = filterContainer.querySelectorAll(
      "input[type='checkbox'][name='category']"
    );

    // Sort Select - finding the one after "Sort By:" label
    const allSelects = filterContainer.querySelectorAll("select");
    let sortSel = null;
    allSelects.forEach((sel) => {
      if (
        sel.previousElementSibling &&
        sel.previousElementSibling.textContent.includes("Sort By")
      ) {
        sortSel = sel;
      }
    });
    // Fallback
    if (!sortSel) {
      const labels = filterContainer.querySelectorAll("label");
      labels.forEach((lbl) => {
        if (lbl.textContent.includes("Sort By")) {
          sortSel = lbl.nextElementSibling;
        }
      });
    }

    if (btnApply) {
      btnApply.addEventListener("click", () => {
        applyFilters(dateFrom, dateTo, categoryCheckboxes, searchInput);

        // Close the filter dropdown after applying filters
        const filterToggle = document.getElementById("filterToggle");
        const filterDropdown = document.getElementById("filterDropdown");
        if (filterToggle && filterDropdown) {
          filterToggle.classList.remove("active");
          filterDropdown.classList.remove("active");
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        // Reset inputs
        if (dateFrom) dateFrom.value = "";
        if (dateTo) dateTo.value = "";
        if (categoryCheckboxes) {
          categoryCheckboxes.forEach((cb) => (cb.checked = false));
        }
        if (sortSel) sortSel.value = "";
        if (searchInput) searchInput.value = "";

        // Reset data
        filteredItems = [...allItems];
        sortItems("date"); // Default sort

        // Export for PDF generation
        window.vcNewsletterFilteredItems = [...filteredItems];
        window.vcNewsletterAllItems = [...allItems];

        renderGrid(filteredItems);
      });
    }

    if (sortSel) {
      sortSel.addEventListener("change", () => {
        sortItems(sortSel.value);
        renderGrid(filteredItems);
      });
    }

    // Real-time search or on enter? Let's do input for real-time
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        applyFilters(dateFrom, dateTo, categoryCheckboxes, searchInput);
      });
    }
  }

  function applyFilters(dateFrom, dateTo, categoryCheckboxes, searchInput) {
    let temp = [...allItems];

    // 1. Date Range
    if (dateFrom && dateFrom.value) {
      const fromTime = new Date(dateFrom.value).getTime();
      temp = temp.filter((item) => {
        const itemTime = new Date(item.createdAt || 0).getTime();
        return itemTime >= fromTime;
      });
    }
    if (dateTo && dateTo.value) {
      // Set to end of day for "To" date
      const toDate = new Date(dateTo.value);
      toDate.setHours(23, 59, 59, 999);
      const toTime = toDate.getTime();
      temp = temp.filter((item) => {
        const itemTime = new Date(item.createdAt || 0).getTime();
        return itemTime <= toTime;
      });
    }

    // 2. Category
    if (categoryCheckboxes) {
      const selectedCategories = Array.from(categoryCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
      if (selectedCategories.length > 0) {
        temp = temp.filter((item) => {
          const itemCat = normalizeCategory(item.category);
          return selectedCategories.some((sel) => {
            const cleanSel = sel.replace(/-/g, "");
            return itemCat === cleanSel;
          });
        });
      }
    }

    // 3. Search Text
    if (searchInput && searchInput.value.trim()) {
      const term = searchInput.value.toLowerCase().trim();
      temp = temp.filter((item) => {
        const title = getTitleForItem(item).toLowerCase();
        const body = (item.fullText || "").toLowerCase();
        const cat = (item.category || "").toLowerCase();
        return (
          title.includes(term) || body.includes(term) || cat.includes(term)
        );
      });
    }

    filteredItems = temp;

    // Re-apply current sort
    const filterContainer = document.querySelector(".filter-dropdown");
    let sortSel = null;
    if (filterContainer) {
      const labels = filterContainer.querySelectorAll("label");
      labels.forEach((lbl) => {
        if (lbl.textContent.includes("Sort By")) {
          sortSel = lbl.nextElementSibling;
        }
      });
    }
    const sortVal = sortSel ? sortSel.value : "date";
    sortItems(sortVal);

    // Export filtered items for PDF generation
    window.vcNewsletterFilteredItems = [...filteredItems];

    renderGrid(filteredItems);
  }

  function sortItems(criteria) {
    if (!criteria || criteria === "date" || criteria === "date-desc") {
      // Newest first (descending)
      filteredItems.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
    } else if (criteria === "date-asc") {
      // Oldest first (ascending)
      filteredItems.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });
    } else if (criteria === "category") {
      filteredItems.sort((a, b) => {
        const cA = (a.category || "").toLowerCase();
        const cB = (b.category || "").toLowerCase();
        return cA.localeCompare(cB);
      });
    } else if (criteria === "department") {
      // Not strictly available, but we can try if it exists
      filteredItems.sort((a, b) => {
        const dA = (a.department || "").toLowerCase();
        const dB = (b.department || "").toLowerCase();
        return dA.localeCompare(dB);
      });
    } else if (criteria === "impact") {
      // Placeholder for impact sorting
      // Maybe based on views or some other metric if available
    }
  }

  function renderGrid(items) {
    timelineRoot.innerHTML = "";

    if (items.length === 0) {
      timelineRoot.innerHTML =
        '<div class="vc-news-state">No items match your filters.</div>';
      return;
    }

    items.forEach(async (item) => {
      const card = buildCard(item);
      timelineRoot.appendChild(card);

      // Add enhanced metrics display for journal publications and conference proceedings
      if (typeof addMetricsToCard === 'function') {
        const catKey = normalizeCategory(item.category);
        if (catKey === 'journalpublications' || catKey === 'journalpublication' ||
          catKey === 'conferenceproceeding' || catKey === 'conferenceproceedings') {
          await addMetricsToCard(card, item);
        }
      }
    });
  }

  function normalizeCategory(category) {
    return (category || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  }

  function getTitleForItem(item) {
    const fullText = item.fullText || "";
    const firstLine = (fullText.split(/\r?\n/)[0] || "").trim();
    const catKey = normalizeCategory(item.category);
    const fd = item.formData || {};

    switch (catKey) {
      case "researchgrant":
        return (
          fd.researchTopic ||
          item.researchTopic ||
          item.topic ||
          firstLine ||
          "Research Topic"
        );

      case "journalpublications":
      case "journalpublication":
        return (
          fd.journalName ||
          item.journalName ||
          item.journal ||
          firstLine ||
          "Journal Name"
        );

      case "bookchapters":
      case "bookchapter":
        return (
          fd.chapterTitle ||
          item.chapterTitle ||
          item.title ||
          firstLine ||
          "Title of Chapter"
        );

      case "booksandeditedbooks":
      case "bookseditedbooks":
        return (
          fd.bookTitle ||
          item.bookTitle ||
          item.title ||
          firstLine ||
          "Title of the Book"
        );

      case "conferenceproceeding":
      case "conferenceproceedings":
        return (
          fd.conferenceName ||
          item.conferenceName ||
          item.conference ||
          firstLine ||
          "Name of Conference"
        );

      case "conferencepresentation":
      case "conferencepresentations":
        return (
          fd.conferenceName ||
          item.conferenceName ||
          item.conference ||
          firstLine ||
          "Name of Conference"
        );

      case "seminarandworkshop":
      case "seminarworkshop":
        return (
          fd.workTitle ||
          item.workTitle ||
          item.title ||
          firstLine ||
          "Work Title"
        );

      case "media":
        // User asked for "Photo and some text..." in body, title can be caption or generic
        return fd.caption || item.caption || firstLine || "Media";

      case "achievements":
      case "achievementsvc":
        return (
          fd.achievementTitle ||
          item.achievementTitle ||
          item.title ||
          firstLine ||
          "Achievement"
        );

      default:
        return firstLine || "Newsletter entry";
    }
  }

  function truncateText(str, maxLen) {
    if (!str) return "";
    if (str.length <= maxLen) return str;
    const sliced = str.slice(0, maxLen);
    const lastSpace = sliced.lastIndexOf(" ");
    const clean = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
    return clean.trim();
  }

  function getPreviewForItem(item) {
    const catKey = normalizeCategory(item.category);
    const fd = item.formData || {};
    const base = item.summary || item.shortDescription || item.fullText || "";

    // Research Grant: Show Harvard Ref as body
    if (catKey === "researchgrant") {
      return fd.harvardRef || base;
    }

    // Seminar and Workshop: Show brief description
    if (catKey === "seminarandworkshop" || catKey === "seminarworkshop") {
      return fd.briefDescription || base || "Click to see more details";
    }

    // Media & Achievements: "Photo and some text with 'see more'"
    if (
      catKey === "media" ||
      catKey === "achievements" ||
      catKey === "achievementsvc"
    ) {
      const truncated = truncateText(base, 120);
      if (!truncated) return "See more";
      // Always append "See more" as requested
      return truncated + " ... see more";
    }

    // For other categories, user said "Show only 'Research Topic'..." etc.
    // This implies the body text should be hidden or minimal in collapsed state.
    // We'll return an empty string so only the Title (which holds the specific field) is prominent.
    // The card is still clickable to expand.
    return "";
  }

  function buildCategoryLabel(item) {
    const rawCat = item.category || "";
    const catKey = normalizeCategory(rawCat);
    let label = formatCategory(rawCat);

    // Achievements: include student / faculty etc. if present
    if (catKey === "achievements" || catKey === "achievementsvc") {
      const extra =
        item.achievementRole ||
        item.achieverType ||
        item.role ||
        item.level ||
        (item.student ? "Student" : "") || // Fallback checks based on user request "include student or faculty as choosen"
        (item.faculty ? "Faculty" : "");

      // If the item has a specific field like 'categoryType' or similar that stores 'Student'/'Faculty', we should use it.
      // Assuming 'achievementRole' or similar holds it. If not, we might need to check other fields.
      // The user said "include student or faculty as choosen in Achievements category".
      if (extra) label += " – " + extra;
    }

    return label;
  }


  function buildCard(item) {
    // item: { _id, category, fullText, image, doi, createdBy, createdAt, ... }
    const fullText = item.fullText || "";
    const titleText = getTitleForItem(item);
    const previewText = getPreviewForItem(item);

    const card = document.createElement("article");
    card.className = "vc-news-card";
    card.dataset.id = item._id || "";
    card.dataset.fullText = fullText; // Store full text for search functionality

    // Metrics are now handled by addMetricsToCard in renderGrid
    const catKey = normalizeCategory(item.category);

    // Optional image
    if (item.image) {
      const media = document.createElement("div");
      media.className = "vc-news-media";

      const img = document.createElement("img");
      const imageUrl = typeof getImageUrl === 'function' ? getImageUrl(item.image) : item.image;
      console.log('VC Newsletter - Loading image for item:', item._id, 'URL:', imageUrl, 'Original:', item.image);
      img.src = imageUrl;
      img.alt = (item.category || "VC item") + " image";
      img.loading = "lazy";

      // Add error handling
      img.onerror = function() {
        console.error('VC Newsletter - Failed to load image:', imageUrl, 'for item:', item._id);
        // Show a placeholder or hide the media
        media.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #d7e6fa, #bcd4f5); display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px;"><i class="bi bi-image" style="font-size: 24px; opacity: 0.5;"></i><br>Image unavailable</div>';
      };

      img.onload = function() {
        console.log('VC Newsletter - Successfully loaded image:', imageUrl, 'for item:', item._id);
      };

      media.appendChild(img);
      card.appendChild(media);
    }

    const content = document.createElement("div");
    content.className = "vc-news-content";

    // 1. Category Badge (Top Right in Flex)
    const catSpan = document.createElement("span");
    catSpan.className = "vc-news-category-badge";
    catSpan.textContent = buildCategoryLabel(item);

    // 2. Meta Info (Date & Author)
    const meta = document.createElement("div");
    meta.className = "vc-news-meta";


    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "Unknown date";

    const dateSpan = document.createElement("span");
    dateSpan.innerHTML = `<i class="bi bi-calendar3"></i> ${dateStr}`;
    meta.appendChild(dateSpan);

    const authorSpan = document.createElement("span");
    authorSpan.innerHTML = `<i class="bi bi-person-circle"></i> ${escapeHtml(
      item.createdBy || "Unknown"
    )}`;
    meta.appendChild(authorSpan);

    // Append Category Badge to Meta (it will be pushed to right via CSS margin-left: auto)
    meta.appendChild(catSpan);
    content.appendChild(meta);

    // Title
    const titleEl = document.createElement("h3");
    titleEl.className = "vc-news-title";
    // Allow only <i> tags in title
    titleEl.innerHTML = titleText;
    content.appendChild(titleEl);

    // Body
    const bodyEl = document.createElement("p");
    bodyEl.className = "vc-news-body";
    bodyEl.innerHTML = previewText || "";
    content.appendChild(bodyEl);

    // DOI link (if any)
    if (item.doi) {
      const doiLink = document.createElement("a");
      doiLink.className = "vc-news-doi";
      doiLink.href = item.doi;
      doiLink.target = "_blank";
      doiLink.rel = "noopener noreferrer";
      doiLink.innerHTML = `<i class="bi bi-link-45deg"></i> ${escapeHtml(
        item.doi
      )}`;
      content.appendChild(doiLink);
    }

    // Admin-only Edit/Delete
    if (userRole === "admin") {
      const adminBar = document.createElement("div");
      adminBar.className = "vc-news-admin-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-sm btn-outline-primary";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleEditItem(item, card, titleEl, bodyEl);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn-sm btn-outline-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleDeleteItem(item, card);
      });

      adminBar.appendChild(editBtn);
      adminBar.appendChild(deleteBtn);
      content.appendChild(adminBar);
    }

    card.appendChild(content);

    // Card click => expand/collapse text
    card.addEventListener("click", (e) => {
      // Ignore clicks on links and buttons
      if (e.target.closest("button") || e.target.closest("a")) return;

      const expanded = card.classList.toggle("vc-news-card--expanded");
      if (expanded) {
        bodyEl.innerHTML = fullText || previewText;
      } else {
        bodyEl.innerHTML = previewText;
      }
    });

    return card;
  }

  function formatCategory(raw) {
    if (!raw) return "";
    // Convert camelCase / snake_case / kebab-case -> "Nice Words"
    const spaced = raw
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  // --- Admin Edit ---
  async function handleEditItem(item, card, titleEl, bodyEl) {
    const currentText = item.fullText || "";
    const currentDoi = item.doi || "";

    // Show beautiful edit modal
    const formData = await EditModal.show({
      title: "Edit News Item",
      fields: [
        {
          name: "fullText",
          label: "Content",
          type: "textarea",
          value: currentText,
          placeholder: "Enter the full text content...",
          required: true,
        },
        {
          name: "doi",
          label: "DOI (Optional)",
          type: "text",
          value: currentDoi,
          placeholder: "https://doi.org/...",
        },
      ],
    });

    if (!formData) return; // cancel

    const newText = formData.fullText;
    const newDoi = formData.doi;

    try {
      const res = await fetch(
        `${API_NEWSFEED_VC}/${encodeURIComponent(item._id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullText: newText,
            doi: newDoi,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        Toast.error(data.message || "Failed to update news item.");
        return;
      }

      // Update local item & UI
      item.fullText = newText;
      item.doi = newDoi;

      const newTitle = getTitleForItem(item);
      const newPreview = getPreviewForItem(item);

      titleEl.textContent = newTitle;
      // If card currently expanded, show full text; otherwise preview
      if (card.classList.contains("vc-news-card--expanded")) {
        bodyEl.innerHTML = newText;
      } else {
        bodyEl.innerHTML = newPreview || newText;
      }

      let doiLink = card.querySelector(".vc-news-doi");
      if (newDoi) {
        if (!doiLink) {
          doiLink = document.createElement("a");
          doiLink.className = "vc-news-doi";
          card.querySelector(".vc-news-content").appendChild(doiLink);
        }
        doiLink.href = newDoi;
        doiLink.target = "_blank";
        doiLink.rel = "noopener noreferrer";
        doiLink.innerHTML = `<i class="bi bi-link-45deg"></i> ${escapeHtml(
          newDoi
        )}`;
      } else if (doiLink) {
        doiLink.remove();
      }

      Toast.success("News item updated successfully.");
    } catch (err) {
      console.error("Update error:", err);
      Toast.error("Error updating news item.");
    }
  }

  // --- Admin Delete ---
  async function handleDeleteItem(item, card) {
    // Extract title for better context in confirmation
    const itemTitle = getTitleForItem(item) || "this news item";

    // Show beautiful confirmation modal
    const confirmed = await ConfirmModal.delete(
      `Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`,
      "Delete News Item"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_NEWSFEED_VC}/${encodeURIComponent(item._id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        Toast.error(data.message || "Failed to delete news item.");
        return;
      }

      card.remove();

      // Also remove from local arrays so filtering doesn't bring it back
      allItems = allItems.filter((i) => i._id !== item._id);
      filteredItems = filteredItems.filter((i) => i._id !== item._id);

      Toast.success("News item deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      Toast.error("Error deleting news item.");
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m] || m
      );
    });
  }

  // Auto-scroll functionality
  function startAutoScroll() {
    // Skip if on homepage (let homepage-autoscroll.js handle it)
    if (window.location.pathname.includes("homepage.html")) {
      console.log("On homepage, skipping VC autoscroll to avoid conflict");
      return;
    }

    // Scroll the main window/page
    const scrollSpeed = 2;
    const scrollInterval = 20; // milliseconds

    // Detect user scrolling
    window.addEventListener(
      "wheel",
      () => {
        isUserScrolling = true;
        clearInterval(autoScrollInterval);

        // Resume auto-scroll after 3 seconds of no user interaction
        clearTimeout(userScrollTimeout);
        userScrollTimeout = setTimeout(() => {
          console.log("Resuming auto-scroll");
          isUserScrolling = false;
          startAutoScrollInterval();
        }, 3000);
      },
      { passive: true }
    );

    // Detect touch scrolling on mobile
    window.addEventListener(
      "touchstart",
      () => {
        isUserScrolling = true;
        clearInterval(autoScrollInterval);

        clearTimeout(userScrollTimeout);
        userScrollTimeout = setTimeout(() => {
          isUserScrolling = false;
          startAutoScrollInterval();
        }, 3000);
      },
      { passive: true }
    );

    // Start the auto-scroll interval
    startAutoScrollInterval();

    function startAutoScrollInterval() {
      console.log("🚀 Starting VC Newsletter auto-scroll");

      autoScrollInterval = setInterval(() => {
        if (isUserScrolling) return;

        const scrollTop =
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );
        const clientHeight =
          window.innerHeight || document.documentElement.clientHeight;

        // Check if we're at or near the bottom (with 50px threshold)
        const isAtBottom =
          Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50;

        if (isAtBottom) {
          console.log("🔝 At bottom - jumping to top", {
            scrollTop,
            clientHeight,
            scrollHeight,
          });
          // Instant jump to top (no smooth behavior that could cause issues)
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        } else {
          // Continue scrolling down
          window.scrollBy(0, scrollSpeed);
        }
      }, scrollInterval);
    }
  }

  // Stop auto-scroll when user interacts with cards
  function stopAutoScrollOnInteraction() {
    isUserScrolling = true;
    clearInterval(autoScrollInterval);

    clearTimeout(userScrollTimeout);
    userScrollTimeout = setTimeout(() => {
      isUserScrolling = false;
      startAutoScroll();
    }, 5000);
  }
});

console.log("✅ vcNewsletterTimeline.js COMPLETED");
