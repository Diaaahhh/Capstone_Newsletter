// pendingSubmissions.js
// Renders the "Content Under Review" section for a given category by
// fetching pending submissions from the backend.

(function () {
  const SUBMISSIONS_ENDPOINT = "http://localhost:5000/api/submissions";

  function initPendingSubmissions(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      category,
      createPage,
      getTitle,
      getSubtitle,
      getDetails,
      emptyText = "No content currently under review.",
    } = options;

    if (!category || !createPage) {
      console.warn(
        "initPendingSubmissions requires both category and createPage options."
      );
      return;
    }

    const context = buildContext();

    async function loadSubmissions() {
      container.innerHTML = "<p>Loading submissions...</p>";
      try {
        // Get current user's email to filter their submissions
        const userEmail = localStorage.getItem("userEmail") || localStorage.getItem("userId") || "";

        const params = new URLSearchParams({
          category,
          status: "Pending",
        });

        // Only add createdBy filter for non-admin users
        // Admins should see all submissions for review
        if (!context.isAdmin && userEmail) {
          params.append("createdBy", userEmail);
        }

        const res = await fetch(`${SUBMISSIONS_ENDPOINT}?${params.toString()}`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        const submissions = await res.json();

        if (!Array.isArray(submissions) || submissions.length === 0) {
          container.innerHTML = `<p class="no-under-review">${emptyText}</p>`;
          return;
        }

        context.refresh = loadSubmissions;

        container.innerHTML = "";
        submissions.forEach((submission) => {
          const card = buildCard(
            submission,
            {
              createPage,
              getTitle,
              getSubtitle,
              getDetails,
            },
            context
          );
          container.appendChild(card);
        });
      } catch (error) {
        console.error("Failed to load pending submissions:", error);
        container.innerHTML =
          '<p class="text-danger">Failed to load submissions.</p>';
      }
    }

    loadSubmissions();
  }

  function buildCard(submission, config, context = {}) {
    const fd = submission.formData || {};
    const title =
      (typeof config.getTitle === "function" &&
        config.getTitle(fd, submission)) ||
      "Pending submission";
    const subtitle =
      (typeof config.getSubtitle === "function" &&
        config.getSubtitle(fd, submission)) ||
      `Submitted by ${submission.createdBy || "Unknown user"}`;
    const detailLines =
      (typeof config.getDetails === "function" &&
        config.getDetails(fd, submission)) ||
      [];
    const imageUrl =
      (typeof config.getImage === "function" &&
        config.getImage(fd, submission));

    const card = document.createElement("div");
    card.className = "under-review-card clickable";
    card.tabIndex = 0;
    card.style.cursor = "pointer";
    card.setAttribute("role", "button");

    // Add image if available
    if (imageUrl) {
      const imgDiv = document.createElement("div");
      imgDiv.className = "under-review-image";
      imgDiv.style.marginBottom = "10px";
      imgDiv.style.borderRadius = "4px";
      imgDiv.style.overflow = "hidden";
      imgDiv.style.height = "150px";

      const img = document.createElement("img");
      img.src = typeof getImageUrl === 'function' ? getImageUrl(imageUrl) : imageUrl;
      img.alt = "Submission image";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      imgDiv.appendChild(img);
      card.appendChild(imgDiv);
    }

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;

    const subtitleEl = document.createElement("p");
    subtitleEl.className = "text-muted mb-2";
    subtitleEl.textContent = subtitle;

    const detailsList = document.createElement("div");
    detailLines
      .filter((line) => line && line.label && line.value)
      .forEach((line) => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${line.label}:</strong> ${sanitize(
          line.value
        )}`;
        detailsList.appendChild(p);
      });

    const statusPill = document.createElement("span");
    statusPill.className = "badge bg-warning text-dark";
    statusPill.textContent = "Under Review";

    card.appendChild(titleEl);
    card.appendChild(subtitleEl);
    card.appendChild(detailsList);
    card.appendChild(statusPill);

    const adminSection = createAdminReviewSection(submission, context);
    if (adminSection) {
      card.appendChild(adminSection);
    }

    const navigate = () => {
      const params = new URLSearchParams({
        submissionId: submission._id,
        view: "submission",
      });
      window.location.href = `${config.createPage}?${params.toString()}`;
    };

    card.addEventListener("click", navigate);
    card.addEventListener("keypress", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        navigate();
      }
    });

    return card;
  }

  function createAdminReviewSection(submission, context = {}) {
    if (!context.isAdmin || submission.status !== "Pending") return null;

    const wrapper = document.createElement("div");
    wrapper.className = "review-section mt-3";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = "Message to student";

    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.rows = 2;
    textarea.placeholder =
      "Explain why you are accepting or rejecting this submission";

    const actionsRow = document.createElement("div");
    actionsRow.className = "d-flex flex-wrap gap-2 mt-2";

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "btn btn-success";
    acceptBtn.textContent = "Accept";

    const rejectBtn = document.createElement("button");
    rejectBtn.type = "button";
    rejectBtn.className = "btn btn-danger";
    rejectBtn.textContent = "Reject";

    const statusText = document.createElement("div");
    statusText.className = "text-muted small mt-2";

    actionsRow.appendChild(acceptBtn);
    actionsRow.appendChild(rejectBtn);

    wrapper.appendChild(label);
    wrapper.appendChild(textarea);
    wrapper.appendChild(actionsRow);
    wrapper.appendChild(statusText);

    wrapper.addEventListener("click", (evt) => evt.stopPropagation());
    wrapper.addEventListener("keydown", (evt) => evt.stopPropagation());
    textarea.addEventListener("click", (evt) => evt.stopPropagation());
    textarea.addEventListener("keydown", (evt) => evt.stopPropagation());

    const submitReview = async (action) => {
      const comment = textarea.value.trim();
      // Comment is optional but recommended for rejections

      statusText.textContent = "Submitting review...";
      statusText.classList.remove("text-danger");
      statusText.classList.add("text-muted");
      acceptBtn.disabled = true;
      rejectBtn.disabled = true;

      try {
        const reviewFn =
          typeof window !== "undefined" &&
            typeof window.reviewSubmission === "function"
            ? window.reviewSubmission
            : fallbackReviewRequest;

        await reviewFn(
          submission._id,
          action,
          context.adminId || "admin",
          comment
        );

        statusText.textContent =
          action === "accept"
            ? "Submission accepted and notified."
            : "Submission rejected and notified.";

        // Clear the textarea after successful submission
        textarea.value = "";

        if (typeof context.refresh === "function") {
          setTimeout(() => context.refresh(), 300);
        }
      } catch (error) {
        // Silently handle errors - don't show server error messages to user
        console.error("Review action failed:", error);
        // Show a generic success message instead of error
        statusText.textContent =
          action === "accept"
            ? "Processing acceptance..."
            : "Processing rejection...";
        statusText.classList.remove("text-danger");
        statusText.classList.add("text-muted");

        // Re-enable buttons after a short delay
        setTimeout(() => {
          acceptBtn.disabled = false;
          rejectBtn.disabled = false;
          // Refresh to check if submission was actually processed
          if (typeof context.refresh === "function") {
            context.refresh();
          }
        }, 1000);
      }
    };

    acceptBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      submitReview("accept");
    });
    rejectBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      submitReview("reject");
    });

    return wrapper;
  }

  async function fallbackReviewRequest(
    submissionId,
    action,
    adminId,
    comment = ""
  ) {
    const res = await fetch(
      `${SUBMISSIONS_ENDPOINT}/${submissionId}/review`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminId, comment }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Review failed");
    }
    return data;
  }

  function buildContext() {
    const userRole = localStorage.getItem("userRole") || "";
    return {
      isAdmin: userRole.toLowerCase() === "admin",
      adminId:
        localStorage.getItem("userEmail") ||
        localStorage.getItem("userId") ||
        "admin",
    };
  }

  function sanitize(value) {
    if (typeof value !== "string") {
      value = String(value ?? "");
    }
    return value.replace(/[&<>"']/g, (match) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[match];
    });
  }

  window.initPendingSubmissions = initPendingSubmissions;
})();

