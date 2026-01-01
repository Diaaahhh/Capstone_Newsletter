#!/usr/bin/env python3
"""
Script to add image upload functionality to all remaining newsletter categories.
Updates both HTML and JavaScript files systematically.
"""

import os
import re

# Define the categories that need to be updated
CATEGORIES_TO_UPDATE = [
    # General Newsletter
    ("createclubActivities.html", "CreateClubActivities.js", "clubActivities"),
    ("createscholarships.html", "CreateScholarships.js", "scholarships"),
    ("createlibrary.html", "CreateLibrary.js", "library"),
    ("createresearch.html", "CreateResearch.js", "research"),
    ("createrecreation.html", "CreateRecreation.js", "recreation"),
    ("createdegreeReview.html", "CreateDegreeReview.js", "degreeReview"),
    ("createseminars.html", "CreateSeminars.js", "seminars"),
    ("creatememberships.html", "CreateMemberships.js", "memberships"),
    ("createtrainingProgram.html", "CreateTrainingProgram.js", "trainingProgram"),
    ("createmap.html", "CreateMap.js", "map"),
    ("createdeptActivities.html", "CreateDeptActivities.js", "deptActivities"),
    ("createothers.html", "CreateOthers.js", "others"),
    # VC Newsletter
    ("createmedia.html", "CreateMedia.js", "media"),
    ("createMediaVC.html", "createMediaVC.js", "mediaVC"),
    ("createSeminarAndWorkshop.html", "createSeminarAndWorkshop.js", "seminarAndWorkshop"),
    ("createConferencePresentation.html", "createConferencePresentation.js", "conferencePresentation"),
    ("createConferenceProceeding.html", "createConferenceProceeding.js", "conferenceProceeding"),
]

FRONTEND_DIR = "frontend"

def update_html_file(filepath):
    """Add imageUploadHelper.js script to HTML file if not present."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if imageUploadHelper.js is already included
        if 'imageUploadHelper.js' in content:
            print(f"  ✓ {os.path.basename(filepath)} already has imageUploadHelper.js")
            return True
        
        # Find the script section and add imageUploadHelper.js
        # Look for bootstrap bundle script as anchor point
        pattern = r'(<script src="https://cdn\.jsdelivr\.net/npm/bootstrap@[^"]+"></script>)'
        replacement = r'\1\n    <script src="imageUploadHelper.js"></script>'
        
        new_content = re.sub(pattern, replacement, content, count=1)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  ✓ Updated {os.path.basename(filepath)}")
            return True
        else:
            print(f"  ⚠ Could not find insertion point in {os.path.basename(filepath)}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error updating {filepath}: {e}")
        return False

def update_js_file(filepath):
    """Update JavaScript file to add async image upload functionality."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if 'uploadImageFromInput' in content:
            print(f"  ✓ {os.path.basename(filepath)} already has upload functionality")
            return True
        
        modified = False
        
        # Pattern 1: Update getFormData() function to be async and add upload
        pattern1 = r'(  (?:\/\/ Get form data|function getFormData\(\) \{)[\s\S]*?)(    const formData = \{[\s\S]*?featuredImage: document\.getElementById\("featuredImage"\)\?\.value\.trim\(\) \|\| "",)'
        
        replacement1 = r'\1    // Upload image if selected\n    let imageUrl = "";\n    try {\n      imageUrl = await uploadImageFromInput("featuredImage") || "";\n    } catch (error) {\n      console.error("Image upload failed:", error);\n    }\n\n\2'
        replacement1 = replacement1.replace('featuredImage: document.getElementById("featuredImage")?.value.trim() || ""', 'featuredImage: imageUrl')
        
        # Make function async
        content = re.sub(r'function getFormData\(\)', 'async function getFormData()', content)
        modified = True
        
        # Update featuredImage assignment
        content = re.sub(
            r'featuredImage: document\.getElementById\("featuredImage"\)\?\.value\.trim\(\) \|\| ""',
            'featuredImage: imageUrl',
            content
        )
        
        # Add upload code before formData declaration
        pattern_formdata = r'(  async function getFormData\(\) \{)\n(    const formData = \{)'
        replacement_formdata = r'\1\n    // Upload image if selected\n    let imageUrl = "";\n    try {\n      imageUrl = await uploadImageFromInput("featuredImage") || "";\n    } catch (error) {\n      console.error("Image upload failed:", error);\n    }\n\n\2'
        content = re.sub(pattern_formdata, replacement_formdata, content)
        
        # Pattern 2: Update all calls to getFormData() to use await
        content = re.sub(
            r'const formData = getFormData\(\);',
            'const formData = await getFormData();',
            content
        )
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Updated {os.path.basename(filepath)}")
            return True
        else:
            print(f"  ⚠ No changes made to {os.path.basename(filepath)}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error updating {filepath}: {e}")
        return False

def main():
    """Main function to update all category files."""
    print("=" * 60)
    print("Image Upload Implementation Script")
    print("=" * 60)
    print()
    
    total = len(CATEGORIES_TO_UPDATE)
    success_count = 0
    
    for html_file, js_file, category in CATEGORIES_TO_UPDATE:
        print(f"\nProcessing {category}...")
        
        html_path = os.path.join(FRONTEND_DIR, html_file)
        js_path = os.path.join(FRONTEND_DIR, js_file)
        
        html_success = False
        js_success = False
        
        # Update HTML
        if os.path.exists(html_path):
            html_success = update_html_file(html_path)
        else:
            print(f"  ⚠ HTML file not found: {html_path}")
        
        # Update JavaScript
        if os.path.exists(js_path):
            js_success = update_js_file(js_path)
        else:
            print(f"  ⚠ JS file not found: {js_path}")
        
        if html_success and js_success:
            success_count += 1
    
    print()
    print("=" * 60)
    print(f"Completed: {success_count}/{total} categories updated successfully")
    print("=" * 60)

if __name__ == "__main__":
    main()