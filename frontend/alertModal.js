/**
 * Custom Alert Modal System
 * Replaces native alert() with a styled modal popup
 * Auto-injects CSS and overrides native alert()
 */

// Prevent multiple initializations
if (window.alertModalInitialized) {
  console.warn('Alert Modal already initialized');
} else {
  window.alertModalInitialized = true;
  
  // Auto-inject CSS
  (function injectCSS() {
    const cssId = 'alert-modal-styles';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'alertModal.css';
      document.head.appendChild(link);
    }
  })();
}

// Store active modals to prevent duplicates
let activeModals = [];

/**
 * Detect alert type from message content
 * @param {string} message - The alert message
 * @returns {string} - The alert type (success, error, warning, info)
 */
function detectAlertType(message) {
  const msg = message.toLowerCase();
  
  // Success indicators
  if (msg.includes('✅') || msg.includes('success') || msg.includes('submitted') || 
      msg.includes('saved') || msg.includes('deleted') || msg.includes('updated') ||
      msg.includes('completed') || msg.includes('registered')) {
    return 'success';
  }
  
  // Error indicators
  if (msg.includes('❌') || msg.includes('error') || msg.includes('failed') || 
      msg.includes('cannot') || msg.includes('invalid') || msg.includes('wrong')) {
    return 'error';
  }
  
  // Warning indicators
  if (msg.includes('⚠️') || msg.includes('warning') || msg.includes('please') || 
      msg.includes('required') || msg.includes('must') || msg.includes('should')) {
    return 'warning';
  }
  
  // Default to info
  return 'info';
}

/**
 * Get icon for alert type
 * @param {string} type - The alert type
 * @returns {string} - The icon HTML
 */
function getAlertIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

/**
 * Get title for alert type
 * @param {string} type - The alert type
 * @returns {string} - The title text
 */
function getAlertTitle(type) {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information'
  };
  return titles[type] || titles.info;
}

/**
 * Create and show a custom alert modal
 * @param {string} message - The message to display
 * @param {string} type - Optional type (success, error, warning, info)
 * @param {Object} options - Optional configuration
 * @returns {Promise} - Resolves when modal is closed
 */
function showAlert(message, type = null, options = {}) {
  return new Promise((resolve) => {
    // Auto-detect type if not provided
    if (!type) {
      type = detectAlertType(message);
    }
    
    // Default options
    const config = {
      title: options.title || getAlertTitle(type),
      showCloseButton: options.showCloseButton !== false,
      showOkButton: options.showOkButton !== false,
      okButtonText: options.okButtonText || 'OK',
      autoClose: options.autoClose || false,
      autoCloseDelay: options.autoCloseDelay || 3000,
      ...options
    };
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'alert-modal-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'alert-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'alert-modal-header';
    
    const title = document.createElement('h3');
    title.className = 'alert-modal-title';
    title.innerHTML = `<span class="alert-modal-icon ${type}">${getAlertIcon(type)}</span> ${config.title}`;
    
    header.appendChild(title);
    
    if (config.showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'alert-modal-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.onclick = () => closeModal();
      header.appendChild(closeBtn);
    }
    
    // Create body
    const body = document.createElement('div');
    body.className = 'alert-modal-body';
    body.textContent = message;
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'alert-modal-footer';
    
    if (config.showOkButton) {
      const okBtn = document.createElement('button');
      okBtn.className = 'alert-modal-button primary';
      okBtn.textContent = config.okButtonText;
      okBtn.onclick = () => closeModal();
      footer.appendChild(okBtn);
    }
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    if (config.showOkButton) {
      modal.appendChild(footer);
    }
    overlay.appendChild(modal);
    
    // Close modal function
    function closeModal() {
      overlay.style.animation = 'fadeOut 0.2s ease-in-out';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        // Remove from active modals
        const index = activeModals.indexOf(overlay);
        if (index > -1) {
          activeModals.splice(index, 1);
        }
        resolve();
      }, 200);
    }
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    };
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Add to DOM
    document.body.appendChild(overlay);
    activeModals.push(overlay);
    
    // Auto-close if enabled
    if (config.autoClose) {
      setTimeout(() => closeModal(), config.autoCloseDelay);
    }
    
    // Focus OK button if present
    if (config.showOkButton) {
      setTimeout(() => {
        const okBtn = footer.querySelector('.alert-modal-button');
        if (okBtn) okBtn.focus();
      }, 100);
    }
  });
}

/**
 * Override native alert function
 * This replaces the browser's alert() with our custom modal
 */
window.alert = function(message) {
  return showAlert(String(message));
};

// Add fadeOut animation to CSS if not already present
if (!document.querySelector('#alert-modal-animations')) {
  const style = document.createElement('style');
  style.id = 'alert-modal-animations';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showAlert };
}

// Make available globally
window.showAlert = showAlert;