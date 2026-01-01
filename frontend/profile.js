// frontend/profile.js

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");
    const userRole = localStorage.getItem("userRole");

    // Check if user is logged in (either with token or localStorage data)
    if (!token && !userEmail) {
        window.location.href = "loginPage.html";
        return;
    }

    const API_URL = "http://localhost:5000/api";
    let currentUser = null;

    // Elements
    const profileImageDisplay = document.getElementById("profileImageDisplay");
    const profileInitial = document.getElementById("profileInitial");
    const imageUpload = document.getElementById("imageUpload");
    const uploadZone = document.getElementById("uploadZone");
    const uploadLoading = document.getElementById("uploadLoading");
    const roleBadge = document.getElementById("roleBadge");
    const toastContainer = document.getElementById("toastContainer");

    // Sections
    const studentSection = document.getElementById("studentSection");
    const facultySection = document.getElementById("facultySection");
    const adminSection = document.getElementById("adminSection");

    // Save buttons
    const saveBtn = document.getElementById("saveBtn");
    const saveBtnFaculty = document.getElementById("saveBtnFaculty");
    const saveBtnAdmin = document.getElementById("saveBtnAdmin");

    // ===========================
    // Toast Notification System
    // ===========================
    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill";
        const title = type === "success" ? "Success" : "Error";

        toast.innerHTML = `
            <i class="bi ${icon} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===========================
    // Fetch User Profile
    // ===========================
    try {
        if (token) {
            // Try to fetch from API if token exists
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch profile: ${res.status}`);
            }

            currentUser = await res.json();
        } else {
            // Fallback to localStorage data if no token
            console.log("Using localStorage fallback data");
            currentUser = {
                email: userEmail,
                role: userRole || determineRoleFromEmail(userEmail),
                name: localStorage.getItem("userName") || "User",
                id: localStorage.getItem("userId") || userEmail.split('@')[0],
                department: "",
                cgpa: 0,
                semester: "",
                graduateYear: null,
                registrationId: "",
                initials: "",
                designation: "",
                profileImage: ""
            };
        }

        renderProfile(currentUser);
    } catch (error) {
        console.error("Profile fetch error:", error);

        // Use localStorage fallback on error
        if (userEmail) {
            console.log("API failed, using localStorage fallback");
            currentUser = {
                email: userEmail,
                role: userRole || determineRoleFromEmail(userEmail),
                name: localStorage.getItem("userName") || "User",
                id: localStorage.getItem("userId") || userEmail.split('@')[0],
                department: "",
                cgpa: 0,
                semester: "",
                graduateYear: null,
                registrationId: "",
                initials: "",
                designation: "",
                profileImage: ""
            };
            renderProfile(currentUser);
            showToast("Using offline mode - some features may be limited", "error");
        } else {
            showToast(`Error loading profile: ${error.message}`, "error");
        }
    }

    // ===========================
    // Determine Role from Email
    // ===========================
    function determineRoleFromEmail(email) {
        const lowerEmail = email.toLowerCase();
        if (lowerEmail === "admin@ewubd.edu") {
            return "admin";
        } else if (lowerEmail.endsWith("@ewubd.edu") && !lowerEmail.endsWith("@std.ewubd.edu")) {
            return "faculty";
        } else if (lowerEmail.endsWith("@std.ewubd.edu")) {
            return "student";
        }
        return "student"; // default
    }

    // ===========================
    // Render Profile Data
    // ===========================
    function renderProfile(user) {
        // Set profile image or initial
        if (user.profileImage) {
            const imgSrc = user.profileImage.startsWith("http")
                ? user.profileImage
                : `http://localhost:5000${user.profileImage}`;
            profileImageDisplay.innerHTML = `<img src="${imgSrc}" alt="Profile" />`;
        } else {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";
            profileInitial.textContent = initial;
        }

        // Set role badge
        roleBadge.textContent = user.role.toUpperCase();
        roleBadge.className = `role-badge ${user.role}`;

        // Hide all sections first
        studentSection.classList.remove("active");
        facultySection.classList.remove("active");
        adminSection.classList.remove("active");

        // Show based on role
        if (user.role === "student") {
            studentSection.classList.add("active");
            document.getElementById("studentName").value = user.name || "";
            document.getElementById("studentEmail").value = user.email || "";
            document.getElementById("studentId").value = user.id || "";
            document.getElementById("studentDept").value = user.department || "";
            document.getElementById("studentCgpa").value = user.cgpa || "";
            document.getElementById("studentSemester").value = user.semester || "";
            document.getElementById("studentGradYear").value = user.graduateYear || "";

        } else if (user.role === "faculty") {
            facultySection.classList.add("active");
            document.getElementById("facultyInitials").value = user.initials || "";
            document.getElementById("facultyName").value = user.name || "";
            document.getElementById("facultyEmail").value = user.email || "";
            document.getElementById("facultyDept").value = user.department || "";
            document.getElementById("facultyDesignation").value = user.designation || "";

        } else if (user.role === "admin") {
            adminSection.classList.add("active");
            document.getElementById("adminName").value = user.name || "";
            document.getElementById("adminEmail").value = user.email || "";
            document.getElementById("adminDept").value = user.department || "";
        }
    }

    // ===========================
    // Edit Button Functionality
    // ===========================
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const input = document.getElementById(targetId);
            input.disabled = !input.disabled;

            if (!input.disabled) {
                input.focus();
                // Enable appropriate save button
                if (currentUser && currentUser.role === "student") {
                    saveBtn.disabled = false;
                } else if (currentUser && currentUser.role === "faculty") {
                    saveBtnFaculty.disabled = false;
                } else if (currentUser && currentUser.role === "admin") {
                    saveBtnAdmin.disabled = false;
                }
            }
        });
    });

    // ===========================
    // Save Profile Changes
    // ===========================
    async function saveProfile() {
        if (!currentUser) return;

        const updates = {};
        let isValid = true;

        if (currentUser.role === "student") {
            updates.name = document.getElementById("studentName").value.trim();
            updates.department = document.getElementById("studentDept").value.trim();

            const cgpa = parseFloat(document.getElementById("studentCgpa").value);
            if (isNaN(cgpa) || cgpa < 0 || cgpa > 4.00) {
                showToast("CGPA must be between 0.00 and 4.00", "error");
                isValid = false;
            } else {
                updates.cgpa = cgpa;
            }

            updates.semester = document.getElementById("studentSemester").value.trim();

            const gradYear = document.getElementById("studentGradYear").value;
            if (gradYear) {
                if (gradYear.length !== 4 || isNaN(gradYear)) {
                    showToast("Graduate Year must be a 4-digit year", "error");
                    isValid = false;
                } else {
                    updates.graduateYear = parseInt(gradYear);
                }
            } else {
                updates.graduateYear = null;
            }

        } else if (currentUser.role === "faculty") {
            updates.name = document.getElementById("facultyName").value.trim();
            updates.initials = document.getElementById("facultyInitials").value.trim();
            updates.designation = document.getElementById("facultyDesignation").value.trim();
            updates.department = document.getElementById("facultyDept").value.trim();

        } else if (currentUser.role === "admin") {
            updates.name = document.getElementById("adminName").value.trim();
            updates.department = document.getElementById("adminDept").value.trim();
        }

        if (!isValid) return;

        if (!token) {
            showToast("Cannot save in offline mode. Please log in.", "error");
            return;
        }

        // Get the appropriate save button
        let activeSaveBtn = saveBtn;
        if (currentUser.role === "faculty") activeSaveBtn = saveBtnFaculty;
        if (currentUser.role === "admin") activeSaveBtn = saveBtnAdmin;

        activeSaveBtn.disabled = true;
        activeSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        try {
            const res = await fetch(`${API_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to update profile");
            }

            const updatedUser = await res.json();
            showToast("Profile updated successfully!", "success");

            // Disable all inputs again
            document.querySelectorAll(".form-input:not([type='email'])").forEach(input => {
                if (input.id !== "studentEmail" && input.id !== "facultyEmail" && input.id !== "adminEmail" && input.id !== "studentId") {
                    input.disabled = true;
                }
            });

            // Update local state
            currentUser = updatedUser;

            // Update localStorage
            localStorage.setItem("userName", updatedUser.name);

        } catch (error) {
            console.error(error);
            showToast(error.message || "Error updating profile", "error");
        } finally {
            activeSaveBtn.disabled = true;
            activeSaveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
        }
    }

    // Attach save handlers
    if (saveBtn) saveBtn.addEventListener("click", saveProfile);
    if (saveBtnFaculty) saveBtnFaculty.addEventListener("click", saveProfile);
    if (saveBtnAdmin) saveBtnAdmin.addEventListener("click", saveProfile);

    // ===========================
    // Image Upload - Click
    // ===========================
    uploadZone.addEventListener("click", () => {
        imageUpload.click();
    });

    imageUpload.addEventListener("change", async function () {
        const file = this.files[0];
        if (file) {
            await uploadImage(file);
        }
    });

    // ===========================
    // Image Upload - Drag & Drop
    // ===========================
    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    });

    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("dragover");
    });

    uploadZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        if (file) {
            // Validate file type
            if (!file.type.match(/image\/(jpe?g|png)/)) {
                showToast("Please upload only JPG or PNG images", "error");
                return;
            }
            await uploadImage(file);
        }
    });

    // ===========================
    // Upload Image Function
    // ===========================
    async function uploadImage(file) {
        // Validate file type
        if (!file.type.match(/image\/(jpe?g|png)/)) {
            showToast("Please upload only JPG or PNG images", "error");
            return;
        }

        if (!token) {
            showToast("Cannot upload image in offline mode. Please log in.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        uploadLoading.classList.add("active");

        try {
            // 1. Upload to Cloudinary via generic route
            const uploadRes = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                throw new Error(`Server responded with ${uploadRes.status}: ${errorText}`);
            }
            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.url;

            // 2. Save URL to User Profile
            const updateRes = await fetch(`${API_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ profileImage: imageUrl }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile with image");

            // Update UI
            profileImageDisplay.innerHTML = `<img src="${imageUrl}" alt="Profile" />`;
            showToast("Profile picture updated!", "success");

        } catch (error) {
            console.error(error);
            showToast(`Error uploading image: ${error.message}`, "error");
        } finally {
            uploadLoading.classList.remove("active");
        }
    }
});
