// backend/models/UserInteraction.js
const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        articleId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        interactionType: {
            type: String,
            enum: ["view", "click", "search", "like", "dislike", "share"],
            required: true,
        },
        category: {
            type: String,
            default: "",
            index: true,
        },
        searchQuery: {
            type: String,
            default: "",
        },
        engagementTime: {
            type: Number, // in seconds
            default: 0,
        },
        metadata: {
            type: Object,
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
userInteractionSchema.index({ userId: 1, timestamp: -1 });
userInteractionSchema.index({ userId: 1, category: 1 });
userInteractionSchema.index({ userId: 1, interactionType: 1 });

module.exports = mongoose.model("UserInteraction", userInteractionSchema);
