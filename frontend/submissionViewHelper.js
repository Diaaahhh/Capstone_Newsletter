// submissionViewHelper.js
// Provides utilities for loading a submission's data on a create page
// so admins/faculty can view the exact content that was submitted.

(function () {
  const SUBMISSIONS_ENDPOINT = "http://localhost:5000/api/submissions";

  function setupSubmissionView(options = {}) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") !== "submission") return false;

    const submissionId = params.get("submissionId");
    if (!submissionId) return false;

    const {
      category,
      onDataReady,
      onError,
      formElement,
      extraDisableElements = [],
    } = options;

    const banner = ensureBanner();
    banner.textContent = "Loading submitted entry...";

    fetch(`${SUBMISSIONS_ENDPOINT}/${submissionId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        return res.json();
      })
      .then((submission) => {
        if (category && submission.category !== category) {
          console.warn(
            `Submission category mismatch. Expected ${category}, got ${submission.category}`
          );
        }

        if (typeof onDataReady === "function") {
          // Pass formData to the callback, not the entire submission
          onDataReady(submission.formData || submission);
        }

        if (formElement) {
          enterSubmissionViewMode(formElement, extraDisableElements);
        }

        banner.classList.remove("alert-info");
        banner.classList.add("alert-success");
        banner.textContent = "Viewing submitted entry (read-only mode).";
      })
      .catch((error) => {
        console.error("Failed to load submission:", error);
        banner.classList.remove("alert-info");
        banner.classList.add("alert-danger");
        banner.textContent = "Unable to load submission details.";
        if (typeof onError === "function") {
          onError(error);
        }
      });

    return true;
  }

  function ensureBanner() {
    let banner = document.querySelector(".submission-view-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "alert alert-info submission-view-banner";
      const container =
        document.querySelector(".form-container") || document.body;
      container.prepend(banner);
    }
    return banner;
  }

  function enterSubmissionViewMode(formElement, extraDisableElements = []) {
    if (formElement) {
      const interactive = formElement.querySelectorAll(
        "input, textarea, select, button"
      );
      interactive.forEach((el) => {
        el.disabled = true;
      });
    }

    extraDisableElements
      .filter((el) => el)
      .forEach((el) => {
        el.disabled = true;
      });
  }

  window.setupSubmissionView = setupSubmissionView;
  window.enterSubmissionViewMode = enterSubmissionViewMode;
})();

