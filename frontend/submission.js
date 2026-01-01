// submission.js
// Utility functions to interact with submission endpoints from front-end forms.
// This file exposes helper functions used by specific create pages (CreateMajorEvent.js, CreateAchievements.js, etc.)
const API_BASE = "http://localhost:5000/api";
const SUBMISSIONS_ENDPOINT = `${API_BASE}/submissions`;
const DRAFTS_ENDPOINT = `${API_BASE}/drafts`;

/**
 * Submit a plain payload (category, formData, createdBy) for review.
 * Returns the saved submission object on success.
 */
async function submitPayloadForReview(payload) {
  const res = await fetch(`${SUBMISSIONS_ENDPOINT}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data;
}

// Normalize category name to match backend expectations
function normalizeCategory(category) {
  if (!category) return category;
  const normalized = category.charAt(0).toLowerCase() + category.slice(1);
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

/**
 * Convert a draft -> submission and optionally delete draft.
 * draftObj must be the draft document returned from backend (has _id, category, formData, createdBy)
 */
async function submitDraftById(draftObj) {
  const payload = {
    category: normalizeCategory(draftObj.category || "Unspecified"),
    formData: draftObj.formData || {},
    createdBy: draftObj.createdBy,
    draftId: draftObj._id,
  };

  const res = await fetch(`${SUBMISSIONS_ENDPOINT}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data;
}

/**
 * Admin function: review a submission (accept or reject)
 * action -> "accept" or "reject"
 */
async function reviewSubmission(submissionId, action, adminId, comment = "") {
  const res = await fetch(`${SUBMISSIONS_ENDPOINT}/${submissionId}/review`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, adminId, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Review failed");
  return data;
}

// Expose functions globally for use in other scripts
if (typeof window !== "undefined") {
  window.submitPayloadForReview = submitPayloadForReview;
  window.submitDraftById = submitDraftById;
  window.reviewSubmission = reviewSubmission;
}
