// backend/controllers/authController.js
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { id, name, email, password, applyForAdmin } = req.body;

    // Basic validation
    if (!id || !name || !email || !password) {
      return res
        .status(400)
        .json({ message: "id, name, email and password are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // -----------------------------------------
    // ROLE DECISION BASED ON EMAIL DOMAIN
    // -----------------------------------------
    let role = "student";
    const lowerEmail = email.toLowerCase();

    if (typeof User.determineRole === "function") {
      role = User.determineRole(lowerEmail);
    } else {
      if (lowerEmail === "admin@ewubd.edu") {
        role = "admin";
      } else if (
        lowerEmail.endsWith("@ewubd.edu") &&
        !lowerEmail.endsWith("@std.ewubd.edu")
      ) {
        role = "faculty";
      } else if (lowerEmail.endsWith("@std.ewubd.edu")) {
        role = "student";
      } else {
        return res.status(400).json({
          message:
            "Email must be an institutional address (@std.ewubd.edu or @ewubd.edu)",
        });
      }
    }

    // -----------------------------------------
    // CREATE USER
    // -----------------------------------------
    const user = await User.create({
      id,
      name,
      email: lowerEmail,
      password,
      role,
    });

    // -----------------------------------------
    // OPTIONAL: FACULTY APPLIES FOR ADMIN
    // -----------------------------------------
    if (user.role === "faculty" && applyForAdmin) {
      user.adminRequestStatus = "pending";
      user.requestedAdminAt = new Date();
      await user.save();

      // Notification for all admins (shared "admins" channel)
      await Notification.create({
        to: "admins",
        type: "admin_request",
        title: "Admin Role Request",
        message: `${name} (${lowerEmail}) has requested admin access.`,
        requestUserId: user._id,
        requestStatus: "pending",
      });
    }

    if (user) {
      return res.status(201).json({
        _id: user._id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // Assuming your User model has comparePassword
    if (user && (await user.comparePassword(password))) {
      return res.json({
        _id: user._id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;
    
    // Return complete profile with all fields
    return res.status(200).json({
      _id: user._id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || "",
      department: user.department || "",
      // Student fields
      cgpa: user.cgpa || 0,
      semester: user.semester || "",
      graduateYear: user.graduateYear || null,
      registrationId: user.registrationId || "",
      // Faculty fields
      initials: user.initials || "",
      designation: user.designation || "",
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
