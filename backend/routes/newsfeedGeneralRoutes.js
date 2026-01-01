// backend/routes/newsfeedGeneralRoutes.js
const express = require("express");
const router = express.Router();

const {
  getGeneralNewsfeed,
  updateGeneralNewsItem,
  deleteGeneralNewsItem,
} = require("../controllers/newsfeedGeneralController");

// GET all / by category
router.get("/", getGeneralNewsfeed);

// Admin-only in real app; for now frontend can hide behind userRole === "admin"
router.put("/:id", updateGeneralNewsItem);
router.delete("/:id", deleteGeneralNewsItem);

module.exports = router;
