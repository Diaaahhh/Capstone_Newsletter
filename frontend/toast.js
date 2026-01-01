// toast.js - Reusable Toast Notification System
// Uses Bootstrap 5 Toast component (no additional dependencies needed)

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success', 'danger', 'warning', 'info', 'primary'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
  // Ensure toast container exists
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  // Map type to Bootstrap background classes (professional, no emojis)
  const typeConfig = {
    success: { bg: 'bg-success', textClass: 'text-white', label: 'Success' },
    danger: { bg: 'bg-danger', textClass: 'text-white', label: 'Error' },
    error: { bg: 'bg-danger', textClass: 'text-white', label: 'Error' }, // Alias for danger
    warning: { bg: 'bg-warning', textClass: 'text-dark', label: 'Warning' },
    info: { bg: 'bg-info', textClass: 'text-white', label: 'Info' },
    primary: { bg: 'bg-primary', textClass: 'text-white', label: 'Notice' }
  };

  const config = typeConfig[type] || typeConfig.info;

  // Create toast HTML (professional, clean design)
  const toastId = 'toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center ${config.bg} ${config.textClass} border-0 shadow-sm" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fw-medium">
          ${message}
        </div>
        <button type="button" class="btn-close ${config.textClass === 'text-white' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // Insert toast into container
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);

  // Initialize and show Bootstrap toast
  const bsToast = new bootstrap.Toast(toastElement, {
    animation: true,
    autohide: true,
    delay: duration
  });

  bsToast.show();

  // Remove toast element from DOM after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// Convenience methods for common toast types
const Toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'danger', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  primary: (message, duration) => showToast(message, 'primary', duration)
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showToast, Toast };
}
