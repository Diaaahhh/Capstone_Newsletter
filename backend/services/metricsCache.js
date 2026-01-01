// backend/services/metricsCache.js
const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const journalMetricsCache = new NodeCache({ 
  stdTTL: 2592000,  // 30 days in seconds
  checkperiod: 86400 // Check for expired keys every 24 hours
});

const citationCache = new NodeCache({ 
  stdTTL: 604800,   // 7 days in seconds
  checkperiod: 3600  // Check for expired keys every hour
});

/**
 * Generate cache key for journal metrics
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 * @returns {string} Cache key
 */
function getJournalCacheKey(journalName, year) {
  const normalizedName = journalName.toLowerCase().trim().replace(/\s+/g, '-');
  return `journal:${normalizedName}:${year}`;
}

/**
 * Generate cache key for citations
 * @param {string} identifier - DOI or title
 * @returns {string} Cache key
 */
function getCitationCacheKey(identifier) {
  const normalized = identifier.toLowerCase().trim();
  return `citation:${normalized}`;
}

/**
 * Get journal metrics from cache
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 * @returns {object|null} Cached metrics or null
 */
function getJournalMetrics(journalName, year) {
  const key = getJournalCacheKey(journalName, year);
  const cached = journalMetricsCache.get(key);
  
  if (cached) {
    console.log(`✅ Cache HIT for journal metrics: ${journalName} (${year})`);
    return cached;
  }
  
  console.log(`❌ Cache MISS for journal metrics: ${journalName} (${year})`);
  return null;
}

/**
 * Set journal metrics in cache
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 * @param {object} metrics - Metrics data to cache
 */
function setJournalMetrics(journalName, year, metrics) {
  const key = getJournalCacheKey(journalName, year);
  journalMetricsCache.set(key, metrics);
  console.log(`💾 Cached journal metrics: ${journalName} (${year})`);
}

/**
 * Get citation count from cache
 * @param {string} identifier - DOI or title
 * @returns {object|null} Cached citation data or null
 */
function getCitationCount(identifier) {
  const key = getCitationCacheKey(identifier);
  const cached = citationCache.get(key);
  
  if (cached) {
    console.log(`✅ Cache HIT for citations: ${identifier}`);
    return cached;
  }
  
  console.log(`❌ Cache MISS for citations: ${identifier}`);
  return null;
}

/**
 * Set citation count in cache
 * @param {string} identifier - DOI or title
 * @param {object} citationData - Citation data to cache
 */
function setCitationCount(identifier, citationData) {
  const key = getCitationCacheKey(identifier);
  citationCache.set(key, citationData);
  console.log(`💾 Cached citation data: ${identifier}`);
}

/**
 * Clear all caches (for testing/debugging)
 */
function clearAllCaches() {
  journalMetricsCache.flushAll();
  citationCache.flushAll();
  console.log('🗑️  All caches cleared');
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getCacheStats() {
  return {
    journalMetrics: journalMetricsCache.getStats(),
    citations: citationCache.getStats()
  };
}

module.exports = {
  getJournalMetrics,
  setJournalMetrics,
  getCitationCount,
  setCitationCount,
  clearAllCaches,
  getCacheStats
};
