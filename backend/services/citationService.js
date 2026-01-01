// backend/services/citationService.js
const axios = require('axios');
const metricsCache = require('./metricsCache');

/**
 * Get citation count by DOI using OpenAlex API
 * @param {string} doi - DOI of the publication
 * @returns {Promise<object>} Citation data
 */
async function getCitationsByDOI(doi) {
  if (!doi) {
    return { citationCount: 0, source: 'none' };
  }

  // Check cache first
  const cached = metricsCache.getCitationCount(doi);
  if (cached) {
    return cached;
  }

  try {
    // Clean DOI (remove https://doi.org/ prefix if present)
    const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '').trim();
    
    // Try OpenAlex first
    const openAlexData = await fetchFromOpenAlex(cleanDOI);
    if (openAlexData) {
      metricsCache.setCitationCount(doi, openAlexData);
      return openAlexData;
    }

    // Fallback to Crossref
    const crossrefData = await fetchFromCrossref(cleanDOI);
    if (crossrefData) {
      metricsCache.setCitationCount(doi, crossrefData);
      return crossrefData;
    }

    // No data found
    const noData = { citationCount: 0, source: 'unavailable' };
    metricsCache.setCitationCount(doi, noData);
    return noData;

  } catch (error) {
    console.error('Error fetching citations by DOI:', error.message);
    return { citationCount: 0, source: 'error' };
  }
}

/**
 * Get citation count by title and authors (fallback method)
 * @param {string} title - Publication title
 * @param {string} authors - Authors string
 * @returns {Promise<object>} Citation data
 */
async function getCitationsByTitle(title, authors = '') {
  if (!title) {
    return { citationCount: 0, source: 'none' };
  }

  // Check cache
  const cacheKey = `${title}:${authors}`;
  const cached = metricsCache.getCitationCount(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Search OpenAlex by title
    const searchUrl = `https://api.openalex.org/works?filter=title.search:${encodeURIComponent(title)}`;
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)' }
    });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const work = response.data.results[0];
      const citationData = {
        citationCount: work.cited_by_count || 0,
        source: 'OpenAlex'
      };
      
      metricsCache.setCitationCount(cacheKey, citationData);
      return citationData;
    }

    const noData = { citationCount: 0, source: 'not_found' };
    metricsCache.setCitationCount(cacheKey, noData);
    return noData;

  } catch (error) {
    console.error('Error fetching citations by title:', error.message);
    return { citationCount: 0, source: 'error' };
  }
}

/**
 * Fetch citation data from OpenAlex
 * @param {string} doi - Clean DOI
 * @returns {Promise<object|null>} Citation data or null
 */
async function fetchFromOpenAlex(doi) {
  try {
    const url = `https://api.openalex.org/works/https://doi.org/${doi}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)' }
    });

    if (response.data) {
      return {
        citationCount: response.data.cited_by_count || 0,
        source: 'OpenAlex'
      };
    }

    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`OpenAlex: DOI not found - ${doi}`);
    } else {
      console.error('OpenAlex API error:', error.message);
    }
    return null;
  }
}

/**
 * Fetch citation data from Crossref
 * @param {string} doi - Clean DOI
 * @returns {Promise<object|null>} Citation data or null
 */
async function fetchFromCrossref(doi) {
  try {
    const url = `https://api.crossref.org/works/${doi}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)' }
    });

    if (response.data && response.data.message) {
      const message = response.data.message;
      return {
        citationCount: message['is-referenced-by-count'] || 0,
        source: 'Crossref'
      };
    }

    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Crossref: DOI not found - ${doi}`);
    } else {
      console.error('Crossref API error:', error.message);
    }
    return null;
  }
}

module.exports = {
  getCitationsByDOI,
  getCitationsByTitle
};
