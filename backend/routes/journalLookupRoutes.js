// backend/routes/journalLookupRoutes.js
const express = require('express');
const router = express.Router();
const journalRankingService = require('../services/journalRankingService');
const citationService = require('../services/citationService');
const scimagoService = require('../services/scimagoService');

/**
 * POST /api/journal/lookup
 * Fetch journal metrics by journal name
 * Used for manual journal name entry
 */
router.post('/lookup', async (req, res) => {
  try {
    const { journalName, year } = req.body;

    // Validate input
    if (!journalName || typeof journalName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Journal name is required and must be a string'
      });
    }

    const publicationYear = year || new Date().getFullYear();

    console.log(`📊 ========================================`);
    console.log(`📊 Journal Lookup Request`);
    console.log(`📊 Journal: ${journalName}`);
    console.log(`📊 Year: ${publicationYear}`);
    console.log(`📊 ========================================\n`);

    // Fetch journal metrics using SCImago with fallback
    const metrics = await scimagoService.getJournalRankingWithFallback(journalName, publicationYear);

    if (metrics && (metrics.ranking || metrics.impactFactor > 0)) {
      console.log(`✅ Journal metrics found:`);
      console.log(`   - Ranking: ${metrics.ranking || 'N/A'}`);
      console.log(`   - Impact Factor/SJR: ${metrics.impactFactor || metrics.sjrScore || 'N/A'}`);
      console.log(`   - H-Index: ${metrics.hIndex || 'N/A'}`);
      console.log(`   - Source: ${metrics.source}\n`);

      return res.json({
        success: true,
        data: {
          journalRanking: metrics.ranking,
          impactFactor: metrics.impactFactor || 0,
          hIndex: metrics.hIndex || 0,
          citedByCount: metrics.citedByCount || 0,
          source: metrics.source
        },
        message: 'Journal metrics fetched successfully'
      });
    }

    // No metrics found
    console.log(`⚠️ No metrics found for journal: ${journalName}\n`);
    
    return res.json({
      success: true,
      data: {
        journalRanking: null,
        impactFactor: 0,
        hIndex: 0,
        citedByCount: 0,
        source: 'unavailable'
      },
      message: 'Journal metrics not available'
    });

  } catch (error) {
    console.error('❌ Journal lookup error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching journal metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/journal/lookup-by-issn
 * Fetch journal metrics by ISSN
 * Alternative lookup method
 */
router.post('/lookup-by-issn', async (req, res) => {
  try {
    const { issn } = req.body;

    if (!issn || typeof issn !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'ISSN is required and must be a string'
      });
    }

    console.log(`\n📊 Journal Lookup by ISSN: ${issn}\n`);

    const metrics = await journalRankingService.getJournalMetricsByISSN(issn);

    if (metrics && (metrics.ranking || metrics.impactFactor > 0)) {
      return res.json({
        success: true,
        data: {
          journalRanking: metrics.ranking,
          impactFactor: metrics.impactFactor || 0,
          hIndex: metrics.hIndex || 0,
          citedByCount: metrics.citedByCount || 0,
          venueName: metrics.venueName || '',
          source: metrics.source
        },
        message: 'Journal metrics fetched successfully'
      });
    }

    return res.json({
      success: true,
      data: {
        journalRanking: null,
        impactFactor: 0,
        hIndex: 0,
        citedByCount: 0,
        source: 'unavailable'
      },
      message: 'Journal metrics not available'
    });

  } catch (error) {
    console.error('❌ ISSN lookup error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching journal metrics by ISSN',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/journal/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Journal lookup service is running',
    services: {
      openAlex: 'Available',
      caching: 'Enabled'
    }
  });
});

module.exports = router;
