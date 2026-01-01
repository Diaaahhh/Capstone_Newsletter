// backend/controllers/newsfeedVCController.js
const NewsfeedVC = require("../models/NewsfeedVC");
const Submission = require("../models/Submission");

// GET /api/newsfeedvc?category=bookChapters&startDate=2024-01-01&endDate=2024-12-31
// Returns VC newsletter items, newest first
// ONLY returns items linked to submissions with status: "Accepted"
// Excludes items with status: "Pending" or "Rejected"
// Supports date range filtering
exports.getVCNewsfeed = async (req, res) => {
  try {
    // Use aggregation to join NewsfeedVC with Submission and filter by status
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
      // Match NewsfeedVC items (with optional category and date filters)
      { $match: matchStage },
      // Lookup the related submission
      {
        $lookup: {
          from: "submissions",
          localField: "relatedSubmission",
          foreignField: "_id",
          as: "submission"
        }
      },
      // Unwind the submission array (should be single item)
      {
        $unwind: {
          path: "$submission",
          preserveNullAndEmptyArrays: false // Exclude items without valid submission
        }
      },
      // ONLY include items where submission status is "Accepted"
      {
        $match: {
          "submission.status": "Accepted"
        }
      },
      // Remove the submission field from output (keep only NewsfeedVC fields)
      {
        $project: {
          submission: 0
        }
      },
      // Sort by newest first
      {
        $sort: { createdAt: -1 }
      },
      // Remove limit to allow fetching all items in date range
    ];

    const items = await NewsfeedVC.aggregate(pipeline);
    return res.json(items);
  } catch (err) {
    console.error("Error fetching VC newsfeed:", err);
    return res
      .status(500)
      .json({ message: "Server error fetching VC newsfeed" });
  }
};

// PUT /api/newsfeedvc/:id
// Body can contain: { fullText, image, doi, category }
exports.updateVCNewsItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullText, image, doi, category } = req.body;

    const update = {};
    if (typeof fullText === "string") update.fullText = fullText;
    if (typeof image === "string") update.image = image;
    if (typeof doi === "string") update.doi = doi;
    if (typeof category === "string") update.category = category;

    const item = await NewsfeedVC.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!item) {
      return res.status(404).json({ message: "Newsfeed item not found" });
    }

    return res.json({ message: "Newsfeed item updated", item });
  } catch (err) {
    console.error("Error updating VC newsfeed item:", err);
    return res
      .status(500)
      .json({ message: "Server error updating VC newsfeed item" });
  }
};

// DELETE /api/newsfeedvc/:id
exports.deleteVCNewsItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await NewsfeedVC.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Newsfeed item not found" });
    }

    return res.json({ message: "Newsfeed item deleted" });
  } catch (err) {
    console.error("Error deleting VC newsfeed item:", err);
    return res
      .status(500)
      .json({ message: "Server error deleting VC newsfeed item" });
  }
};
