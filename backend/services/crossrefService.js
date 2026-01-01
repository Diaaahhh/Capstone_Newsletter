const axios = require('axios');

/**
 * CrossRef Service
 * Fetches publication metadata from CrossRef API using DOI
 * Official API: https://api.crossref.org/
 */
class CrossRefService {
  constructor() {
    this.baseURL = 'https://api.crossref.org/works/';
    this.timeout = 10000; // 10 seconds
    this.userAgent = 'NewLetterEWU/1.0 (mailto:admin@ewubd.edu)'; // Polite user agent
  }

  /**
   * Fetch publication data by DOI from CrossRef API
   * @param {string} doi - Digital Object Identifier
   * @returns {Promise<Object|null>} Publication data or null if not found
   */
  async fetchByDOI(doi) {
    try {
      const cleanDOI = this.cleanDOI(doi);
      const url = `${this.baseURL}${cleanDOI}`;
      
      console.log(`📚 Fetching from CrossRef: ${cleanDOI}`);
      
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (response.status === 200 && response.data.message) {
        console.log('✅ CrossRef data fetched successfully');
        return this.mapCrossRefData(response.data.message);
      }
      
      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('⚠️ DOI not found in CrossRef');
        return null;
      }
      console.error('❌ CrossRef API error:', error.message);
      return null;
    }
  }

  /**
   * Clean DOI by removing common prefixes
   * @param {string} doi - Raw DOI input
   * @returns {string} Cleaned DOI
   */
  cleanDOI(doi) {
    // Remove https://doi.org/, http://dx.doi.org/, etc.
    return doi
      .replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '')
      .trim();
  }

  /**
   * Map CrossRef API response to our format
   * @param {Object} data - CrossRef API response data
   * @returns {Object} Mapped publication data
   */
  mapCrossRefData(data) {
    return {
      title: this.extractTitle(data),
      authors: this.extractAuthors(data.author || []),
      journal: this.extractJournal(data),
      year: this.extractYear(data),
      volume: data.volume || '',
      issue: data.issue || data['journal-issue']?.issue || '',
      pages: data.page || '',
      doi: data.DOI || '',
      abstract: this.cleanAbstract(data.abstract || ''),
      publisher: data.publisher || '',
      issn: data.ISSN?.[0] || '',
      url: data.URL || `https://doi.org/${data.DOI}`,
      type: data.type || 'journal-article',
      source: 'CrossRef'
    };
  }

  /**
   * Extract title from CrossRef data
   */
  extractTitle(data) {
    if (data.title && Array.isArray(data.title) && data.title.length > 0) {
      return data.title[0];
    }
    return '';
  }

  /**
   * Extract and format authors
   * @param {Array} authorArray - Array of author objects from CrossRef
   * @returns {string} Comma-separated author names
   */
  extractAuthors(authorArray) {
    if (!Array.isArray(authorArray) || authorArray.length === 0) {
      return '';
    }

    return authorArray.map(author => {
      const given = author.given || '';
      const family = author.family || '';
      
      // Format: "Family, G." or "Family, G. M."
      if (given && family) {
        // Get initials from given name
        const initials = given
          .split(' ')
          .map(name => name.charAt(0).toUpperCase() + '.')
          .join(' ');
        return `${family}, ${initials}`;
      } else if (family) {
        return family;
      } else if (given) {
        return given;
      }
      return '';
    })
    .filter(name => name) // Remove empty names
    .join(', ');
  }

  /**
   * Extract journal name
   */
  extractJournal(data) {
    if (data['container-title'] && Array.isArray(data['container-title'])) {
      return data['container-title'][0] || '';
    }
    return '';
  }

  /**
   * Extract publication year
   */
  extractYear(data) {
    // Try multiple date fields
    if (data.published?.['date-parts']?.[0]?.[0]) {
      return data.published['date-parts'][0][0].toString();
    }
    if (data['published-print']?.['date-parts']?.[0]?.[0]) {
      return data['published-print']['date-parts'][0][0].toString();
    }
    if (data['published-online']?.['date-parts']?.[0]?.[0]) {
      return data['published-online']['date-parts'][0][0].toString();
    }
    return '';
  }

  /**
   * Clean abstract by removing HTML tags
   */
  cleanAbstract(abstract) {
    if (!abstract) return '';
    // Remove XML/HTML tags
    return abstract.replace(/<[^>]*>/g, '').trim();
  }
}

module.exports = new CrossRefService();
