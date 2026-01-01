const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

async function debugScrape() {
  const journalName = "Heliyon";
  console.log(`Debug scraping for: ${journalName}`);

  try {
    // 1. Search
    const searchUrl = `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(journalName)}&tip=sid`;
    console.log(`Fetching search: ${searchUrl}`);
    const searchParams = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };
    
    const searchRes = await axios.get(searchUrl, searchParams);
    fs.writeFileSync('scimago_search.html', searchRes.data);
    console.log('Saved scimago_search.html');

    const $ = cheerio.load(searchRes.data);
    
    // Find first result link
    // The search results usually have a list of links. 
    // Structure typically: .search_results > a
    const firstLink = $('.search_results a').first().attr('href');
    
    if (!firstLink) {
        console.log('No link found in search results');
        return;
    }

    console.log(`Found detail link: ${firstLink}`);
    
    // 2. Details
    const detailUrl = firstLink.startsWith('http') ? firstLink : `https://www.scimagojr.com/${firstLink}`;
    console.log(`Fetching details: ${detailUrl}`);
    const detailRes = await axios.get(detailUrl, searchParams);
    
    fs.writeFileSync('scimago_detail.html', detailRes.data);
    console.log('Saved scimago_detail.html');

    // 3. Try to find Quartile in detail
    const $d = cheerio.load(detailRes.data);
    
    // Log typical containers
    console.log('Grid items:', $d('.cell1x1').length);
    console.log('Tables:', $d('table').length);
    
    // Usually quartiles are in a table or visualized
    // Let's dump text that looks like Q1/Q2
    const bodyText = $d('body').text();
    const qs = bodyText.match(/Q[1-4]/g);
    console.log('Q matches in body text:', qs);
    
  } catch (err) {
    console.error(err);
  }
}

debugScrape();
