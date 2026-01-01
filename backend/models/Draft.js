// models/Draft.js
const mongoose = require("mongoose");

const DraftSchema = new mongoose.Schema({
  category: { type: String, required: true },
  formData: { type: Object, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Draft", DraftSchema);
