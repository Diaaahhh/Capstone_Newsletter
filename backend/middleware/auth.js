// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------------------
// VERIFY JWT TOKEN (Protect Route)
// ------------------------------
const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ------------------------------
// ONLY ADMIN CAN ACCESS
// ------------------------------
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// ------------------------------
// ONLY FACULTY CAN ACCESS
// ------------------------------
const facultyAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "faculty") {
    return res.status(403).json({ message: "Faculty access required" });
  }
  next();
};

module.exports = {
  auth,
  adminAuth,
  facultyAuth,
};
