"""
Replace all remaining alerts in utility and admin files
Handles notification.js, homepage.js, drafts.js, draftsVC.js, and editor files
"""

import os
import re

FRONTEND_DIR = r"d:\Academic\Capstone\NewLetterEWU_Digital_NewsfeedGeneral\NewLetterEWU\frontend"

# Files with alerts that need fixing
FILES_TO_FIX = [
    "notification.js",
    "homepage.js",
    "drafts.js",
    "draftsVC.js",
    "generalNewsletterEditor.js",
    "vcNewsletterModernEditor.js",
    "vcNewsletterCategorizedEditor.js",
    "vcNewsletterTimeline.js",
    "printPage.js",
    "categoryPages.js",
    "bookChaptersUnderReview.js",
]

# Alert replacement patterns
PATTERNS = [
    # Success messages
    (r'alert\("✅\s*([^"]+)"\)', r'Toast.success("\1")'),
    (r"alert\('✅\s*([^']+)'\)", r"Toast.success('\1')"),
    (r'alert\("([^"]*(?:success|Success|successful|Successful|updated|deleted|granted|approved|accepted)[^"]*)"\)', r'Toast.success("\1")'),
    
    # Error messages
    (r'alert\("❌\s*([^"]+)"\)', r'Toast.error("\1")'),
    (r"alert\('❌\s*([^']+)'\)", r"Toast.error('\1')"),
    (r'alert\("([^"]*(?:Error|error|Failed|failed|Cannot|cannot|Invalid|invalid)[^"]*)"\)', r'Toast.error("\1")'),
    (r'alert\(data\.message\s*\|\|\s*"([^"]+)"\)', r'Toast.error(data.message || "\1")'),
    
    # Warning messages  
    (r'alert\("⚠️\s*([^"]+)"\)', r'Toast.warning("\1")'),
    (r'alert\("([^"]*(?:Please|please|No items|No category)[^"]*)"\)', r'Toast.warning("\1")'),
    
    # Info messages
    (r'alert\("([^"]*(?:Coming soon|coming soon)[^"]*)"\)', r'Toast.info("\1")'),
    (r'alert\(`([^`]*(?:Edit functionality|moved to)[^`]*)`\)', r'Toast.info(`\1`)'),
    
    # Generic alerts with variables
    (r'alert\(([^)]+)\s*\+\s*error\.message\)', r'Toast.error(\1 + error.message)'),
]

def fix_alerts_in_file(filepath):
    """Replace all alert() calls with Toast notifications"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = 0
        
        # Apply all patterns
        for pattern, replacement in PATTERNS:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                changes += len(matches)
        
        # Manual fixes for complex cases
        if 'notification.js' in filepath:
            # Fix admin request alerts
            content = re.sub(
                r'alert\(data\.message \|\| "Failed to handle admin request"\)',
                r'Toast.error(data.message || "Failed to handle admin request")',
                content
            )
            content = re.sub(
                r'alert\(data\.message \|\| "Request handled"\)',
                r'Toast.success(data.message || "Request handled")',
                content
            )
            content = re.sub(
                r'alert\("Error while handling admin request\."\)',
                r'Toast.error("Error while handling admin request.")',
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
            if fix_alerts_in_file(filepath):
                fixed_count += 1
                print(f"[OK] {filename}: Fixed alerts")
            else:
                print(f"[SKIP] {filename}: No alerts found or already fixed")
        else:
            print(f"[SKIP] {filename}: File not found")
    
    print(f"\n=== Summary ===")
    print(f"Files fixed: {fixed_count}")

if __name__ == "__main__":
    main()
