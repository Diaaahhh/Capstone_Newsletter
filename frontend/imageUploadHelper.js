/**
 * Image Upload Helper
 * Provides reusable functions for uploading images to the server
 */

/**
 * Upload an image file to the server
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The URL/path of the uploaded image
 */
window.uploadImage = async function(file) {
   if (!file) {
     throw new Error("No file provided");
   }

   const formData = new FormData();
   formData.append("image", file);

   // Always use localhost:5000 for backend API
   const baseUrl = "http://localhost:5000";

   try {
     const response = await fetch(`${baseUrl}/api/upload`, {
       method: "POST",
       body: formData,
     });

     if (!response.ok) {
       throw new Error(`Upload failed with status ${response.status}`);
     }

     const data = await response.json();
     return data.url; // Returns the path like "/uploads/image-123456.jpg"
   } catch (error) {
     console.error("Image upload error:", error);
     throw error;
   }
}

/**
 * Upload an image from a file input element
 * @param {string} inputId - The ID of the file input element
 * @returns {Promise<string|null>} - The URL/path of the uploaded image, or null if no file selected
 */
window.uploadImageFromInput = async function(inputId) {
  const fileInput = document.getElementById(inputId);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return null;
  }

  const file = fileInput.files[0];
  return await uploadImage(file);
}

/**
 * Show upload progress (optional enhancement)
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Callback function to track progress (0-100)
 * @returns {Promise<string>} - The URL/path of the uploaded image
 */
window.uploadImageWithProgress = async function(file, onProgress) {
   if (!file) {
     throw new Error("No file provided");
   }

   return new Promise((resolve, reject) => {
     const formData = new FormData();
     formData.append("image", file);

     // Always use localhost:5000 for backend API
     const baseUrl = "http://localhost:5000";

     const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch (error) {
          reject(new Error("Failed to parse server response"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.open("POST", `${baseUrl}/api/upload`);
    xhr.send(formData);
  });
}

/**
 * Convert a relative image path to a full URL
 * This function ensures images display correctly by prepending the server base URL
 * to relative paths returned from the upload endpoint.
 *
 * @param {string} imagePath - The image path (can be relative like "/uploads/image.jpg" or already a full URL)
 * @param {string} baseUrl - The base URL of the server (auto-detected from current location if not provided)
 * @returns {string} - The full image URL, or empty string if imagePath is null/undefined
 *
 * @example
 * // Convert relative path to full URL
 * getImageUrl("/uploads/image-123.jpg")
 * // Returns: "http://localhost:5000/uploads/image-123.jpg" (or current origin)
 *
 * @example
 * // Already full URL - returns as-is
 * getImageUrl("http://example.com/image.jpg")
 * // Returns: "http://example.com/image.jpg"
 *
 * @example
 * // Handle null/undefined
 * getImageUrl(null)
 * // Returns: ""
 */
window.getImageUrl = function(imagePath, baseUrl) {
  // Handle null, undefined, or empty string
  if (!imagePath) {
    return "";
  }

  // If already a full URL (http:// or https://), return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Always use localhost:5000 for backend API and uploads
  // This ensures images load correctly regardless of how the frontend is served
  if (!baseUrl) {
    baseUrl = "http://localhost:5000";
  }

  // If it's a relative path starting with /, prepend base URL
  if (imagePath.startsWith("/")) {
    return `${baseUrl}${imagePath}`;
  }

  // If no leading slash, add it before prepending base URL
  return `${baseUrl}/${imagePath}`;
}