// ============================================================
// GENERAL NEWSFEED (ALL GENERAL CATEGORIES EXCEPT MEDIA)
// Shown on homepage in #generalNewsfeed
// ============================================================
(function () {
  const API_GENERAL_NEWS = "http://localhost:5000/api/newsfeed-general";

  // Nice labels per category (you can tweak texts later)
  const GENERAL_CATEGORY_LABELS = {
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
  };

  // Helper: is this a Media item? (we want to exclude)
  function isMediaCategory(category) {
    if (!category) return false;
    const c = String(category).toLowerCase();
    return c === "media" || c === "mediavc" || c === "mediageneral";
  }

  function formatCategoryLabel(raw) {
    if (!raw) return "General";
    if (GENERAL_CATEGORY_LABELS[raw]) return GENERAL_CATEGORY_LABELS[raw];

    const spaced = raw
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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

  document.addEventListener("DOMContentLoaded", () => {
    initGeneralNewsfeed();
  });

  async function initGeneralNewsfeed() {
    const grid = document.getElementById("generalNewsfeed");
    const stateEl = document.getElementById("generalNewsfeedState");
    if (!grid || !stateEl) return;

    stateEl.textContent = "Loading latest updates...";

    try {
      const res = await fetch(API_GENERAL_NEWS);
      if (!res.ok) throw new Error("Failed to load general newsfeed");

      let items = await res.json();
      if (!Array.isArray(items)) items = [];

      // Filter: remove Media category
      items = items.filter((item) => !isMediaCategory(item.category));

      if (!items.length) {
        grid.innerHTML = "";
        stateEl.textContent = "No updates have been published yet.";
        return;
      }

      // Newest first just in case
      items.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      grid.innerHTML = "";
      stateEl.textContent = "";

      // Show all items (Option A: show all, all except Media)
      items.forEach(async (item) => {
        const card = buildGeneralNewsCard(item);
        grid.appendChild(card);

        // Add metrics to card if it's a journal publication or conference proceeding
        if (typeof addMetricsToCard === 'function') {
          const category = (item.category || '').toLowerCase();
          if (category.includes('journal') || category.includes('conference') || category.includes('publication')) {
            await addMetricsToCard(card, item);
          }
        }
      });
    } catch (err) {
      console.error("General newsfeed load error:", err);
      stateEl.textContent =
        "Error loading updates. Please check your server connection.";
    }
  }

  function buildGeneralNewsCard(item) {
    const card = document.createElement("article");
    card.className = "general-news-card";
    card.dataset.id = item._id || "";

    // Optional image
    if (item.image) {
      const media = document.createElement("div");
      media.className = "general-news-media";

      const img = document.createElement("img");
      const imageUrl = typeof getImageUrl === 'function' ? getImageUrl(item.image) : item.image;
      console.log('Homepage - Loading image for item:', item._id, 'URL:', imageUrl, 'Original:', item.image);
      img.src = imageUrl;
      img.alt = (item.category || "News item") + " image";
      img.loading = "lazy";

      // Add error handling
      img.onerror = function() {
        console.error('Homepage - Failed to load image:', imageUrl, 'for item:', item._id);
        // Show a placeholder or hide the media
        media.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #d7e6fa, #bcd4f5); display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px;"><i class="bi bi-image" style="font-size: 24px; opacity: 0.5;"></i><br>Image unavailable</div>';
      };

      img.onload = function() {
        console.log('Homepage - Successfully loaded image:', imageUrl, 'for item:', item._id);
      };

      media.appendChild(img);
      card.appendChild(media);
    }

    const content = document.createElement("div");
    content.className = "general-news-content";

    // 1. Category badge - top right
    const catBadge = document.createElement("span");
    catBadge.className = "general-news-category-badge";
    catBadge.textContent = formatCategoryLabel(item.category || "General");
    content.appendChild(catBadge);

    // 2. Date and 3. ID (Author) - below badge, left-aligned
    const metaInfo = document.createElement("div");
    metaInfo.className = "general-news-meta-info";

    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "Unknown date";

    const dateEl = document.createElement("div");
    dateEl.innerHTML = `<i class="bi bi-calendar3"></i>${createdAt}`;

    const idEl = document.createElement("div");
    idEl.innerHTML = `<i class="bi bi-person-circle"></i>${escapeHtml(
      item.createdBy || "Unknown"
    )}`;

    metaInfo.appendChild(dateEl);
    metaInfo.appendChild(idEl);
    content.appendChild(metaInfo);

    // Add journal metrics if available (for journal publications/conference proceedings)
    // This will be populated asynchronously by addMetricsToCard function

    // 4. Title in bold
    const fullText = item.fullText || "";
    const firstLine = (fullText.split(/\r?\n/)[0] || "").trim();
    const titleText = firstLine || "News Update";

    const titleEl = document.createElement("h3");
    titleEl.className = "general-news-title-text";
    titleEl.textContent = titleText;
    content.appendChild(titleEl);

    // 5. Body text - lighter weight, 2-3 lines
    // Skip the first line (title) and any blank lines, show only article content
    const bodyEl = document.createElement("div");
    bodyEl.className = "general-news-body";
    const lines = fullText.split(/\r?\n/);
    const bodyLines = lines.slice(1).filter(line => line.trim()); // Skip first line (title) and remove empty lines
    const bodyText = bodyLines.join('\n');
    bodyEl.textContent = bodyText;
    content.appendChild(bodyEl);

    // "See more" link
    const seeMore = document.createElement("a");
    seeMore.className = "general-news-see-more";
    seeMore.href = "#";
    seeMore.innerHTML = '.... See more';

    // Only show See More if text is long enough
    if (fullText.length > 150 || (fullText.match(/\n/g) || []).length > 2) {
      content.appendChild(seeMore);
    }

    // Admin-only Edit/Delete buttons
    const userRole = localStorage.getItem("userRole") || "user";
    if (userRole === "admin") {
      const adminBar = document.createElement("div");
      adminBar.className = "general-news-admin-actions";
      adminBar.style.marginTop = "10px";
      adminBar.style.display = "flex";
      adminBar.style.gap = "8px";
      adminBar.style.justifyContent = "flex-end";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-sm btn-outline-primary";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleEditItem(item, titleEl, bodyEl);
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

    // Click handler for "See more" - opens full-screen modal
    seeMore.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openNewsModal(item);
    });

    // Also allow clicking the card itself
    card.addEventListener("click", (e) => {
      if (e.target.closest("a") || e.target.closest("button")) return;
      openNewsModal(item);
    });

    return card;
  }

  // Admin Edit Handler
  async function handleEditItem(item, titleEl, bodyEl) {
    const currentText = item.fullText || "";

    // Show beautiful edit modal
    const formData = await EditModal.show({
      title: 'Edit News Item',
      fields: [
        {
          name: 'fullText',
          label: 'Content',
          type: 'textarea',
          value: currentText,
          placeholder: 'Enter the full text content...',
          required: true
        }
      ]
    });

    if (!formData) return; // cancelled

    const newText = formData.fullText;

    try {
      const res = await fetch(
        `http://localhost:5000/api/newsfeed-general/${encodeURIComponent(item._id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullText: newText,
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
      const firstLine = (newText.split(/\r?\n/)[0] || "").trim();
      titleEl.textContent = firstLine || "News Update";
      bodyEl.textContent = newText;

      Toast.success("News item updated successfully.");

      // Refresh the page to show updated content
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Update error:", err);
      Toast.error("Error updating news item.");
    }
  }

  // Admin Delete Handler
  async function handleDeleteItem(item, card) {
    // Extract title for better context in confirmation
    const fullText = item.fullText || "";
    const firstLine = (fullText.split(/\r?\n/)[0] || "").trim();
    const itemTitle = firstLine || "this news item";

    // Show beautiful confirmation modal
    const confirmed = await ConfirmModal.delete(
      `Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`,
      'Delete News Item'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/newsfeed-general/${encodeURIComponent(item._id)}`,
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
      Toast.success("News item deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      Toast.error("Error deleting news item.");
    }
  }

  // Use global modal function
  function openNewsModal(item) {
    window.openNewsModal(item);
  }
})();
