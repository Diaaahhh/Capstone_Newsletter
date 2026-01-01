// frontend/uploadUtils.js

const UPLOAD_API_URL = "http://localhost:5000/api/upload";

/**
 * Uploads a file to Cloudinary via the backend.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch(UPLOAD_API_URL, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Failed to upload image");
        }

        const data = await res.json();
        return data.url;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
}
