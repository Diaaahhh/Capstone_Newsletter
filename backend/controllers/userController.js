// backend/controllers/userController.js
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Common fields
        if (req.body.name !== undefined) {
            user.name = req.body.name.trim();
        }
        if (req.body.department !== undefined) {
            user.department = req.body.department.trim();
        }
        if (req.body.profileImage !== undefined) {
            user.profileImage = req.body.profileImage;
        }

        // Student-specific fields
        if (user.role === 'student') {
            if (req.body.cgpa !== undefined) {
                const cgpa = Number(req.body.cgpa);
                if (isNaN(cgpa)) {
                    return res.status(400).json({ message: "CGPA must be a number" });
                }
                if (cgpa < 0 || cgpa > 4.0) {
                    return res.status(400).json({ message: "CGPA must be between 0.00 and 4.00" });
                }
                user.cgpa = cgpa;
            }
            if (req.body.semester !== undefined) {
                user.semester = req.body.semester.trim();
            }
            if (req.body.graduateYear !== undefined) {
                if (req.body.graduateYear === "" || req.body.graduateYear === null) {
                    user.graduateYear = null;
                } else {
                    const gradYear = Number(req.body.graduateYear);
                    if (isNaN(gradYear)) {
                        return res.status(400).json({ message: "Graduate year must be a number" });
                    }
                    if (gradYear < 1900 || gradYear > 2100) {
                        return res.status(400).json({ message: "Graduate year must be a valid 4-digit year" });
                    }
                    user.graduateYear = gradYear;
                }
            }
            if (req.body.registrationId !== undefined) {
                user.registrationId = req.body.registrationId.trim();
            }
        }

        // Faculty-specific fields
        if (user.role === 'faculty') {
            if (req.body.initials !== undefined) {
                user.initials = req.body.initials.trim();
            }
            if (req.body.designation !== undefined) {
                user.designation = req.body.designation.trim();
            }
        }

        const updatedUser = await user.save();

        // Return complete profile
        res.json({
            _id: updatedUser._id,
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            profileImage: updatedUser.profileImage,
            // Student fields
            cgpa: updatedUser.cgpa,
            semester: updatedUser.semester,
            graduateYear: updatedUser.graduateYear,
            registrationId: updatedUser.registrationId,
            // Faculty fields
            initials: updatedUser.initials,
            designation: updatedUser.designation,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(req.user._id);

        if (user) {
            // Delete old image if exists and not default
            if (user.profileImage && !user.profileImage.startsWith('http')) {
                const oldImagePath = path.join(__dirname, '..', user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save relative path
            user.profileImage = `/uploads/${req.file.filename}`;
            await user.save();

            res.json({
                message: "Image uploaded successfully",
                profileImage: user.profileImage
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Upload image error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    updateUserProfile,
    uploadProfileImage
};
