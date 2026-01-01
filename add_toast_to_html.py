"""
Add toast.js to HTML files that use the fixed JavaScript files
"""

import os
import re

FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

# HTML files that need toast.js
HTML_FILES = [
    "homepage.html",
    "drafts.html",
    "draftsVC.html",
    # vcNewsletter.html already has it
    # printPage.html already has it
]

def add_toast_script(filepath):
    """Add toast.js script if not already present"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if toast.js is already included
        if 'toast.js' in content:
            return False
        
        # Find the last script tag before </body>
        # Add toast.js before the last script or before </body>
        if '</body>' in content:
            # Insert before </body>
            content = content.replace('</body>', '    <script src="toast.js"></script>\n  </body>')
            
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
            if add_toast_script(filepath):
                fixed_count += 1
                print(f"[OK] {filename}: Added toast.js")
            else:
                print(f"[SKIP] {filename}: Already has toast.js or no </body> tag")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files updated: {fixed_count}")

if __name__ == "__main__":
    main()
