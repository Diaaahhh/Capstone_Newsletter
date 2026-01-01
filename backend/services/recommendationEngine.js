// backend/services/recommendationEngine.js
const UserInteraction = require("../models/UserInteraction");
const UserPreference = require("../models/UserPreference");
const NewsfeedGeneral = require("../models/NewsfeedGeneral");
const NewsfeedVC = require("../models/NewsfeedVC");

class RecommendationEngine {
    /**
     * Generate personalized recommendations for a user
     * @param {string} userId - User identifier
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Array>} - Array of recommended articles with scores
     */
    async generateRecommendations(userId, limit = 5) {
        try {
            // Get user preferences
            const preferences = await this.getUserPreferences(userId);

            // Get user interaction history
            const interactions = await this.getUserInteractions(userId, 100);

            // Get all available articles
            const allArticles = await this.getAllArticles();

            // Filter out already viewed articles
            const viewedArticleIds = interactions
                .filter(i => i.interactionType === "view" || i.interactionType === "click")
                .map(i => i.articleId.toString());

            const excludedIds = preferences.excludedArticles.map(id => id.toString());
            const candidateArticles = allArticles.filter(
                article => !viewedArticleIds.includes(article._id.toString()) &&
                    !excludedIds.includes(article._id.toString())
            );

            // Score each article
            const scoredArticles = candidateArticles.map(article => ({
                article,
                score: this.calculateRelevanceScore(article, interactions, preferences),
                reasons: this.generateReasons(article, interactions, preferences),
            }));

            // Apply diversity if needed
            const diversifiedArticles = this.applyDiversity(
                scoredArticles,
                preferences.recommendationSettings.diversityLevel
            );

            // Sort by score and return top N
            return diversifiedArticles
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        } catch (error) {
            console.error("Error generating recommendations:", error);
            return [];
        }
    }

    /**
     * Calculate relevance score for an article
     */
    calculateRelevanceScore(article, interactions, preferences) {
        let score = 0;

        // 1. Category-based scoring (weight: 30%)
        score += this.getCategoryScore(article, interactions, preferences) * 0.3;

        // 2. Content-based scoring (weight: 40%)
        score += this.getContentScore(article, interactions) * 0.4;

        // 3. Freshness scoring (weight: based on user preference)
        const freshnessWeight = preferences.recommendationSettings.freshnessWeight;
        score += this.getFreshnessScore(article) * freshnessWeight;

        // 4. Engagement pattern scoring (weight: 20%)
        score += this.getEngagementScore(article, interactions) * 0.2;

        // 5. Popularity boost (weight: 10%)
        score += this.getPopularityScore(article) * 0.1;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Category-based scoring
     */
    getCategoryScore(article, interactions, preferences) {
        const category = article.category || "";
        let score = 0;

        // Favorite categories
        if (preferences.favoriteCategories.includes(category)) {
            score += 40;
        }

        // Excluded categories
        if (preferences.excludedCategories.includes(category)) {
            return 0;
        }

        // Categories from interaction history
        const categoryInteractions = interactions.filter(i => i.category === category);
        const categoryFrequency = categoryInteractions.length / Math.max(interactions.length, 1);
        score += categoryFrequency * 60;

        return score;
    }

    /**
     * Content-based scoring using search history and viewed content
     */
    getContentScore(article, interactions) {
        let score = 0;
        const articleText = (article.fullText || "").toLowerCase();
        const articleTitle = articleText.split(/\r?\n/)[0] || "";

        // Extract keywords from search history
        const searchInteractions = interactions.filter(i => i.interactionType === "search");
        const searchTerms = searchInteractions.map(i => (i.searchQuery || "").toLowerCase());

        // Score based on search term matches
        searchTerms.forEach(term => {
            if (term && term.length > 2) {
                if (articleTitle.includes(term)) {
                    score += 15;
                } else if (articleText.includes(term)) {
                    score += 8;
                }
            }
        });

        // Extract keywords from viewed articles
        const viewedInteractions = interactions.filter(i => i.interactionType === "view");
        // Simple keyword extraction (in production, use TF-IDF or similar)
        const viewedKeywords = this.extractKeywords(viewedInteractions);

        viewedKeywords.forEach(keyword => {
            if (articleText.includes(keyword)) {
                score += 5;
            }
        });

        return Math.min(score, 100);
    }

    /**
     * Freshness scoring - newer articles get higher scores
     */
    getFreshnessScore(article) {
        if (!article.createdAt) return 0;

        const now = Date.now();
        const articleDate = new Date(article.createdAt).getTime();
        const ageInDays = (now - articleDate) / (1000 * 60 * 60 * 24);

        // Exponential decay: 100 for today, ~50 for 7 days, ~25 for 30 days
        return 100 * Math.exp(-ageInDays / 10);
    }

    /**
     * Engagement pattern scoring
     */
    getEngagementScore(article, interactions) {
        let score = 0;
        const category = article.category || "";

        // Find interactions in the same category
        const categoryInteractions = interactions.filter(i => i.category === category);

        // Calculate average engagement time for this category
        const avgEngagementTime = categoryInteractions.reduce(
            (sum, i) => sum + (i.engagementTime || 0),
            0
        ) / Math.max(categoryInteractions.length, 1);

        // Higher engagement time = more interest
        // Normalize to 0-100 (assuming 300 seconds is very high engagement)
        score = Math.min((avgEngagementTime / 300) * 100, 100);

        return score;
    }

    /**
     * Popularity scoring based on overall interactions
     */
    getPopularityScore(article) {
        // This would ideally query interaction counts for this article
        // For now, return a neutral score
        return 50;
    }

    /**
     * Apply diversity to recommendations
     */
    applyDiversity(scoredArticles, diversityLevel) {
        if (diversityLevel < 0.3) return scoredArticles;

        const diversified = [];
        const usedCategories = new Set();

        // First pass: pick top articles from different categories
        for (const item of scoredArticles.sort((a, b) => b.score - a.score)) {
            const category = item.article.category || "general";

            if (!usedCategories.has(category) || diversityLevel < 0.5) {
                diversified.push(item);
                usedCategories.add(category);
            }

            if (diversified.length >= scoredArticles.length * 0.7) break;
        }

        // Second pass: fill remaining slots with highest scores
        const remaining = scoredArticles.filter(item => !diversified.includes(item));
        diversified.push(...remaining);

        return diversified;
    }

    /**
     * Generate human-readable reasons for recommendation
     */
    generateReasons(article, interactions, preferences) {
        const reasons = [];
        const category = article.category || "";

        // Check favorite categories
        if (preferences.favoriteCategories.includes(category)) {
            reasons.push("From your favorite categories");
        }

        // Check search history
        const searchInteractions = interactions.filter(i => i.interactionType === "search");
        const articleText = (article.fullText || "").toLowerCase();
        const matchedSearch = searchInteractions.find(i =>
            articleText.includes((i.searchQuery || "").toLowerCase())
        );

        if (matchedSearch) {
            reasons.push(`Matches your search: "${matchedSearch.searchQuery}"`);
        }

        // Check category frequency
        const categoryCount = interactions.filter(i => i.category === category).length;
        if (categoryCount > 3) {
            reasons.push("Popular in your reading history");
        }

        // Check freshness
        if (article.createdAt) {
            const ageInDays = (Date.now() - new Date(article.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays < 7) {
                reasons.push("Recently published");
            }
        }

        // Default reason
        if (reasons.length === 0) {
            reasons.push("Recommended for you");
        }

        return reasons;
    }

    /**
     * Extract keywords from interactions (simple implementation)
     */
    extractKeywords(interactions) {
        const keywords = new Set();
        const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"]);

        interactions.forEach(interaction => {
            if (interaction.searchQuery) {
                const words = interaction.searchQuery.toLowerCase().split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3 && !stopWords.has(word)) {
                        keywords.add(word);
                    }
                });
            }
        });

        return Array.from(keywords).slice(0, 20);
    }

    /**
     * Get user preferences (create default if not exists)
     */
    async getUserPreferences(userId) {
        let preferences = await UserPreference.findOne({ userId });

        if (!preferences) {
            preferences = await UserPreference.create({
                userId,
                favoriteCategories: [],
                interests: [],
                excludedCategories: [],
                excludedArticles: [],
                recommendationSettings: {
                    diversityLevel: 0.5,
                    freshnessWeight: 0.3,
                    showReasonings: true,
                    maxRecommendations: 5,
                },
            });
        }

        return preferences;
    }

    /**
     * Get user interaction history
     */
    async getUserInteractions(userId, limit = 100) {
        return await UserInteraction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Get all available articles
     */
    async getAllArticles() {
        const [generalArticles, vcArticles] = await Promise.all([
            NewsfeedGeneral.find({ status: "approved" }).lean(),
            NewsfeedVC.find({ status: "approved" }).lean(),
        ]);

        return [...generalArticles, ...vcArticles];
    }
}

module.exports = new RecommendationEngine();
