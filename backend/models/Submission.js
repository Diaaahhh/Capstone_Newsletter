// backend/models/Submission.js
const mongoose = require("mongoose");

// Shared "Submission" collection — stores items submitted for review.
// We keep formData as an object to support different fields across categories.
const submissionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },   // which category (Major Event, Achievement, etc.)
    formData: { type: Object, required: true },   // entire form payload
    createdBy: { type: String, required: true },  // user id or email who submitted
    status: {                                     // current status for the submission
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    adminComment: { type: String, default: "" },  // optional admin comment when approving/rejecting
    reviewedBy: { type: String, default: "" },    // admin id/email who reviewed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
