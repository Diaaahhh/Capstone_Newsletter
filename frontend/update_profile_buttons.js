
const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend';

// Old pattern: <a href="#" class="nav-link" id="userBtn">Profile</a>
// We use a regex that captures variations in whitespace and attribute order
const oldPatternV1 = /<a\s+[^>]*id="userBtn"[^>]*>Profile<\/a>/gi;
// Also maybe checking specifically for class="nav-link" if needed, but id="userBtn" and text Profile is a strong signal.
// But wait, journalPublications.html had: <a href="#" class="nav-link" id="userBtn">Profile</a>

const newButton = `<button type="button" class="user-btn" id="userBtn">
                <i class="bi bi-person-circle"></i>
              </button>`;

const cssLink = `<link rel="stylesheet" href="homepage.css" />`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir(dir, (filePath) => {
    if (path.extname(filePath) === '.html') {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // Check for the old pattern
        if (oldPatternV1.test(content)) {
            console.log(`Updating ${filePath}...`);
            content = content.replace(oldPatternV1, newButton);
            updated = true;
        }

        if (updated) {
            // Check if homepage.css is linked
            if (!content.includes('href="homepage.css"')) {
                // Add it. Try to add before other css or in head.
                // If majorEvents.css exists, add before/after it?
                // Or just before </head>
                if (content.includes('</head>')) {
                    content = content.replace('</head>', `  ${cssLink}\n</head>`);
                    console.log(`  Added homepage.css to ${filePath}`);
                }
            }

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Saved ${filePath}`);
        }
    }
});
