// notificationArticleHighlight.js
// Handles highlighting/focusing on specific articles when navigated from notifications

document.addEventListener("DOMContentLoaded", function() {
    // Check if there's an article ID to highlight
    const highlightArticleId = sessionStorage.getItem('highlightArticleId');
    
    if (highlightArticleId) {
        // Clear the stored ID so it doesn't highlight on subsequent loads
        sessionStorage.removeItem('highlightArticleId');
        
        // Function to highlight the article
        function highlightArticle() {
            // Look for the article card with the matching ID
            const articleCards = document.querySelectorAll('.published-event-card');
            
            articleCards.forEach(card => {
                // Check multiple data attributes for compatibility
                if (card.dataset.articleId === highlightArticleId ||
                    card.dataset.id === highlightArticleId) {
                    highlightCard(card);
                    return;
                }
                
                // Alternative approach: check if the card contains the article data
                if (card.querySelector(`[data-article-id="${highlightArticleId}"], [data-id="${highlightArticleId}"]`)) {
                    highlightCard(card);
                    return;
                }
            });
        }
        
        // Function to highlight a card
        function highlightCard(card) {
            // Add highlighting styles
            card.style.border = '3px solid #007bff';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'all 0.3s ease';
            
            // Scroll the card into view
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Add a temporary highlight effect
            card.classList.add('notification-highlighted');
            
            // Remove the highlight after 5 seconds
            setTimeout(() => {
                card.style.border = '';
                card.style.borderRadius = '';
                card.style.boxShadow = '';
                card.style.transform = '';
                card.classList.remove('notification-highlighted');
            }, 5000);
        }
        
        // Wait for articles to load, then highlight
        setTimeout(highlightArticle, 1000);
        
        // Also try to highlight immediately in case articles are already loaded
        highlightArticle();
    }
});

// Function to be called by category pages to set article IDs on their cards
function setArticleIdOnCard(card, articleId) {
    if (card && articleId) {
        card.dataset.articleId = articleId;
    }
}

// Export for use in other scripts
window.NotificationArticleHighlight = {
    setArticleIdOnCard
};