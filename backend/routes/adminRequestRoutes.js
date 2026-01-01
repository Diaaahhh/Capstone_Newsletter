// backend/routes/adminRequestRoutes.js
const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middleware/auth");
const adminRequestController = require("../controllers/adminRequestController");

// optional list endpoint
router.get("/", auth, adminAuth, adminRequestController.getAdminRequests);

// accept / reject
router.put(
  "/handle/:userId",
  auth,
  adminAuth,
  adminRequestController.handleAdminRequest
);

module.exports = router;
