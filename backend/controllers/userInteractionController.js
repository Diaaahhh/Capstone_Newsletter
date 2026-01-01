// backend/controllers/userInteractionController.js
const UserInteraction = require("../models/UserInteraction");
const UserPreference = require("../models/UserPreference");
const recommendationEngine = require("../services/recommendationEngine");

/**
 * Track article view
 * POST /api/user/interactions/view
 */
exports.trackView = async (req, res) => {
    try {
        const { userId, articleId, category, engagementTime, metadata } = req.body;

        if (!userId || !articleId) {
            return res.status(400).json({
                success: false,
                message: "userId and articleId are required"
            });
        }

        const interaction = await UserInteraction.create({
            userId,
            articleId,
            interactionType: "view",
            category: category || "",
            engagementTime: engagementTime || 0,
            metadata: metadata || {},
        });

        res.status(201).json({
            success: true,
            message: "View tracked successfully",
            data: interaction,
        });
    } catch (error) {
        console.error("Error tracking view:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track view",
            error: error.message,
        });
    }
};

/**
 * Track search query
 * POST /api/user/interactions/search
 */
exports.trackSearch = async (req, res) => {
    try {
        const { userId, searchQuery, category, metadata } = req.body;

        if (!userId || !searchQuery) {
            return res.status(400).json({
                success: false,
                message: "userId and searchQuery are required",
            });
        }

        const interaction = await UserInteraction.create({
            userId,
            articleId: null, // No specific article for search
            interactionType: "search",
            category: category || "",
            searchQuery,
            metadata: metadata || {},
        });

        res.status(201).json({
            success: true,
            message: "Search tracked successfully",
            data: interaction,
        });
    } catch (error) {
        console.error("Error tracking search:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track search",
            error: error.message,
        });
    }
};

/**
 * Track article click
 * POST /api/user/interactions/click
 */
exports.trackClick = async (req, res) => {
    try {
        const { userId, articleId, category, metadata } = req.body;

        if (!userId || !articleId) {
            return res.status(400).json({
                success: false,
                message: "userId and articleId are required",
            });
        }

        const interaction = await UserInteraction.create({
            userId,
            articleId,
            interactionType: "click",
            category: category || "",
            metadata: metadata || {},
        });

        res.status(201).json({
            success: true,
            message: "Click tracked successfully",
            data: interaction,
        });
    } catch (error) {
        console.error("Error tracking click:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track click",
            error: error.message,
        });
    }
};

/**
 * Track article feedback (like/dislike)
 * POST /api/user/interactions/feedback
 */
exports.trackFeedback = async (req, res) => {
    try {
        const { userId, articleId, feedbackType, category, metadata } = req.body;

        if (!userId || !articleId || !feedbackType) {
            return res.status(400).json({
                success: false,
                message: "userId, articleId, and feedbackType are required",
            });
        }

        if (!["like", "dislike"].includes(feedbackType)) {
            return res.status(400).json({
                success: false,
                message: "feedbackType must be 'like' or 'dislike'",
            });
        }

        const interaction = await UserInteraction.create({
            userId,
            articleId,
            interactionType: feedbackType,
            category: category || "",
            metadata: metadata || {},
        });

        res.status(201).json({
            success: true,
            message: "Feedback tracked successfully",
            data: interaction,
        });
    } catch (error) {
        console.error("Error tracking feedback:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track feedback",
            error: error.message,
        });
    }
};

/**
 * Get user interaction history
 * GET /api/user/interactions/history/:userId
 */
exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, type } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const query = { userId };
        if (type) {
            query.interactionType = type;
        }

        const interactions = await UserInteraction.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: interactions,
            count: interactions.length,
        });
    } catch (error) {
        console.error("Error fetching interaction history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch interaction history",
            error: error.message,
        });
    }
};

/**
 * Save user preferences
 * POST /api/user/preferences
 */
exports.savePreferences = async (req, res) => {
    try {
        const { userId, favoriteCategories, interests, excludedCategories, recommendationSettings } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const updateData = {};
        if (favoriteCategories !== undefined) updateData.favoriteCategories = favoriteCategories;
        if (interests !== undefined) updateData.interests = interests;
        if (excludedCategories !== undefined) updateData.excludedCategories = excludedCategories;
        if (recommendationSettings !== undefined) updateData.recommendationSettings = recommendationSettings;

        const preferences = await UserPreference.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Preferences saved successfully",
            data: preferences,
        });
    } catch (error) {
        console.error("Error saving preferences:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save preferences",
            error: error.message,
        });
    }
};

/**
 * Get user preferences
 * GET /api/user/preferences/:userId
 */
exports.getPreferences = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        let preferences = await UserPreference.findOne({ userId });

        // Create default preferences if not found
        if (!preferences) {
            preferences = await UserPreference.create({
                userId,
                favoriteCategories: [],
                interests: [],
                excludedCategories: [],
                recommendationSettings: {
                    diversityLevel: 0.5,
                    freshnessWeight: 0.3,
                    showReasonings: true,
                    maxRecommendations: 5,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: preferences,
        });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch preferences",
            error: error.message,
        });
    }
};

/**
 * Get personalized recommendations
 * GET /api/recommendations/personalized/:userId
 */
exports.getRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 5 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const recommendations = await recommendationEngine.generateRecommendations(
            userId,
            parseInt(limit)
        );

        res.status(200).json({
            success: true,
            data: recommendations,
            count: recommendations.length,
        });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate recommendations",
            error: error.message,
        });
    }
};

/**
 * Exclude article from recommendations
 * POST /api/user/preferences/exclude
 */
exports.excludeArticle = async (req, res) => {
    try {
        const { userId, articleId } = req.body;

        if (!userId || !articleId) {
            return res.status(400).json({
                success: false,
                message: "userId and articleId are required",
            });
        }

        const preferences = await UserPreference.findOneAndUpdate(
            { userId },
            { $addToSet: { excludedArticles: articleId } },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Article excluded from recommendations",
            data: preferences,
        });
    } catch (error) {
        console.error("Error excluding article:", error);
        res.status(500).json({
            success: false,
            message: "Failed to exclude article",
            error: error.message,
        });
    }
};
