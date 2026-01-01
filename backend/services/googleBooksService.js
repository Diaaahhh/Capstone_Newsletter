const axios = require('axios');

/**
 * Google Books API Service
 * Fetches book metadata using ISBN from Google Books API
 * API Documentation: https://developers.google.com/books/docs/v1/using
 */
class GoogleBooksService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/books/v1/volumes';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Fetch book data by ISBN
   * @param {string} isbn - ISBN-10 or ISBN-13
   * @returns {Object|null} Normalized book data or null if not found
   */
  async fetchByISBN(isbn) {
    try {
      const cleanISBN = this.cleanISBN(isbn);
      
      if (!cleanISBN) {
        console.log('❌ Invalid ISBN format');
        return null;
      }

      console.log(`📚 Fetching book data from Google Books for ISBN: ${cleanISBN}`);
      
      const url = `${this.baseURL}?q=isbn:${cleanISBN}`;
      const response = await axios.get(url, { 
        timeout: this.timeout,
        headers: {
          'User-Agent': 'EWU-Newsletter-App/1.0'
        }
      });

      if (!response.data || response.data.totalItems === 0) {
        console.log('⚠️ No books found in Google Books');
        return null;
      }

      const book = response.data.items[0];
      const normalizedData = this.normalizeBookData(book);
      
      console.log('✅ Book data fetched from Google Books:', normalizedData.title);
      return normalizedData;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Google Books API timeout');
      } else if (error.response) {
        console.error(`❌ Google Books API error: ${error.response.status}`);
      } else {
        console.error('❌ Google Books API error:', error.message);
      }
      return null;
    }
  }

  /**
   * Clean ISBN by removing hyphens, spaces, and non-alphanumeric characters
   * @param {string} isbn - Raw ISBN input
   * @returns {string} Cleaned ISBN
   */
  cleanISBN(isbn) {
    if (!isbn || typeof isbn !== 'string') return '';
    
    // Remove hyphens, spaces, and keep only digits and X
    const cleaned = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
    
    // Validate length (ISBN-10 or ISBN-13)
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      return '';
    }
    
    return cleaned;
  }

  /**
   * Normalize Google Books API response to our standard format
   * @param {Object} book - Raw book object from Google Books API
   * @returns {Object} Normalized book data
   */
  normalizeBookData(book) {
    const volumeInfo = book.volumeInfo || {};
    
    return {
      title: volumeInfo.title || '',
      subtitle: volumeInfo.subtitle || '',
      authors: this.formatAuthors(volumeInfo.authors),
      publisher: volumeInfo.publisher || '',
      year: this.extractYear(volumeInfo.publishedDate),
      isbn: this.getPreferredISBN(volumeInfo.industryIdentifiers),
      pageCount: volumeInfo.pageCount || '',
      description: volumeInfo.description || '',
      language: volumeInfo.language || '',
      categories: (volumeInfo.categories || []).join(', '),
      source: 'Google Books'
    };
  }

  /**
   * Format authors array into comma-separated string
   * @param {Array} authors - Array of author names
   * @returns {string} Formatted authors string
   */
  formatAuthors(authors) {
    if (!authors || !Array.isArray(authors) || authors.length === 0) {
      return '';
    }
    
    // Join authors with comma and space
    return authors.join(', ');
  }

  /**
   * Extract year from date string
   * @param {string} dateString - Date string (e.g., "2023-01-15" or "2023")
   * @returns {string} Year as string
   */
  extractYear(dateString) {
    if (!dateString) return '';
    
    // Extract first 4 digits (year)
    const match = dateString.match(/\d{4}/);
    return match ? match[0] : '';
  }

  /**
   * Get preferred ISBN from identifiers array
   * Prefers ISBN-13 over ISBN-10
   * @param {Array} identifiers - Array of industry identifiers
   * @returns {string} Preferred ISBN
   */
  getPreferredISBN(identifiers) {
    if (!identifiers || !Array.isArray(identifiers)) return '';
    
    // Prefer ISBN-13
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;
    
    // Fall back to ISBN-10
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;
    
    return '';
  }

  /**
   * Format ISBN with hyphens for display
   * @param {string} isbn - Raw ISBN
   * @returns {string} Formatted ISBN
   */
  formatISBN(isbn) {
    if (!isbn) return '';
    
    const cleaned = isbn.replace(/[^0-9X]/gi, '');
    
    if (cleaned.length === 13) {
      // Format ISBN-13: 978-0-123-45678-9
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 12)}-${cleaned.slice(12)}`;
    } else if (cleaned.length === 10) {
      // Format ISBN-10: 0-123-45678-9
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    return isbn;
  }
}

module.exports = new GoogleBooksService();
