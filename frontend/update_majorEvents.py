
import os
import re

file_path = r"c:\Users\Rupommoral\Documents\Finale\NewLetterEWU\frontend\majorEvents.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find the old link
# We match <a ... id="userBtn">Profile</a> with flexibility for whitespace and attributes order
# But typically it's: <a href="#" class="nav-link" id="userBtn">Profile</a>
pattern = r'<a\s+href="#"\s+class="nav-link"\s+id="userBtn">Profile</a>'

replacement = '''<button type="button" class="user-btn" id="userBtn">
                <i class="bi bi-person-circle"></i>
              </button>'''

if re.search(pattern, content):
    print(f"Found old pattern in {file_path}")
    new_content = re.sub(pattern, replacement, content)
    
    # Check for homepage.css
    if "homepage.css" not in new_content:
        print("homepage.css not found, adding it.")
        # Add homepage.css after majorEvents.css or just in head
        # Trying to find a good place
        if 'href="majorEvents.css"' in new_content:
            new_content = new_content.replace('href="majorEvents.css" />', 'href="majorEvents.css" />\n  <link rel="stylesheet" href="homepage.css" />')
        elif '</head>' in new_content:
            new_content = new_content.replace('</head>', '  <link rel="stylesheet" href="homepage.css" />\n</head>')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated file.")
else:
    print("Pattern not found.")
