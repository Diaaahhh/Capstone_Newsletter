const crossrefService = require('../services/crossrefService');
const googleScholarService = require('../services/googleScholarService');
const googleBooksService = require('../services/googleBooksService');
const openLibraryService = require('../services/openLibraryService');
const journalRankingService = require('../services/journalRankingService');
const citationService = require('../services/citationService');
const scimagoService = require('../services/scimagoService');

/**
 * Auto-Fill Controller
 * Handles DOI-based publication data fetching
 */
class AutoFillController {
  /**
   * Fetch publication data by DOI
   * Strategy: Try CrossRef first (fast, reliable), then enhance with Google Scholar
   */
  async fetchPublicationData(req, res) {
    try {
      const { doi } = req.body;

      // Validate DOI input
      if (!doi || typeof doi !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'DOI is required and must be a string'
        });
      }

      // Validate DOI format
      if (!this.isValidDOI(doi)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid DOI format. Please enter a valid DOI (e.g., 10.1234/example.2023.123456)'
        });
      }

      console.log(`\n📚 ========================================`);
      console.log(`📚 Auto-Fill Request for DOI: ${doi}`);
      console.log(`📚 ========================================\n`);

      // Step 1: Try CrossRef API (Primary source - fast and reliable)
      let publicationData = await crossrefService.fetchByDOI(doi);
      const sources = [];

      if (publicationData) {
        sources.push('CrossRef');
        console.log('✅ Data fetched from CrossRef');

        // Step 2: Try to enhance with Google Scholar (for citations)
        // Note: This is optional and may be slow
        try {
          console.log('🔍 Attempting to enhance with Google Scholar...');
          const scholarData = await googleScholarService.searchByDOI(doi);
          
          if (scholarData) {
            // Add citation count from Google Scholar
            if (scholarData.citations) {
              publicationData.citations = scholarData.citations;
            }
            // Add PDF link if available
            if (scholarData.pdfLink) {
              publicationData.pdfLink = scholarData.pdfLink;
            }
            sources.push('Google Scholar');
            console.log('✅ Enhanced with Google Scholar data');
          }
        } catch (error) {
          console.log('⚠️ Google Scholar enhancement failed (continuing with CrossRef data):', error.message);
          // Continue with CrossRef data even if Google Scholar fails
        }

        // Step 3: Fetch journal metrics (ranking, impact factor)
        let journalMetrics = null;
        if (publicationData.journal || publicationData.journalName) {
          try {
            console.log('📊 Fetching journal metrics...');
            const journalName = publicationData.journal || publicationData.journalName;
            const year = publicationData.year || new Date().getFullYear();
            
            // Use SCImago with OpenAlex fallback
            journalMetrics = await scimagoService.getJournalRankingWithFallback(journalName, year);
            
            if (journalMetrics && journalMetrics.ranking) {
              console.log(`✅ Journal Ranking: ${journalMetrics.ranking} (Source: ${journalMetrics.source})`);
              publicationData.journalRanking = journalMetrics.ranking;
              publicationData.impactFactor = journalMetrics.impactFactor || journalMetrics.sjrScore || 0;
              publicationData.hIndex = journalMetrics.hIndex || 0;
              
              // Add source to response
              if (!sources.includes(journalMetrics.source)) {
                sources.push(journalMetrics.source);
              }
            } else {
              console.log('ℹ️ No journal ranking available');
            }
          } catch (error) {
            console.log('⚠️ Journal metrics fetch failed (continuing without metrics):', error.message);
          }
        }

        // Step 4: Fetch citation count
        try {
          console.log('📈 Fetching citation count...');
          const citationData = await citationService.getCitationsByDOI(doi);
          
          if (citationData && citationData.citationCount !== undefined) {
            console.log(`✅ Citations: ${citationData.citationCount}`);
            publicationData.citationCount = citationData.citationCount;
            if (!sources.includes(citationData.source)) {
              sources.push(citationData.source);
            }
          }
        } catch (error) {
          console.log('⚠️ Citation count fetch failed (continuing without citations):', error.message);
        }

        console.log(`\n✅ Success! Data from: ${sources.join(' + ')}\n`);

        return res.json({
          success: true,
          data: publicationData,
          sources: sources,
          message: 'Publication data fetched successfully'
        });
      }

      // Step 3: If CrossRef failed, try Google Scholar as fallback
      console.log('⚠️ CrossRef failed, trying Google Scholar as fallback...');
      const scholarData = await googleScholarService.searchByDOI(doi);

      if (scholarData) {
        console.log('✅ Data fetched from Google Scholar (fallback)');
        
        // Map Google Scholar data to our format
        const fallbackData = {
          title: scholarData.title || '',
          authors: scholarData.authors || '',
          year: scholarData.year || '',
          doi: doi,
          citations: scholarData.citations || 0,
          pdfLink: scholarData.pdfLink || '',
          source: 'Google Scholar'
        };

        return res.json({
          success: true,
          data: fallbackData,
          sources: ['Google Scholar'],
          warning: 'Limited data available from Google Scholar. Please verify and complete manually.'
        });
      }

      // Step 4: Both sources failed
      console.log('❌ Publication not found in any source\n');
      
      return res.status(404).json({
        success: false,
        message: 'Publication not found. Please enter details manually.',
        doi: doi
      });

    } catch (error) {
      console.error('❌ Auto-fill error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Server error occurred while fetching publication data. Please try again or enter details manually.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validate DOI format
   * DOI format: 10.xxxx/xxxxx
   */
  isValidDOI(doi) {
    // Remove common prefixes
    const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '').trim();
    
    // DOI regex pattern: starts with 10. followed by 4+ digits, then /, then any characters
    const doiPattern = /^10\.\d{4,}(\.\d+)*\/[^\s]+$/;
    return doiPattern.test(cleanDOI);
  }

  /**
   * Fetch book data by ISBN
   * Strategy: Try Google Books first (fast, reliable), then fall back to Open Library
   */
  async fetchBookDataByISBN(req, res) {
    try {
      const { isbn } = req.body;

      // Validate ISBN input
      if (!isbn || typeof isbn !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'ISBN is required and must be a string'
        });
      }

      // Validate ISBN format
      if (!this.isValidISBN(isbn)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ISBN format. Please enter a valid ISBN-10 or ISBN-13'
        });
      }

      console.log(`\n📚 ========================================`);
      console.log(`📚 Auto-Fill Request for ISBN: ${isbn}`);
      console.log(`📚 ========================================\n`);

      // Step 1: Try Google Books API (Primary source - fast and reliable)
      let bookData = await googleBooksService.fetchByISBN(isbn);
      const sources = [];

      if (bookData) {
        sources.push('Google Books');
        console.log('✅ Data fetched from Google Books');

        console.log(`\n✅ Success! Data from: ${sources.join(' + ')}\n`);

        return res.json({
          success: true,
          data: bookData,
          sources: sources,
          message: 'Book data fetched successfully'
        });
      }

      // Step 2: If Google Books failed, try Open Library as fallback
      console.log('⚠️ Google Books failed, trying Open Library as fallback...');
      bookData = await openLibraryService.fetchByISBN(isbn);

      if (bookData) {
        sources.push('Open Library');
        console.log('✅ Data fetched from Open Library (fallback)');

        return res.json({
          success: true,
          data: bookData,
          sources: sources,
          warning: 'Limited data available from Open Library. Please verify and complete manually.'
        });
      }

      // Step 3: Both sources failed
      console.log('❌ Book not found in any source\n');
      
      return res.status(404).json({
        success: false,
        message: 'Book not found. Please enter details manually.',
        isbn: isbn
      });

    } catch (error) {
      console.error('❌ ISBN lookup error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Server error occurred while fetching book data. Please try again or enter details manually.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validate ISBN format
   * Accepts ISBN-10 or ISBN-13 (with or without hyphens)
   */
  isValidISBN(isbn) {
    if (!isbn || typeof isbn !== 'string') return false;
    
    // Remove hyphens, spaces, and keep only digits and X
    const cleaned = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
    
    // Valid ISBN must be 10 or 13 characters
    return cleaned.length === 10 || cleaned.length === 13;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    res.json({
      success: true,
      message: 'Auto-fill service is running',
      services: {
        crossref: 'Available',
        googleScholar: 'Available (with rate limiting)',
        googleBooks: 'Available',
        openLibrary: 'Available'
      }
    });
  }
}

module.exports = new AutoFillController();
