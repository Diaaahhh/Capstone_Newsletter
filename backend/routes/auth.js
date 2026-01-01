// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { auth: protect } = require('../middleware/auth');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Get current user profile
router.get('/me', protect, getMe);

module.exports = router;
