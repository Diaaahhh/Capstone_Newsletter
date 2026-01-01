// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { auth: protect } = require("../middleware/auth"); // Correct import
const { updateUserProfile } = require("../controllers/userController");

// Update user profile
router.put("/profile", protect, updateUserProfile);

module.exports = router;
