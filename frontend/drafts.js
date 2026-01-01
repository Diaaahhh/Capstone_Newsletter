// drafts.js
// -------------------------------------
// Purpose: Manage user drafts on draftsVC.html
// Features: View, Edit, Submit for Review, Delete, Clear All
// -------------------------------------

// ---------- Configuration ----------
const API_BASE = "http://localhost:5000/api";
const DRAFTS_ENDPOINT = `${API_BASE}/drafts`;
const SUBMISSIONS_ENDPOINT = `${API_BASE}/submissions`;

// Mapping of draft categories to their corresponding "create" page paths.
// Keys use the category name with whitespace removed and converted to lowercase.
const CATEGORY_PAGE_MAP = {
  majorevent: "createMajorEvent.html",
  cccevent: "createcccEvents.html",
  alumnistories: "createalumniStories.html",
  clubactivity: "createclubActivities.html",
  clubactivities: "createclubActivities.html",
  bookchapters: "createBookChapters.html",
  booksandeditedbooks: "createBooksAndEditedBooks.html",
  journalpublications: "createJournalPublications.html",
  conferenceproceeding: "createConferenceProceeding.html",
  conferencepresentation: "createConferencePresentation.html",
  seminarandworkshop: "createSeminarAndWorkshop.html",
  seminar: "CreateSeminar.html",
  researchgrant: "createResearchGrant.html",
  researcharticle: "createresearch.html",
  research: "createresearch.html",
  scholarships: "createscholarships.html",
  library: "createlibrary.html",
  libraryarticle: "createlibrary.html",
  recreation: "createrecreation.html",
  membership: "creatememberships.html",
  memberships: "creatememberships.html",
  trainingprogram: "createtrainingProgram.html",
  maparticle: "createmap.html",
  map: "createmap.html",
  achievements: "createachievements.html",
  achievementsvc: "createAchievementsVC.html",
  mediavc: "createMediaVC.html",
  others: "createothers.html",
  deptactivities: "createdeptActivities.html",
  clubactivities: "clubActivities.html", // fallback landing page
};

function resolveCreatePage(category) {
  if (!category) return null;
  const normalized = category.replace(/\s+/g, "").toLowerCase();
  return (
    CATEGORY_PAGE_MAP[normalized] ||
    `create${category.replace(/\s+/g, "")}.html`
  );
}

function withNewFlag(path) {
  if (!path) return null;
  return path.includes("?") ? `${path}&new=true` : `${path}?new=true`;
}

// ---------- Main Script ----------
document.addEventListener("DOMContentLoaded", () => {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    Toast.warning("Please log in first.");
    window.location.href = "loginPage.html";
    return;
  }

  const draftsContainer = document.getElementById("draftsContainer");
  const clearAllBtn = document.getElementById("clearAllBtn");

  let draftsList = [];

  // --- Handle "Create New" button ---
  const createNewBtn = document.getElementById("createNewBtn");

  if (createNewBtn) {
    createNewBtn.addEventListener("click", (e) => {
      e.preventDefault(); // 🚫 stop default anchor behavior (no jump)

      const category = e.currentTarget?.dataset.category;

      if (!category) {
        Toast.warning("No category selected for new draft.");
        return;
      }

      // 🧹 Clear any previously loaded draft info
      localStorage.removeItem("isEditingDraft");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("currentDraftId");

      const targetPage = withNewFlag(resolveCreatePage(category));
      if (!targetPage) {
        alert("Unable to find the create page for this category.");
        return;
      }

      console.log("Navigating to:", targetPage);
      window.location.href = targetPage;
    });
  }

  // ---------- Load Drafts ----------
  // Load ALL drafts from ALL categories
  async function loadDrafts() {
    draftsContainer.innerHTML = "<p>Loading drafts...</p>";

    try {
      const response = await fetch(`${DRAFTS_ENDPOINT}?createdBy=${userEmail}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const allDrafts = await response.json();

      // Show ALL drafts from ALL categories
      draftsList = allDrafts;

      renderDrafts(draftsList);
    } catch (error) {
      console.error("Error loading drafts:", error);
      draftsContainer.innerHTML =
        "<p>⚠️ Failed to load drafts. Check your server connection.</p>";
    }
  }

  // ---------- Render Drafts ----------
  function renderDrafts(drafts) {
    draftsContainer.innerHTML = "";

    if (drafts.length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "No drafts found.";
      draftsContainer.appendChild(msg);
      return;
    }

    drafts.forEach((draft) => {
      const data = draft.formData || {};

      // Card container
      const card = document.createElement("div");
      card.className = "draft-card border p-3 mb-3 rounded";

      // Title - generate based on category
      const title = document.createElement("h4");
      let titleText = "Untitled Draft";

      if (data.title) {
        titleText = data.title;
      } else if (data.eventTitle) {
        titleText = data.eventTitle;
      } else if (data.researchTopic) {
        titleText = data.researchTopic;
      } else if (data.grantSource) {
        titleText = `Research Grant: ${data.grantSource}`;
      } else if (data.publicationName) {
        titleText = data.publicationName;
      } else if (data.bookTitle) {
        titleText = data.bookTitle;
      } else if (data.chapterTitle) {
        titleText = data.chapterTitle;
      } else if (data.conferenceName) {
        titleText = data.conferenceName;
      } else if (data.paperTitle) {
        titleText = data.paperTitle;
      } else if (data.workTitle) {
        titleText = data.workTitle;
      } else if (data.mediaText) {
        titleText =
          data.mediaText.substring(0, 50) +
          (data.mediaText.length > 50 ? "..." : "");
      } else if (data.achievementText) {
        titleText =
          data.achievementText.substring(0, 50) +
          (data.achievementText.length > 50 ? "..." : "");
      } else if (data.activityTitle) {
        titleText = data.activityTitle;
      } else if (data.storyTitle) {
        titleText = data.storyTitle;
      }

      title.textContent = titleText;

      // Category + Date
      const info = document.createElement("p");
      info.className = "text-muted small";
      const date = new Date(draft.createdAt).toLocaleString();
      info.textContent = `${draft.category} • ${date}`;

      // Action Buttons
      const actions = document.createElement("div");
      actions.className = "d-flex gap-2 mt-2";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-secondary btn-sm";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editDraft(draft);

      const submitBtn = document.createElement("button");
      submitBtn.className = "btn btn-primary btn-sm";
      submitBtn.textContent = "Submit for Review";
      submitBtn.onclick = () => submitDraft(draft);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-outline-danger btn-sm";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteDraft(draft._id);

      actions.appendChild(editBtn);
      actions.appendChild(submitBtn);
      actions.appendChild(deleteBtn);

      // Add all parts to card
      card.appendChild(title);
      card.appendChild(info);
      card.appendChild(actions);

      draftsContainer.appendChild(card);
    });
  }

  // When user clicks Create New
  // document.getElementById("createNewBtn").addEventListener("click", () => {
  //   localStorage.removeItem("currentDraft");
  //   localStorage.removeItem("currentDraftId");
  //   window.location.href = "createBookChapters.html"; // or any form page
  // });

  // ---------- Edit Draft ----------
  function editDraft(draft) {
    // Store full draft data in localStorage
    localStorage.setItem("currentDraft", JSON.stringify(draft));
    localStorage.setItem("currentDraftId", draft._id);
    localStorage.setItem("isEditingDraft", "true"); // mark edit mode

    const targetPage = resolveCreatePage(draft.category);
    if (!targetPage) {
      alert("Unable to open this draft because its create page was not found.");
      return;
    }
    window.location.href = targetPage;
  }

  // ---------- Delete Draft ----------
  async function deleteDraft(id) {
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const res = await fetch(`${DRAFTS_ENDPOINT}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      Toast.success("Draft deleted successfully!");
      loadDrafts();
    } catch (error) {
      console.error("Error deleting draft:", error);
      Toast.error("Failed to delete draft.");
    }
  }

  // Normalize category name to match backend expectations
  function normalizeCategory(category) {
    if (!category) return category;
    // Convert "ResearchGrant" -> "researchGrant", "BookChapters" -> "bookChapters", etc.
    const normalized = category.charAt(0).toLowerCase() + category.slice(1);
    // Handle special cases
    const categoryMap = {
      "researchGrant": "researchGrant",
      "bookChapters": "bookChapters",
      "booksAndEditedBooks": "booksAndEditedBooks",
      "journalPublications": "journalPublications",
      "conferenceProceeding": "conferenceProceeding",
      "conferencePresentation": "conferencePresentation",
      "seminarAndWorkshop": "seminarAndWorkshop",
      "mediaVC": "mediaVC",
      "achievementsVC": "achievementsVC",
      "ResearchGrant": "researchGrant",
      "BookChapters": "bookChapters",
      "BooksAndEditedBooks": "booksAndEditedBooks",
      "JournalPublications": "journalPublications",
      "ConferenceProceeding": "conferenceProceeding",
      "ConferencePresentation": "conferencePresentation",
      "SeminarAndWorkshop": "seminarAndWorkshop",
      "MediaVC": "mediaVC",
      "AchievementsVC": "achievementsVC",
    };
    return categoryMap[category] || normalized;
  }

  // ---------- Submit Draft for Review ----------
  async function submitDraft(draft) {
    if (!confirm("Submit this draft for review?")) return;

    try {
      const payload = {
        category: normalizeCategory(draft.category),
        formData: draft.formData,
        createdBy: userEmail,
        draftId: draft._id,
      };

      const res = await fetch(`${SUBMISSIONS_ENDPOINT}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Submission failed");
      }

      // Draft will be automatically deleted by the backend
      Toast.success("Draft submitted for review! The draft has been removed from your drafts.");
      loadDrafts();
    } catch (error) {
      console.error("Submit error:", error);
      alert(`❌ Failed to submit draft: ${error.message}`);
    }
  }

  // ---------- Clear All Drafts ----------
  async function clearAll() {
    if (!confirm("Are you sure you want to delete ALL drafts?")) return;

    for (const d of draftsList) {
      await fetch(`${DRAFTS_ENDPOINT}/${d._id}`, { method: "DELETE" });
    }

    alert("All drafts cleared!");
    loadDrafts();
  }

  if (clearAllBtn) clearAllBtn.addEventListener("click", clearAll);

  // ---------- Initial Load ----------
  loadDrafts();
});
