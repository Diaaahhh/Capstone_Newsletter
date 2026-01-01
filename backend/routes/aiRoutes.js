const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'AI routes working' });
});

// Handle preflight for reformat
router.options('/reformat', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// Test reformat with GET
router.get('/reformat', (req, res) => {
  res.json({ message: 'Reformat route exists, but use POST' });
});

// Reformat text
router.post('/reformat', async (req, res) => {
  try {
    const { text, tone } = req.body;

    if (!text || !tone) {
      return res.status(400).json({ error: 'Text and tone are required' });
    }

    const prompt = `Please reformat the following text into a ${tone} tone. Maintain the original meaning but adjust the language style accordingly. Return only the reformatted text without any additional explanation.\n\nText: ${text}`;

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reformattedText = response.text().trim();

    res.json({ reformattedText });
  } catch (error) {
    console.error('Error reformatting text:', error);
    res.status(500).json({ error: 'Failed to reformat text: ' + error.message });
  }
});


module.exports = router;