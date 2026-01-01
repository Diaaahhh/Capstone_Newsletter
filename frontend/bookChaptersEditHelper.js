// bookChaptersEditHelper.js
// If user came from "Edit & Resubmit" on a rejected submission,
// pre-fill the createBookChapters form with previous values.

document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("bookChaptersEditData");
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse bookChaptersEditData:", err);
    return;
  }

  const formData = payload.formData || {};

  // Safely set each field if it exists in DOM
  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el && typeof value === "string") {
      el.value = value;
    }
  };

  setValue("authors", formData.authors || "");
  setValue("year", formData.year || "");
  setValue("chapterTitle", formData.chapterTitle || "");
  setValue("bookName", formData.bookName || "");
  setValue("volumeNumber", formData.volumeNumber || "");
  setValue("pageRange", formData.pageRange || "");
  setValue("editors", formData.editors || "");
  setValue("publisher", formData.publisher || "");
  setValue("doi", formData.doi || "");

  // চাইলে উপরে একটা ছোট মেসেজ দেখাতে পারো:
  const form = document.getElementById("createBookChapterForm");
  if (form) {
    const info = document.createElement("div");
    info.className = "alert alert-info mb-3";
    info.textContent =
      "You are editing a previously rejected submission. Please update and submit again.";
    form.parentNode.insertBefore(info, form);
  }

  // একবার ব্যবহার হয়ে গেলে data clear করে দিতে পারো
  // যাতে পরের বার fresh form আসে
  localStorage.removeItem("bookChaptersEditData");
});
