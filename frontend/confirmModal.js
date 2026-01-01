// confirmModal.js - Beautiful Bootstrap Modal Confirmation Dialog
// A modern, reusable confirmation dialog system using Bootstrap 5

/**
 * Show a beautiful confirmation modal
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title (default: "Confirm Action")
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {string} options.type - Type: 'danger', 'warning', 'info', 'success' (default: 'danger')
 * @param {string} options.icon - Bootstrap icon class (default: based on type)
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Optional callback when cancelled
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmModal(options = {}) {
  return new Promise((resolve) => {
    // Default options
    const config = {
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'danger',
      icon: options.icon || null,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
    };

    // Type configurations
    const typeConfig = {
      danger: {
        btnClass: 'btn-danger',
        icon: 'bi-exclamation-triangle-fill',
        iconColor: '#dc3545',
        headerBg: '#dc3545'
      },
      warning: {
        btnClass: 'btn-warning',
        icon: 'bi-exclamation-circle-fill',
        iconColor: '#ffc107',
        headerBg: '#ffc107'
      },
      info: {
        btnClass: 'btn-info',
        icon: 'bi-info-circle-fill',
        iconColor: '#0dcaf0',
        headerBg: '#0dcaf0'
      },
      success: {
        btnClass: 'btn-success',
        icon: 'bi-check-circle-fill',
        iconColor: '#198754',
        headerBg: '#198754'
      }
    };

    const typeSettings = typeConfig[config.type] || typeConfig.danger;
    const iconClass = config.icon || typeSettings.icon;

    // Remove any existing confirmation modals
    const existingModal = document.getElementById('confirmationModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content confirm-modal-content">
            <div class="modal-header confirm-modal-header" style="background: linear-gradient(135deg, ${typeSettings.headerBg} 0%, ${typeSettings.headerBg}dd 100%);">
              <div class="confirm-modal-icon-wrapper">
                <i class="bi ${iconClass} confirm-modal-icon" style="color: white;"></i>
              </div>
              <h5 class="modal-title confirm-modal-title" id="confirmationModalLabel">${config.title}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body confirm-modal-body">
              <p class="confirm-modal-message">${config.message}</p>
            </div>
            <div class="modal-footer confirm-modal-footer">
              <button type="button" class="btn btn-secondary confirm-modal-cancel" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> ${config.cancelText}
              </button>
              <button type="button" class="btn ${typeSettings.btnClass} confirm-modal-confirm">
                <i class="bi bi-check-circle"></i> ${config.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element and initialize Bootstrap modal
    const modalElement = document.getElementById('confirmationModal');
    const bsModal = new bootstrap.Modal(modalElement);

    // Get buttons
    const confirmBtn = modalElement.querySelector('.confirm-modal-confirm');
    const cancelBtn = modalElement.querySelector('.confirm-modal-cancel');

    // Confirm button handler
    confirmBtn.addEventListener('click', () => {
      bsModal.hide();
      if (config.onConfirm) {
        config.onConfirm();
      }
      resolve(true);
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', () => {
      if (config.onCancel) {
        config.onCancel();
      }
      resolve(false);
    });

    // Close button handler (X button)
    const closeBtn = modalElement.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
      if (config.onCancel) {
        config.onCancel();
      }
      resolve(false);
    });

    // Cleanup after modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
    });

    // Show modal
    bsModal.show();
  });
}

// Convenience methods for common confirmation types
const ConfirmModal = {
  /**
   * Show a danger/delete confirmation
   */
  delete: (message, title = 'Delete Confirmation') => {
    return showConfirmModal({
      title,
      message,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'bi-trash-fill'
    });
  },

  /**
   * Show a warning confirmation
   */
  warning: (message, title = 'Warning') => {
    return showConfirmModal({
      title,
      message,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'warning'
    });
  },

  /**
   * Show an info confirmation
   */
  info: (message, title = 'Confirm') => {
    return showConfirmModal({
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      type: 'info'
    });
  },

  /**
   * Show a success confirmation
   */
  success: (message, title = 'Success') => {
    return showConfirmModal({
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      type: 'success'
    });
  },

  /**
   * Custom confirmation with full options
   */
  custom: showConfirmModal
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showConfirmModal, ConfirmModal };
}
