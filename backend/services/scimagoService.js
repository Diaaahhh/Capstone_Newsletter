// backend/services/scimagoService.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape SCImago Journal Rank for journal quartile
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year (optional, defaults to latest)
 * @returns {Promise<object>} Journal ranking data
 */
async function getJournalRankingFromScimago(journalName, year) {
  if (!journalName) {
    return { ranking: null, source: 'none' };
  }

  // Optimize journal name for search
  // Remove special characters that might confuse search
  const cleanName = journalName.replace(/[^\w\s]/g, ' ').trim();

  try {
    console.log(`🔍 Searching SCImago for: ${journalName}`);
    
    // 1. Search for the journal
    const searchUrl = `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(cleanName)}&tip=sid`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.scimagojr.com/'
    };

    const searchResponse = await axios.get(searchUrl, { headers, timeout: 15000 });
    const $ = cheerio.load(searchResponse.data);

    // 2. Find the detail link
    // Search results are usually in .search_results > a
    // If we are already on the specific journal page (unlikely with general search), we might see the data immediately.
    
    let detailUrl = null;
    
    // Check if we got redirected or if there's a direct link
    const firstResultLink = $('.search_results a').first().attr('href');
    
    if (firstResultLink) {
      // Construct absolute URL
      detailUrl = firstResultLink.startsWith('http') 
        ? firstResultLink 
        : `https://www.scimagojr.com/${firstResultLink}`;
    } else {
        // Sometimes usually scraping might fail or no results
        console.log(`⚠️ No search results found on SCImago for: ${journalName}`);
        return { ranking: null, source: 'not_found' };
    }

    console.log(`🔗 Found detail URL: ${detailUrl}`);

    // 3. Fetch detail page
    const detailResponse = await axios.get(detailUrl, { headers, timeout: 15000 });
    const $d = cheerio.load(detailResponse.data);

    // 4. Extract Quartile Data
    // Best reliability: Parse the "dataquartiles" JS variable
    const scripts = $d('script').map((i, el) => $d(el).html()).get();
    let quartilesData = null;

    for (const script of scripts) {
      if (script && script.includes('var dataquartiles =')) {
        // Extract the string value: var dataquartiles = "Category;Year;Quartile\n...";
        const match = script.match(/var dataquartiles = "(.*?)";/s);
        if (match && match[1]) {
          quartilesData = match[1];
          break;
        }
      }
    }

    let ranking = null;
    let targetYear = year ? year.toString() : new Date().getFullYear().toString();

    if (quartilesData) {
        // Parse CSV-like string: Category;Year;Quartile
        // Example: Multidisciplinary;2023;Q1
        const lines = quartilesData.split('\\n'); // Interpret encoded newlines if any
        // Note: script string might be literal newlines or \n. split using regex handles both
        const rows = quartilesData.split(/\r?\n|\\n/); 
        
        let bestRanking = null; // Q1 < Q2 < Q3 < Q4
        
        rows.forEach(row => {
            const parts = row.split(';');
            if (parts.length >= 3) {
                const rowYear = parts[1];
                const rowQ = parts[2];
                
                // Match year
                if (rowYear === targetYear) {
                    bestRanking = compareRankings(bestRanking, rowQ);
                }
            }
        });
        
        // If exact year not found, try the latest year found in data
        if (!bestRanking) {
             console.log(`ℹ️ Year ${targetYear} not found, trying to find latest available year`);
             // Assume data is sorted or we just scan all to find max year
             let maxYear = 0;
             rows.forEach(row => {
                const parts = row.split(';');
                if (parts.length >= 3 && !isNaN(parts[1])) {
                    const y = parseInt(parts[1]);
                    if (y > maxYear) maxYear = y;
                }
             });
             
             if (maxYear > 0) {
                 rows.forEach(row => {
                    const parts = row.split(';');
                    if (parts.length >= 3 && parseInt(parts[1]) === maxYear) {
                        bestRanking = compareRankings(bestRanking, parts[2]);
                    }
                 });
                 console.log(`ℹ️ Used year ${maxYear} instead`);
             }
        }
        
        ranking = bestRanking;
    }

    // Fallback: HTML Table parsing if variable parsing failed
    if (!ranking) {
        console.log('⚠️ JS variable parsing failed, trying HTML table');
        const rows = $d('table tr');
        let bestRanking = null;
        
        rows.each((i, row) => {
           const cols = $d(row).find('td');
           if (cols.length >= 3) {
               // Usually Category, Year, Quartile
               const y = $d(cols[1]).text().trim();
               const q = $d(cols[2]).text().trim();
               
               if (y === targetYear) {
                   if (/^Q[1-4]$/.test(q)) {
                       bestRanking = compareRankings(bestRanking, q);
                   }
               }
           }
        });
        ranking = bestRanking;
    }

    if (ranking) {
      console.log(`✅ Found ranking: ${ranking}`);
      
      // Extract SJR Score if possible
      let sjrScore = 0;
      // var datasjr = "Year;SJR\n..."
      for (const script of scripts) {
        if (script && script.includes('var datasjr =')) {
            const match = script.match(/var datasjr = "(.*?)";/s);
            if (match && match[1]) {
                const rows = match[1].split(/\r?\n|\\n/);
                // Find matching year or latest
                // Format: Year;SJR
                rows.reverse().some(row => {
                     const parts = row.split(';');
                     if (parts.length >= 2) {
                         sjrScore = parseFloat(parts[1]);
                         return true; // break
                     }
                     return false;
                });
            }
            break;
        }
      }

      return {
        ranking,
        sjrScore,
        source: 'SCImago'
      };
    }

    console.log(`⚠️ No ranking found on SCImago for: ${journalName}`);
    return { ranking: null, source: 'not_found' };

  } catch (error) {
    console.error('SCImago scraping error:', error.message);
    return { ranking: null, source: 'error' };
  }
}

/**
 * Compare rankings and return the better one (Q1 > Q2 > Q3 > Q4)
 */
function compareRankings(currentBest, newRank) {
    if (!/^Q[1-4]$/.test(newRank)) return currentBest;
    if (!currentBest) return newRank;
    
    const valCurrent = parseInt(currentBest.replace('Q', ''));
    const valNew = parseInt(newRank.replace('Q', ''));
    
    return valNew < valCurrent ? newRank : currentBest;
}

/**
 * Get journal ranking with fallback strategy
 */
async function getJournalRankingWithFallback(journalName, year) {
  // Try SCImago first
  const scimagoResult = await getJournalRankingFromScimago(journalName, year);
  
  if (scimagoResult.ranking) {
    return scimagoResult;
  }

  // Fallback to OpenAlex
  console.log('⚠️ SCImago failed, using OpenAlex as fallback');
  const openAlexService = require('./journalRankingService');
  return await openAlexService.getJournalMetrics(journalName, year);
}

module.exports = {
  getJournalRankingFromScimago,
  getJournalRankingWithFallback
};
