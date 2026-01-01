// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student",
    },

    // 🔹 Profile Image
    profileImage: {
      type: String,
      default: "",
    },

    // 🔹 Common fields
    department: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Student-specific fields
    cgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4.0,
    },
    semester: {
      type: String,
      default: "",
      trim: true,
    },
    graduateYear: {
      type: Number,
      default: null,
    },
    registrationId: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Faculty-specific fields
    initials: {
      type: String,
      default: "",
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },

    // 🔹 Admin request fields (for faculty → admin promotion)
    adminRequestStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "none",
    },
    requestedAdminAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving user
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Determine role based on email domain
userSchema.statics.determineRole = function (email) {
  if (email === "admin@ewubd.edu") {
    return "admin";
  } else if (
    email.endsWith("@ewubd.edu") &&
    !email.endsWith("@std.ewubd.edu")
  ) {
    return "faculty";
  } else if (email.endsWith("@std.ewubd.edu")) {
    return "student";
  } else {
    return "student"; // default role
  }
};

module.exports = mongoose.model("User", userSchema);
