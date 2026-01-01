/**
 * Alert Modal Loader
 * This script automatically loads the alert modal CSS and JS
 * Include this script in your HTML files to enable custom alerts
 */

(function() {
  // Check if already loaded
  if (window.alertModalLoaded) {
    return;
  }
  window.alertModalLoaded = true;

  // Load CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = 'alertModal.css';
  document.head.appendChild(cssLink);

  // Load JS
  const jsScript = document.createElement('script');
  jsScript.src = 'alertModal.js';
  jsScript.async = false; // Ensure it loads before other scripts use alert()
  document.head.appendChild(jsScript);
})();