"""
Add novalidate attribute to all create form HTML files
This prevents browser's built-in validation and allows Toast notifications to work
"""

import os
import re

FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

HTML_FILES = [
    "createachievements.html",
    "createAchievementsVC.html",
    "createalumniStories.html",
    "createBookChapters.html",
    "createBooksAndEditedBooks.html",
    "createcccEvents.html",
    "createclubActivities.html",
    "createConferencePresentation.html",
    "createConferenceProceeding.html",
    "createdegreeReview.html",
    "createdeptActivities.html",
    "createJournalPublications.html",
    "createlibrary.html",
    "CreateMajorEvent.html",
    "createmap.html",
    "createmedia.html",
    "createMediaVC.html",
    "creatememberships.html",
    "createothers.html",
    "createrecreation.html",
    "createresearch.html",
    "CreateResearchArticle.html",
    "createResearchGrant.html",
    "createscholarships.html",
    "createSeminarAndWorkshop.html",
    "CreateSeminar.html",
    "createtrainingProgram.html",
]

def add_novalidate(filepath):
    """Add novalidate attribute to form tags"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern: <form id="..." > or <form id="...">
        # Add novalidate if not already present
        if 'novalidate' not in content:
            content = re.sub(
                r'(<form\s+id="[^"]+")(\s*>)',
                r'\1 novalidate\2',
                content
            )
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Process all HTML files"""
    fixed_count = 0
    
    for filename in HTML_FILES:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(filepath):
            if add_novalidate(filepath):
                fixed_count += 1
                print(f"[OK] {filename}: Added novalidate")
            else:
                print(f"[SKIP] {filename}: Already has novalidate or no form found")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files updated: {fixed_count}")

if __name__ == "__main__":
    main()
