// debug_notification_links.js
// Simple debug script to test notification rendering and verify links are showing up

(function() {
    'use strict';

    console.log('🔍 Notification Link Debug Script Loaded');

    // Wait for DOM and notification system to load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 DOM loaded, checking for notification elements...');

        // Check if notification elements exist
        const notifLinks = document.querySelectorAll('.notification-link');
        const badgeEls = document.querySelectorAll('.notification-badge');

        console.log(`📊 Found ${notifLinks.length} notification links and ${badgeEls.length} badge elements`);

        if (notifLinks.length === 0) {
            console.warn('⚠️ No notification links found on page');
            return;
        }

        // Override the showNotificationList function to add debugging
        const originalShowNotificationList = window.showNotificationList;
        if (originalShowNotificationList) {
            window.showNotificationList = function(items, triggerElement) {
                console.log('🔔 showNotificationList called with:', {
                    itemCount: items.length,
                    items: items.map(n => ({
                        id: n._id,
                        title: n.title,
                        hasArticleLink: !!(n.relatedArticleId && n.relatedArticleCategory),
                        relatedArticleId: n.relatedArticleId,
                        relatedArticleCategory: n.relatedArticleCategory,
                        isRead: n.isRead
                    }))
                });

                // Call original function
                originalShowNotificationList.call(this, items, triggerElement);

                // After overlay is created, check for links
                setTimeout(() => {
                    const overlay = document.getElementById('notifOverlay');
                    if (overlay) {
                        const viewLinks = overlay.querySelectorAll('.view-article-link');
                        console.log(`🔗 Found ${viewLinks.length} "View Article" links in notification dropdown`);

                        viewLinks.forEach((link, index) => {
                            console.log(`   Link ${index + 1}:`, {
                                text: link.textContent,
                                visible: link.offsetParent !== null,
                                hasClickHandler: link.onclick !== null
                            });
                        });

                        if (viewLinks.length === 0 && items.some(n => n.relatedArticleId && n.relatedArticleCategory)) {
                            console.error('❌ ERROR: Notifications have article data but no links rendered!');
                        } else if (viewLinks.length > 0) {
                            console.log('✅ SUCCESS: Article links are being rendered');
                        }
                    } else {
                        console.warn('⚠️ No notification overlay found after rendering');
                    }
                }, 100);
            };
            console.log('🔧 showNotificationList function overridden for debugging');
        } else {
            console.warn('⚠️ Original showNotificationList not found - notification.js may not be loaded yet');
        }

        // Add a global debug function
        window.debugNotifications = function() {
            console.log('🔍 Manual notification debug triggered');

            // Try to fetch notifications manually
            const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole') || 'user';
            const toParam = userRole === 'admin' ? 'admins' : userEmail;

            if (!toParam) {
                console.error('❌ No user email/id found in localStorage');
                return;
            }

            fetch(`http://localhost:5000/api/notifications?to=${encodeURIComponent(toParam)}`)
                .then(res => res.json())
                .then(notifications => {
                    console.log('📨 Current notifications from API:', notifications);
                    console.log('📈 Summary:', {
                        total: notifications.length,
                        withLinks: notifications.filter(n => n.relatedArticleId && n.relatedArticleCategory).length,
                        unread: notifications.filter(n => !n.isRead).length
                    });
                })
                .catch(err => console.error('❌ Failed to fetch notifications:', err));
        };

        console.log('✅ Debug script ready. Use debugNotifications() in console to manually check notifications.');
        console.log('💡 Click notification bell to see rendering debug info.');
    });

    // Add some CSS for better debugging visibility
    const debugStyle = document.createElement('style');
    debugStyle.textContent = `
        .view-article-link {
            border: 1px solid #007bff !important;
            background: #e7f3ff !important;
        }
        .view-article-link:hover {
            background: #d1e7ff !important;
        }
    `;
    document.head.appendChild(debugStyle);
    console.log('🎨 Debug styles added to highlight article links');

})();