// backend/controllers/adminRequestController.js
const User = require("../models/User");
const Notification = require("../models/Notification");

// GET /api/admin-requests
// (optional) not strictly needed if we handle everything via notifications
exports.getAdminRequests = async (req, res) => {
  try {
    const requests = await User.find({
      adminRequestStatus: "pending",
      role: "faculty",
    }).select("name email id requestedAdminAt");

    res.json(requests);
  } catch (err) {
    console.error("getAdminRequests error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin-requests/handle/:userId
// body: { action: "accept" | "reject", notifId }
exports.handleAdminRequest = async (req, res) => {
  try {
    const adminActorEmail = req.user.email; // from auth middleware
    const { userId } = req.params;
    const { action, notifId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // prevent double-handling
    if (user.adminRequestStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "This request was already handled" });
    }

    // find original request notification if provided
    let notif = null;
    if (notifId) {
      notif = await Notification.findById(notifId);
    }

    // ACCEPT
    if (action === "accept") {
      user.role = "admin";
      user.adminRequestStatus = "accepted";
      await user.save();

      if (notif) {
        notif.requestStatus = "accepted";
        notif.message = `Admin access request accepted by ${adminActorEmail}`;
        await notif.save();
      }

      // notify the faculty
      await Notification.create({
        to: user.email,
        type: "generic",
        title: "Admin Access Approved",
        message: "Your request for admin access was approved.",
      });

      // notify other admins via shared channel
      await Notification.create({
        to: "admins",
        type: "generic",
        title: "Admin Request Handled",
        message: `${user.email}'s admin request was accepted by ${adminActorEmail}.`,
      });

      return res.json({ message: "Admin access granted" });
    }

    // REJECT
    if (action === "reject") {
      user.adminRequestStatus = "rejected";
      await user.save();

      if (notif) {
        notif.requestStatus = "rejected";
        notif.message = `Admin access request rejected by ${adminActorEmail}`;
        await notif.save();
      }

      await Notification.create({
        to: user.email,
        type: "generic",
        title: "Admin Access Rejected",
        message: "Your request for admin access was rejected.",
      });

      await Notification.create({
        to: "admins",
        type: "generic",
        title: "Admin Request Handled",
        message: `${user.email}'s admin request was rejected by ${adminActorEmail}.`,
      });

      return res.json({ message: "Admin request rejected" });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("handleAdminRequest error:", err);
    res.status(500).json({ message: err.message });
  }
};
