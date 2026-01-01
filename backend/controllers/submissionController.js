// backend/controllers/submissionController.js
const Submission = require("../models/Submission");
const Notification = require("../models/Notification");
const NewsfeedVC = require("../models/NewsfeedVC");
const NewsfeedGeneral = require("../models/NewsfeedGeneral");
const Draft = require("../models/Draft");
const User = require("../models/User");

// 🔹 Map each category to its division: "vc" or "general"
// Right now only bookChapters is wired to VC Newsletter.
// You can add the remaining 24 categories here, e.g.:
// researchGrant: "vc", "achievements": "general", etc.
const CATEGORY_DIVISION_MAP = {
  bookChapters: "vc",
  researchGrant: "vc",
  journalPublications: "vc",
  booksAndEditedBooks: "vc",
  conferenceProceeding: "vc",
  conferencePresentation: "vc",
  seminarAndWorkshop: "vc",
  mediaVC: "vc",
  achievementsVC: "vc",
  cccEvents: "general",
  alumniStories: "general",
  clubActivities: "general",
  library: "general",
  research: "general",
  recreation: "general",
  degreeReview: "general",
  seminars: "general",
  memberships: "general",
  trainingProgram: "general",
  achievements: "general",
  map: "general",
  deptActivities: "general",
  others: "general",
  media: "general",
  majorEvent: "general",
};

const CATEGORY_LABELS = {
  researchGrant: "Research Grant",
  journalPublications: "Journal Publication",
  bookChapters: "Book Chapter",
  booksAndEditedBooks: "Book or Edited Book",
  conferenceProceeding: "Conference Proceeding",
  conferencePresentation: "Conference Presentation",
  seminarAndWorkshop: "Seminar or Workshop",
  mediaVC: "Media Submission",
  media: "Media Submission",
  achievementsVC: "Achievement",
  achievements: "Achievement",
  majorEvent: "Major Event",
};

const SUBMITTER_NAME_FIELDS = [
  "studentName",
  "fullName",
  "name",
  "submittedBy",
  "submittedByName",
  "applicantName",
  "contactName",
  "primaryAuthor",
  "author",
  "teamLead",
  "leaderName",
];

const TITLE_FIELDS = [
  "chapterTitle",
  "title",
  "researchTopic",
  "paperTitle",
  "bookName",
  "achievementTitle",
  "eventTitle",
  "projectTitle",
  "mediaTitle",
  "topic",
  "headline",
];

function getDivisionForCategory(category) {
  if (!category) return "general";
  // Normalize category name to handle case variations
  const normalized = category.charAt(0).toLowerCase() + category.slice(1);
  return CATEGORY_DIVISION_MAP[normalized] || CATEGORY_DIVISION_MAP[category] || "general";
}

function getCategoryLabel(category) {
  if (!category) return "Submission";
  if (CATEGORY_LABELS[category]) {
    return CATEGORY_LABELS[category];
  }
  return category
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickField(formData, fields) {
  if (!formData || typeof formData !== "object") return "";
  for (const field of fields) {
    const value = formData[field];
    if (typeof value === "string" && value.trim().length) {
      return value.trim();
    }
  }
  return "";
}

function getSubmitterDisplay(formData, createdBy) {
  const submitterName = pickField(formData, SUBMITTER_NAME_FIELDS);
  if (submitterName && submitterName !== createdBy) {
    return `${submitterName} (${createdBy})`;
  }
  return createdBy;
}

function getSubmissionTitle(formData) {
  return pickField(formData, TITLE_FIELDS);
}

/**
 * Build fullText for VC Newsletter items based on category
 * Follows the same pattern as Book Chapters (harvardReference)
 */
function buildFullTextForCategory(category, formData) {
  if (!formData || typeof formData !== "object") return "";

  const cat = (category || "").toLowerCase();
  const fd = formData;

  // Book Chapters: use harvardReference
  if (cat === "bookchapters" || cat === "bookchapter") {
    return (typeof fd.harvardReference === "string" && fd.harvardReference.trim()) || "";
  }

  // Research Grant: build from grantSource, researchTopic, grantAmount, members
  if (cat === "researchgrant") {
    const parts = [];
    if (fd.researchTopic) parts.push(`Research Topic: ${fd.researchTopic}`);
    if (fd.grantSource) parts.push(`Grant Source: ${fd.grantSource}`);
    if (fd.grantAmount) parts.push(`Amount: ${fd.grantAmount}`);
    if (fd.members && Array.isArray(fd.members) && fd.members.length > 0) {
      const memberNames = fd.members.map(m => m.name || "").filter(Boolean).join(", ");
      if (memberNames) parts.push(`Team Members: ${memberNames}`);
    }
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Journal Publications: build from authors, year, journalName, publicationName, volume, issue, pages, doi
  if (cat === "journalpublications" || cat === "journalpublication") {
    // If user provided a custom Harvard reference, use it
    if (typeof fd.harvardReference === "string" && fd.harvardReference.trim()) {
      return fd.harvardReference.trim();
    }
    // Fallback to auto-generation
    const parts = [];
    if (fd.authors) parts.push(fd.authors);
    if (fd.year) parts.push(`(${fd.year})`);
    if (fd.publicationName) parts.push(`"${fd.publicationName}"`);
    if (fd.journalName) parts.push(`in ${fd.journalName}`);
    if (fd.volumeNumber) parts.push(`Vol. ${fd.volumeNumber}`);
    if (fd.issueNumber) parts.push(`Issue ${fd.issueNumber}`);
    if (fd.pageNumber) parts.push(`pp. ${fd.pageNumber}`);
    if (fd.doi) parts.push(`DOI: ${fd.doi}`);
    return parts.join(", ") + (parts.length > 0 ? "." : "");
  }

  // Books and Edited Books: build from authors, year, bookTitle, publisher, publicationPlace, isbn
  if (cat === "booksandeditedbooks" || cat === "bookseditedbooks") {
    const parts = [];
    if (fd.authors) parts.push(fd.authors);
    if (fd.year) parts.push(`(${fd.year})`);
    if (fd.bookTitle) parts.push(fd.bookTitle);
    if (fd.publisher) parts.push(fd.publisher);
    if (fd.publicationPlace) parts.push(fd.publicationPlace);
    if (fd.isbn) parts.push(`ISBN: ${fd.isbn}`);
    return parts.join(", ") + (parts.length > 0 ? "." : "");
  }

  // Conference Proceeding: build from authors, year, publicationName, conferenceName, conferencePlace, conferenceDate, pageRange, doi
  if (cat === "conferenceproceeding" || cat === "conferenceproceedings") {
    const parts = [];
    if (fd.authors) parts.push(fd.authors);
    if (fd.year) parts.push(`(${fd.year})`);
    if (fd.publicationName) parts.push(`"${fd.publicationName}"`);
    if (fd.conferenceName) parts.push(`in ${fd.conferenceName}`);
    if (fd.conferencePlace) parts.push(fd.conferencePlace);
    if (fd.conferenceDate) parts.push(fd.conferenceDate);
    if (fd.pageRange) parts.push(`pp. ${fd.pageRange}`);
    if (fd.doi) parts.push(`DOI: ${fd.doi}`);
    return parts.join(", ") + (parts.length > 0 ? "." : "");
  }

  // Conference Presentation: similar to Conference Proceeding
  if (cat === "conferencepresentation" || cat === "conferencepresentations") {
    const parts = [];
    if (fd.authors) parts.push(fd.authors);
    if (fd.year) parts.push(`(${fd.year})`);
    if (fd.publicationName) parts.push(`"${fd.publicationName}"`);
    if (fd.conferenceName) parts.push(`at ${fd.conferenceName}`);
    if (fd.conferencePlace) parts.push(fd.conferencePlace);
    if (fd.conferenceDate) parts.push(fd.conferenceDate);
    if (fd.doi) parts.push(`DOI: ${fd.doi}`);
    return parts.join(", ") + (parts.length > 0 ? "." : "");
  }

  // Seminar and Workshop: build from workTitle, topic, description, date, location
  if (cat === "seminarandworkshop" || cat === "seminarworkshop") {
    const parts = [];
    if (fd.workTitle) parts.push(fd.workTitle);
    if (fd.topic) parts.push(`Topic: ${fd.topic}`);
    if (fd.description) parts.push(fd.description);
    if (fd.date) parts.push(`Date: ${fd.date}`);
    if (fd.location) parts.push(`Location: ${fd.location}`);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Media VC: use harvardRef if available, otherwise build from name, caption, description
  if (cat === "mediavc" || cat === "media") {
    // Prioritize harvardRef field
    if (fd.harvardRef) return fd.harvardRef;

    // Fallback to building from other fields
    const parts = [];
    if (fd.name) parts.push(fd.name);
    if (fd.mediaTitle) parts.push(fd.mediaTitle);
    if (fd.caption) parts.push(fd.caption);
    if (fd.description) parts.push(fd.description);
    if (fd.mediaText) parts.push(fd.mediaText);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Achievements VC: use harvardRef if available, otherwise build from name, description, etc.
  if (cat === "achievementsvc" || cat === "achievements") {
    // Prioritize harvardRef field
    if (fd.harvardRef) return fd.harvardRef;

    // Fallback to building from other fields
    const parts = [];
    if (fd.name) parts.push(fd.name);
    if (fd.achievementTitle) parts.push(fd.achievementTitle);
    if (fd.description) parts.push(fd.description);
    if (fd.achievementText) parts.push(fd.achievementText);
    if (fd.achievementRole || fd.achieverType) {
      parts.push(`Role: ${fd.achievementRole || fd.achieverType}`);
    }
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Major Event: build from title, shortSummary, date, location (removed fullArticle for brevity)
  if (cat === "majorevent" || cat === "majorevents") {
    const parts = [];
    if (fd.title) parts.push(fd.title);
    if (fd.fullArticle) parts.push(fd.fullArticle);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Achievements: build from title, fullArticle
  if (cat === "achievement" || cat === "achievements") {
    const parts = [];
    if (fd.title) parts.push(fd.title);
    if (fd.fullArticle) parts.push(fd.fullArticle);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // CCC Events: build from title, fullArticle
  if (cat === "cccevent" || cat === "cccevents") {
    const parts = [];
    if (fd.title) parts.push(fd.title);
    if (fd.fullArticle) parts.push(fd.fullArticle);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // All other general categories: build from title, fullArticle
  const generalCategories = [
    "alumnistories", "alumnistory",
    "clubactivities", "clubactivity",
    "library",
    "research",
    "recreation",
    "degreereview",
    "seminars", "seminar",
    "memberships", "membership",
    "trainingprogram",
    "map",
    "deptactivities", "deptactivity",
    "others", "other",
    "media"
  ];

  if (generalCategories.includes(cat)) {
    const parts = [];
    if (fd.title) parts.push(fd.title);
    if (fd.fullArticle) parts.push(fd.fullArticle);
    return parts.join(". ") + (parts.length > 0 ? "." : "");
  }

  // Fallback: try common fields
  return (
    (typeof fd.fullText === "string" && fd.fullText.trim()) ||
    (typeof fd.description === "string" && fd.description.trim()) ||
    (typeof fd.summary === "string" && fd.summary.trim()) ||
    pickField(formData, TITLE_FIELDS) ||
    ""
  );
}

/**
 * Submit for review (create a Submission record).
 * Body: { category, formData, createdBy, draftId? }
 */
exports.submitForReview = async (req, res) => {
  try {
    const { category, formData, createdBy, draftId } = req.body;
    if (!category || !formData || !createdBy) {
      return res
        .status(400)
        .json({ message: "category, formData and createdBy are required" });
    }

    // Determine if submitter is student or faculty
    let submitterRole = "user";
    let submitterName = "";
    try {
      const user = await User.findOne({ email: createdBy });
      if (user) {
        submitterRole = user.role || "user";
        submitterName = user.name || "";
      }
    } catch (userError) {
      console.warn("Could not fetch user info:", userError);
      // Continue with default values
    }

    const submission = new Submission({
      category,
      formData,
      createdBy,
      status: "Pending",
    });

    await submission.save();

    // Delete draft if draftId is provided
    if (draftId) {
      try {
        await Draft.findByIdAndDelete(draftId);
      } catch (draftError) {
        console.warn("Could not delete draft:", draftError);
        // Continue even if draft deletion fails
      }
    }

    // Create admin notification with improved formatting
    const categoryLabel = getCategoryLabel(category);
    const submissionTitle = getSubmissionTitle(formData);
    const submitterInfo = getSubmitterDisplay(formData, createdBy);

    // Determine submitter type for notification
    const submitterType = submitterRole === "student" ? "student" :
      submitterRole === "faculty" ? "faculty" : "user";

    const adminTitle = submissionTitle
      ? `${categoryLabel}: "${submissionTitle}"`
      : `New ${categoryLabel} submission`;

    // Enhanced message with category and submitter type
    const adminMessage = submissionTitle
      ? `A ${submitterType} (${submitterInfo}) has submitted an ${categoryLabel} titled "${submissionTitle}" for review from the ${categoryLabel} category.`
      : `A ${submitterType} (${submitterInfo}) has submitted an ${categoryLabel} for review from the ${categoryLabel} category.`;

    const adminNotification = new Notification({
      to: "admins", // admin UI will load with to=admins
      title: adminTitle,
      message: adminMessage,
      relatedSubmissionId: submission._id,
    });

    await adminNotification.save();

    return res.status(201).json({
      message: "Submission created and admins notified",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return res
      .status(500)
      .json({ message: "Server error creating submission" });
  }
};

/**
 * Admin reviews a submission (approve/reject).
 * PUT /submissions/:id/review
 * Body: { action: "accept" | "reject", adminId, comment }
 */
exports.reviewSubmission = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { action, adminId, comment } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "action must be 'accept' or 'reject'" });
    }

    const status = action === "accept" ? "Accepted" : "Rejected";

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { status, adminComment: comment || "", reviewedBy: adminId || "" },
      { new: true }
    );

    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    // Determine submitter role for notification
    let submitterRole = "user";
    try {
      const user = await User.findOne({ email: submission.createdBy });
      if (user) {
        submitterRole = user.role || "user";
      }
    } catch (userError) {
      console.warn("Could not fetch user info for notification:", userError);
      // Continue with default values
    }

    // Create user notification with improved formatting
    const categoryLabel = getCategoryLabel(submission.category);
    const submissionTitle = getSubmissionTitle(submission.formData);
    const baseLabel = submissionTitle
      ? `Your ${categoryLabel} "${submissionTitle}"`
      : `Your ${categoryLabel} submission`;
    const statusText = status.toLowerCase();

    const userTitle = `${categoryLabel} ${status}`;

    // Enhanced message with category and admin comment
    let userMessage = `${baseLabel} from the ${categoryLabel} category has been ${statusText}.`;
    if (comment && comment.trim().length) {
      userMessage += ` Admin comment: ${comment}`;
    }

    // Notify the original submitter (student or faculty)
    const notify = new Notification({
      to: submission.createdBy,
      title: userTitle,
      message: userMessage,
      relatedSubmissionId: submission._id,
    });

    await notify.save();

    // 🔹 If accepted: copy into appropriate Newsfeed collection
    let newsfeedItem = null;
    if (status === "Accepted") {
      const division = getDivisionForCategory(submission.category);
      console.log(`[Review] Submission accepted. Category: ${submission.category}, Division: ${division}`);

      // Build fullText for VC Newsletter following Book Chapters pattern
      const fd = submission.formData || {};

      // For general categories with title field, format as: Title\n\nFullArticle
      // This ensures the homepage can extract the title from the first line
      let fullText;
      if (division === "general" && fd.title) {
        // Put title on first line, then full article
        fullText = `${fd.title}\n\n${fd.fullArticle || ""}`;
      } else {
        // For VC categories or categories without title, use existing logic
        // Check both harvardRef and harvardReference for compatibility
        fullText = fd.harvardRef || fd.harvardReference || buildFullTextForCategory(submission.category, fd);
      }

      console.log(`[Review] Extracted fullText length: ${fullText.length}`);

      // Optional image field (you can standardize this later for other categories)
      const image =
        fd.imageUrl ||
        fd.image ||
        fd.featuredImage ||
        fd.featuredImages ||
        fd.coverImage ||
        fd.photo ||
        fd.relatedPhoto ||
        fd.researchPhoto ||
        ""; // will be empty string if nothing found

      // DOI if present (mainly useful for VC Newsfeed)
      const doiField =
        fd.doi || fd.DOI || fd.doiLink || "";

      try {
        if (division === "vc") {
          // Extract journal metrics from formData if present
          const journalRanking = fd.journalRanking || "";
          const citationCount = parseInt(fd.citationCount) || 0;
          const impactFactor = parseFloat(fd.impactFactor) || 0;
          const hIndex = parseInt(fd.hIndex) || 0;

          newsfeedItem = await NewsfeedVC.create({
            category: submission.category,
            fullText,
            image,
            doi: doiField,
            formData: submission.formData, // Save original data
            createdBy: submission.createdBy,
            relatedSubmission: submission._id,
            // Journal Metrics
            journalRanking,
            citationCount,
            impactFactor,
            hIndex,
            metricsLastUpdated: journalRanking || citationCount > 0 ? new Date() : undefined
          });
          console.log(`[Review] Created NewsfeedVC item: ${newsfeedItem._id}`);
        } else {
          newsfeedItem = await NewsfeedGeneral.create({
            category: submission.category,
            fullText,
            image,
            createdBy: submission.createdBy,
            relatedSubmission: submission._id,
          });
          console.log(`[Review] Created NewsfeedGeneral item: ${newsfeedItem._id}`);
        }
      } catch (createError) {
        console.error("[Review] Error creating newsfeed item:", createError);
        // We don't fail the whole request, but we should probably let the admin know
      }
    }

    return res.json({
      message: `Submission ${status.toLowerCase()}`,
      submission,
      newsfeedItem, // Return this so we can see if it was created
      debug: {
        division: getDivisionForCategory(submission.category),
        fullTextLength: (submission.formData.fullArticle || "").length
      }
    });
  } catch (error) {
    console.error("Error reviewing submission:", error);
    return res
      .status(500)
      .json({ message: "Server error reviewing submission" });
  }
};

/**
 * GET submissions (filter by category or creator)
 */
exports.getSubmissions = async (req, res) => {
  try {
    const { createdBy, category, status } = req.query;
    const filter = {};
    if (createdBy) filter.createdBy = createdBy;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const submissions = await Submission.find(filter).sort({ createdAt: -1 });
    return res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching submissions" });
  }
};

/**
 * GET single submission by ID
 */
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    return res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching submission" });
  }
};
