// backend/routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");

// @route   POST /api/upload
// @desc    Upload image/file locally
// @access  Public
router.post("/upload", (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error("Multer error:", err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
            }
            if (err.message === 'Only image files are allowed!') {
                return res.status(400).json({ message: err.message });
            }
            return res.status(500).json({ message: "File upload error" });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            // Return the local path
            const filePath = `/uploads/${req.file.filename}`;
            res.json({ url: filePath });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({ message: "Server error during upload" });
        }
    });
});

module.exports = router;
