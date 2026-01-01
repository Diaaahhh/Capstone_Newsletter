const puppeteer = require('puppeteer');

/**
 * Google Scholar Service
 * Scrapes publication data from Google Scholar
 * Note: Use responsibly with rate limiting
 */
class GoogleScholarService {
  constructor() {
    this.baseURL = 'https://scholar.google.com/scholar';
    this.delay = 2000; // 2 seconds delay between requests
    this.maxRetries = 2;
  }

  /**
   * Search Google Scholar by DOI
   * @param {string} doi - Digital Object Identifier
   * @returns {Promise<Object|null>} Publication data or null
   */
  async searchByDOI(doi) {
    let browser = null;
    
    try {
      console.log(`🔍 Searching Google Scholar for: ${doi}`);
      
      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Search for DOI on Google Scholar
      const searchURL = `${this.baseURL}?q=${encodeURIComponent(doi)}`;
      await page.goto(searchURL, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for results to load
      await page.waitForSelector('.gs_ri, .gs_r', { timeout: 10000 });

      // Extract data from page
      const data = await page.evaluate(() => {
        const firstResult = document.querySelector('.gs_ri') || document.querySelector('.gs_r');
        
        if (!firstResult) return null;

        // Extract title
        const titleEl = firstResult.querySelector('.gs_rt');
        const title = titleEl ? titleEl.textContent.trim() : '';

        // Extract authors and publication info
        const authorsEl = firstResult.querySelector('.gs_a');
        let authors = '';
        let year = '';
        
        if (authorsEl) {
          const authorsText = authorsEl.textContent;
          // Format: "Authors - Journal, Year - Publisher"
          const parts = authorsText.split(' - ');
          if (parts.length > 0) {
            authors = parts[0].trim();
          }
          // Try to extract year
          const yearMatch = authorsText.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            year = yearMatch[0];
          }
        }

        // Extract snippet/abstract
        const snippetEl = firstResult.querySelector('.gs_rs');
        const snippet = snippetEl ? snippetEl.textContent.trim() : '';

        // Extract citation count
        const citedByEl = firstResult.querySelector('.gs_fl a');
        let citations = 0;
        if (citedByEl && citedByEl.textContent.includes('Cited by')) {
          const citationMatch = citedByEl.textContent.match(/\d+/);
          if (citationMatch) {
            citations = parseInt(citationMatch[0]);
          }
        }

        // Extract PDF link
        const pdfEl = firstResult.querySelector('.gs_or_ggsm a');
        const pdfLink = pdfEl ? pdfEl.href : '';

        return {
          title,
          authors,
          year,
          snippet,
          citations,
          pdfLink
        };
      });

      await browser.close();

      if (data && data.title) {
        console.log('✅ Google Scholar data extracted successfully');
        return {
          ...data,
          source: 'Google Scholar'
        };
      }

      console.log('⚠️ No results found on Google Scholar');
      return null;

    } catch (error) {
      console.error('❌ Google Scholar scraping error:', error.message);
      if (browser) {
        await browser.close();
      }
      return null;
    }
  }

  /**
   * Add delay between requests to avoid rate limiting
   */
  async addDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
}

module.exports = new GoogleScholarService();
