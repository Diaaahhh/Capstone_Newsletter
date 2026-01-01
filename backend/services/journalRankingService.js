// backend/services/journalRankingService.js
const axios = require('axios');
const metricsCache = require('./metricsCache');

/**
 * Get journal metrics and ranking
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 * @returns {Promise<object>} Journal metrics including ranking
 */
async function getJournalMetrics(journalName, year) {
  if (!journalName) {
    return {
      ranking: null,
      impactFactor: 0,
      hIndex: 0,
      citedByCount: 0,
      source: 'none'
    };
  }

  // Check cache first
  const cached = metricsCache.getJournalMetrics(journalName, year);
  if (cached) {
    return cached;
  }

  try {
    // Try OpenAlex first (most comprehensive)
    const openAlexData = await fetchFromOpenAlex(journalName, year);
    if (openAlexData) {
      metricsCache.setJournalMetrics(journalName, year, openAlexData);
      return openAlexData;
    }

    // Fallback: Return unavailable
    const unavailable = {
      ranking: null,
      impactFactor: 0,
      hIndex: 0,
      citedByCount: 0,
      source: 'unavailable'
    };
    
    metricsCache.setJournalMetrics(journalName, year, unavailable);
    return unavailable;

  } catch (error) {
    console.error('Error fetching journal metrics:', error.message);
    return {
      ranking: null,
      impactFactor: 0,
      hIndex: 0,
      citedByCount: 0,
      source: 'error'
    };
  }
}

/**
 * Fetch journal data from OpenAlex
 * @param {string} journalName - Journal name
 * @param {number} year - Publication year
 * @returns {Promise<object|null>} Journal metrics or null
 */
async function fetchFromOpenAlex(journalName, year) {
  try {
    // Search for the journal/venue in OpenAlex
    const searchUrl = `https://api.openalex.org/venues?filter=display_name.search:${encodeURIComponent(journalName)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)' }
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      // Get the best match (first result)
      const venue = response.data.results[0];
      
      // Extract metrics
      const citedByCount = venue.cited_by_count || 0;
      const worksCount = venue.works_count || 0;
      const hIndex = venue.summary_stats?.h_index || 0;
      const i10Index = venue.summary_stats?.i10_index || 0;
      
      // Calculate approximate impact factor (citations per work in recent years)
      // This is a simplified calculation
      const impactFactor = worksCount > 0 ? (citedByCount / worksCount).toFixed(2) : 0;
      
      // Determine quartile based on h-index and impact factor
      const ranking = determineQuartile(hIndex, parseFloat(impactFactor), i10Index);
      
      return {
        ranking,
        impactFactor: parseFloat(impactFactor),
        hIndex,
        i10Index,
        citedByCount,
        worksCount,
        source: 'OpenAlex',
        venueName: venue.display_name
      };
    }

    return null;
  } catch (error) {
    console.error('OpenAlex venue search error:', error.message);
    return null;
  }
}

/**
 * Determine journal quartile based on metrics
 * Uses h-index and impact factor to estimate Q1-Q4 ranking
 * 
 * @param {number} hIndex - h-index of the journal
 * @param {number} impactFactor - Impact factor
 * @param {number} i10Index - i10 index
 * @returns {string|null} Quartile (Q1, Q2, Q3, Q4) or null
 */
function determineQuartile(hIndex, impactFactor, i10Index = 0) {
  // If no meaningful metrics, return null
  if (hIndex === 0 && impactFactor === 0) {
    return null;
  }

  // Calculate a composite score
  // This is a heuristic approach based on typical journal metrics
  const compositeScore = (hIndex * 0.5) + (impactFactor * 10) + (i10Index * 0.1);

  // Quartile thresholds (these are approximate and can be adjusted)
  // Based on typical academic journal distributions
  if (compositeScore >= 50) {
    return 'Q1'; // Top tier journals
  } else if (compositeScore >= 25) {
    return 'Q2'; // High quality journals
  } else if (compositeScore >= 10) {
    return 'Q3'; // Good journals
  } else if (compositeScore >= 2) {
    return 'Q4'; // Standard journals
  }

  // Very low metrics - might be new or niche journal
  return 'Q4';
}

/**
 * Get journal ranking by ISSN (alternative method)
 * @param {string} issn - ISSN of the journal
 * @returns {Promise<object|null>} Journal metrics or null
 */
async function getJournalMetricsByISSN(issn) {
  if (!issn) return null;

  try {
    const url = `https://api.openalex.org/venues/issn:${issn}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)' }
    });

    if (response.data) {
      const venue = response.data;
      const hIndex = venue.summary_stats?.h_index || 0;
      const citedByCount = venue.cited_by_count || 0;
      const worksCount = venue.works_count || 0;
      const impactFactor = worksCount > 0 ? (citedByCount / worksCount).toFixed(2) : 0;
      const i10Index = venue.summary_stats?.i10_index || 0;

      return {
        ranking: determineQuartile(hIndex, parseFloat(impactFactor), i10Index),
        impactFactor: parseFloat(impactFactor),
        hIndex,
        i10Index,
        citedByCount,
        worksCount,
        source: 'OpenAlex',
        venueName: venue.display_name
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching journal by ISSN:', error.message);
    return null;
  }
}

module.exports = {
  getJournalMetrics,
  getJournalMetricsByISSN,
  determineQuartile
};
