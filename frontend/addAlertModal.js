/**
 * Script to add alertModal.js to all HTML files
 * Run with: node addAlertModal.js
 */

const fs = require('fs');
const path = require('path');

const frontendDir = __dirname;
const alertModalScript = '<script src="alertModal.js"></script>';

// Get all HTML files
const htmlFiles = fs.readdirSync(frontendDir)
  .filter(file => file.endsWith('.html'))
  .filter(file => !file.startsWith('test')); // Skip test files

let updatedCount = 0;
let skippedCount = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(frontendDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if alertModal.js is already included
  if (content.includes('alertModal.js')) {
    console.log(`⏭️  Skipped ${file} (already has alertModal.js)`);
    skippedCount++;
    return;
  }
  
  // Find the </head> tag and insert before it
  if (content.includes('</head>')) {
    content = content.replace('</head>', `  ${alertModalScript}\n  </head>`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file}`);
    updatedCount++;
  } else {
    console.log(`⚠️  Warning: ${file} doesn't have </head> tag`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`   Total: ${htmlFiles.length} files`);