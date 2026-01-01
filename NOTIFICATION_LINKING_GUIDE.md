# Notification Article Linking - Implementation Guide

## Overview

This implementation adds clickable links to notifications that direct users to specific articles. When users click on a notification with an article link, they are taken to the corresponding category page and the specific article is highlighted.

## Features Implemented

### 1. Backend Changes

#### Notification Model Enhancement
- **File**: `backend/models/Notification.js`
- **New Fields**:
  - `relatedArticleId`: References the specific article (NewsfeedGeneral model)
  - `relatedArticleCategory`: Stores the category for navigation

#### Notification Controller Update
- **File**: `backend/controllers/notificationController.js`
- **Updated**: `createNotification` function to handle new fields

### 2. Frontend Changes

#### Notification Display Enhancement
- **File**: `frontend/notification.js`
- **New Features**:
  - Shows "📄 View Article" link when notification has article reference
  - Click handling for navigation to specific articles
  - Navigation function that maps categories to HTML files

#### Article Highlighting System
- **File**: `frontend/notificationArticleHighlight.js`
- **Functionality**:
  - Detects when page is navigated from notification
  - Highlights the target article with visual effects
  - Compatible with multiple data attribute formats

#### Category Page Integration
- **Updated Files**:
  - `frontend/research.html`
  - `frontend/majorEvents.html`
- **Changes**:
  - Added notification highlighting script
  - Set article IDs on cards for targeting

#### Test Functionality
- **File**: `frontend/testNotification.js`
- **Purpose**: Creates test notifications for development

## How It Works

### 1. Creating Notifications with Article Links

When creating a notification, include the new fields:

```javascript
{
  "to": "user@example.com",
  "title": "New Research Article Published",
  "message": "Check out the latest research findings",
  "relatedArticleId": "article_id_here",
  "relatedArticleCategory": "research"
}
```

### 2. User Experience

1. **Notification Display**: Users see notifications with "📄 View Article" link
2. **Click Navigation**: Clicking the link navigates to the appropriate category page
3. **Article Highlighting**: The target article is highlighted with:
   - Blue border (3px solid #007bff)
   - Box shadow effect
   - Slight scale increase (1.02x)
   - Auto-scroll to center
   - Highlight effect lasts 5 seconds

### 3. Category Mapping

The system maps categories to HTML files:

```javascript
const categoryMap = {
  'major-events': 'majorEvents.html',
  'ccc-events': 'cccEvents.html',
  'research': 'research.html',
  'achievements': 'achievements.html',
  // ... more categories
};
```

## Category Pages Supported

All major category pages are supported:
- Major Events (`majorEvents.html`)
- CCC Events (`cccEvents.html`)
- Alumni Stories (`alumniStories.html`)
- Club Activities (`clubActivities.html`)
- Scholarships (`scholarships.html`)
- Library (`library.html`)
- Research (`research.html`)
- Recreation (`recreation.html`)
- Degree Review (`degreeReview.html`)
- Seminars (`seminars.html`)
- Memberships (`memberships.html`)
- Training Program (`trainingProgram.html`)
- Achievements (`achievements.html`)
- Map (`map.html`)
- Department Activities (`deptActivities.html`)
- Others (`others.html`)
- Research Grant (`researchGrant.html`)
- Journal Publications (`journalPublications.html`)
- Book Chapters (`bookChapters.html`)
- Books and Edited Books (`booksAndEditedBooks.html`)
- Conference Proceeding (`conferenceProceeding.html`)
- Conference Presentation (`conferencePresentation.html`)
- Seminar and Workshop (`seminarAndWorkshop.html`)
- Media (`mediaVC.html`)
- Achievements VC (`achievementsVC.html`)

## Testing

### Manual Testing

1. **Create Test Notification**:
   - Include the test script: `<script src="testNotification.js"></script>`
   - A "Create Test Notification" button will appear (localhost only)
   - Click to create a test notification with article link

2. **Test Navigation**:
   - Click on notification with article link
   - Verify navigation to correct category page
   - Check that article is highlighted

3. **Test Highlighting**:
   - Verify blue border and shadow effects
   - Check auto-scroll functionality
   - Confirm highlight disappears after 5 seconds

### Automated Testing

The `testNotification.js` script can be used to:
- Fetch existing articles from database
- Create test notifications automatically
- Verify the linking functionality

## Implementation Notes

### Data Flow

1. **Backend**: Notification model stores article reference
2. **Frontend Display**: Notification shows clickable link if article reference exists
3. **Navigation**: User clicks link → navigates to category page with article ID
4. **Highlighting**: Category page detects article ID and highlights the article

### Compatibility

- **Backward Compatible**: Existing notifications without article links work normally
- **Multiple Card Formats**: Supports both `data-article-id` and `data-id` attributes
- **Graceful Fallback**: If article not found, no highlighting occurs

### Performance

- **Efficient**: Highlighting only triggers when navigation from notification
- **Non-blocking**: Article highlighting doesn't interfere with page loading
- **Memory Safe**: Event listeners are properly cleaned up

## Future Enhancements

### Potential Improvements

1. **Deep Linking**: URL parameters for direct article access
2. **Multiple Articles**: Support for notifications linking to multiple articles
3. **Category Filtering**: Auto-filter to show only relevant articles
4. **Animation Options**: Different highlighting animations
5. **Bookmark Feature**: Save highlighted articles for later

### Integration Points

1. **Content Management**: Admin interface for creating notifications with article links
2. **Auto-notifications**: System-generated notifications when new articles are published
3. **User Preferences**: Allow users to customize notification behavior

## Troubleshooting

### Common Issues

1. **Article Not Highlighted**:
   - Check that article ID is correctly set on card
   - Verify category mapping in navigation function
   - Ensure notification highlighting script is loaded

2. **Navigation Fails**:
   - Check category mapping in `navigateToArticle` function
   - Verify target HTML file exists
   - Check browser console for errors

3. **Notification Link Not Showing**:
   - Verify backend notification has `relatedArticleId` and `relatedArticleCategory`
   - Check notification display logic in `notification.js`

### Debug Tools

- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Verify API calls for notifications and articles
- **Element Inspector**: Check data attributes on article cards

## Conclusion

This implementation provides a seamless way for users to navigate from notifications directly to the referenced articles, with visual highlighting to guide them to the specific content. The system is designed to be robust, compatible, and user-friendly.