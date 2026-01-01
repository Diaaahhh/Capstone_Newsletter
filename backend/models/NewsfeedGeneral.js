// backend/models/NewsfeedGeneral.js
const mongoose = require("mongoose");

const NewsfeedGeneralSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    fullText: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    relatedSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsfeedGeneral", NewsfeedGeneralSchema);
