// testNotification.js
// Script to create a test notification with article link

async function createTestNotification() {
    try {
        // First, let's get some existing articles to use for testing
        const articlesRes = await fetch('http://localhost:5000/api/newsfeed-general');
        const articles = await articlesRes.json();
        
        if (!articles || articles.length === 0) {
            console.log('No articles found in database');
            return;
        }
        
        // Use the first article for testing
        const testArticle = articles[0];
        const testUserEmail = localStorage.getItem('userEmail') || 'test@example.com';
        
        console.log('Creating test notification for article:', testArticle);
        
        // Create a test notification
        const notificationData = {
            to: testUserEmail,
            title: 'Test Notification',
            message: 'This is a test notification with a link to an article',
            relatedArticleId: testArticle._id,
            relatedArticleCategory: testArticle.category || 'research'
        };
        
        const response = await fetch('http://localhost:5000/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Test notification created successfully:', result);
            alert('Test notification created! Check your notifications.');
        } else {
            const error = await response.text();
            console.error('Failed to create test notification:', error);
            alert('Failed to create test notification: ' + error);
        }
        
    } catch (error) {
        console.error('Error creating test notification:', error);
        alert('Error creating test notification: ' + error.message);
    }
}

// Add a button to create test notification (for testing purposes)
function addTestNotificationButton() {
    const button = document.createElement('button');
    button.textContent = 'Create Test Notification';
    button.className = 'btn btn-warning btn-sm';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.onclick = createTestNotificationButton;
    
    function createTestNotificationButton() {
        createTestNotification();
    }
    
    document.body.appendChild(button);
}

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only add the button if we're in development/testing mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(addTestNotificationButton, 2000);
    }
});