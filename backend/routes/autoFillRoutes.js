const express = require('express');
const router = express.Router();
const autoFillController = require('../controllers/autoFillController');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware to prevent abuse
const autoFillLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many auto-fill requests from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * @route   POST /api/autofill/publication
 * @desc    Fetch publication data by DOI
 * @access  Public (with rate limiting)
 * @body    { doi: string }
 * @returns { success: boolean, data: object, sources: array }
 */
router.post('/publication', autoFillLimiter, autoFillController.fetchPublicationData.bind(autoFillController));

/**
 * @route   POST /api/autofill/book
 * @desc    Fetch book data by ISBN
 * @access  Public (with rate limiting)
 * @body    { isbn: string }
 * @returns { success: boolean, data: object, sources: array }
 */
router.post('/book', autoFillLimiter, autoFillController.fetchBookDataByISBN.bind(autoFillController));

/**
 * @route   GET /api/autofill/health
 * @desc    Health check for auto-fill service
 * @access  Public
 */
router.get('/health', autoFillController.healthCheck.bind(autoFillController));

module.exports = router;
