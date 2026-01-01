// notification.js v2.0
// Fetches notifications for current user and renders a simple dropdown badge
// Usage: include this file on pages with header/notification icon.
// It will look for .notification-link and .notification-badge

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api";
  const NOTIFICATIONS_ENDPOINT = `${API_BASE}/notifications`;
  const ADMIN_REQUEST_ENDPOINT = `${API_BASE}/admin-requests`;

  // Identify user
  const userEmail =
    localStorage.getItem("userEmail") || localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole") || "user";
  const token = localStorage.getItem("token");

  // If completely logged out (no email, no id) and not admin, nothing to do
  if (!userEmail && userRole !== "admin") return;

  const notifLinks = document.querySelectorAll(".notification-link");
  const badgeEls = document.querySelectorAll(".notification-badge");

  // -----------------------------
  // fetch notifications for this user/admin (unread only for badge)
  // -----------------------------
  async function loadNotifications() {
    try {
      // Admin হলে shared "admins" channel থেকে, নাহলে নিজস্ব email
      const toParam = userRole === "admin" ? "admins" : userEmail;
      if (!toParam) return;

      const q = new URLSearchParams({
        to: toParam,
        unreadOnly: "true",
      });

      const res = await fetch(`${NOTIFICATIONS_ENDPOINT}?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const list = await res.json();
      const unreadCount = Array.isArray(list) ? list.length : 0;

      // Badge update
      badgeEls.forEach((b) => {
        b.textContent = unreadCount;
        b.style.display = unreadCount ? "inline-block" : "none";
      });

      // Dropdown / overlay: when user clicks notification link
      notifLinks.forEach((link) => {
        // যেন এক element-এ বারবার listener add না হয়
        if (link.dataset.notifBound === "1") return;
        link.dataset.notifBound = "1";

        link.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            // full notifications (read + unread) for same toParam
            const res2 = await fetch(
              `${NOTIFICATIONS_ENDPOINT}?to=${encodeURIComponent(toParam)}`
            );
            if (!res2.ok)
              throw new Error("Failed to fetch full notifications");
            const full = await res2.json();
            showNotificationList(full, e.currentTarget);
          } catch (err) {
            console.error("Notification full list load failed:", err);
          }
        });
      });
    } catch (err) {
      console.error("Notification load failed:", err);
    }
  }

  // -----------------------------
  // Navigate to specific article
  // -----------------------------
  function navigateToArticle(category, articleId) {
    if (!category || !articleId) {
      console.error('Missing category or article ID for navigation');
      return;
    }

    // Map categories to their corresponding HTML files
    const categoryMap = {
      'major-events': 'majorEvents.html',
      'ccc-events': 'cccEvents.html',
      'alumni-stories': 'alumniStories.html',
      'club-activities': 'clubActivities.html',
      'scholarships': 'scholarships.html',
      'library': 'library.html',
      'research': 'research.html',
      'recreation': 'recreation.html',
      'degree-review': 'degreeReview.html',
      'seminars': 'seminars.html',
      'memberships': 'memberships.html',
      'training-program': 'trainingProgram.html',
      'achievements': 'achievements.html',
      'map': 'map.html',
      'dept-activities': 'deptActivities.html',
      'others': 'others.html',
      'research-grant': 'researchGrant.html',
      'journal-publications': 'journalPublications.html',
      'book-chapters': 'bookChapters.html',
      'books-and-edited-books': 'booksAndEditedBooks.html',
      'conference-proceeding': 'conferenceProceeding.html',
      'conference-presentation': 'conferencePresentation.html',
      'seminar-and-workshop': 'seminarAndWorkshop.html',
      'media': 'mediaVC.html',
      'media-vc': 'mediaVC.html',
      'achievements-vc': 'achievementsVC.html'
    };

    // Get the HTML file for the category
    const htmlFile = categoryMap[category.toLowerCase()];
    if (!htmlFile) {
      console.error('No HTML file found for category:', category);
      return;
    }

    // Store the article ID in sessionStorage for the target page to handle
    sessionStorage.setItem('highlightArticleId', articleId);
    
    // Navigate to the category page
    window.location.href = htmlFile;
  }

  // -----------------------------
  // Show overlay list
  // -----------------------------
  function showNotificationList(items = [], triggerElement) {
    // Remove any existing overlay
    const existing = document.getElementById("notifOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "notifOverlay";
    overlay.style.position = "fixed";
    overlay.style.width = "350px";
    overlay.style.maxHeight = "500px";
    overlay.style.overflow = "auto";
    overlay.style.background = "white";
    overlay.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
    overlay.style.borderRadius = "8px";
    overlay.style.zIndex = 99999;
    overlay.style.padding = "10px";

    // Position dropdown relative to the notification button using fixed positioning
    if (triggerElement) {
      const rect = triggerElement.getBoundingClientRect();
      const topPos = rect.bottom + 5;
      const leftPos = rect.left;
      
      console.log('Notification button position:', {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      });
      console.log('Dropdown will be positioned at:', { top: topPos, left: leftPos });
      
      overlay.style.top = `${topPos}px`;
      overlay.style.left = `${leftPos}px`;
    } else {
      console.log('No trigger element, using fallback position');
      // Fallback to fixed position if no trigger element
      overlay.style.right = "20px";
      overlay.style.top = "70px";
    }

    if (!items.length) {
      overlay.appendChild(document.createTextNode("No notifications"));
    } else {
      // Sort notifications: unread first, then by date (newest first)
      const sortedItems = [...items].sort((a, b) => {
        // Unread notifications come first
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        
        // Within same read status, sort by date (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      sortedItems.forEach((n) => {
        const row = document.createElement("div");
        row.className = "mb-2";
        row.style.cursor = "pointer";
        row.style.borderBottom = "1px solid #eee";
        row.style.paddingBottom = "6px";

        row.innerHTML = `
          <strong>${escapeHtml(n.title)}</strong>
          <div class="small text-muted">
            ${escapeHtml(n.message)}
          </div>
          <div class="small text-muted">
            ${n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
          </div>
          ${n.relatedArticleId && n.relatedArticleCategory ?
            '<div class="mt-1"><a href="#" class="view-article-link small" style="color: #007bff; text-decoration: none;">📄 View Article</a></div>' :
            ''
          }
        `;

        if (n.isRead) {
          row.style.opacity = "0.6";
          row.style.backgroundColor = "#f8f9fa";
        } else {
          row.style.backgroundColor = "#e3f2fd";
          row.style.fontWeight = "500";
        }

        // click row -> mark as read (only if unread)
        row.addEventListener("click", async (e) => {
          // If clicking on the "View Article" link, don't handle it here
          if (e.target.closest('.view-article-link')) {
            return;
          }

          if (n.isRead) return;

          try {
            if (n._id) {
              await fetch(`${NOTIFICATIONS_ENDPOINT}/${n._id}/read`, {
                method: "PUT",
              });
            }

            n.isRead = true;
            row.style.opacity = "0.6";

            // badge count manually কমিয়ে দিই
            badgeEls.forEach((b) => {
              const current = parseInt(b.textContent, 10) || 0;
              const next = current > 0 ? current - 1 : 0;
              b.textContent = next;
              b.style.display = next ? "inline-block" : "none";
            });
          } catch (err) {
            console.error("Failed to mark notification as read:", err);
          }
        });

        // Handle "View Article" link click
        const viewArticleLink = row.querySelector('.view-article-link');
        if (viewArticleLink) {
          viewArticleLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateToArticle(n.relatedArticleCategory, n.relatedArticleId);
          });
        }

        // 🔥 If this is an admin_request and current user is admin -> show Accept/Reject buttons
        if (
          userRole === "admin" &&
          n.type === "admin_request" &&
          n.requestStatus === "pending" &&
          n.requestUserId &&
          token
        ) {
          const actions = document.createElement("div");
          actions.className = "mt-2";

          actions.innerHTML = `
            <button class="btn btn-success btn-sm me-2 accept-btn">Accept</button>
            <button class="btn btn-danger btn-sm reject-btn">Reject</button>
          `;

          const acceptBtn = actions.querySelector(".accept-btn");
          const rejectBtn = actions.querySelector(".reject-btn");

          const handleAction = async (action) => {
            try {
              acceptBtn.disabled = true;
              rejectBtn.disabled = true;

              const res = await fetch(
                `${ADMIN_REQUEST_ENDPOINT}/handle/${n.requestUserId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    action,
                    notifId: n._id,
                  }),
                }
              );

              const data = await res.json();
              if (!res.ok) {
                Toast.error(data.message || "Failed to handle admin request");
                acceptBtn.disabled = false;
                rejectBtn.disabled = false;
                return;
              }

              Toast.success(data.message || "Request handled");
              overlay.remove();
              loadNotifications();
            } catch (err) {
              console.error("Admin request handle error:", err);
              Toast.error("Error while handling admin request.");
              acceptBtn.disabled = false;
              rejectBtn.disabled = false;
            }
          };

          acceptBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            handleAction("accept");
          });

          rejectBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            handleAction("reject");
          });

          row.appendChild(actions);
        }

        overlay.appendChild(row);
      });
    }

    document.body.appendChild(overlay);

    // click outside to remove
    const onDocClick = (ev) => {
      if (!overlay.contains(ev.target)) {
        overlay.remove();
        document.removeEventListener("click", onDocClick);
      }
    };
    setTimeout(() => document.addEventListener("click", onDocClick), 50);
  }

  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, (m) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }

  loadNotifications();
});
