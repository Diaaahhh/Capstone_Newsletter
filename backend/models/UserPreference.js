// backend/models/UserPreference.js
const mongoose = require("mongoose");

const userPreferenceSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        favoriteCategories: {
            type: [String],
            default: [],
        },
        interests: {
            type: [String],
            default: [],
        },
        excludedCategories: {
            type: [String],
            default: [],
        },
        excludedArticles: {
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
        },
        recommendationSettings: {
            diversityLevel: {
                type: Number,
                default: 0.5, // 0 = similar content, 1 = very diverse
                min: 0,
                max: 1,
            },
            freshnessWeight: {
                type: Number,
                default: 0.3, // 0 = ignore recency, 1 = heavily favor new content
                min: 0,
                max: 1,
            },
            showReasonings: {
                type: Boolean,
                default: true,
            },
            maxRecommendations: {
                type: Number,
                default: 5,
                min: 3,
                max: 10,
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("UserPreference", userPreferenceSchema);
