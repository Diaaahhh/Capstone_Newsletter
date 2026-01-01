"""
Add setTimeout delays before redirects in all create form JS files
This allows toast notifications to be visible before page changes
"""

import os
import re

FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

# All create form JS files
FILES_TO_FIX = [
    "CreateTrainingProgram.js",
    "CreateSeminar.js",
    "CreateScholarships.js",
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
    "createSeminarAndWorkshop.js",
    "createResearchGrant.js",
    "createAchievementsVC.js",
    "createBookChapters.js",
    "createBooksAndEditedBooks.js",
    "createConferencePresentation.js",
    "createConferenceProceeding.js",
    "createJournalPublications.js",
    "createMediaVC.js",
]

def add_redirect_delays(filepath):
    """Add setTimeout before window.location redirects after Toast.success"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: Toast.success followed by window.location.href (with possible lines in between)
        # Replace: window.location.href = "page.html";
        # With: setTimeout(() => { window.location.href = "page.html"; }, 1500);
        
        pattern = r'(Toast\.success\([^)]+\);[\s\S]{0,200}?)\s*window\.location\.href\s*=\s*(["\'][^"\']+["\'])\s*;'
        replacement = r'\1\n        setTimeout(() => {\n          window.location.href = \2;\n        }, 1500);'
        
        content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Process all files"""
    fixed_count = 0
    
    for filename in FILES_TO_FIX:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(filepath):
            if add_redirect_delays(filepath):
                fixed_count += 1
                print(f"[OK] {filename}: Added redirect delays")
            else:
                print(f"[SKIP] {filename}: No redirects found or already has delays")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files fixed: {fixed_count}")

if __name__ == "__main__":
    main()
