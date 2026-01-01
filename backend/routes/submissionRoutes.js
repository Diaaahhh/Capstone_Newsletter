// backend/routes/submissionRoutes.js
const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionController");

// POST /api/submissions/submit -> create a pending submission
router.post("/submit", submissionController.submitForReview);

// GET /api/submissions -> list submissions (filters supported)
router.get("/", submissionController.getSubmissions);

// GET /api/submissions/:id -> fetch a single submission
router.get("/:id", submissionController.getSubmissionById);

// PUT /api/submissions/:id/review -> admin reviews the submission (accept/reject)
router.put("/:id/review", submissionController.reviewSubmission);

module.exports = router;
