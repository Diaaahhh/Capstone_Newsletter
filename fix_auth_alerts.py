"""
Fix remaining authentication alerts
Replaces alert("You need to be logged in.") with Toast.warning()
"""

import os
import re

FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

FILES_TO_FIX = [
    "CreateDegreeReview.js",
    "CreateDeptActivities.js",
    "CreateClubActivities.js",
    "CreateCCCEvents.js",
    "CreateAlumniStories.js",
    "CreateAchievements.js",
    "CreateMedia.js",
    "CreateMap.js",
    "CreateLibrary.js",
    "CreateResearch.js",
    "CreateRecreation.js",
    "CreateOthers.js",
    "CreateMemberships.js",
    "CreateScholarships.js",
    "CreateSeminars.js",
    "CreateTrainingProgram.js",
]

def fix_auth_alert(filepath):
    """Replace authentication alert with Toast.warning"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: Multi-line format
        content = re.sub(
            r'if \(!userEmail\) \{\s*alert\("You need to be logged in\."\);',
            r'if (!userEmail) {\n    Toast.warning("You need to be logged in.");',
            content
        )
        
        # Pattern 2: Single-line format (for CreateMedia.js)
        content = re.sub(
            r'if \(!userEmail\) \{ alert\("You need to be logged in\."\);',
            r'if (!userEmail) { Toast.warning("You need to be logged in.");',
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
    """Process all files"""
    fixed_count = 0
    
    for filename in FILES_TO_FIX:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(filepath):
            if fix_auth_alert(filepath):
                fixed_count += 1
                print(f"[OK] {filename}: Fixed authentication alert")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files fixed: {fixed_count}")

if __name__ == "__main__":
    main()
