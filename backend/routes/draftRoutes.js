// routes/draftRoutes.js
const express = require("express");
const router = express.Router();
const {
  createDraft,
  getAllDrafts,
  getDraftById,
  deleteDraft
} = require("../controllers/draftController");


// Save a draft
router.post("/", createDraft);

// Get all drafts of specific user
router.get("/", getAllDrafts);

// Get single draft (Reopen)
router.get("/:id", getDraftById);

// Delete specific draft
router.delete("/:id", deleteDraft);

module.exports = router;
