// backend/routes/userInteractionRoutes.js
const express = require("express");
const router = express.Router();
const userInteractionController = require("../controllers/userInteractionController");

// Interaction tracking endpoints
router.post("/interactions/view", userInteractionController.trackView);
router.post("/interactions/search", userInteractionController.trackSearch);
router.post("/interactions/click", userInteractionController.trackClick);
router.post("/interactions/feedback", userInteractionController.trackFeedback);
router.get("/interactions/history/:userId", userInteractionController.getHistory);

// Preference management endpoints
router.post("/preferences", userInteractionController.savePreferences);
router.get("/preferences/:userId", userInteractionController.getPreferences);
router.post("/preferences/exclude", userInteractionController.excludeArticle);

// Recommendation endpoint
router.get("/recommendations/:userId", userInteractionController.getRecommendations);

module.exports = router;
