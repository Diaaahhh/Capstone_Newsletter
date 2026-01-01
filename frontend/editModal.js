// editModal.js - Beautiful Bootstrap Edit Modal
// A modern, reusable edit dialog system using Bootstrap 5

/**
 * Show a beautiful edit modal with dynamic fields
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title (default: "Edit Content")
 * @param {string} options.saveText - Save button text (default: "Save Changes")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {Array} options.fields - Array of field objects
 * @param {string} options.fields[].name - Field name (key in returned object)
 * @param {string} options.fields[].label - Field label
 * @param {string} options.fields[].type - 'text', 'textarea', 'number', etc.
 * @param {string} options.fields[].value - Initial value
 * @param {string} options.fields[].placeholder - Placeholder text
 * @param {boolean} options.fields[].required - Is required?
 * @returns {Promise<Object|null>} - Resolves to form data object if saved, null if cancelled
 */
function showEditModal(options = {}) {
  return new Promise((resolve) => {
    // Default options
    const config = {
      title: options.title || 'Edit Content',
      saveText: options.saveText || 'Save Changes',
      cancelText: options.cancelText || 'Cancel',
      fields: options.fields || []
    };

    // Remove any existing edit modals
    const existingModal = document.getElementById('editModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Generate fields HTML
    const fieldsHTML = config.fields.map(field => {
      const isTextarea = field.type === 'textarea';
      const inputId = `edit-field-${field.name}`;
      
      let inputHTML = '';
      if (isTextarea) {
        inputHTML = `
          <textarea 
            id="${inputId}" 
            class="edit-modal-textarea" 
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
          >${escapeHtml(field.value || '')}</textarea>
        `;
      } else {
        inputHTML = `
          <input 
            type="${field.type || 'text'}" 
            id="${inputId}" 
            class="edit-modal-input" 
            value="${escapeHtml(field.value || '')}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
          />
        `;
      }

      return `
        <div class="edit-modal-form-group">
          <label for="${inputId}" class="edit-modal-label">${field.label}</label>
          ${inputHTML}
        </div>
      `;
    }).join('');

    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content edit-modal-content">
            <div class="modal-header edit-modal-header">
              <div class="edit-modal-icon-wrapper">
                <i class="bi bi-pencil-square edit-modal-icon"></i>
              </div>
              <h5 class="modal-title edit-modal-title" id="editModalLabel">${config.title}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body edit-modal-body">
              <form id="editModalForm">
                ${fieldsHTML}
              </form>
            </div>
            <div class="modal-footer edit-modal-footer">
              <button type="button" class="edit-modal-btn edit-modal-btn-cancel" data-bs-dismiss="modal">
                <i class="bi bi-x-circle"></i> ${config.cancelText}
              </button>
              <button type="button" class="edit-modal-btn edit-modal-btn-save">
                <i class="bi bi-check-circle"></i> ${config.saveText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element and initialize Bootstrap modal
    const modalElement = document.getElementById('editModal');
    const bsModal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('editModalForm');
    const saveBtn = modalElement.querySelector('.edit-modal-btn-save');

    // Helper to escape HTML
    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[m]);
    }

    // Save handler
    const handleSave = () => {
      // Validate
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Collect data
      const formData = {};
      config.fields.forEach(field => {
        const input = document.getElementById(`edit-field-${field.name}`);
        formData[field.name] = input.value;
      });

      bsModal.hide();
      resolve(formData);
    };

    saveBtn.addEventListener('click', handleSave);

    // Allow Ctrl+Enter to save
    modalElement.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
      }
    });

    // Cancel handler (modal hidden event handles cleanup)
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      // If we haven't resolved yet (i.e. not saved), resolve with null
      // We can't easily check if resolved, but resolving twice does nothing.
      // However, to be precise, we should only resolve null if not saved.
      // A simple flag works.
    });

    // Close button handler (X button and Cancel button are handled by data-bs-dismiss)
    // We just need to catch the dismissal to resolve null
    const dismissButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
    dismissButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        resolve(null);
      });
    });

    // Show modal
    bsModal.show();
  });
}

// Convenience object
const EditModal = {
  show: showEditModal
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showEditModal, EditModal };
}
