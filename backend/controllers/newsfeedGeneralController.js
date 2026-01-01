// backend/controllers/newsfeedGeneralController.js
const NewsfeedGeneral = require("../models/NewsfeedGeneral");
const Submission = require("../models/Submission");

/**
 * GET /api/newsfeedgeneral?category=achievements&startDate=2024-01-01&endDate=2024-12-31
 * Returns ONLY items whose related submission is "Accepted"
 * Supports date range filtering and category filtering
 */
exports.getGeneralNewsfeed = async (req, res) => {
  try {
    const matchStage = {};

    // Category filter
    if (req.query.category) {
      matchStage.category = req.query.category;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      matchStage.createdAt = {};
      if (req.query.startDate) {
        matchStage.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Set end date to end of day
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = endDate;
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "submissions",
          localField: "relatedSubmission",
          foreignField: "_id",
          as: "submission",
        },
      },
      {
        $unwind: {
          path: "$submission",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "submission.status": "Accepted",
        },
      },
      {
        $project: {
          submission: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      // Remove limit to allow fetching all items in date range
    ];

    const items = await NewsfeedGeneral.aggregate(pipeline);
    return res.json(items);
  } catch (err) {
    console.error("Error fetching General newsfeed:", err);
    return res.status(500).json({
      message: "Server error fetching General newsfeed",
    });
  }
};

/**
 * PUT /api/newsfeedgeneral/:id
 * Body: { fullText?, image?, category? }
 * (No DOI here)
 */
exports.updateGeneralNewsItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullText, image, category } = req.body;

    const update = {};
    if (typeof fullText === "string") update.fullText = fullText;
    if (typeof image === "string") update.image = image;
    if (typeof category === "string") update.category = category;

    const item = await NewsfeedGeneral.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!item) {
      return res.status(404).json({ message: "Newsfeed item not found" });
    }

    return res.json({ message: "Newsfeed item updated", item });
  } catch (err) {
    console.error("Error updating General newsfeed item:", err);
    return res.status(500).json({
      message: "Server error updating General newsfeed item",
    });
  }
};

/**
 * DELETE /api/newsfeedgeneral/:id
 */
exports.deleteGeneralNewsItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await NewsfeedGeneral.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Newsfeed item not found" });
    }

    return res.json({ message: "Newsfeed item deleted" });
  } catch (err) {
    console.error("Error deleting General newsfeed item:", err);
    return res.status(500).json({
      message: "Server error deleting General newsfeed item",
    });
  }
};
