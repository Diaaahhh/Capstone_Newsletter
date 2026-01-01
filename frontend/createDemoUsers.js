const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

// Load environment variables
require("dotenv").config();

// Demo user data
const demoUsers = [
  {
    id: "ADMIN001",
    name: "Admin User",
    email: "admin@ewubd.edu",
    password: "admin123",
    role: "admin",
  },
  {
    id: "FAC001",
    name: "Faculty User",
    email: "faculty@ewubd.edu",
    password: "faculty123",
    role: "faculty",
  },
  {
    id: "STU001",
    name: "Student User",
    email: "student@std.ewubd.edu",
    password: "student123",
    role: "student",
  },
  {
    id: "GEN001",
    name: "General User",
    email: "general@gmail.com",
    password: "general123",
    role: "student", // Default role for non-university emails
  },
];

const createDemoUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log("Creating demo users...");

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User with email ${userData.email} already exists`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user with hashed password
      const user = new User({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });

      await user.save();
      console.log(`Created ${userData.role} user: ${userData.email}`);
    }

    console.log("Demo users created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating demo users:", error);
    process.exit(1);
  }
};

createDemoUsers();
