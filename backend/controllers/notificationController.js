// backend/controllers/notificationController.js
const Notification = require("../models/Notification");

/**
 * Create a notification (rarely used directly; mostly created by other controllers)
 * POST /notifications
 * body: { to, title, message, relatedSubmissionId, type, requestUserId, requestStatus }
 */
exports.createNotification = async (req, res) => {
  try {
    const {
      to,
      title,
      message,
      relatedSubmissionId,
      relatedArticleId,
      relatedArticleCategory,
      type,
      requestUserId,
      requestStatus,
    } = req.body;

    if (!to || !title || !message)
      return res
        .status(400)
        .json({ message: "to, title and message required" });

    const n = new Notification({
      to,
      title,
      message,
      relatedSubmissionId: relatedSubmissionId || undefined,
      relatedArticleId: relatedArticleId || undefined,
      relatedArticleCategory: relatedArticleCategory || undefined,
      type: type || "generic",
      requestUserId: requestUserId || null,
      requestStatus: requestStatus || null,
    });

    await n.save();
    return res
      .status(201)
      .json({ message: "Notification created", notificationId: n._id });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res
      .status(500)
      .json({ message: "Server error creating notification" });
  }
};

/**
 * Get notifications for a user
 * GET /notifications?to=user@example.com
 */
exports.getNotifications = async (req, res) => {
  try {
    const { to, unreadOnly } = req.query;
    if (!to)
      return res.status(400).json({ message: "query param 'to' is required" });

    const filter = { to };
    if (unreadOnly === "true") filter.isRead = false;

    const list = await Notification.find(filter).sort({ createdAt: -1 });
    return res.json(list);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res
      .status(500)
      .json({ message: "Server error fetching notifications" });
  }
};

/**
 * Mark notification as read
 * PUT /notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const n = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    return res.json({ message: "Marked as read", notification: n });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return res
      .status(500)
      .json({ message: "Server error updating notification" });
  }
};
