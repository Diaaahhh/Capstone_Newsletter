
// controllers/draftController.js
const Draft = require("../models/Draft");
// Create a new draft
exports.createDraft = async (req, res) => {
  try {
    const { category, formData, createdBy } = req.body;

    if (!category || !formData || !createdBy) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newDraft = new Draft({
      category,
      formData,
      createdBy,
      createdAt: new Date(),
    });

    await newDraft.save();
    res.status(201).json({ message: "Draft saved successfully", draft: newDraft });
  } catch (error) {
    console.error(" Error saving draft:", error);
    res.status(500).json({ message: "Server error while saving draft" });
  }
};

// Get all drafts for a user (optionally filtered by category / categories)
exports.getAllDrafts = async (req, res) => {
  try {
    const { createdBy, category, categories } = req.query;
    const filter = {};

    if (createdBy) {
      filter.createdBy = createdBy;
    }

    if (category && category !== "undefined") {
      filter.category = category;
    } else if (categories) {
      const list = categories
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (list.length) {
        filter.category = { $in: list };
      }
    }

    const drafts = await Draft.find(filter).sort({ createdAt: -1 });
    res.status(200).json(drafts);
  } catch (error) {
    console.error(" Error fetching drafts:", error);
    res.status(500).json({ message: "Failed to fetch drafts" });
  }
};

// Get a single draft by ID (Reopen draft)
exports.getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await Draft.findById(id);

    if (!draft) {
      return res.status(404).json({ message: "Draft not found." });
    }

    res.status(200).json(draft);
  } catch (error) {
    console.error(" Error fetching draft:", error);
    res.status(500).json({ message: "Failed to fetch draft." });
  }
};

//  Delete a draft
exports.deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    await Draft.findByIdAndDelete(id);
    res.json({ message: "🗑️ Draft deleted successfully." });
  } catch (err) {
    console.error(" Error deleting draft:", err);
    res.status(500).json({ message: "Failed to delete draft." });
  }
};