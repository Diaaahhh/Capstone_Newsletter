# VC Newsletter Editor - Complete Guide

## Overview
The VC Newsletter Editor is a Canva-like PDF editor that automatically organizes articles into 9 fixed category sections.

## How to Use

### 1. Opening the Editor
1. Go to VC Newsletter page (`vcNewsletter.html`)
2. Click the **"Generate PDF"** button
3. Editor opens in full-screen modal

### 2. Editor Features

#### Categorized Content
- Articles are automatically organized into these categories:
  - Research Grant
  - Journal Publications
  - Book Chapter
  - Books & Edited Books
  - Conference Proceeding
  - Conference Presentation
  - Seminar & Workshop
  - Media
  - Achievements

- **Only categories with articles are shown**
- Each category has a header and horizontal divider line
- No category badges on individual articles

#### Sidebar
- **Content Section**: Shows all articles grouped by category
- **Templates Section**: Pre-made blocks (Header, Article, Footer)
- Click any article to add it to the canvas

#### Toolbar Buttons
- **Add Page**: Create a new page
- **Previous/Next**: Navigate between pages
- **Text/Heading**: Add text elements
- **B/I/U**: Bold, Italic, Underline
- **Align**: Left, Center, Right alignment
- **Image/Shape**: Add media elements
- **Duplicate**: Copy selected element
- **Delete**: Remove selected element
- **Move to Page**: Transfer element to another page

#### Properties Panel
- Appears when you select an element
- **Draggable**: Click and hold "⋮⋮ Properties" title to drag anywhere
- Controls:
  - Font Family dropdown
  - Font Size input
  - Color swatches (12 colors)
  - Opacity slider

#### Keyboard Shortcuts
- **Delete**: Remove selected element(s)
- **Ctrl+D**: Duplicate element
- **Ctrl+B**: Toggle bold
- **Ctrl+I**: Toggle italic
- **Ctrl+U**: Toggle underline

#### Cross-Page Dragging
1. Select an element
2. Drag it to the very top or bottom edge of the canvas
3. Page background will highlight slightly
4. Release the element
5. Confirm dialog appears
6. Element moves to next/previous page

### 3. Exporting
- **Preview**: See current page in full quality
- **Download PDF**: Export all pages as PDF file

## Troubleshooting

### Editor doesn't open
- Check browser console for errors
- Ensure Fabric.js and jsPDF libraries are loaded
- Verify newsletter items are loaded (check `window.vcNewsletterFilteredItems`)

### Delete button not working
- Make sure an element is selected (click on it first)
- Try using Delete key instead
- For multiple elements, select with Shift+Click or drag-select

### Properties panel not showing
- Select an element first
- Panel only appears when something is selected

### Can't drag properties panel
- Click and hold the "⋮⋮ Properties" title bar (not the panel body)
- Drag while holding mouse button

### Cross-page drag not working
- Use the "Move to Page" button instead
- Or drag element to very edge (within 50px) and release

## Technical Details

### Files
- `vcNewsletterModernEditor.js` - Main editor logic
- `vcNewsletter.html` - Page with Generate PDF button
- `vcNewsletter.css` - Styling for newsletter page

### Dependencies
- Fabric.js 5.3.0 - Canvas manipulation
- jsPDF 2.5.1 - PDF generation
- html2canvas 1.4.1 - HTML to canvas conversion
- Bootstrap 5.3.3 - UI components
- Bootstrap Icons 1.11.3 - Icons

### Data Flow
1. Articles loaded from API → `window.vcNewsletterFilteredItems`
2. Click "Generate PDF" → `openModernEditor()`
3. Articles categorized → `categorizeItems()`
4. Canvas created → `addModernContent()`
5. Events bound → `setupModernEvents()`
6. Export → `downloadHighQualityPDF()`

## Known Issues
- Fabric.js warnings about 'alphabetical' baseline (cosmetic, doesn't affect functionality)
- These warnings can be ignored

## Support
If issues persist, check:
1. Browser console for JavaScript errors
2. Network tab for failed resource loads
3. Ensure you're using a modern browser (Chrome, Firefox, Edge)