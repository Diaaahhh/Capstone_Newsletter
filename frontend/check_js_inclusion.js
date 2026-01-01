
const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend';
const missingFiles = [];

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
        // Check if it has the NEW button structure (indicating we updated it or it was already correct)
        // We look for class="user-btn" and id="userBtn"
        if (content.includes('class="user-btn"') && content.includes('id="userBtn"')) {
            // Check for profileDropdown.js
            if (!content.includes('profileDropdown.js')) {
                missingFiles.push(filePath);
            }
        }
    }
});

console.log("Files missing profileDropdown.js:");
missingFiles.forEach(f => console.log(f));

if (missingFiles.length > 0) {
    const fixScript = `
    const fs = require('fs');
    const files = ${JSON.stringify(missingFiles)};
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('</body>')) {
            content = content.replace('</body>', '<script src="profileDropdown.js"></script>\n</body>');
            fs.writeFileSync(file, content, 'utf8');
            console.log("Fixed " + file);
        }
    });
    `;
    fs.writeFileSync(path.join(dir, 'fix_missing_js.js'), fixScript);
    console.log("Created fix_missing_js.js to fix them.");
}
