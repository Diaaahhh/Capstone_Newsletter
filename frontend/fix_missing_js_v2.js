
const fs = require('fs');
const files = [
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createAchievementsVC.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createBookChapters.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createBooksAndEditedBooks.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createConferencePresentation.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createConferenceProceeding.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createJournalPublications.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createMediaVC.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createResearchGrant.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\createSeminarAndWorkshop.html",
    "c:\\Users\\Rupommoral\\Documents\\Finale\\NewLetterEWU\\frontend\\test-dropdown.html"
];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('</body>')) {
            // Append script before closing body
            content = content.replace('</body>', '<script src="profileDropdown.js"></script>\n</body>');
            fs.writeFileSync(file, content, 'utf8');
            console.log("Fixed " + file);
        } else {
            console.log("Could not find </body> in " + file);
        }
    } catch (e) {
        console.error("Error processing " + file + ": " + e);
    }
});
