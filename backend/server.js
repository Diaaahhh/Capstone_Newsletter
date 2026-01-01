// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");

// ✅ Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env") });

// ✅ Initialize app FIRST
const app = express();

// ✅ Middleware (must come AFTER app is created)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

// CRITICAL: Serve uploads with custom handler to ensure it works
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "uploads", filename);
  console.log(`📁 Attempting to serve: ${filepath}`);
  res.sendFile(filepath, (err) => {
    if (err) {
      console.error(`❌ Error serving file: ${err.message}`);
      res.status(404).send("File not found");
    } else {
      console.log(`✅ Successfully served: ${filename}`);
    }
  });
});

// ✅ Connect MongoDB
connectDB();

// ...


// ✅ Import routes
const draftRoutes = require("./routes/draftRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/auth"); // you already have this
const newsfeedVCRoutes = require("./routes/newsfeedVCRoutes");
const adminRequestRoutes = require("./routes/adminRequestRoutes");
const newsfeedGeneralRoutes = require("./routes/newsfeedGeneralRoutes");
const aiRoutes = require("./routes/aiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const autoFillRoutes = require("./routes/autoFillRoutes"); // DOI Auto-Fill
const journalLookupRoutes = require("./routes/journalLookupRoutes"); // Journal Metrics Lookup
const userInteractionRoutes = require("./routes/userInteractionRoutes"); // Personalized Recommendations



// ✅ Use routes
app.use("/api/drafts", draftRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/newsfeedvc", newsfeedVCRoutes);
app.use("/api/admin-requests", adminRequestRoutes);
app.use("/api/newsfeed-general", newsfeedGeneralRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/autofill", autoFillRoutes); // DOI Auto-Fill API
app.use("/api/journal", journalLookupRoutes); // Journal Metrics Lookup API
app.use("/api/user", userInteractionRoutes); // User Interaction & Recommendations API

// Serve frontend static files (after API routes and uploads)
app.use(express.static(path.join(__dirname, "../frontend")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
