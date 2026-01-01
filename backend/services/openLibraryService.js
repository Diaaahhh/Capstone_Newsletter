const axios = require('axios');

/**
 * Open Library API Service
 * Fetches book metadata using ISBN from Open Library API
 * API Documentation: https://openlibrary.org/dev/docs/api/books
 */
class OpenLibraryService {
  constructor() {
    this.baseURL = 'https://openlibrary.org';
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

      console.log(`📚 Fetching book data from Open Library for ISBN: ${cleanISBN}`);
      
      const url = `${this.baseURL}/isbn/${cleanISBN}.json`;
      const response = await axios.get(url, { 
        timeout: this.timeout,
        headers: {
          'User-Agent': 'EWU-Newsletter-App/1.0'
        }
      });

      if (!response.data) {
        console.log('⚠️ No book found in Open Library');
        return null;
      }

      const normalizedData = await this.normalizeBookData(response.data);
      
      console.log('✅ Book data fetched from Open Library:', normalizedData.title);
      return normalizedData;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Open Library API timeout');
      } else if (error.response && error.response.status === 404) {
        console.log('⚠️ Book not found in Open Library');
      } else if (error.response) {
        console.error(`❌ Open Library API error: ${error.response.status}`);
      } else {
        console.error('❌ Open Library API error:', error.message);
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
   * Normalize Open Library API response to our standard format
   * @param {Object} book - Raw book object from Open Library API
   * @returns {Object} Normalized book data
   */
  async normalizeBookData(book) {
    return {
      title: book.title || '',
      subtitle: book.subtitle || '',
      authors: await this.formatAuthors(book.authors),
      publisher: this.getFirstPublisher(book.publishers),
      year: this.extractYear(book.publish_date),
      isbn: this.getPreferredISBN(book),
      pageCount: book.number_of_pages || '',
      description: book.description || '',
      language: '',
      categories: (book.subjects || []).slice(0, 3).join(', '), // Limit to 3 subjects
      source: 'Open Library'
    };
  }

  /**
   * Format authors - Open Library returns author references
   * For simplicity, we'll try to extract author names from the data
   * @param {Array} authorRefs - Array of author references
   * @returns {string} Formatted authors string
   */
  async formatAuthors(authorRefs) {
    if (!authorRefs || !Array.isArray(authorRefs) || authorRefs.length === 0) {
      return '';
    }

    try {
      // If authors are already objects with names
      if (authorRefs[0].name) {
        return authorRefs.map(a => a.name).join(', ');
      }

      // If authors are references (keys), we'd need to fetch them
      // For now, return empty to avoid additional API calls
      // In production, you might want to fetch author details
      return '';
    } catch (error) {
      console.error('Error formatting authors:', error);
      return '';
    }
  }

  /**
   * Get first publisher from publishers array
   * @param {Array} publishers - Array of publishers
   * @returns {string} Publisher name
   */
  getFirstPublisher(publishers) {
    if (!publishers || !Array.isArray(publishers) || publishers.length === 0) {
      return '';
    }
    return publishers[0];
  }

  /**
   * Extract year from date string
   * @param {string} dateString - Date string (e.g., "January 15, 2023" or "2023")
   * @returns {string} Year as string
   */
  extractYear(dateString) {
    if (!dateString) return '';
    
    // Extract 4-digit year
    const match = dateString.match(/\d{4}/);
    return match ? match[0] : '';
  }

  /**
   * Get preferred ISBN from book data
   * Prefers ISBN-13 over ISBN-10
   * @param {Object} book - Book object
   * @returns {string} Preferred ISBN
   */
  getPreferredISBN(book) {
    // Check for ISBN-13 array
    if (book.isbn_13 && Array.isArray(book.isbn_13) && book.isbn_13.length > 0) {
      return book.isbn_13[0];
    }
    
    // Fall back to ISBN-10
    if (book.isbn_10 && Array.isArray(book.isbn_10) && book.isbn_10.length > 0) {
      return book.isbn_10[0];
    }
    
    return '';
  }
}

module.exports = new OpenLibraryService();
