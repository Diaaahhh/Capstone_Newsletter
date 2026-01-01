// CreateMedia.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createMediaForm");
  const draftBtn = document.querySelector(".draft-btn");
  const API_BASE = "http://localhost:5000/api/drafts";
  const SUBMIT_ENDPOINT = "http://localhost:5000/api/submissions/submit";
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    Toast.warning("You need to be logged in."); window.location.href = "loginPage.html"; return; }
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("new") === "true") { localStorage.removeItem("isEditingDraft"); localStorage.removeItem("currentDraft"); localStorage.removeItem("currentDraftId"); }
  loadDraftData();
  function getFormData() { return { title: document.getElementById("eventTitle")?.value.trim() || "", fullArticle: document.getElementById("fullArticle")?.value.trim() || "", featuredImage: document.getElementById("featuredImage")?.value.trim() || "", date: new Date().toISOString() }; }
  function loadDraftData() { const savedDraft = localStorage.getItem("currentDraft"); const isEditMode = localStorage.getItem("isEditingDraft") === "true"; if (isEditMode && savedDraft) { try { const draft = JSON.parse(savedDraft); const data = draft.formData || draft; if (data.title) document.getElementById("eventTitle").value = data.title; if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle; if (data.featuredImage) document.getElementById("featuredImage").value = data.featuredImage; } catch (err) { console.error("Failed to load draft:", err); } } }
  function populateFormFromData(data = {}) { if (data.title) document.getElementById("eventTitle").value = data.title; if (data.fullArticle) document.getElementById("fullArticle").value = data.fullArticle; }
  if (typeof setupSubmissionView === "function") { setupSubmissionView({ category: "media", onDataReady: populateFormFromData, formElement: form, extraDisableElements: [draftBtn] }); }
  if (form) { form.addEventListener("submit", async function (e) { e.preventDefault(); const formData = getFormData(); if (!formData.title || !formData.fullArticle) { Toast.error("Please fill in all required fields marked with *"); return; } try { const res = await fetch(SUBMIT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "media", formData, createdBy: userEmail }) }); if (!res.ok) throw new Error(`Server error ${res.status}`); Toast.success("Media Content submitted for review!"); localStorage.removeItem("currentDraftId"); localStorage.removeItem("currentDraft"); localStorage.removeItem("isEditingDraft"); form.reset();
        setTimeout(() => {
          window.location.href = "media.html";
        }, 1500); } catch (err) { console.error("Error submitting:", err); Toast.error("Failed to submit. Check your server connection."); } }); }
  if (draftBtn) { draftBtn.addEventListener("click", async function (e) { e.preventDefault(); e.stopPropagation(); if (form) form.noValidate = true; const formData = getFormData(); try { const currentDraftId = localStorage.getItem("currentDraftId"); const isEditMode = localStorage.getItem("isEditingDraft") === "true" && currentDraftId; if (isEditMode) { try { await fetch(`${API_BASE}/${currentDraftId}`, { method: "DELETE" }); } catch (err) { console.warn("Could not delete old draft:", err); } localStorage.removeItem("isEditingDraft"); localStorage.removeItem("currentDraft"); localStorage.removeItem("currentDraftId"); } const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: "media", formData, createdBy: userEmail }) }); if (!res.ok) throw new Error(`Server error ${res.status}`); Toast.success("Draft saved successfully!");
        setTimeout(() => {
          window.location.href = "drafts.html";
        }, 1500); } catch (err) { console.error("Error saving draft:", err); Toast.error("Failed to save draft."); } }); }
});
