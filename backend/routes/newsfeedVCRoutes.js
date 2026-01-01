// backend/routes/newsfeedVCRoutes.js
const express = require("express");
const router = express.Router();

const {
  getVCNewsfeed,
  updateVCNewsItem,
  deleteVCNewsItem,
} = require("../controllers/newsfeedVCController");

// GET all / by category
router.get("/", getVCNewsfeed);

// Admin-only in real app; for now frontend hides these behind userRole === "admin"
router.put("/:id", updateVCNewsItem);
router.delete("/:id", deleteVCNewsItem);

module.exports = router;
