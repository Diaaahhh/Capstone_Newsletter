import os
import re

# List of category HTML files to update
category_files = [
    'frontend/cccEvents.html',
    'frontend/alumniStories.html',
    'frontend/clubActivities.html',
    'frontend/scholarships.html',
    'frontend/library.html',
    'frontend/research.html',
    'frontend/recreation.html',
    'frontend/degreeReview.html',
    'frontend/seminars.html',
    'frontend/memberships.html',
    'frontend/trainingProgram.html',
    'frontend/achievements.html',
    'frontend/map.html',
    'frontend/deptActivities.html',
    'frontend/others.html',
    'frontend/researchGrant.html',
    'frontend/journalPublications.html',
    'frontend/bookChapters.html',
    'frontend/booksAndEditedBooks.html',
    'frontend/conferenceProceeding.html',
    'frontend/conferencePresentation.html',
    'frontend/seminarAndWorkshop.html',
    'frontend/mediaVC.html',
    'frontend/achievementsVC.html'
]

def update_search_input(content):
    """Add id and autocomplete to search input, and add search dropdown"""
    # Pattern to find search input without id
    pattern = r'(<input\s+type="text"\s+class="search-input"(?!\s+id=)[^>]*)(placeholder="Search..."[^>]*>)'
    
    # Check if already has searchDropdown
    if 'id="searchDropdown"' in content:
        return content
    
    # Replace search input
    def replace_input(match):
        input_start = match.group(1)
        input_end = match.group(2)
        
        # Add id and autocomplete if not present
        if 'id=' not in input_start:
            input_start += ' id="searchInput"'
        if 'autocomplete=' not in input_start:
            input_start += ' autocomplete="off"'
        
        # Add dropdown after input
        return f'{input_start} {input_end}\n                <div class="search-dropdown" id="searchDropdown">\n                  <!-- Search results will be populated here -->\n                </div>'
    
    content = re.sub(pattern, replace_input, content)
    return content

def add_global_search_script(content):
    """Add globalSearch.js script before other scripts"""
    # Find the script section
    if 'globalSearch.js' in content:
        return content
    
    # Pattern to find first script tag after Bootstrap
    pattern = r'(<script src="https://cdn\.jsdelivr\.net/npm/bootstrap@[^"]+"></script>\s*\n\s*<script src=")'
    
    replacement = r'\1globalSearch.js"></script>\n  <script src="'
    
    content = re.sub(pattern, replacement, content)
    return content

def process_file(filepath):
    """Process a single HTML file"""
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update search input
        content = update_search_input(content)
        
        # Add global search script
        content = add_global_search_script(content)
        
        # Only write if changes were made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Updated: {filepath}")
            return True
        else:
            print(f"ℹ️  No changes needed: {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    print("🚀 Starting batch update of category pages...\n")
    
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for filepath in category_files:
        result = process_file(filepath)
        if result:
            updated_count += 1
        elif result is False and os.path.exists(filepath):
            skipped_count += 1
        else:
            error_count += 1
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Updated: {updated_count}")
    print(f"   ℹ️  Skipped: {skipped_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📁 Total: {len(category_files)}")

if __name__ == "__main__":
    main()