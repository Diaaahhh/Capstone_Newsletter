// bookChaptersUnderReview.js
// Show Book Chapter submissions in the "Content Under Review" section.
// - Admin: sees all Pending bookChapters and can Accept / Reject
// - Normal user: sees own bookChapters with status Pending or Rejected.
//                Rejected cards get an "Edit & Resubmit" button.

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("majorEventsUnderReview");
  const userRole = localStorage.getItem("userRole") || "user";
  const userEmail =
    localStorage.getItem("userEmail") || localStorage.getItem("userId");
  const API_SUBMISSIONS = "http://localhost:5000/api/submissions";

  if (!container) return;

  const isAdmin = userRole === "admin";

  // 🔹 সবার জন্য submissions লোড করবো
  // Admin: Pending only
  // User: নিজের submissions -> Pending + Rejected দেখাবো
  async function loadSubmissions() {
    container.innerHTML = "<p>Loading submissions...</p>";

    try {
      let url = `${API_SUBMISSIONS}?category=bookChapters`;

      if (isAdmin) {
        // Admin -> Pending only
        url += "&status=Pending";
      } else if (userEmail) {
        // User -> নিজের সব submission আনবো, পরে status দিয়ে filter করবো
        url += `&createdBy=${encodeURIComponent(userEmail)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load submissions");

      let submissions = await res.json();

      // User view: শুধু Pending বা Rejected রাখি
      if (!isAdmin && Array.isArray(submissions)) {
        submissions = submissions.filter(
          (s) => s.status === "Pending" || s.status === "Rejected"
        );
      }

      if (!Array.isArray(submissions) || !submissions.length) {
        container.innerHTML = isAdmin
          ? "<p>No submissions under review.</p>"
          : "<p>No pending or rejected book chapters at the moment.</p>";
        return;
      }

      container.innerHTML = "";
      submissions.forEach((item) => {
        container.appendChild(buildSubmissionCard(item, isAdmin));
      });
    } catch (err) {
      console.error("Error loading submissions:", err);
      container.innerHTML = "<p>Error loading submissions.</p>";
    }
  }

  // প্রতিটি submission এর জন্য card তৈরির function
  function buildSubmissionCard(submission, isAdminView) {
    const card = document.createElement("div");
    card.className = "under-review-card";

    const data = submission.formData || {};

    // Common অংশ: Admin + User দুইজনই দেখবে
    let baseHtml = `
      <h3>${data.chapterTitle || "Untitled chapter"}</h3>
      <p><strong>Authors:</strong> ${data.authors || "-"}</p>
      <p><strong>Book:</strong> ${data.bookName || "-"}</p>
      <p><strong>Year:</strong> ${data.year || "-"}</p>
      <p><strong>Created By:</strong> ${submission.createdBy}</p>
      <p><strong>Status:</strong> ${submission.status}</p>
    `;

    // 🔹 Admin view + Pending -> Accept/Reject + comment box
    if (isAdminView && submission.status === "Pending") {
      baseHtml += `
        <div class="review-section mt-2">
          <label class="form-label">Admin Comment</label>
          <textarea
            class="form-control comment-input"
            rows="2"
            placeholder="Write your feedback for the user..."
          ></textarea>

          <div class="review-buttons mt-2">
            <button class="btn btn-success btn-accept">Accept</button>
            <button class="btn btn-danger btn-reject ms-2">Reject</button>
          </div>

          <small class="text-muted review-hint d-block mt-1">
            Once you review, other admins will not be able to review this submission.
          </small>
        </div>
      `;
    } else {
      // 🔹 User view বা ইতিমধ্যে reviewed submission এর read-only অংশ
      const adminCommentText =
        submission.adminComment && submission.adminComment.trim().length
          ? submission.adminComment
          : null;

      baseHtml += `
        <div class="review-section mt-2">
          <p class="mb-1">
            <strong>Review Status:</strong> ${submission.status}
          </p>
          ${
            adminCommentText
              ? `<p class="mb-0"><strong>Admin Comment:</strong> ${escapeHtml(
                  adminCommentText
                )}</p>`
              : ""
          }
      `;

      // 🔹 Normal user + Rejected -> Edit & Resubmit button
      if (!isAdminView && submission.status === "Rejected") {
        baseHtml += `
          <div class="mt-2">
            <button class="btn btn-outline-primary btn-edit">
              Edit &amp; Resubmit
            </button>
          </div>
        `;
      }

      baseHtml += `</div>`; // close review-section
    }

    card.innerHTML = baseHtml;

    // === Admin + Pending: Accept/Reject logic ===
    if (isAdminView && submission.status === "Pending") {
      const commentInput = card.querySelector(".comment-input");
      const acceptBtn = card.querySelector(".btn-accept");
      const rejectBtn = card.querySelector(".btn-reject");

      async function handleReview(action) {
        const comment = commentInput.value.trim();
        acceptBtn.disabled = true;
        rejectBtn.disabled = true;

        try {
          const res = await fetch(
            `${API_SUBMISSIONS}/${submission._id}/review`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action, // "accept" or "reject"
                adminId:
                  localStorage.getItem("userEmail") || "admin@example.com",
                comment,
              }),
            }
          );

          const data = await res.json();

          if (!res.ok) {
            Toast.error(data.message || "Failed to review submission.");
            acceptBtn.disabled = false;
            rejectBtn.disabled = false;
            return;
          }

          Toast.error(data.message || "Reviewed successfully.");

          const reviewSection = card.querySelector(".review-section");
          reviewSection.innerHTML = `
            <p class="text-success mb-0">
              Reviewed as <strong>${action.toUpperCase()}</strong> by you.
            </p>
          `;
        } catch (err) {
          console.error("Review error:", err);
          Toast.error("Error while reviewing.");
          acceptBtn.disabled = false;
          rejectBtn.disabled = false;
        }
      }

      acceptBtn.addEventListener("click", () => handleReview("accept"));
      rejectBtn.addEventListener("click", () => handleReview("reject"));

      return card;
    }

    // === User view + Rejected: Edit & Resubmit logic ===
    if (!isAdminView && submission.status === "Rejected") {
      const editBtn = card.querySelector(".btn-edit");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          try {
            // formData + submissionId localStorage এ রেখে
            // form pre-fill করার জন্য createBookChapters.html এ পাঠাবো
            const payload = {
              submissionId: submission._id,
              formData: submission.formData || {},
            };
            localStorage.setItem(
              "bookChaptersEditData",
              JSON.stringify(payload)
            );
            window.location.href = "createBookChapters.html";
          } catch (err) {
            console.error("Edit & Resubmit error:", err);
            alert("Could not prepare data for editing.");
          }
        });
      }
    }

    return card;
  }

  // Simple HTML escape
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, (m) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }

  // init
  loadSubmissions();
});
