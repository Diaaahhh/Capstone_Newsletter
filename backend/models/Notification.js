// backend/models/Notification.js
const mongoose = require("mongoose");

// Notifications are simple records that point to an action and to whom it pertains.
const notificationSchema = new mongoose.Schema(
  {
    // "admins" for all admins OR specific user email
    to: { type: String, required: true },

    // Optional: admin/student/etc (you can use later)
    forUserType: { type: String, default: "" },

    title: { type: String, required: true },   // short title
    message: { type: String, required: true }, // detailed message

    // 🔥 For admin role requests
    type: {
      type: String,
      enum: ["generic", "admin_request"],
      default: "generic",
    },

    // The faculty who requested admin
    requestUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Status of that request
    requestStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected", null],
      default: null,
    },

    // Optional link to a submission (your old field, kept)
    relatedSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },

    // Fields for linking to specific articles
    relatedArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewsfeedGeneral",
      default: null,
    },
    
    relatedArticleCategory: {
      type: String,
      default: null,
    },

    isRead: { type: Boolean, default: false }, // read/unread flag
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
