// frontend/recommendationAPI.js
// ============================================================
// RECOMMENDATION API CLIENT
// Handles all communication with the recommendation backend
// ============================================================

(function () {
    const API_BASE = "http://localhost:5000/api/user";

    /**
     * Get user ID from localStorage
     */
    function getUserId() {
        const userEmail = localStorage.getItem("userEmail");
        const userId = localStorage.getItem("userId");
        // Prioritize userId, fallback to email, then anonymous
        const id = userId || userEmail || "anonymous";
        // Ensure strictly safe characters for URL
        return encodeURIComponent(id);
    }

    /**
     * Helper for making requests with logging
     */
    async function makeRequest(endpoint, method, body = null) {
        const url = `${API_BASE}${endpoint}`;
        console.log(`[RecommendationAPI] Request: ${method} ${url}`, body);

        try {
            const options = {
                method,
                headers: { "Content-Type": "application/json" },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            // Check for 404 or other non-OK status
            if (!response.ok) {
                console.error(`[RecommendationAPI] Error ${response.status}: ${response.statusText} at ${url}`);
                const text = await response.text();
                // Try to parse text as JSON if possible, else return text
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error(`Server returned ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`[RecommendationAPI] Fetch error for ${url}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Track article view
     */
    async function trackView(articleId, category, engagementTime = 0) {
        return makeRequest("/interactions/view", "POST", {
            userId: getUserId(),
            articleId,
            category: category || "general",
            engagementTime,
            metadata: { timestamp: Date.now() },
        });
    }

    /**
     * Track search query
     */
    async function trackSearch(searchQuery, category = "") {
        return makeRequest("/interactions/search", "POST", {
            userId: getUserId(),
            searchQuery,
            category: category || "general",
            metadata: { timestamp: Date.now() },
        });
    }

    /**
     * Track article click
     */
    async function trackClick(articleId, category) {
        return makeRequest("/interactions/click", "POST", {
            userId: getUserId(),
            articleId,
            category: category || "general",
            metadata: { timestamp: Date.now() },
        });
    }

    /**
     * Track feedback (like/dislike)
     */
    async function trackFeedback(articleId, feedbackType, category) {
        return makeRequest("/interactions/feedback", "POST", {
            userId: getUserId(),
            articleId,
            feedbackType, // 'like' or 'dislike'
            category: category || "general",
            metadata: { timestamp: Date.now() },
        });
    }

    /**
     * Get personalized recommendations
     */
    async function getRecommendations(limit = 5) {
        // userId is already encoded in getUserId(), but we put it in path
        // decoding it here to avoid double encoding issues if reusing the raw string for logic, 
        // but for the URL construction below we must be careful.
        // Actually, let's just use the result of getUserId() which is refined.
        const userId = getUserId();
        // Note: endpoint needs to be exact. 
        // /recommendations/:userId
        const urlPth = `/recommendations/${userId}?limit=${limit}`;

        // We use GET here, so we pass null for body
        // But wait, makeRequest expects endpoint starting with /
        // The API_BASE includes no trailing slash? 
        // API_BASE = .../api/user"
        // endpoint = /recommendations/...
        // Result: .../api/user/recommendations/... Perfect.

        return makeRequest(urlPth, "GET");
    }

    /**
     * Get user preferences
     */
    async function getPreferences() {
        const userId = getUserId();
        return makeRequest(`/preferences/${userId}`, "GET");
    }

    /**
     * Save user preferences
     */
    async function savePreferences(preferences) {
        return makeRequest("/preferences", "POST", {
            userId: getUserId(),
            ...preferences,
        });
    }

    /**
     * Exclude article from recommendations
     */
    async function excludeArticle(articleId) {
        return makeRequest("/preferences/exclude", "POST", {
            userId: getUserId(),
            articleId,
        });
    }

    // Expose API methods globally
    window.RecommendationAPI = {
        trackView,
        trackSearch,
        trackClick,
        trackFeedback,
        getRecommendations,
        getPreferences,
        savePreferences,
        excludeArticle,
        getUserId,
    };

    console.log("[RecommendationAPI] Initialized with base:", API_BASE);
})();
