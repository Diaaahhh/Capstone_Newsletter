const fs = require('fs');
const path = require('path');

console.log("🔍 Verifying Environment Setup...");

// 1. Check Node Modules
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log("✅ Root node_modules found.");
} else {
    console.error("❌ Root node_modules MISSING. Run 'npm install'.");
}

if (fs.existsSync(path.join(__dirname, 'backend', 'node_modules'))) {
    console.warn("⚠️  backend/node_modules found. You should remove this to avoid conflicts: 'rm -rf backend/node_modules'");
}

// 2. Check Backend Config
const cloudinaryConfigPath = path.join(__dirname, 'backend', 'config', 'cloudinary.js');
if (fs.existsSync(cloudinaryConfigPath)) {
    console.log("✅ Cloudinary config found.");
    try {
        require(cloudinaryConfigPath);
        console.log("✅ Cloudinary config syntax is valid.");
    } catch (e) {
        console.error("❌ Cloudinary config syntax error:", e.message);
    }
} else {
    console.error("❌ backend/config/cloudinary.js MISSING.");
}

// 3. Check Server File
const serverPath = path.join(__dirname, 'backend', 'server.js');
if (fs.existsSync(serverPath)) {
    console.log("✅ server.js found.");
    try {
        // Just check syntax by reading, requiring might start server
        const content = fs.readFileSync(serverPath, 'utf8');
        if (content.includes('require("./routes/uploadRoutes")')) {
            console.log("✅ uploadRoutes registered in server.js");
        } else {
            console.error("❌ uploadRoutes NOT registered in server.js");
        }
    } catch (e) {
        console.error("❌ Error reading server.js:", e.message);
    }
}

console.log("\nVerification Complete. If all checks passed, run 'node backend/server.js' to start.");
