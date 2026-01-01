// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// POST /api/notifications -> create a notification
router.post("/", notificationController.createNotification);

// GET /api/notifications?to=user@example.com -> get notifications for a user
router.get("/", notificationController.getNotifications);

// PUT /api/notifications/:id/read -> mark as read
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
