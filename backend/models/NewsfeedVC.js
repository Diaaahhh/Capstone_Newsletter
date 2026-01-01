// backend/models/NewsfeedVC.js
const mongoose = require("mongoose");

// Stores accepted items for VC Newsletter
const newsfeedVCSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },          // e.g. "bookChapters"
    fullText: { type: String, required: true },          // formatted text (Harvard ref / paragraph)
    image: { type: String, default: "" },                // optional image URL/path
    doi: { type: String, default: "" },                  // DOI for VC Newsletter items
    formData: { type: Object },                          // Store original form data (for specific fields like researchTopic)
    createdBy: { type: String, required: true },         // original submitter (email)
    relatedSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
    },                                                   // link back to Submission
    // Journal Metrics Fields
    journalRanking: { type: String, default: "" },       // Q1, Q2, Q3, Q4
    citationCount: { type: Number, default: 0 },         // Number of citations
    impactFactor: { type: Number, default: 0 },          // Journal impact factor
    hIndex: { type: Number, default: 0 },                // Journal h-index
    metricsLastUpdated: { type: Date },                  // When metrics were last fetched
  },
  { timestamps: true }                                   // createdAt, updatedAt
);

module.exports = mongoose.model("NewsfeedVC", newsfeedVCSchema);
