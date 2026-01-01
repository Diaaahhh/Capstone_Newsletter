"""
Automated Alert Replacement Script
Replaces all alert() calls with Toast notifications across frontend files
"""

import os
import re
from pathlib import Path

# Base directory
FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

# Alert replacement patterns
REPLACEMENTS = [
    # Pattern 1: Simple alerts with emojis
    (r'alert\("✅\s*([^"]+)"\);', r'Toast.success("\1");'),
    (r'alert\("❌\s*([^"]+)"\);', r'Toast.error("\1");'),
    (r'alert\("⚠️\s*([^"]+)"\);', r'Toast.warning("\1");'),
    (r'alert\("ℹ️\s*([^"]+)"\);', r'Toast.info("\1");'),
    
    # Pattern 2: Alerts with single quotes and emojis
    (r"alert\('✅\s*([^']+)'\);", r"Toast.success('\1');"),
    (r"alert\('❌\s*([^']+)'\);", r"Toast.error('\1');"),
    (r"alert\('⚠️\s*([^']+)'\);", r"Toast.warning('\1');"),
    (r"alert\('ℹ️\s*([^']+)'\);", r"Toast.info('\1');"),
    
    # Pattern 3: Generic alerts (no emoji) - default to error for validation messages
    (r'alert\("Please\s+([^"]+)"\);', r'Toast.error("Please \1");'),
    (r"alert\('Please\s+([^']+)'\);", r"Toast.error('Please \1');"),
    
    # Pattern 4: Success messages
    (r'alert\("([^"]*(?:successful|success|saved|submitted|updated|deleted)[^"]*)"\);', r'Toast.success("\1");'),
    (r"alert\('([^']*(?:successful|success|saved|submitted|updated|deleted)[^']*)'\);", r"Toast.success('\1');"),
    
    # Pattern 5: Error/failure messages
    (r'alert\("([^"]*(?:failed|error|cannot|invalid|wrong)[^"]*)"\);', r'Toast.error("\1");'),
    (r"alert\('([^']*(?:failed|error|cannot|invalid|wrong)[^']*)'\);", r"Toast.error('\1');"),
    
    # Pattern 6: Dynamic alerts with variables
    (r'alert\(([^)]+)\s*\|\|\s*"([^"]+)"\);', r'Toast.error(\1 || "\2");'),
    (r"alert\(([^)]+)\s*\|\|\s*'([^']+)'\);", r"Toast.error(\1 || '\2');"),
]

# Files to process (from grep search results)
TARGET_FILES = [
    "CreateTrainingProgram.js",
    "CreateSeminars.js",
    "createSeminarAndWorkshop.js",
    "CreateSeminar.js",
    "CreateScholarships.js",
    "createResearchGrant.js",
    "CreateResearchArticle.js",
    "CreateMajorEvent.js",
    "CreateCCCEvents.js",
    "CreateAlumniStories.js",
    "CreateClubActivities.js",
    "CreateDegreeReview.js",
    "CreateDeptActivities.js",
    "CreateLibrary.js",
    "CreateMap.js",
    "CreateMedia.js",
    "CreateMemberships.js",
    "CreateOthers.js",
    "CreateRecreation.js",
    "CreateResearch.js",
    "CreateAchievements.js",
    "createAchievementsVC.js",
    "createBookChapters.js",
    "createBooksAndEditedBooks.js",
    "createConferencePresentation.js",
    "createConferenceProceeding.js",
    "createJournalPublications.js",
    "createMediaVC.js",
    "vcNewsletterTimeline.js",
    "vcNewsletterPdfGenerator.js",
    "vcNewsletterPdfEditor.js",
    "vcNewsletterModernEditor.js",
    "vcNewsletterCategorizedEditor.js",
    "vcNewsletterCanvaEditor.js",
    "printPage.js",
]

def replace_alerts_in_file(filepath):
    """Replace all alert() calls in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = 0
        
        # Apply all replacement patterns
        for pattern, replacement in REPLACEMENTS:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                changes_made += content.count('alert(') - new_content.count('alert(')
                content = new_content
        
        # Remove emojis from remaining alerts
        content = re.sub(r'(Toast\.(success|error|warning|info)\(")✅\s*', r'\1', content)
        content = re.sub(r'(Toast\.(success|error|warning|info)\(")❌\s*', r'\1', content)
        content = re.sub(r'(Toast\.(success|error|warning|info)\(")⚠️\s*', r'\1', content)
        content = re.sub(r'(Toast\.(success|error|warning|info)\(")ℹ️\s*', r'\1', content)
        
        # Write back if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return changes_made
        return 0
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    """Process all target files"""
    total_replacements = 0
    files_processed = 0
    
    for filename in TARGET_FILES:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(filepath):
            changes = replace_alerts_in_file(filepath)
            if changes > 0:
                total_replacements += changes
                files_processed += 1
                print(f"[OK] {filename}: {changes} alerts replaced")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files processed: {files_processed}")
    print(f"Total alerts replaced: {total_replacements}")

if __name__ == "__main__":
    main()
