const fs = require('fs');
const path = require('path');

// List of category HTML files to update
const categoryFiles = [
  'frontend/cccEvents.html',
  'frontend/alumniStories.html',
  'frontend/clubActivities.html',
  'frontend/scholarships.html',
  'frontend/library.html',
  'frontend/research.html',
  'frontend/recreation.html',
  'frontend/degreeReview.html',
  'frontend/seminars.html',
  'frontend/memberships.html',
  'frontend/trainingProgram.html',
  'frontend/achievements.html',
  'frontend/map.html',
  'frontend/deptActivities.html',
  'frontend/others.html',
  'frontend/researchGrant.html',
  'frontend/journalPublications.html',
  'frontend/bookChapters.html',
  'frontend/booksAndEditedBooks.html',
  'frontend/conferenceProceeding.html',
  'frontend/conferencePresentation.html',
  'frontend/seminarAndWorkshop.html',
  'frontend/mediaVC.html',
  'frontend/achievementsVC.html'
];

function updateSearchInput(content) {
  // Add id and autocomplete to search input, and add search dropdown
  
  // Check if already has searchDropdown
  if (content.includes('id="searchDropdown"')) {
    return content;
  }
  
  // Pattern to find search input and add dropdown after it
  const searchInputPattern = /<input\s+type="text"\s+class="search-input"[^>]*>/;
  
  content = content.replace(searchInputPattern, (match) => {
    // Add id and autocomplete if not present
    let updatedInput = match;
    if (!match.includes('id=')) {
      updatedInput = updatedInput.replace('class="search-input"', 'class="search-input" id="searchInput"');
    }
    if (!match.includes('autocomplete=')) {
      updatedInput = updatedInput.replace(/\/>|>/, ' autocomplete="off"$&');
    }
    
    // Add dropdown after input
    return `${updatedInput}
                <div class="search-dropdown" id="searchDropdown">
                  <!-- Search results will be populated here -->
                </div>`;
  });
  
  return content;
}

function addGlobalSearchScript(content) {
  // Add globalSearch.js script if not present
  if (content.includes('globalSearch.js')) {
    return content;
  }
  
  // Find Bootstrap script and add globalSearch.js after it
  const bootstrapPattern = /(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@[^"]+"><\/script>\s*\n\s*<script src=")/;
  
  content = content.replace(bootstrapPattern, '$1globalSearch.js"></script>\n  <script src="');
  
  return content;
}

function processFile(filepath) {
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filepath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filepath, 'utf8');
    const originalContent = content;
    
    // Update search input
    content = updateSearchInput(content);
    
    // Add global search script
    content = addGlobalSearchScript(content);
    
    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`✅ Updated: ${filepath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filepath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error processing ${filepath}: ${error.message}`);
    return null;
  }
}

function main() {
  console.log('🚀 Starting batch update of category pages...\n');
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  categoryFiles.forEach(filepath => {
    const result = processFile(filepath);
    if (result === true) {
      updatedCount++;
    } else if (result === false) {
      skippedCount++;
    } else {
      errorCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ℹ️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total: ${categoryFiles.length}`);
}

main();