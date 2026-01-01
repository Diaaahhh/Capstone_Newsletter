// ============================================================
// ENHANCED RECOMMENDED SECTION - PERSONALIZED RECOMMENDATIONS
// With backend API integration, feedback mechanisms, and personalization indicators
// ============================================================

(function () {
  const SEARCH_HISTORY_KEY = "ewu_search_history";
  const MAX_HISTORY_ITEMS = 50;
  const MAX_RECOMMENDATIONS = 5;
  const API_GENERAL_NEWS = "http://localhost:5000/api/newsfeed-general";
  const API_VC_NEWS = "http://localhost:5000/api/newsfeedvc";

  let allNewsItems = [];
  let recommendedSection = null;
  let recommendedContent = null;
  let closeButton = null;
  let useBackendAPI = true; // Try backend first, fallback to client-side

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

  // Initialize the recommendation system
  function init() {
    recommendedSection = document.getElementById("recommendedSection");
    recommendedContent = document.getElementById("recommendedContent");
    closeButton = document.getElementById("recommendedClose");

    if (!recommendedSection || !recommendedContent || !closeButton) {
      console.warn("Recommended section elements not found");
      return;
    }

    // Create toggle button for reopening
    createToggleButton();

    // Close button handler
    closeButton.addEventListener("click", () => {
      recommendedSection.classList.add("hidden");
      showToggleButton();
    });
  }

  // Create a toggle button to reopen the recommendations
  function createToggleButton() {
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "recommendedToggle";
    toggleBtn.className = "recommended-toggle-btn";
    toggleBtn.innerHTML = '<i class="bi bi-star-fill"></i>';
    toggleBtn.title = "Show Recommendations";
    toggleBtn.style.display = "flex";

    toggleBtn.addEventListener("click", () => {
      if (allNewsItems.length === 0) {
        loadNewsAndRecommend();
      }
      recommendedSection.classList.remove("hidden");
      toggleBtn.style.display = "none";
    });

    document.body.appendChild(toggleBtn);
  }

  // Show the toggle button
  function showToggleButton() {
    const toggleBtn = document.getElementById("recommendedToggle");
    if (toggleBtn) {
      toggleBtn.style.display = "flex";
    }
  }

  // Load all news items
  async function loadNewsAndRecommend() {
    try {
      const [generalRes, vcRes] = await Promise.all([
        fetch(API_GENERAL_NEWS),
        fetch(API_VC_NEWS),
      ]);

      let items = [];

      if (generalRes.ok) {
        const generalItems = await generalRes.json();
        if (Array.isArray(generalItems)) {
          items = items.concat(generalItems);
        }
      }

      if (vcRes.ok) {
        const vcItems = await vcRes.json();
        if (Array.isArray(vcItems)) {
          items = items.concat(vcItems);
        }
      }

      allNewsItems = items;
      generateRecommendations();
    } catch (err) {
      console.error("Error loading news for recommendations:", err);
      showEmptyState();
    }
  }

  // Get search history from localStorage
  function getSearchHistory() {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (err) {
      console.error("Error reading search history:", err);
      return [];
    }
  }

  // Save search term to history
  function saveSearchTerm(term, itemId = null, category = null) {
    if (!term || term.trim().length < 2) return;

    try {
      let history = getSearchHistory();

      // Add new search entry
      history.unshift({
        term: term.toLowerCase().trim(),
        itemId: itemId,
        category: category,
        timestamp: Date.now(),
      });

      // Remove duplicates and limit size
      const uniqueHistory = [];
      const seenTerms = new Set();

      for (const entry of history) {
        if (!seenTerms.has(entry.term)) {
          seenTerms.add(entry.term);
          uniqueHistory.push(entry);
        }
        if (uniqueHistory.length >= MAX_HISTORY_ITEMS) break;
      }

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(uniqueHistory));

      // Track search with backend API
      if (window.RecommendationAPI && term.length >= 3) {
        window.RecommendationAPI.trackSearch(term, category);
      }
    } catch (err) {
      console.error("Error saving search history:", err);
    }
  }

  // Generate recommendations based on backend API or fallback to client-side
  async function generateRecommendations() {
    if (allNewsItems.length === 0) {
      showEmptyState();
      return;
    }

    // Try backend API first
    if (useBackendAPI && window.RecommendationAPI) {
      try {
        const backendRecommendations = await window.RecommendationAPI.getRecommendations(
          MAX_RECOMMENDATIONS
        );

        if (backendRecommendations && backendRecommendations.length > 0) {
          displayBackendRecommendations(backendRecommendations);
          return;
        }
      } catch (error) {
        console.warn("Backend recommendations failed, using client-side:", error);
        useBackendAPI = false; // Fallback to client-side
      }
    }

    // Fallback to client-side recommendations
    generateClientSideRecommendations();
  }

  // Display backend recommendations with reasons
  function displayBackendRecommendations(recommendations) {
    recommendedContent.innerHTML = "";

    // Add personalization header
    const header = document.createElement("div");
    header.className = "recommended-personalized-header";
    header.innerHTML = `
      <div class="personalized-badge">
        <i class="bi bi-person-check-fill"></i>
        <span>Personalized for You</span>
      </div>
    `;
    recommendedContent.appendChild(header);

    recommendations.forEach((rec) => {
      const itemEl = createEnhancedRecommendedItem(rec.article, rec.reasons, rec.score);
      recommendedContent.appendChild(itemEl);
    });
  }

  // Client-side recommendation generation (fallback)
  function generateClientSideRecommendations() {
    const history = getSearchHistory();

    if (history.length === 0) {
      showLatestArticles();
      return;
    }

    // Extract keywords and categories from search history
    const searchTerms = history.map((h) => h.term);
    const searchedCategories = history
      .filter((h) => h.category)
      .map((h) => h.category.toLowerCase());
    const viewedItemIds = history.filter((h) => h.itemId).map((h) => h.itemId);

    // Score each news item based on relevance
    const scoredItems = allNewsItems.map((item) => {
      let score = 0;
      const itemId = item._id || "";
      const title = (item.fullText || "").split(/\r?\n/)[0].toLowerCase();
      const content = (item.fullText || "").toLowerCase();
      const category = (item.category || "").toLowerCase();

      // Skip already viewed items
      if (viewedItemIds.includes(itemId)) {
        return { item, score: -1, reasons: [] };
      }

      const reasons = [];

      // Score based on search terms in title (highest weight)
      searchTerms.forEach((term) => {
        if (title.includes(term)) {
          score += 10;
          reasons.push(`Matches your search: "${term}"`);
        }
      });

      // Score based on search terms in content
      searchTerms.forEach((term) => {
        if (content.includes(term) && !title.includes(term)) {
          score += 5;
        }
      });

      // Score based on category match
      if (searchedCategories.includes(category)) {
        score += 8;
        if (reasons.length === 0) {
          reasons.push("From your favorite categories");
        }
      }

      // Boost recent items slightly
      const daysOld = item.createdAt
        ? (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      if (daysOld < 7) {
        score += 2;
        reasons.push("Recently published");
      }
      if (daysOld < 30) score += 1;

      if (reasons.length === 0) {
        reasons.push("Recommended for you");
      }

      return { item, score, reasons };
    });

    // Filter and sort by score
    const recommendations = scoredItems
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);

    if (recommendations.length === 0) {
      showLatestArticles();
    } else {
      displayClientSideRecommendations(recommendations);
    }
  }

  // Display client-side recommendations
  function displayClientSideRecommendations(recommendations) {
    recommendedContent.innerHTML = "";

    recommendations.forEach((rec) => {
      const itemEl = createEnhancedRecommendedItem(rec.item, rec.reasons, rec.score);
      recommendedContent.appendChild(itemEl);
    });
  }

  // Show latest articles when no recommendations available
  function showLatestArticles() {
    if (allNewsItems.length === 0) {
      showEmptyState();
      return;
    }

    const latestItems = [...allNewsItems]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, MAX_RECOMMENDATIONS);

    recommendedContent.innerHTML = "";

    const header = document.createElement("div");
    header.style.cssText = "padding: 8px 0; margin-bottom: 8px; border-bottom: 1px solid #d7e2ef;";
    header.innerHTML = '<div style="font-size: 0.85rem; color: #64748b; text-align: center;"><i class="bi bi-clock-history"></i> Latest Articles</div>';
    recommendedContent.appendChild(header);

    latestItems.forEach((item) => {
      const itemEl = createEnhancedRecommendedItem(item, ["Recently published"], 50);
      recommendedContent.appendChild(itemEl);
    });
  }

  // Create an enhanced recommended item with personalization features
  function createEnhancedRecommendedItem(item, reasons = [], score = 0) {
    const div = document.createElement("div");
    div.className = "recommended-item";
    div.dataset.id = item._id || "";

    // Personalization badge (if reasons exist)
    if (reasons && reasons.length > 0) {
      const reasonBadge = document.createElement("div");
      reasonBadge.className = "recommended-reason-badge";
      reasonBadge.innerHTML = `<i class="bi bi-lightbulb-fill"></i> ${reasons[0]}`;
      reasonBadge.title = reasons.join("\n");
      div.appendChild(reasonBadge);
    }

    // Category badge
    const categoryBadge = document.createElement("div");
    categoryBadge.className = "recommended-item-category";
    categoryBadge.textContent = formatCategoryLabel(item.category);
    div.appendChild(categoryBadge);

    // Title
    const title = document.createElement("div");
    title.className = "recommended-item-title";
    const firstLine = (item.fullText || "").split(/\r?\n/)[0].trim();
    title.textContent = firstLine || "News Update";
    div.appendChild(title);

    // Meta info
    const meta = document.createElement("div");
    meta.className = "recommended-item-meta";
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "Unknown date";
    meta.innerHTML = `<i class="bi bi-calendar3"></i> ${createdAt}`;
    div.appendChild(meta);

    // Feedback buttons
    const feedbackContainer = document.createElement("div");
    feedbackContainer.className = "recommended-feedback";

    const likeBtn = document.createElement("button");
    likeBtn.className = "feedback-btn feedback-like";
    likeBtn.innerHTML = '<i class="bi bi-hand-thumbs-up"></i>';
    likeBtn.title = "I like this recommendation";
    likeBtn.onclick = (e) => {
      e.stopPropagation();
      handleFeedback(item, "like");
    };

    const dislikeBtn = document.createElement("button");
    dislikeBtn.className = "feedback-btn feedback-dislike";
    dislikeBtn.innerHTML = '<i class="bi bi-hand-thumbs-down"></i>';
    dislikeBtn.title = "Not interested";
    dislikeBtn.onclick = (e) => {
      e.stopPropagation();
      handleFeedback(item, "dislike");
    };

    feedbackContainer.appendChild(likeBtn);
    feedbackContainer.appendChild(dislikeBtn);
    div.appendChild(feedbackContainer);

    // Click handler
    div.addEventListener("click", () => {
      handleArticleClick(item, firstLine);
    });

    return div;
  }

  // Handle article click
  function handleArticleClick(item, title) {
    const searchTerm = title.substring(0, 30);
    saveSearchTerm(searchTerm, item._id, item.category);

    // Track click with backend API
    if (window.RecommendationAPI) {
      window.RecommendationAPI.trackClick(item._id, item.category);
    }

    // Open the modal
    if (window.openNewsModal) {
      window.openNewsModal(item);

      // Track view after a delay (engagement time)
      const viewStartTime = Date.now();
      setTimeout(() => {
        const engagementTime = Math.floor((Date.now() - viewStartTime) / 1000);
        if (window.RecommendationAPI) {
          window.RecommendationAPI.trackView(item._id, item.category, engagementTime);
        }
      }, 5000); // Track after 5 seconds
    }

    // Refresh recommendations after interaction
    setTimeout(() => {
      generateRecommendations();
    }, 1000);
  }

  // Handle feedback (like/dislike)
  function handleFeedback(item, feedbackType) {
    // Track feedback with backend API
    if (window.RecommendationAPI) {
      window.RecommendationAPI.trackFeedback(item._id, feedbackType, item.category);
    }

    // Remove item from current recommendations
    const itemEl = document.querySelector(`.recommended-item[data-id="${item._id}"]`);
    if (itemEl) {
      itemEl.style.opacity = "0";
      itemEl.style.transform = "translateX(-20px)";
      setTimeout(() => {
        itemEl.remove();
        // Refresh recommendations
        generateRecommendations();
      }, 300);
    }

    // Show feedback toast
    if (window.showToast) {
      const message = feedbackType === "like"
        ? "Thanks for your feedback! We'll show more like this."
        : "Got it! We'll show fewer articles like this.";
      window.showToast(message, "success");
    }
  }

  // Show empty state when no articles available
  function showEmptyState() {
    recommendedContent.innerHTML = `
      <div class="recommended-empty">
        <i class="bi bi-inbox"></i>
        <p>No articles available at the moment.</p>
      </div>
    `;
  }

  // Hook into the global search to track searches
  function hookIntoSearch() {
    // Override the original search result click handler
    const originalOpenModal = window.openNewsModal;
    if (originalOpenModal) {
      window.openNewsModal = function (item) {
        // Track the search/view
        const title = (item.fullText || "").split(/\r?\n/)[0].trim();
        saveSearchTerm(title.substring(0, 30), item._id, item.category);

        // Call original function
        originalOpenModal(item);

        // Refresh recommendations after a short delay
        setTimeout(() => {
          generateRecommendations();
        }, 500);
      };
    }

    // Also track search input
    const searchInput = document.querySelector(".search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const term = e.target.value.trim();
        if (term.length >= 3) {
          saveSearchTerm(term);
        }
      });
    }
  }

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    init();
    hookIntoSearch();
  });

  // Also initialize immediately if DOM is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(() => {
      init();
      hookIntoSearch();
    }, 100);
  }

  // Expose function to manually refresh recommendations
  window.refreshRecommendations = function () {
    if (allNewsItems.length > 0) {
      generateRecommendations();
    } else {
      loadNewsAndRecommend();
    }
  };
})();