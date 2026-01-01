const express = require('express');
const router = express.Router();

// ❌ Wrong (causing crash)
// const { auth, adminAuth, facultyAuth } = require('../middleware/auth');

// ✅ Correct
const { auth, adminAuth, facultyAuth } = require('./middleware/auth');

router.get('/student', auth, (req, res) => {
  res.send('Student route working!');
});

router.get('/admin', adminAuth, (req, res) => {
  res.send('Admin route working!');
});

router.get('/faculty', facultyAuth, (req, res) => {
  res.send('Faculty route working!');
});

module.exports = router;
