// vcNewsletterModernEditor.js
// Modern Canva-like PDF editor with categorized sections

console.log('🚀 vcNewsletterModernEditor.js loaded');

// Global flag to prevent multiple executions
window.modernEditorInitialized = false;

// Wait for DOM to be ready
function initEditor() {
  if (window.modernEditorInitialized) {
    console.log('⚠️ Editor already initialized, skipping');
    return;
  }

  console.log('🔧 Initializing editor...');

  const generatePdfBtn = document.querySelector('.generate-pdf-btn');
  console.log('🔍 Generate PDF button:', generatePdfBtn);

  if (!generatePdfBtn) {
    console.error('❌ Generate PDF button not found!');
    return;
  }

  // Mark as initialized
  window.modernEditorInitialized = true;

  // Method 1: Direct onclick (most aggressive)
  generatePdfBtn.onclick = function (e) {
    console.log('🎯 Button clicked via onclick!');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Check for data immediately on click
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
    if (items.length === 0) {
      console.warn('⚠️ No items found when clicking Generate PDF');
      if (typeof Toast !== 'undefined') {
        Toast.warning('Newsletter data is loading or empty. Please wait a moment.');
      } else {
        alert('Newsletter data is loading or empty. Please wait a moment.');
      }
      return false;
    }

    openModernEditor();
    return false;
  };

  // Method 2: addEventListener with capture
  generatePdfBtn.addEventListener('click', function (e) {
    console.log('🎯 Button clicked via addEventListener!');
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Check done in onclick, but good to have safeguard here too
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
    if (items.length > 0) {
      openModernEditor();
    }
  }, { capture: true });

  // Update button text based on status but DO NOT DISABLE IT
  generatePdfBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading...';
  console.log('⏳ Button waiting for data...');

  // Check for data
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCount++;
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];

    if (items.length > 0) {
      generatePdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Generate PDF';
      console.log(`✅ Data loaded! Button ready (${items.length} items found after ${checkCount} checks)`);
      clearInterval(checkInterval);
    } else if (checkCount >= 100) { // 10 seconds
      console.warn(`⚠️ No data after 10 seconds (${checkCount} checks)`);
      // Update text but keep clickable so user gets the alert feedback
      generatePdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Generate PDF';
      clearInterval(checkInterval);
    }

    if (checkCount % 10 === 0) {
      console.log(`⏱️ Check ${checkCount}: ${items.length} items`);
    }
  }, 100);

  console.log('✅ Event listeners attached (onclick + addEventListener)');
}

// Initialize when DOM is ready
console.log('📍 Script execution point - readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('⏳ DOM still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  console.log('✅ DOM already loaded, initializing in 100ms');
  // DOM already loaded, wait a tiny bit for other scripts
  setTimeout(initEditor, 100);
}

// Also try immediate initialization as fallback
setTimeout(() => {
  console.log('🔄 Fallback initialization check');
  if (!window.modernEditorInitialized) {
    console.log('⚠️ Editor not initialized yet, forcing init');
    initEditor();
  }
}, 500);

async function openModernEditor() {
  try {
    showLoadingScreen();
    updateLoadingProgress(5, 'Loading data...');

    // Wait a moment for data to load if not available yet
    let items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];

    // If no items, wait up to 3 seconds for data to load
    if (items.length === 0) {
      console.log('Waiting for newsletter data to load...');

      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
        if (items.length > 0) break;
      }
    }

    if (items.length === 0) {
      hideLoadingScreen();
      if (typeof Toast !== 'undefined') {
        Toast.error('No items to generate PDF from. Please wait for newsletter items to load and try again.');
      } else {
        alert('No items to generate PDF from. Please wait for newsletter items to load and try again.');
      }
      return;
    }

    updateLoadingProgress(10, 'Initializing editor...');
    console.log('Opening editor with', items.length, 'items');

    // Use setTimeout to allow UI to render the loading screen
    setTimeout(() => {
      createModernEditor(items);
    }, 100);

  } catch (error) {
    hideLoadingScreen();
    console.error('Error opening editor:', error);
    if (typeof Toast !== 'undefined') {
      Toast.error('Error opening editor: ' + error.message);
    } else {
      alert('Error opening editor: ' + error.message);
    }
  }
}

function createPageContainer(pageIndex) {
  const container = document.createElement('div');
  container.className = 'canvas-container';
  container.id = 'page-container-' + pageIndex;
  container.style.position = 'relative'; // For absolute positioning of delete button

  const label = document.createElement('div');
  label.className = 'page-label';
  label.textContent = 'Page ' + (pageIndex + 1);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'page-control-btn page-delete-btn';
  deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
  deleteBtn.title = 'Delete Page';
  deleteBtn.style.position = 'absolute';
  deleteBtn.style.top = '10px';
  deleteBtn.style.right = '10px';
  deleteBtn.style.zIndex = '1000';
  deleteBtn.onclick = () => deletePage(pageIndex);

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-' + pageIndex;

  container.appendChild(label);
  container.appendChild(deleteBtn);
  container.appendChild(canvas);

  return container;
}

async function createModernEditor(items) {
  // Check if Fabric.js is loaded
  if (typeof fabric === 'undefined') {
    throw new Error('Fabric.js is not loaded. Please refresh the page and try again.');
  }

  const modal = document.createElement('div');
  modal.id = 'modernEditorModal';
  modal.innerHTML = `
    <!-- Balance Text Library for better typography -->
    <script src="https://cdn.jsdelivr.net/npm/balance-text@3.3.1/balancer.js"></script>

    <!-- jsPDF Library for PDF generation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

    <style>
      #modernEditorModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0d2747 0%, #0f2e59 100%);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
      }
      
      .modern-editor-footer {
        height: 40px;
        background: #f8f9fa;
        border-top: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        flex-shrink: 0;
        z-index: 20;
      }
      
      .modern-header {
        background: linear-gradient(135deg, #0d2747 0%, #0f2e59 100%);
        padding: 16px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .modern-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: white;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
      }
      
      .modern-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #0d2747 0%, #0f2e59 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(13, 39, 71, 0.4);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(13, 39, 71, 0.6);
      }
      
      .btn-secondary {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
      }
      
      .btn-secondary:hover {
        background: #667eea;
        color: white;
      }
      
      .modern-workspace {
        display: flex;
        flex: 1;
        overflow: hidden;
        position: relative;
        height: calc(100% - 90px); /* Subtract header (60px) and footer (30px) */
      }
      
      .modern-sidebar {
        width: 280px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        overflow-y: auto;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
      }
      
      .sidebar-section {
        padding: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .sidebar-title {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #0d2747;
        margin-bottom: 16px;
      }
      
      .modern-toolbar {
        background: #ffffff;
        padding: 12px 24px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid #e2e8f0;
        z-index: 10;
      }
      
      .tool-group {
        display: flex;
        gap: 4px;
        padding: 4px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .tool-dropdown { position: relative; z-index: 99999; }
      .tool-dropdown-menu {
        position: absolute;
        top: 44px;
        left: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        padding: 8px;
        display: none;
        flex-direction: column;
        gap: 6px;
        min-width: 160px;
        z-index: 99999;
        will-change: transform, opacity;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }
      
      
      .tool-dropdown-menu .tool-btn { width: 100%; justify-content: flex-start; background: white; color: #495057; border-radius: 6px; }
      .tool-dropdown-menu .tool-btn:hover { background: #667eea; color: white; }
      
      .tool-btn {
        padding: 8px 12px;
        border: 1px solid transparent;
        background: #f1f5f9;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #475569;
        font-weight: 600;
      }
      
      .tool-btn:hover {
        background: #e2e8f0;
        color: #0f172a;
        transform: translateY(-1px);
      }

      .tool-btn.active {
        background: #0d2747;
        color: white;
        box-shadow: 0 2px 6px rgba(13, 39, 71, 0.2);
      }

      
      .tool-separator {
        width: 1px;
        height: 32px;
        background: #dee2e6;
        margin: 0 8px;
      }
      
      .modern-canvas-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        overflow-y: auto;
        overflow-x: hidden;
        gap: 30px;
      }
      
      .canvas-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
        flex-shrink: 0;
      }

      
      .page-header {
        position: absolute;
        top: -60px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
      }

      .page-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }

      .page-controls {
        display: flex;
        gap: 8px;
      }

      .page-control-btn {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #0d2747;
        font-size: 14px;
      }

      .page-control-btn:hover {
        background: #0d2747;
        color: white;
        transform: scale(1.1);
      }

      .page-control-btn:active {
        transform: scale(0.95);
      }
      
      .property-panel {
        position: fixed;
        right: 24px;
        top: 100px;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        min-width: 250px;
        display: none;
        z-index: 10001;
        cursor: move;
      }
      
      .property-panel.dragging {
        cursor: grabbing;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
      }
      
      .property-panel.active {
        display: block;
      }
      
      .property-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 16px;
        color: #212529;
        cursor: move;
        padding-bottom: 12px;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: space-between;
      }
      
      .property-title::before {
        content: '⋮⋮';
        color: #667eea;
        font-size: 18px;
        letter-spacing: -2px;
      }
      
      .property-close-btn {
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: all 0.2s ease;
      }
      
      .property-close-btn:hover {
        color: #0d2747;
        transform: scale(1.1);
      }

      .shape-panel {
        position: fixed;
        right: 24px;
        top: 200px;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        display: none;
        z-index: 100;
        cursor: move;
      }

      .shape-panel.active {
        display: block;
      }

      .shape-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 16px;
      }

      .shape-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
        color: #495057;
      }

      .shape-btn:hover {
        border-color: #0d2747;
        background: #f8f9fa;
        transform: translateY(-2px);
      }

      .shape-btn i {
        font-size: 20px;
      }

      .layers-panel {
        position: fixed;
        right: 24px;
        top: 300px;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        display: none;
        z-index: 100;
        cursor: move;
      }

      .layers-panel.active {
        display: block;
      }

      .layers-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 16px;
      }

      .layer-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 8px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
        color: #495057;
      }

      .layer-btn:hover {
        border-color: #0d2747;
        background: #f8f9fa;
        transform: translateY(-2px);
      }
      
      .property-group {
        margin-bottom: 16px;
      }
      
      .property-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #0d2747;
        margin-bottom: 8px;
        display: block;
      }
      
      .property-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .property-input:focus {
        outline: none;
        border-color: #0d2747;
        box-shadow: 0 0 0 3px rgba(13, 39, 71, 0.1);
      }
      
      .color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      }
      
      .color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .color-swatch:hover {
        transform: scale(1.1);
        border-color: #0d2747;
      }

      .color-picker-container {
        margin-top: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .color-picker {
        width: 40px;
        height: 32px;
        padding: 0;
        border: 2px solid #e9ecef;
        border-radius: 4px;
        cursor: pointer;
        background: none;
      }

      .color-picker:hover {
        border-color: #0d2747;
      }

      .color-picker-label {
        font-size: 12px;
        font-weight: 600;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .element-card {
        background: white;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
      }
      
      .element-card:hover {
        transform: translateX(4px);
        border-color: #0d2747;
        box-shadow: 0 4px 12px rgba(13, 39, 71, 0.2);
      }
      
      .element-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #212529;
      }
      
      .element-subtitle {
        font-size: 12px;
        color: #6c757d;
      }
      
      .template-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .template-card {
        background: linear-gradient(135deg, #0d2747 0%, #0f2e59 100%);
        padding: 20px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .template-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(13, 39, 71, 0.4);
      }
      
      .template-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      
      .template-name {
        font-weight: 600;
        font-size: 14px;
      }

      .ai-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 10002;
        align-items: center;
        justify-content: center;
      }

      .ai-modal.active {
        display: flex;
      }

      .ai-modal-content {
        background: white;
        border-radius: 12px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .ai-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ai-modal-header h3 {
        margin: 0;
        font-size: 20px;
        color: #0d2747;
      }

      .ai-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6c757d;
      }

      .ai-modal-body {
        padding: 24px;
      }

      .ai-option {
        margin-bottom: 24px;
        padding: 16px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
      }

      .ai-option h4 {
        margin: 0 0 8px 0;
        color: #0d2747;
      }

      .ai-option p {
        margin: 0 0 12px 0;
        color: #6c757d;
        font-size: 14px;
      }

      .ai-option select, .ai-option input {
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
      }

      .ai-action-btn {
        background: linear-gradient(135deg, #0d2747 0%, #0f2e59 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
      }

      .ai-action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(13, 39, 71, 0.4);
      }
    </style>
    
    <div class="modern-header">
      <h2>✨ VC Newsletter Editor</h2>
      <div class="header-actions">
        <button class="modern-btn btn-secondary" id="previewBtn">
          <i class="bi bi-eye"></i> Preview
        </button>
        <button class="modern-btn btn-secondary" id="downloadWordBtn" onclick="downloadWordDoc()">
          <i class="bi bi-file-word"></i> Download Word
        </button>
        <button class="modern-btn btn-primary" id="downloadBtn">
          <i class="bi bi-download"></i> Download PDF
        </button>
        <button class="modern-btn btn-secondary" id="closeBtn">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
    
    <div class="modern-toolbar">
      <div class="tool-group">
        <button class="tool-btn" id="toggleSidebarBtn" title="Toggle Sidebar" onclick="toggleModernSidebar()">
          <i class="bi bi-layout-sidebar"></i>
        </button>
      </div>

      <div class="tool-separator"></div>

      <div class="tool-group">
        <button class="tool-btn" id="addTopPageBtn" title="Add Page at Top">
          <i class="bi bi-file-plus"></i> Add Top Page
        </button>
        <button class="tool-btn" id="addBottomPageBtn" title="Add Page at Bottom">
          <i class="bi bi-file-plus"></i> Add Bottom Page
        </button>
        <button class="tool-btn" id="prevPageBtn" title="Previous Page">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span id="pageIndicator" style="padding: 0 10px; font-weight: 600;">Page 1 of 1</span>
        <button class="tool-btn" id="nextPageBtn" title="Next Page">
          <i class="bi bi-chevron-right"></i>
        </button>
        <button class="tool-btn" id="undoBtn" title="Undo (Ctrl+Z)">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
        <button class="tool-btn" id="redoBtn" title="Redo (Ctrl+Y)">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" id="addTextBtn" title="Add Text">
          <i class="bi bi-fonts"></i> Text
        </button>
        <button class="tool-btn" id="addHeadingBtn" title="Add Heading">
          <i class="bi bi-type-h1"></i> Heading
        </button>
        <button class="tool-btn" id="cleanParagraphsBtn" title="Clean Paragraphs">
          <i class="bi bi-magic"></i> Clean
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" id="boldBtn" title="Bold (Ctrl+B)">
          <i class="bi bi-type-bold"></i>
        </button>
        <button class="tool-btn" id="italicBtn" title="Italic (Ctrl+I)">
          <i class="bi bi-type-italic"></i>
        </button>
        <button class="tool-btn" id="underlineBtn" title="Underline (Ctrl+U)">
          <i class="bi bi-type-underline"></i>
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" id="alignLeftBtn" title="Align Left">
          <i class="bi bi-text-left"></i>
        </button>
        <button class="tool-btn" id="alignCenterBtn" title="Align Center">
          <i class="bi bi-text-center"></i>
        </button>
        <button class="tool-btn" id="alignRightBtn" title="Align Right">
          <i class="bi bi-text-right"></i>
        </button>
        <button class="tool-btn" id="alignJustifyBtn" title="Justify">
          <i class="bi bi-justify"></i>
        </button>
        <button class="tool-btn" id="alignJustifyLeftBtn" title="Justify Left">
          <i class="bi bi-justify-left"></i>
        </button>
        <button class="tool-btn" id="alignJustifyRightBtn" title="Justify Right">
          <i class="bi bi-justify-right"></i>
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" id="addImageBtn" title="Add Image">
          <i class="bi bi-image"></i> Image
        </button>
        <button class="tool-btn" id="addShapeBtn" title="Add Shape">
          <i class="bi bi-square"></i> Shape
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <button class="tool-btn" id="duplicateBtn" title="Duplicate (Ctrl+D)">
          <i class="bi bi-files"></i>
        </button>
        <button class="tool-btn" id="deleteBtn" title="Delete (Del)">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      
      <div class="tool-separator"></div>
      
      <div class="tool-group">
        <div class="tool-dropdown">
          <button class="tool-btn" id="moveToPageBtn" title="Move to Page">
            <i class="bi bi-arrow-right-square"></i> Move to Page <span style="margin-left:8px; font-size:12px;">▾</span>
          </button>
          <div class="tool-dropdown-menu" id="moveToPageMenu" aria-hidden="true">
            <!-- Page options will be populated dynamically -->
          </div>
        </div>
      </div>



      <div class="tool-separator"></div>

      <div class="tool-group">
        <button class="tool-btn" id="aiBtn" title="AI Assistant">
          <i class="bi bi-robot"></i> AI
        </button>
      </div>

      <div class="tool-separator"></div>

      <div class="tool-group">
        <div class="tool-dropdown">
          <button class="tool-btn" id="backgroundBtn" title="Background">
            <i class="bi bi-paint-bucket"></i> Background <span style="margin-left:8px; font-size:12px;">▾</span>
          </button>
          <div class="tool-dropdown-menu" id="backgroundMenu" aria-hidden="true">
            <button class="tool-btn" id="bgColorBtn">
              <i class="bi bi-palette"></i> Solid Color
            </button>
            <button class="tool-btn" id="bgImageBtn">
              <i class="bi bi-image"></i> Image
            </button>
            <button class="tool-btn" id="bgGradientBtn">
              <i class="bi bi-gradient"></i> Gradient
            </button>
            <button class="tool-btn" id="bgClearBtn">
              <i class="bi bi-x-circle"></i> Clear Background
            </button>
          </div>
        </div>
      </div>

      <div class="tool-separator"></div>

      <!-- Drawing Tools -->
      <div class="tool-group">
        <button class="tool-btn" id="drawBtn" title="Drawing Tools">
          <i class="bi bi-pencil"></i> Draw
        </button>
      </div>

      <div class="tool-separator"></div>

      <!-- Grid & Guides Tools -->
      <div class="tool-group">
        <button class="tool-btn" id="gridBtn" title="Grid & Guides">
          <i class="bi bi-grid-3x3"></i> Grid
        </button>
      </div>

      <div class="tool-separator"></div>

      <!-- Layers Tools -->
      <div class="tool-group">
        <button class="tool-btn" id="layersBtn" title="Layers & Grouping">
          <i class="bi bi-layers"></i> Layers
        </button>
      </div>
    </div>
    
    <div class="modern-workspace">
      <!-- Floating Open Sidebar Button -->
      <button id="floatingSidebarBtn" onclick="toggleModernSidebar()" style="display: none; position: absolute; left: 20px; top: 20px; z-index: 100; background: white; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" title="Open Sidebar">
        <i class="bi bi-layout-sidebar"></i>
      </button>

      <div class="modern-sidebar" id="modernSidebar">
        <div style="padding: 10px 20px 0; display: flex; justify-content: flex-end;">
          <button onclick="toggleModernSidebar()" style="background: none; border: none; color: #6c757d; cursor: pointer; padding: 4px;" title="Close Sidebar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-title" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleSidebarSection('contentList', this)">
            <span>📄 Content</span>
            <i class="bi bi-chevron-down"></i>
          </div>
          <div id="contentList"></div>
        </div>
        
        <div class="sidebar-section">
          <div class="sidebar-title" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleSidebarSection('templateGrid', this)">
            <span>🎨 Templates</span>
            <i class="bi bi-chevron-down"></i>
          </div>
          <div class="template-grid" id="templateGrid">
            <div class="template-card" data-template="header">
              <div class="template-icon">📰</div>
              <div class="template-name">Header Block</div>
            </div>
            <div class="template-card" data-template="article">
              <div class="template-icon">📝</div>
              <div class="template-name">Article Block</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modern-canvas-area" id="canvasArea">
        <div id="zoomContainer" style="display: flex; flex-direction: column; align-items: center; gap: 30px; transform-origin: top center; transition: transform 0.1s ease-out; min-height: 100%; padding-bottom: 50px; width: 100%;"></div>
        <div class="property-panel" id="propertyPanel">
          <div class="property-title">
            <span>Properties</span>
            <button class="property-close-btn" id="propertyCloseBtn" title="Close properties panel">×</button>
          </div>

          <div class="property-group">
            <label class="property-label">Font Family</label>
            <select class="property-input" id="fontFamilySelect">
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Calibri">Calibri</option>
              <option value="Cambria">Cambria</option>
              <option value="Garamond">Garamond</option>
              <option value="Palatino">Palatino</option>
              <option value="Bookman">Bookman</option>
              <option value="Courier New">Courier New</option>
              <option value="Lucida Console">Lucida Console</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
          </div>

          <div class="property-group">
            <label class="property-label">Font Size</label>
            <input type="number" class="property-input" id="fontSizeInput" min="8" max="120" value="16">
          </div>

          <div class="property-group">
            <label class="property-label">Text Color</label>
            <div class="color-grid">
              <div class="color-swatch" style="background: #000000" data-color="#000000"></div>
              <div class="color-swatch" style="background: #667eea" data-color="#667eea"></div>
              <div class="color-swatch" style="background: #764ba2" data-color="#764ba2"></div>
              <div class="color-swatch" style="background: #f093fb" data-color="#f093fb"></div>
              <div class="color-swatch" style="background: #4facfe" data-color="#4facfe"></div>
              <div class="color-swatch" style="background: #43e97b" data-color="#43e97b"></div>
              <div class="color-swatch" style="background: #fa709a" data-color="#fa709a"></div>
              <div class="color-swatch" style="background: #fee140" data-color="#fee140"></div>
              <div class="color-swatch" style="background: #30cfd0" data-color="#30cfd0"></div>
              <div class="color-swatch" style="background: #a8edea" data-color="#a8edea"></div>
              <div class="color-swatch" style="background: #ff6b6b" data-color="#ff6b6b"></div>
              <div class="color-swatch" style="background: #ffffff; border: 1px solid #ddd" data-color="#ffffff"></div>
            </div>
            <div class="color-picker-container">
              <input type="color" class="property-input color-picker" id="colorPicker" value="#667eea">
              <label class="color-picker-label">Custom Color</label>
            </div>
          </div>

          <div class="property-group">
            <label class="property-label">Opacity</label>
            <input type="range" class="property-input" id="opacityInput" min="0" max="1" step="0.1" value="1">
          </div>
        </div>

        <div class="shape-panel" id="shapePanel">
          <div class="property-title">
            <span>Shapes</span>
            <button class="property-close-btn" id="shapeCloseBtn" title="Close shapes panel">×</button>
          </div>

          <div class="shape-grid">
            <button class="shape-btn" data-shape="rect" title="Rectangle">
              <i class="bi bi-square"></i>
              <span>Rectangle</span>
            </button>
            <button class="shape-btn" data-shape="circle" title="Circle">
              <i class="bi bi-circle"></i>
              <span>Circle</span>
            </button>
            <button class="shape-btn" data-shape="triangle" title="Triangle">
              <i class="bi bi-triangle"></i>
              <span>Triangle</span>
            </button>
            <button class="shape-btn" data-shape="line" title="Line">
              <i class="bi bi-slash"></i>
              <span>Line</span>
            </button>
            <button class="shape-btn" data-shape="arrow" title="Arrow">
              <i class="bi bi-arrow-right"></i>
              <span>Arrow</span>
            </button>
            <button class="shape-btn" data-shape="star" title="Star">
              <i class="bi bi-star"></i>
              <span>Star</span>
            </button>
          </div>
        </div>

        <!-- Layers Panel (Floating) -->
        <div class="property-panel" id="layersPanel" style="display: none; right: 400px; top: 150px; width: 320px;">
          <div class="property-title" style="cursor: move;" id="layersPanelHeader">
            <span>📚 Layers & Grouping</span>
            <button class="property-close-btn" id="layersCloseBtn" title="Close layers panel">×</button>
          </div>

          <div class="property-group">
            <!-- Layer Order Controls -->
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Layer Order</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 16px;">
              <button class="layer-btn" id="bringToFrontBtn" style="padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                <i class="bi bi-arrow-up-circle"></i> To Front
              </button>
              <button class="layer-btn" id="sendToBackBtn" style="padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                <i class="bi bi-arrow-down-circle"></i> To Back
              </button>
              <button class="layer-btn" id="bringForwardBtn" style="padding: 8px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                <i class="bi bi-arrow-up"></i> Forward
              </button>
              <button class="layer-btn" id="sendBackwardBtn" style="padding: 8px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                <i class="bi bi-arrow-down"></i> Backward
              </button>
            </div>

            <!-- Grouping Controls -->
            <div style="border-top: 1px solid #e9ecef; padding-top: 12px; margin-top: 12px;">
              <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Grouping</label>
              <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button class="property-btn" id="groupObjectsBtn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                  <i class="bi bi-collection"></i> Group
                </button>
                <button class="property-btn" id="ungroupObjectsBtn" style="flex: 1; padding: 8px; background: #ffc107; color: #212529; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                  <i class="bi bi-bounding-box"></i> Ungroup
                </button>
              </div>
            </div>

            <!-- Layer Properties -->
            <div style="border-top: 1px solid #e9ecef; padding-top: 12px; margin-top: 12px;">
              <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Layer Properties</label>
              
              <!-- Lock/Unlock -->
              <label class="property-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                <input type="checkbox" id="lockLayerToggle" style="width: 18px; height: 18px; cursor: pointer;">
                <span style="font-weight: 600;">🔒 Lock Selected</span>
              </label>

              <!-- Visibility Toggle -->
              <label class="property-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
                <input type="checkbox" id="visibilityToggle" checked style="width: 18px; height: 18px; cursor: pointer;">
                <span style="font-weight: 600;">👁️ Visible</span>
              </label>

              <!-- Opacity Slider -->
              <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Opacity</label>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <input type="range" id="layerOpacitySlider" min="0" max="100" value="100" style="flex: 1; cursor: pointer;">
                <span id="layerOpacityValue" style="min-width: 40px; font-size: 12px; font-weight: 600; color: #495057;">100%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-modal" id="aiModal">
          <div class="ai-modal-content" id="aiModalContent">
            <div class="ai-modal-header">
              <h3>AI Assistant</h3>
              <button class="ai-close-btn" id="aiCloseBtn">×</button>
            </div>
            <div class="ai-modal-body">
              <div class="ai-option" id="reformatOption">
                <h4>Reformat Existing Text</h4>
                <p>Change the tone of selected text or all text on the page.</p>
                <select id="reformatTone">
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                </select>
                <button class="ai-action-btn" id="reformatBtn">Reformat</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Background Panel (Floating) -->
        <div class="property-panel" id="backgroundPanel" style="display: none; left: 400px; top: 100px; width: 320px; max-height: 600px; overflow-y: auto;">
          <div class="property-title" style="cursor: move;" id="backgroundPanelHeader">
            <span>🎨 Background</span>
            <button class="property-close-btn" id="backgroundCloseBtn" title="Close background panel">×</button>
          </div>

          <!-- Solid Color Section -->
          <div class="property-group">
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Solid Color</label>
            <div class="color-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
              <div class="color-swatch" style="background: #ffffff; border: 2px solid #ddd; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#ffffff"></div>
              <div class="color-swatch" style="background: #f8f9fa; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#f8f9fa"></div>
              <div class="color-swatch" style="background: #e9ecef; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#e9ecef"></div>
              <div class="color-swatch" style="background: #0d2747; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#0d2747"></div>
              <div class="color-swatch" style="background: #667eea; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#667eea"></div>
              <div class="color-swatch" style="background: #764ba2; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#764ba2"></div>
              <div class="color-swatch" style="background: #f093fb; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#f093fb"></div>
              <div class="color-swatch" style="background: #4facfe; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#4facfe"></div>
              <div class="color-swatch" style="background: #43e97b; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#43e97b"></div>
              <div class="color-swatch" style="background: #fa709a; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#fa709a"></div>
              <div class="color-swatch" style="background: #fee140; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#fee140"></div>
              <div class="color-swatch" style="background: #30cfd0; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-bg-color="#30cfd0"></div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
              <label style="font-size: 11px; font-weight: 600;">Custom:</label>
              <input type="color" id="bgColorPicker" value="#ffffff" style="width: 40px; height: 32px; border: 2px solid #e9ecef; border-radius: 4px; cursor: pointer;">
              <input type="text" id="bgColorHex" placeholder="#ffffff" maxlength="7" style="flex: 1; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: monospace; font-size: 12px;">
            </div>
            <button class="property-btn" id="applyBgColorBtn" style="width: 100%; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Apply Color</button>
          </div>

          <!-- Background Image Section -->
          <div class="property-group" style="border-top: 1px solid #e9ecef; padding-top: 12px;">
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Background Image</label>
            <input type="file" id="bgImageInput" accept="image/*" style="width: 100%; margin-bottom: 8px; font-size: 12px;">
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <input type="text" id="bgImageUrl" placeholder="Or enter image URL..." style="flex: 1; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px;">
              <button class="property-btn" id="loadBgImageUrlBtn" style="padding: 6px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Load</button>
            </div>
            <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Image Fit:</label>
            <select id="bgImageFit" class="property-input" style="width: 100%; padding: 6px 8px; margin-bottom: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px;">
              <option value="cover">Cover (Fill page)</option>
              <option value="contain">Contain (Fit within)</option>
              <option value="repeat">Repeat (Tile)</option>
              <option value="stretch">Stretch</option>
            </select>
            <button class="property-btn" id="applyBgImageBtn" style="width: 100%; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Apply Image</button>
          </div>

          <!-- Gradient Section -->
          <div class="property-group" style="border-top: 1px solid #e9ecef; padding-top: 12px;">
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Gradient</label>
            <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Type:</label>
            <select id="gradientType" class="property-input" style="width: 100%; padding: 6px 8px; margin-bottom: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 12px;">
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div style="flex: 1;">
                <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Color 1:</label>
                <input type="color" id="gradientColor1" value="#667eea" style="width: 100%; height: 36px; border: 2px solid #e9ecef; border-radius: 4px; cursor: pointer;">
              </div>
              <div style="flex: 1;">
                <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Color 2:</label>
                <input type="color" id="gradientColor2" value="#764ba2" style="width: 100%; height: 36px; border: 2px solid #e9ecef; border-radius: 4px; cursor: pointer;">
              </div>
            </div>
            <div id="linearGradientControls">
              <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Angle: <span id="gradientAngleValue">90</span>°</label>
              <input type="range" id="gradientAngle" min="0" max="360" value="90" style="width: 100%; margin-bottom: 8px;">
            </div>
            <button class="property-btn" id="applyGradientBtn" style="width: 100%; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Apply Gradient</button>
          </div>

          <!-- Opacity Section -->
          <div class="property-group" style="border-top: 1px solid #e9ecef; padding-top: 12px;">
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Opacity</label>
            <label style="font-size: 11px; font-weight: 600; display: block; margin-bottom: 4px;">Opacity: <span id="bgOpacityValue">100</span>%</label>
            <input type="range" id="bgOpacitySlider" min="0" max="100" value="100" style="width: 100%; margin-bottom: 8px;">
            <button class="property-btn" id="applyBgOpacityBtn" style="width: 100%; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Apply Opacity</button>
          </div>

          <!-- Clear Background -->
          <div class="property-group" style="border-top: 1px solid #e9ecef; padding-top: 12px;">
            <button class="property-btn" id="bgClearBtn" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
              <i class="bi bi-x-circle"></i> Clear Background
            </button>
          </div>
        </div>

        <!-- Drawing Panel (Floating) -->
        <div class="property-panel" id="drawingPanel" style="display: none; right: 300px; top: 150px; width: 280px;">
          <div class="property-title" style="cursor: move;" id="drawingPanelHeader">
            <span>✏️ Drawing Tools</span>
            <button class="property-close-btn" id="drawingCloseBtn" title="Close drawing panel">×</button>
          </div>

          <div class="property-group">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button class="property-btn" id="brushToolBtn" style="flex: 1; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                <i class="bi bi-brush"></i> Brush
              </button>
              <button class="property-btn" id="eraserToolBtn" style="flex: 1; padding: 8px; background: #f8f9fa; color: #212529; border: 1px solid #ced4da; border-radius: 6px; cursor: pointer; font-weight: 600;">
                <i class="bi bi-eraser"></i> Eraser
              </button>
            </div>

            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Brush Size: <span id="brushSizeValue">5</span>px</label>
            <input type="range" id="brushSizeSlider" min="1" max="50" value="5" style="width: 100%; margin-bottom: 12px;">

            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Brush Color</label>
            <div class="color-grid" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 12px;">
              <div class="color-swatch" style="background: #000000; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#000000"></div>
              <div class="color-swatch" style="background: #dc3545; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#dc3545"></div>
              <div class="color-swatch" style="background: #0d6efd; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#0d6efd"></div>
              <div class="color-swatch" style="background: #198754; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#198754"></div>
              <div class="color-swatch" style="background: #ffc107; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#ffc107"></div>
              <div class="color-swatch" style="background: #6610f2; aspect-ratio: 1; border-radius: 6px; cursor: pointer;" data-draw-color="#6610f2"></div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
              <input type="color" id="drawColorPicker" value="#000000" style="width: 40px; height: 32px; border: 2px solid #e9ecef; border-radius: 4px; cursor: pointer;">
              <span style="font-size: 12px; color: #6c757d;">Custom Color</span>
            </div>

            <button class="property-btn" id="clearDrawingsBtn" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 8px;">
              <i class="bi bi-trash"></i> Clear All Drawings
            </button>
          </div>
        </div>

        <!-- Grid & Guides Panel (Floating) -->
        <div class="property-panel" id="gridPanel" style="display: none; right: 350px; top: 150px; width: 300px;">
          <div class="property-title" style="cursor: move;" id="gridPanelHeader">
            <span>📐 Grid & Guides</span>
            <button class="property-close-btn" id="gridCloseBtn" title="Close grid panel">×</button>
          </div>

          <div class="property-group">
            <!-- Grid Toggle -->
            <label class="property-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;">
              <input type="checkbox" id="gridToggle" style="width: 18px; height: 18px; cursor: pointer;">
              <span style="font-weight: 600;">Show Grid</span>
            </label>

            <!-- Snap to Grid -->
            <label class="property-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; cursor: pointer;">
              <input type="checkbox" id="snapToggle" style="width: 18px; height: 18px; cursor: pointer;">
              <span style="font-weight: 600;">Snap to Grid</span>
            </label>

            <!-- Grid Spacing -->
            <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Grid Spacing</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 16px;">
              <button class="spacing-btn" data-spacing="10" style="padding: 8px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">10px</button>
              <button class="spacing-btn" data-spacing="20" style="padding: 8px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">20px</button>
              <button class="spacing-btn active" data-spacing="30" style="padding: 8px; background: #0d2747; color: white; border: 1px solid #0d2747; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">30px</button>
              <button class="spacing-btn" data-spacing="50" style="padding: 8px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">50px</button>
            </div>

            <!-- Guides Section -->
            <div style="border-top: 1px solid #e9ecef; padding-top: 12px; margin-top: 12px;">
              <label class="property-label" style="font-weight: 600; margin-bottom: 8px; display: block;">Guide Lines</label>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button class="property-btn" id="addVerticalGuide" style="flex: 1; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                  <i class="bi bi-arrow-bar-right"></i> Vertical
                </button>
                <button class="property-btn" id="addHorizontalGuide" style="flex: 1; padding: 8px; background: #0d2747; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                  <i class="bi bi-arrow-bar-down"></i> Horizontal
                </button>
              </div>
              <button class="property-btn" id="clearGuides" style="width: 100%; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                <i class="bi bi-trash"></i> Clear All Guides
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
      <div class="modern-editor-footer">
        <div id="wordCountStatus">Words: 0</div>
        <div style="display: flex; align-items: center; gap: 15px;">
           <div style="display: flex; align-items: center; gap: 8px;">
              <button id="zoomOutBtn" style="background:none; border:none; cursor:pointer; color:#64748b; font-size: 14px;"><i class="bi bi-dash-circle"></i></button>
              <input type="range" id="zoomSlider" min="50" max="200" value="100" step="10" style="width: 100px; cursor: pointer;">
              <button id="zoomInBtn" style="background:none; border:none; cursor:pointer; color:#64748b; font-size: 14px;"><i class="bi bi-plus-circle"></i></button>
              <span id="zoomValue" style="min-width: 45px; text-align: right;">100%</span>
           </div>
           <div style="width: 1px; height: 16px; background: #cbd5e1;"></div>
           <div id="pageStatus">Page 1 / 1</div>
        </div>
      </div>
  `;


  document.body.appendChild(modal);

  // Initialize multi-page system
  const canvasArea = document.getElementById('canvasArea');
  const zoomContainer = document.getElementById('zoomContainer');
  const pages = [];

  // Create cover page (Page 1)
  const coverPageContainer = createPageContainer(0);
  zoomContainer.appendChild(coverPageContainer);

  const coverCanvas = new fabric.Canvas('canvas-0', {
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff'
  });

  coverCanvas.undoStack = [];
  coverCanvas.redoStack = [];

  pages.push(coverCanvas);

  // Modern Cover Page Design
  // Gradient background
  const coverGradient = new fabric.Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 794, y2: 1123 },
    colorStops: [
      { offset: 0, color: '#0d2747' },
      { offset: 0.5, color: '#1a3a5f' },
      { offset: 1, color: '#0d2747' }
    ]
  });

  const coverBg = new fabric.Rect({
    left: 0,
    top: 0,
    width: 794,
    height: 1123,
    fill: coverGradient,
    selectable: true
  });
  coverCanvas.add(coverBg);

  // Decorative geometric shapes
  const circle1 = new fabric.Circle({
    left: -50,
    top: 100,
    radius: 120,
    fill: 'rgba(102, 126, 234, 0.15)',
    selectable: true
  });
  coverCanvas.add(circle1);

  const circle2 = new fabric.Circle({
    left: 650,
    top: 900,
    radius: 150,
    fill: 'rgba(102, 126, 234, 0.1)',
    selectable: true
  });
  coverCanvas.add(circle2);

  // Main title
  const coverTitle = new fabric.IText('VC', {
    left: 60,
    top: 400,
    fontSize: 72,
    fontWeight: 'bold',
    fill: '#ffffff',
    fontFamily: 'Georgia',
    originX: 'left',
    originY: 'center',
    charSpacing: 150,
    shadow: 'rgba(0,0,0,0.3) 3px 3px 6px',
    textAlign: 'left'
  });
  coverCanvas.add(coverTitle);

  const coverSubtitle = new fabric.IText('NEWSLETTER', {
    left: 397,
    top: 480,
    fontSize: 72,
    fontWeight: 'bold',
    fill: '#ffffff',
    fontFamily: 'Georgia',
    originX: 'center',
    originY: 'center',
    charSpacing: 150,
    shadow: 'rgba(0,0,0,0.3) 3px 3px 6px',
    textAlign: 'justify'
  });
  coverCanvas.add(coverSubtitle);

  // University name
  const universityName = new fabric.IText('East West University', {
    left: 397,
    top: 580,
    fontSize: 28,
    fill: '#ffffff',
    fontFamily: 'Arial',
    originX: 'center',
    originY: 'center',
    fontWeight: '300',
    textAlign: 'justify'
  });
  coverCanvas.add(universityName);

  // Date
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const coverDate = new fabric.IText(monthYear, {
    left: 397,
    top: 620,
    fontSize: 20,
    fill: '#667eea',
    fontFamily: 'Arial',
    originX: 'center',
    originY: 'center',
    fontWeight: '600',
    textAlign: 'justify'
  });
  coverCanvas.add(coverDate);

  // Decorative line
  const coverLine = new fabric.Line([297, 560, 497, 560], {
    stroke: '#667eea',
    strokeWidth: 3,
    selectable: true
  });
  coverCanvas.add(coverLine);

  // Create content page (Page 2)
  const contentPageContainer = createPageContainer(1);
  zoomContainer.appendChild(contentPageContainer);

  const contentCanvas = new fabric.Canvas('canvas-1', {
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff'
  });

  contentCanvas.undoStack = [];
  contentCanvas.redoStack = [];

  pages.push(contentCanvas);

  window.modernEditor = {
    canvas: contentCanvas, // Start with content page active
    pages: pages,
    currentPageIndex: 1, // Start on page 2
    items: items,
    canvasArea: canvasArea
  };

  // Add initial content to content page
  updateLoadingProgress(20, 'Adding content...');
  await addModernContent(contentCanvas, items);

  // Save initial state for undo for both canvases
  coverCanvas.undoStack.push(coverCanvas.toJSON());
  contentCanvas.undoStack.push(contentCanvas.toJSON());

  // Setup all event listeners - break into chunks to keep UI responsive
  updateLoadingProgress(90, 'Setting up events...');
  await new Promise(resolve => setTimeout(resolve, 50));

  // Setup all event listeners
  updateLoadingProgress(90, 'Setting up events...');
  await new Promise(resolve => setTimeout(resolve, 50));

  await setupModernEventsAsync();

  updateLoadingProgress(94, 'Events set up...');
  await new Promise(resolve => setTimeout(resolve, 50));

  // Populate sidebar
  updateLoadingProgress(95, 'Populating sidebar...');
  await new Promise(resolve => setTimeout(resolve, 50));
  populateModernSidebar(items);

  // Update page indicator and status bar
  updateLoadingProgress(98, 'Finalizing...');
  await new Promise(resolve => setTimeout(resolve, 50));
  updatePageIndicator();

  updateLoadingProgress(100, 'Ready!');
  await new Promise(resolve => setTimeout(resolve, 200));
  hideLoadingScreen();
}

function updatePageIndicator() {
  const indicator = document.getElementById('pageIndicator');
  if (indicator && window.modernEditor) {
    const current = window.modernEditor.currentPageIndex + 1;
    const total = window.modernEditor.pages.length;
    indicator.textContent = 'Page ' + current + ' of ' + total;
  }
}

function addPageAtIndex(insertIndex) {
  const pageIndex = insertIndex;

  // Shift existing pages up
  for (let i = window.modernEditor.pages.length - 1; i >= pageIndex; i--) {
    const oldContainer = document.getElementById('page-container-' + i);
    const oldCanvas = document.getElementById('canvas-' + i);

    if (oldContainer) {
      oldContainer.id = 'page-container-' + (i + 1);
      const label = oldContainer.querySelector('.page-label');
      if (label) {
        label.textContent = 'Page ' + (i + 2);
      }
      // Update delete button click handler
      const deleteBtn = oldContainer.querySelector('.page-delete-btn');
      if (deleteBtn) deleteBtn.onclick = () => deletePage(i + 1);
    }

    if (oldCanvas) {
      oldCanvas.id = 'canvas-' + (i + 1);
      // Update the canvas reference in the pages array
      window.modernEditor.pages[i + 1] = window.modernEditor.pages[i];
    }
  }

  // Create new page container
  const pageContainer = createPageContainer(pageIndex);
  const zoomContainer = document.getElementById('zoomContainer');

  // Insert at the correct position
  const referenceElement = pageIndex === 0 ? zoomContainer.firstChild : document.getElementById('page-container-' + (pageIndex - 1));
  if (referenceElement && referenceElement.nextSibling) {
    zoomContainer.insertBefore(pageContainer, referenceElement.nextSibling);
  } else if (referenceElement) {
    // If reference element is the last one
    zoomContainer.appendChild(pageContainer);
  } else {
    // If no reference element (e.g. inserting at 0 and it's empty, though unlikely)
    zoomContainer.insertBefore(pageContainer, zoomContainer.firstChild);
  }

  // Create new canvas
  const newCanvas = new fabric.Canvas('canvas-' + pageIndex, {
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff'
  });

  newCanvas.undoStack = [];
  newCanvas.redoStack = [];

  // Insert into pages array
  window.modernEditor.pages.splice(pageIndex, 0, newCanvas);
  window.modernEditor.currentPageIndex = pageIndex;
  window.modernEditor.canvas = newCanvas;

  setupCanvasEvents(newCanvas);

  // Add selection event listeners
  try {
    newCanvas.on('selection:created', (e) => {
      const idx = window.modernEditor.pages.indexOf(newCanvas);
      if (idx !== window.modernEditor.currentPageIndex) {
        switchToPage(idx);
      }
      refreshPropertyPanelValues(newCanvas, (e && e.selected && e.selected.length) ? e.selected[0] : (e && e.target) ? e.target : newCanvas.getActiveObject());
    });
    newCanvas.on('selection:updated', (e) => {
      const idx = window.modernEditor.pages.indexOf(newCanvas);
      if (idx !== window.modernEditor.currentPageIndex) {
        switchToPage(idx);
      }
      refreshPropertyPanelValues(newCanvas, (e && e.selected && e.selected.length) ? e.selected[0] : (e && e.target) ? e.target : newCanvas.getActiveObject());
    });
    newCanvas.on('selection:cleared', () => setTimeout(() => refreshPropertyPanelValues(newCanvas, null), 10));
  } catch (e) {
    // ignore
  }

  updatePageIndicator();
  if (typeof updateStatusBar === 'function') updateStatusBar();

  pageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addNewPage() {
  // Add page at the end
  addPageAtIndex(window.modernEditor.pages.length);
}

function deletePage(pageIndex) {
  if (window.modernEditor.pages.length <= 1) {
    alert('Cannot delete the last page. At least one page must remain.');
    return;
  }

  if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
    return;
  }

  // 1. Dispose of the canvas to be deleted
  const canvasToDelete = window.modernEditor.pages[pageIndex];
  if (canvasToDelete) {
    canvasToDelete.dispose();
  }

  // 2. Remove the DOM container
  const pageContainer = document.getElementById('page-container-' + pageIndex);
  if (pageContainer) {
    pageContainer.remove();
  }

  // 3. Remove from pages array
  window.modernEditor.pages.splice(pageIndex, 1);

  // 4. Renumber remaining pages (DOM only, preserve canvas instances)
  for (let i = pageIndex; i < window.modernEditor.pages.length; i++) {
    // The container currently has ID 'page-container-' + (i + 1)
    const oldIndex = i + 1;
    const container = document.getElementById('page-container-' + oldIndex);
    const canvasEl = document.getElementById('canvas-' + oldIndex);

    if (container) {
      // Update Container ID
      container.id = 'page-container-' + i;

      // Update Label
      const label = container.querySelector('.page-label');
      if (label) {
        label.textContent = 'Page ' + (i + 1);
      }

      // Update Delete Button Handler
      const deleteBtn = container.querySelector('.page-delete-btn');
      if (deleteBtn) {
        // We need to remove the old listener and add a new one, or just update the onclick property
        deleteBtn.onclick = () => deletePage(i);
      }
    }

    if (canvasEl) {
      // Update Canvas Element ID
      // Note: Fabric wrapper might complicate this, but usually the lower canvas has the ID
      // If Fabric is already initialized, the wrapper has class 'canvas-container' (confusing name clash with our page container)
      // But we are targeting the <canvas> element itself which Fabric wraps.
      // Actually, we don't strictly need to rename the canvas ID for Fabric to work, 
      // but it helps for consistency if we need to look it up later.
      canvasEl.id = 'canvas-' + i;
    }
  }

  // 5. Adjust current page index
  if (window.modernEditor.currentPageIndex >= window.modernEditor.pages.length) {
    window.modernEditor.currentPageIndex = window.modernEditor.pages.length - 1;
  } else if (window.modernEditor.currentPageIndex > pageIndex) {
    // If we were on a page after the deleted one, shift index down
    window.modernEditor.currentPageIndex--;
  }

  // If we deleted the current page, switch to the new current page (which is at the same index or one before)
  switchToPage(window.modernEditor.currentPageIndex);

  updatePageIndicator();
}

function duplicatePage(pageIndex) {
  const sourceCanvas = window.modernEditor.pages[pageIndex];

  // Add new page after the current one
  addPageAtIndex(pageIndex + 1);

  // Copy content to the new page (which is now at pageIndex + 1)
  const newCanvas = window.modernEditor.pages[pageIndex + 1];
  sourceCanvas.getObjects().forEach(obj => {
    obj.clone((cloned) => {
      newCanvas.add(cloned);
    });
  });

  newCanvas.renderAll();
  showTemporaryMessage('Page duplicated successfully');
}

function switchToPage(pageIndex) {
  if (pageIndex < 0 || pageIndex >= window.modernEditor.pages.length) return;

  window.modernEditor.currentPageIndex = pageIndex;
  window.modernEditor.canvas = window.modernEditor.pages[pageIndex];

  updatePageIndicator();
  if (typeof updateStatusBar === 'function') updateStatusBar();

  // Update status bar
  if (typeof updateStatusBar === 'function') {
    updateStatusBar();
  } else {
    // Fallback if function not yet defined in scope (though it should be)
    const pageStatus = document.getElementById('pageStatus');
    if (pageStatus) {
      const currentPage = window.modernEditor.currentPageIndex + 1;
      const totalPages = window.modernEditor.pages.length;
      pageStatus.textContent = `Page: ${currentPage} / ${totalPages}`;
    }
  }

  const pageContainer = document.getElementById('page-container-' + pageIndex);
  if (pageContainer) {
    pageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Generic function to make an element draggable via a handle
 * @param {string} elementId - ID of the element to move
 * @param {string} handleSelector - Selector for the handle within the element (optional, defaults to element itself)
 */
function makeElementDraggable(elementId, handleSelector) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const handle = handleSelector ? el.querySelector(handleSelector) : el;
  if (!handle) return;

  handle.style.cursor = 'move';

  let isDragging = false;
  let startX;
  let startY;
  let initialLeft = 0;
  let initialTop = 0;

  // Initialize create transform if not present
  if (!el.style.transform) {
    el.style.transform = 'translate(0px, 0px)';
  }

  handle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    // Only drag with left mouse button
    if (e.button !== 0) return;

    if (e.target === handle || handle.contains(e.target)) {
      // Prevent default to avoid text selection inside
      // e.preventDefault(); // CAREFUL: this might block input focus if handle contains inputs. 
      // Usually handle is a title bar, so it's fine.

      isDragging = true;
      el.classList.add('dragging');

      startX = e.clientX;
      startY = e.clientY;

      // Get current transform values
      const style = window.getComputedStyle(el);
      const matrix = new WebKitCSSMatrix(style.transform);
      initialLeft = matrix.m41;
      initialTop = matrix.m42;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newX = initialLeft + dx;
      const newY = initialTop + dy;

      el.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  }

  function dragEnd(e) {
    if (isDragging) {
      isDragging = false;
      el.classList.remove('dragging');
    }
  }
}



// Helper function to balance text for better typography
function balanceTextContent(text, maxWidth, fontSize, fontFamily) {
  if (!text || !text.trim()) return text;

  // Create a temporary DOM element to apply balance-text
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = maxWidth + 'px';
  tempDiv.style.fontSize = fontSize + 'px';
  tempDiv.style.fontFamily = fontFamily || 'Arial';
  tempDiv.style.lineHeight = '1.5';
  tempDiv.style.visibility = 'hidden';
  tempDiv.textContent = text;

  document.body.appendChild(tempDiv);

  let balancedText = text;

  // Apply balance-text if available
  if (typeof balanceText !== 'undefined') {
    try {
      balanceText(tempDiv);
      balancedText = tempDiv.textContent || tempDiv.innerText || text;
      console.log('✅ Applied balance-text library for better typography');
    } catch (e) {
      console.warn('Balance-text failed, using fallback balancing:', e);
      balancedText = fallbackTextBalancing(text, maxWidth, fontSize);
    }
  } else {
    // Fallback text balancing if balance-text library is not available
    console.log('📝 Using fallback text balancing algorithm');
    balancedText = fallbackTextBalancing(text, maxWidth, fontSize);
  }

  // Clean up
  document.body.removeChild(tempDiv);

  return balancedText;
}

// Fallback text balancing algorithm
function fallbackTextBalancing(text, maxWidth, fontSize) {
  if (!text || text.length < 50) return text; // Don't balance short text

  const words = text.split(' ');
  if (words.length < 6) return text; // Don't balance very short text

  // Estimate characters per line based on width and font size
  const avgCharWidth = fontSize * 0.6; // Rough estimate
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);

  // Try to balance by finding optimal line breaks
  const lines = [];
  let currentLine = '';
  let bestBreakPoint = -1;
  let minDifference = Infinity;

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? ' ' : '') + words[i];

    if (testLine.length > charsPerLine * 1.2) { // Allow some overflow
      // Find the best break point in the last few words
      const startIdx = Math.max(0, i - 3);
      for (let j = startIdx; j < i; j++) {
        const line1 = words.slice(lines.length === 0 ? 0 : lines[lines.length - 1].split(' ').length, j + 1).join(' ');
        const line2 = words.slice(j + 1, i + 1).join(' ');

        const diff = Math.abs(line1.length - line2.length);
        if (diff < minDifference) {
          minDifference = diff;
          bestBreakPoint = j;
        }
      }

      if (bestBreakPoint >= 0) {
        const lineWords = words.slice(lines.length === 0 ? 0 : lines[lines.length - 1].split(' ').length, bestBreakPoint + 1);
        lines.push(lineWords.join(' '));
        currentLine = words.slice(bestBreakPoint + 1, i + 1).join(' ');
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

// Function to clean paragraphs by removing gaps and adjusting line breaks
function cleanParagraphs() {
  const canvas = window.modernEditor.canvas;
  if (!canvas) return;

  let cleanedCount = 0;

  // Get all text objects on the current canvas
  const objects = canvas.getObjects();

  objects.forEach(obj => {
    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const originalText = obj.text || '';

      if (originalText.trim()) {
        // Clean the text
        let cleanedText = originalText;

        // Step 1: Handle special characters and non-breaking spaces
        cleanedText = cleanedText.replace(/\u00A0/g, ' '); // Non-breaking spaces to regular spaces
        cleanedText = cleanedText.replace(/\u200B/g, ''); // Zero-width spaces
        cleanedText = cleanedText.replace(/\u200C/g, ''); // Zero-width non-joiners
        cleanedText = cleanedText.replace(/\u200D/g, ''); // Zero-width joiners
        cleanedText = cleanedText.replace(/\uFEFF/g, ''); // Byte order marks

        // Step 2: Remove excessive whitespace - be more aggressive
        cleanedText = cleanedText.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
        cleanedText = cleanedText.replace(/\n\s+/g, '\n'); // Spaces after line breaks
        cleanedText = cleanedText.replace(/\s+\n/g, '\n'); // Spaces before line breaks

        // Step 3: Fix line breaks
        cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
        cleanedText = cleanedText.replace(/^\n+|\n+$/g, ''); // Remove leading/trailing line breaks

        // Step 4: Fix punctuation spacing - comprehensive approach
        // Remove spaces before punctuation
        cleanedText = cleanedText.replace(/\s+([,.!?;:])/g, '$1');
        // Remove spaces before closing quotes and brackets
        cleanedText = cleanedText.replace(/\s+([)"'\]])/g, '$1');
        // Ensure space after punctuation (but not at end of text)
        cleanedText = cleanedText.replace(/([,.!?;:])(?!\s*$)\s*/g, '$1 ');
        // Ensure space after opening quotes and brackets
        cleanedText = cleanedText.replace(/([("'\[])(?!\s)/g, '$1 ');

        // Step 5: Handle quotes properly
        cleanedText = cleanedText.replace(/"\s+/g, '"'); // Remove space after opening quote
        cleanedText = cleanedText.replace(/\s+"/g, '"'); // Remove space before closing quote
        cleanedText = cleanedText.replace(/'\s+/g, "'"); // Remove space after opening single quote
        cleanedText = cleanedText.replace(/\s+'/g, "'"); // Remove space before closing single quote

        // Step 6: Fix spacing around hyphens and dashes
        cleanedText = cleanedText.replace(/\s*-\s*/g, '-'); // No spaces around hyphens
        cleanedText = cleanedText.replace(/\s*—\s*/g, ' — '); // Spaces around em dashes
        cleanedText = cleanedText.replace(/\s*–\s*/g, ' – '); // Spaces around en dashes

        // Step 7: Final cleanup
        cleanedText = cleanedText.replace(/\s+/g, ' '); // Any remaining multiple spaces
        cleanedText = cleanedText.trim(); // Final trim

        // Step 8: Handle empty lines and paragraphs
        cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n'); // Ensure proper paragraph breaks

        // Update the object if text changed
        if (cleanedText !== originalText) {
          obj.set('text', cleanedText);
          cleanedCount++;
        }
      }
    }
  });

  // Render the canvas
  canvas.renderAll();

  // Show feedback
  if (cleanedCount > 0) {
    showTemporaryMessage(`Cleaned ${cleanedCount} text element${cleanedCount > 1 ? 's' : ''} - removed gaps and fixed spacing`);
  } else {
    showTemporaryMessage('No text elements needed cleaning');
  }
}

async function addModernContent(canvas, items) {
  let y = 60;

  // Deduplicate items with preference for bold text
  const itemGroups = new Map();

  items.forEach(item => {
    // Create a key based on content (ignoring formatting for the key)
    // Aggressive normalization: lowercase and remove ALL non-alphanumeric characters
    const cleanTitle = (getTitleForItem(item) || '').replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanText = (item.fullText || '').replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    let key;
    // If we have substantial text, rely on that for deduplication (ignoring title which might vary)
    if (cleanText.length > 30) {
      key = `${item.category}|${cleanText.substring(0, 300)}`;
    } else {
      // Fallback to title + text for short items
      key = `${item.category}|${cleanTitle}|${cleanText}`;
    }

    if (!itemGroups.has(key)) {
      itemGroups.set(key, []);
    }
    itemGroups.get(key).push(item);
  });

  const uniqueItems = [];
  itemGroups.forEach(group => {
    if (group.length === 1) {
      uniqueItems.push(group[0]);
    } else {
      // If duplicates exist, prefer the one with bold formatting
      const boldItem = group.find(item => {
        const title = getTitleForItem(item) || '';
        const text = item.fullText || '';
        return title.includes('<b>') || title.includes('<strong>') ||
          text.includes('<b>') || text.includes('<strong>') ||
          (item.style && item.style.fontWeight === 'bold');
      });
      uniqueItems.push(boldItem || group[0]);
    }
  });

  // Modern Newsletter Header with gradient and decorative elements
  const headerGradient = new fabric.Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 794, y2: 140 },
    colorStops: [
      { offset: 0, color: '#0d2747' },
      { offset: 0.5, color: '#1a3a5f' },
      { offset: 1, color: '#0d2747' }
    ]
  });

  const headerBg = new fabric.Rect({
    left: 0,
    top: 0,
    width: 794,
    height: 160,
    fill: headerGradient,
    selectable: true
  });
  canvas.add(headerBg);

  // Decorative accent bars
  const accentBar1 = new fabric.Rect({
    left: 0,
    top: 0,
    width: 794,
    height: 4,
    fill: '#667eea',
    selectable: true
  });
  canvas.add(accentBar1);

  const accentBar2 = new fabric.Rect({
    left: 0,
    top: 156,
    width: 794,
    height: 4,
    fill: '#667eea',
    selectable: true
  });
  canvas.add(accentBar2);

  // Main title with shadow effect
  const title = new fabric.IText('VC NEWSLETTER', {
    left: 397,
    top: 50,
    fontSize: 52,
    fontWeight: 'bold',
    fill: '#ffffff',
    fontFamily: 'Georgia',
    charSpacing: 120,
    originX: 'center',
    shadow: 'rgba(0,0,0,0.3) 2px 2px 4px',
    textAlign: 'justify'
  });
  canvas.add(title);

  // Subtitle with date
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const subtitle = new fabric.IText(`East West University • ${monthYear}`, {
    left: 397,
    top: 115,
    fontSize: 18,
    fill: '#ffffff',
    fontFamily: 'Arial',
    originX: 'center',
    originY: 'center',
    fontWeight: '600',
    textAlign: 'justify'
  });
  canvas.add(subtitle);

  y = 180;

  // Decorative line under header
  const decorativeLine = new fabric.Line([60, y, 734, y], {
    stroke: '#667eea',
    strokeWidth: 2,
    selectable: true
  });
  canvas.add(decorativeLine);
  y += 35;

  // Helper function to create text with italic support
  function createTextWithItalics(text, options) {
    // Ensure textAlign is set to justify by default
    if (!options.textAlign) {
      options.textAlign = 'justify';
    }

    // Check if text contains <i> tags
    if (!text.includes('<i>') && !text.includes('</i>')) {
      // No italic tags, create simple text
      return new fabric.Textbox(text, options);
    }

    // Parse HTML and create text with styles
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Create textbox with plain text
    const textbox = new fabric.Textbox(plainText, options);

    // Find italic sections and apply styling
    const italicRegex = /<i>(.*?)<\/i>/g;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      const italicText = match[1];
      const beforeText = text.substring(0, match.index).replace(/<\/?i>/g, '');
      const startIndex = beforeText.length;
      const endIndex = startIndex + italicText.length;

      // Apply italic style to this range
      if (textbox.setSelectionStyles) {
        textbox.setSelectionStyles({
          fontStyle: 'italic'
        }, startIndex, endIndex);
      }
    }

    return textbox;
  }

  // Define categories
  const categories = [
    { id: 'research-grant', name: 'Research Grant' },
    { id: 'journal-publications', name: 'Journal Publications' },
    { id: 'book-chapters', name: 'Book Chapter' },
    { id: 'books-and-edited-books', name: 'Books & Edited Books' },
    { id: 'conference-proceeding', name: 'Conference Proceeding' },
    { id: 'conference-presentation', name: 'Conference Presentation' },
    { id: 'seminar-and-workshop', name: 'Seminar & Workshop' },
    { id: 'media', name: 'Media' },
    { id: 'achievements', name: 'Achievements' }
  ];

  // Categorize unique items only
  const categorizedItems = {};
  categories.forEach(cat => {
    categorizedItems[cat.id] = [];
  });

  uniqueItems.forEach(item => {
    const categoryKey = normalizeCategoryKey(item.category);
    const matchedKey = findBestCategoryMatch(item.category, categories);
    if (categorizedItems[categoryKey]) {
      categorizedItems[categoryKey].push(item);
    } else if (matchedKey && categorizedItems[matchedKey]) {
      categorizedItems[matchedKey].push(item);
    }
  });

  // Calculate total items for progress tracking
  let totalItems = 0;
  categories.forEach(cat => {
    if (categorizedItems[cat.id]) totalItems += categorizedItems[cat.id].length;
  });

  let processedItems = 0;

  // Add each category section (only if it has articles)
  for (const category of categories) {
    const categoryItems = categorizedItems[category.id] || [];

    // Skip empty categories
    if (categoryItems.length === 0) {
      continue;
    }

    // Check if we need a new page
    // Always start a new category on a new page, unless it's the very first category on the first page
    if (processedItems > 0 || y > 500) {
      addNewPage();
      canvas = window.modernEditor.pages[window.modernEditor.pages.length - 1];
      y = 60;
    } else if (y > 950) {
      // Fallback for first category if it doesn't fit
      addNewPage();
      canvas = window.modernEditor.pages[window.modernEditor.pages.length - 1];
      y = 60;
    }

    // Category header
    const categoryHeader = new fabric.Textbox(category.name.toUpperCase(), {
      left: 60,
      top: y,
      width: 674,
      fontSize: 20,
      fontWeight: 'bold',
      fill: '#667eea',
      fontFamily: 'Arial',
      backgroundColor: '#f0f4ff',
      padding: 10,
      textAlign: 'justify'
    });
    canvas.add(categoryHeader);
    y += categoryHeader.height + 20;

    // Horizontal divider line
    const divider = new fabric.Line([60, y, 734, y], {
      stroke: '#667eea',
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockScalingY: true
    });
    canvas.add(divider);
    y += 20;

    // Add items in this category
    for (const item of categoryItems) {
      // Check if we need a new page
      if (y > 950) {
        addNewPage();
        canvas = window.modernEditor.pages[window.modernEditor.pages.length - 1];
        y = 60;
      }

      // Title - with italic support, ALWAYS bold
      const titleText = getTitleForItem(item);
      const itemTitle = createTextWithItalics(titleText, {
        left: 60,
        top: y,
        width: 674,
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#212529',
        fontFamily: 'Georgia',
        textAlign: 'justify'
      });

      // Force bold on the entire title - apply to all characters
      if (itemTitle.setSelectionStyles) {
        for (let i = 0; i < titleText.replace(/<\/?i>/g, '').length; i++) {
          itemTitle.setSelectionStyles({
            fontWeight: 'bold'
          }, i, i + 1);
        }
      }
      // Also set the base fontWeight property
      itemTitle.fontWeight = 'bold';

      canvas.add(itemTitle);
      y += itemTitle.height + 15;

      // Check for Image (Photo)
      const photoUrl = item.image || (item.formData && item.formData.photo) || item.photo;
      if (photoUrl) {
        try {
          // Convert relative path to full URL using helper function
          const fullImageUrl = getImageUrl(photoUrl);
          // Verify if it's a valid data URL or http link
          if (typeof fullImageUrl === 'string' && (fullImageUrl.startsWith('data:image') || fullImageUrl.startsWith('http'))) {
            console.log('📸 Loading image:', photoUrl, '→', fullImageUrl);
            await new Promise((resolve) => {
              fabric.Image.fromURL(fullImageUrl, (img) => {
                if (!img || !img.width || !img.height) {
                  console.warn('⚠️ Image failed to load or has no dimensions:', fullImageUrl);
                  resolve();
                  return;
                }
                console.log('✅ Image loaded successfully:', img.width, 'x', img.height);

                // Constrain image size
                const maxWidth = 300;
                const maxHeight = 300;

                if (img.width > maxWidth) {
                  img.scaleToWidth(maxWidth);
                }
                // Check height after width scale, or if width was ok, check height
                if (img.getScaledHeight() > maxHeight) {
                  img.scaleToHeight(maxHeight);
                }

                img.set({
                  left: 60,
                  top: y,
                  originX: 'left',
                  originY: 'top'
                });

                canvas.add(img);
                y += img.getScaledHeight() + 15;
                resolve();
              }, { crossOrigin: 'anonymous' });
            });
          }
        } catch (e) {
          console.error('❌ Error loading image:', photoUrl, e);
        }
      }

      // Body - with italic support
      // Remove title from body if it appears at the start to avoid duplication
      let rawBodyText = item.fullText || '';
      // Normalize both for comparison (remove HTML tags, trim)
      const normTitle = titleText.replace(/<[^>]*>/g, '').trim();
      const normBodyStart = rawBodyText.replace(/<[^>]*>/g, '').trim().substring(0, normTitle.length);

      if (normBodyStart === normTitle) {
        // If body starts with title, remove it
        // We need to be careful with the original string to preserve other formatting if possible, 
        // but since we are stripping tags for comparison, let's just try to remove the exact string first
        if (rawBodyText.startsWith(titleText)) {
          rawBodyText = rawBodyText.substring(titleText.length);
        } else if (rawBodyText.startsWith(normTitle)) {
          rawBodyText = rawBodyText.substring(normTitle.length);
        } else {
          // Fuzzy removal: find where the title ends in the body
          const titleIndex = rawBodyText.indexOf(normTitle);
          if (titleIndex === 0) {
            rawBodyText = rawBodyText.substring(normTitle.length);
          }
        }
      }

      rawBodyText = rawBodyText.trim();
      // Remove leading punctuation like " - " or ":" that might remain
      rawBodyText = rawBodyText.replace(/^[\s\-:]+/, '');

      const bodyText = rawBodyText.substring(0, 500) + (rawBodyText.length > 500 ? '...' : '');
      const body = createTextWithItalics(bodyText, {
        left: 60,
        top: y,
        width: 674,
        fontSize: 13,
        fill: '#495057',
        fontFamily: 'Arial',
        lineHeight: 1.5,
        textAlign: 'justify'
      });
      canvas.add(body);
      y += body.height + 25;

      // Update progress
      processedItems++;
      const progress = 20 + (processedItems / totalItems) * 70; // Map to 20-90% range
      updateLoadingProgress(progress, `Adding item ${processedItems} of ${totalItems}...`);

      // Yield to UI every 3 items to keep interface responsive
      if (processedItems % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    y += 20; // Extra space after category
  }
}


function normalizeCategoryKey(category) {
  if (!category) return '';
  return category.toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function findBestCategoryMatch(category, categories) {
  if (!category) return null;

  const normalized = category.toLowerCase();

  // Direct matches
  const directMatch = categories.find(cat =>
    normalized.includes(cat.id.replace(/-/g, '')) ||
    cat.id.replace(/-/g, '').includes(normalized.replace(/[\s_-]/g, ''))
  );

  if (directMatch) return directMatch.id;

  // Keyword matches
  const keywordMap = {
    'research': 'research-grant',
    'grant': 'research-grant',
    'journal': 'journal-publications',
    'publication': 'journal-publications',
    'chapter': 'book-chapters',
    'book': 'books-and-edited-books',
    'proceeding': 'conference-proceeding',
    'presentation': 'conference-presentation',
    'conference': 'conference-proceeding',
    'seminar': 'seminar-and-workshop',
    'workshop': 'seminar-and-workshop',
    'media': 'media',
    'achievement': 'achievements',
    'award': 'achievements'
  };

  for (const [keyword, catId] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return catId;
    }
  }

  return null;
}

function setupCanvasEvents(canvas) {
  // Prevent duplicate event setup
  if (canvas._eventsSetup) return;
  canvas._eventsSetup = true;

  // Save state for undo/redo
  const saveState = () => {
    canvas.undoStack.push(canvas.toJSON());
    canvas.redoStack = [];
    // Limit stack size
    if (canvas.undoStack.length > 50) canvas.undoStack.shift();
  };

  canvas.on('object:modified', saveState);
  canvas.on('object:added', saveState);
  canvas.on('object:removed', saveState);
  canvas.on('text:changed', saveState);

  // Auto-select page on click
  canvas.on('mouse:down', () => {
    if (window.modernEditor && window.modernEditor.pages) {
      const index = window.modernEditor.pages.indexOf(canvas);
      if (index !== -1 && index !== window.modernEditor.currentPageIndex) {
        switchToPage(index);
      }
    }
  });

  // Property panel events are handled in setupModernEvents to ensure page switching

  // Enhanced cross-page drag and drop with visual feedback
  let dragIndicator = null;

  canvas.on('object:moving', (e) => {
    const obj = e.target;
    const canvasHeight = canvas.height;
    const canvasWidth = canvas.width;
    const currentIndex = window.modernEditor.pages.length > 0 ?
      window.modernEditor.pages.indexOf(canvas) : 0;

    // Remove any existing indicator
    if (dragIndicator) {
      canvas.remove(dragIndicator);
      dragIndicator = null;
    }

    // Check if dragging near bottom edge (within 80px)
    if (obj.top + obj.height > canvasHeight - 80) {
      const nextIndex = currentIndex + 1;

      // If there's a next page, show visual indicator
      if (nextIndex < window.modernEditor.pages.length) {
        canvas.set('backgroundColor', '#e8f4ff'); // Blue highlight

        // Add arrow indicator
        dragIndicator = new fabric.Text('↓ Drop here to move to Page ' + (nextIndex + 1), {
          left: canvasWidth / 2,
          top: canvasHeight - 40,
          fontSize: 16,
          fill: '#667eea',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 10
        });
        canvas.add(dragIndicator);
        canvas.renderAll();
      }
    } else if (obj.top < 80) {
      // Check if dragging near top edge
      const prevIndex = currentIndex - 1;

      // If there's a previous page, show visual indicator
      if (prevIndex >= 0) {
        canvas.set('backgroundColor', '#e8f4ff'); // Blue highlight

        // Add arrow indicator
        dragIndicator = new fabric.Text('↑ Drop here to move to Page ' + (prevIndex + 1), {
          left: canvasWidth / 2,
          top: 40,
          fontSize: 16,
          fill: '#667eea',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 10
        });
        canvas.add(dragIndicator);
        canvas.renderAll();
      }
    } else {
      // Reset background
      canvas.set('backgroundColor', '#ffffff');
      canvas.renderAll();
    }
  });

  canvas.on('object:modified', (e) => {
    const obj = e.target;
    const canvasHeight = canvas.height;
    const currentIndex = window.modernEditor.pages.length > 0 ?
      window.modernEditor.pages.indexOf(canvas) : 0;

    // Remove drag indicator if exists
    if (dragIndicator) {
      canvas.remove(dragIndicator);
      dragIndicator = null;
    }

    // Check if object was dropped near bottom edge (within 60px)
    if (obj.top + obj.height > canvasHeight - 60) {
      const nextIndex = currentIndex + 1;

      if (nextIndex < window.modernEditor.pages.length) {
        // Automatically move to next page
        obj.clone((cloned) => {
          canvas.remove(obj);
          canvas.set('backgroundColor', '#ffffff');
          canvas.renderAll();

          const nextCanvas = window.modernEditor.pages[nextIndex];
          cloned.set({ top: 60 }); // Position near top of next page
          nextCanvas.add(cloned);
          cloned.bringToFront(); // Bring element to front
          nextCanvas.renderAll();

          // Show success message
          showTemporaryMessage('Element moved to Page ' + (nextIndex + 1));

          // Switch to next page and select the moved element
          setTimeout(() => {
            switchToPage(nextIndex);
            nextCanvas.setActiveObject(cloned);
            nextCanvas.renderAll();
          }, 300);
        });
      } else {
        // No next page, keep on current page
        obj.set({ top: canvasHeight - obj.height - 60 });
        canvas.set('backgroundColor', '#ffffff');
        canvas.renderAll();
      }
    } else if (obj.top < 60) {
      // Check if dropped near top edge
      const prevIndex = currentIndex - 1;

      if (prevIndex >= 0) {
        // Automatically move to previous page
        obj.clone((cloned) => {
          canvas.remove(obj);
          canvas.set('backgroundColor', '#ffffff');
          canvas.renderAll();

          const prevCanvas = window.modernEditor.pages[prevIndex];
          cloned.set({ top: prevCanvas.height - cloned.height - 60 }); // Position near bottom of prev page
          prevCanvas.add(cloned);
          cloned.bringToFront(); // Bring element to front
          prevCanvas.renderAll();

          // Show success message
          showTemporaryMessage('Element moved to Page ' + (prevIndex + 1));

          // Switch to previous page and select the moved element
          setTimeout(() => {
            switchToPage(prevIndex);
            prevCanvas.setActiveObject(cloned);
            prevCanvas.renderAll();
          }, 300);
        });
      } else {
        // No previous page, keep on current page
        obj.set({ top: 60 });
        canvas.set('backgroundColor', '#ffffff');
        canvas.renderAll();
      }
    } else {
      // Reset background
      canvas.set('backgroundColor', '#ffffff');
      canvas.renderAll();
    }
  });
}

function showTemporaryMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
  position: fixed;
  top: 100px;
  left: 50 %;
  transform: translateX(-50 %);
  background: linear - gradient(135deg, #667eea 0 %, #764ba2 100 %);
  color: white;
  padding: 16px 32px;
  border - radius: 8px;
  font - weight: 600;
  font - size: 14px;
  box - shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z - index: 10001;
  opacity: 0;
  transition: opacity 0.3s ease;
  `;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  // Fade in
  setTimeout(() => {
    messageDiv.style.opacity = '1';
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 300);
  }, 2000);
}

function showPropertyPanel(canvas, e) {
  // Prefer the event target (selection event) if provided, otherwise fall back to canvas.getActiveObject()
  const obj = (e && e.selected && e.selected.length ? e.selected[0] : (e && e.target) ? e.target : canvas.getActiveObject());
  refreshPropertyPanelValues(canvas, obj);
}

// Helpers to apply changes to single objects or groups/selections
function forEachObjectInTarget(target, cb) {
  if (!target) return;
  // Active selection or group - handle fabric's activeSelection and groups
  if (typeof target.forEachObject === 'function') {
    target.forEachObject(o => cb(o));
    return;
  }

  if (target.type === 'activeSelection' || target.type === 'group') {
    const objs = target._objects || (typeof target.getObjects === 'function' ? target.getObjects() : []);
    objs.forEach(o => cb(o));
    return;
  }

  // single object
  cb(target);
}

function findFirstTextInTarget(target) {
  if (!target) return null;
  // If the target has forEachObject, iterate and return first text
  if (typeof target.forEachObject === 'function') {
    let found = null;
    target.forEachObject(o => {
      if (found) return;
      if (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox') found = o;
      // Also search nested groups
      if (!found && (o.type === 'group' || typeof o.forEachObject === 'function')) {
        const nested = findFirstTextInTarget(o);
        if (nested) found = nested;
      }
    });
    return found;
  }

  if (target.type === 'activeSelection' || target.type === 'group') {
    const objs = target._objects || (typeof target.getObjects === 'function' ? target.getObjects() : []);
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox') return o;
      if (o.type === 'group' || typeof o.forEachObject === 'function') {
        const nested = findFirstTextInTarget(o);
        if (nested) return nested;
      }
    }
    return null;
  }

  if (target.type === 'i-text' || target.type === 'text' || target.type === 'textbox') return target;
  return null;
}

function updateColorSwatchSelection(obj) {
  try {
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(s => s.style.outline = 'none');

    if (!obj) return;
    // prefer fill, then stroke
    const color = obj.fill || obj.stroke;
    if (!color) return;
    const match = Array.from(swatches).find(s => s.dataset.color && s.dataset.color.toLowerCase() === color.toLowerCase());
    if (match) match.style.outline = '3px solid rgba(102,126,234,0.28)';
  } catch (e) {
    // ignore
  }
}

// Centralized refresh function for property panel values
function refreshPropertyPanelValues(canvas, explicitObj) {
  const panel = document.getElementById('propertyPanel');
  console.log('refreshPropertyPanelValues called', { explicitObj: !!explicitObj, panel: !!panel });

  if (!panel) {
    console.error('Property Panel element not found in DOM');
    return;
  }

  const currentCanvas = canvas;
  const obj = explicitObj || (currentCanvas ? currentCanvas.getActiveObject() : null);
  console.log('Selected object:', obj ? obj.type : 'none');

  const fontFamilySelect = document.getElementById('fontFamilySelect');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const opacityInput = document.getElementById('opacityInput');

  if (!obj) {
    console.log('No object selected, hiding panel');
    panel.classList.remove('active');
    panel.style.display = 'none';
    if (fontFamilySelect) fontFamilySelect.disabled = true;
    if (fontSizeInput) fontSizeInput.disabled = true;
    if (opacityInput) opacityInput.disabled = true;
    updateColorSwatchSelection(null);
    return;
  }

  console.log('Object selected, SHOWING panel');
  panel.classList.add('active');
  panel.style.display = 'block';

  // Find first text inside selection if any
  const textObj = findFirstTextInTarget(obj);

  if (fontFamilySelect) {
    if (textObj) {
      fontFamilySelect.disabled = false;
      fontFamilySelect.value = textObj.fontFamily || 'Arial';
    } else {
      fontFamilySelect.disabled = true;
      fontFamilySelect.value = 'Arial';
    }
  }

  if (fontSizeInput) {
    if (textObj) {
      fontSizeInput.disabled = false;
      fontSizeInput.value = textObj.fontSize || 16;
    } else {
      fontSizeInput.disabled = true;
      fontSizeInput.value = 16;
    }
  }

  if (opacityInput) {
    const val = (obj && obj.opacity !== undefined) ? obj.opacity : 1;
    opacityInput.disabled = false;
    opacityInput.value = val;
  }

  // toolbar states
  if (textObj) {
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    if (boldBtn) boldBtn.classList.toggle('active', textObj.fontWeight === 'bold');
    if (italicBtn) italicBtn.classList.toggle('active', textObj.fontStyle === 'italic');
    if (underlineBtn) underlineBtn.classList.toggle('active', textObj.underline === true);

    // Alignment state
    const alignLeftBtn = document.getElementById('alignLeftBtn');
    const alignCenterBtn = document.getElementById('alignCenterBtn');
    const alignRightBtn = document.getElementById('alignRightBtn');
    const alignJustifyBtn = document.getElementById('alignJustifyBtn');
    const alignJustifyLeftBtn = document.getElementById('alignJustifyLeftBtn');
    const alignJustifyRightBtn = document.getElementById('alignJustifyRightBtn');

    if (alignLeftBtn) alignLeftBtn.classList.toggle('active', textObj.textAlign === 'left');
    if (alignCenterBtn) alignCenterBtn.classList.toggle('active', textObj.textAlign === 'center');
    if (alignRightBtn) alignRightBtn.classList.toggle('active', textObj.textAlign === 'right');
    if (alignJustifyBtn) alignJustifyBtn.classList.toggle('active', textObj.textAlign === 'justify');
    // Check for both 'justify' (legacy/default) and 'justify-left' for the left button
    if (alignJustifyLeftBtn) alignJustifyLeftBtn.classList.toggle('active', textObj.textAlign === 'justify-left');
    if (alignJustifyRightBtn) alignJustifyRightBtn.classList.toggle('active', textObj.textAlign === 'justify-right');
  } else {
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    if (boldBtn) boldBtn.classList.remove('active');
    if (italicBtn) italicBtn.classList.remove('active');
    if (underlineBtn) underlineBtn.classList.remove('active');
  }

  updateColorSwatchSelection(textObj || obj);

  // Update color picker value
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker && obj) {
    const color = obj.fill || obj.stroke || '#667eea';
    colorPicker.value = color;
  }
}

// Global keyboard shortcuts handler
function setupGlobalKeyboardShortcuts() {
  // Prevent duplicate setup
  if (window._keyboardShortcutsSetup) return;
  window._keyboardShortcutsSetup = true;

  document.addEventListener('keydown', (e) => {
    // Skip if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
      return;
    }

    const canvas = window.modernEditor ? window.modernEditor.canvas : null;
    if (!canvas) return;

    const obj = canvas.getActiveObject();

    // Ctrl+Z - Undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // Ctrl+Y - Redo
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redo();
      return;
    }

    // Ctrl+Shift+Z - Redo (alternative)
    if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
      e.preventDefault();
      redo();
      return;
    }

    // Delete key
    if (e.key === 'Delete') {
      const activeSelection = canvas.getActiveObject();
      if (activeSelection) {
        if (activeSelection.type === 'activeSelection') {
          // Multiple objects selected
          activeSelection.forEachObject((obj) => {
            canvas.remove(obj);
          });
          canvas.discardActiveObject();
        } else {
          // Single object selected
          canvas.remove(activeSelection);
        }
        canvas.renderAll();
      }
      return;
    }

    // Ctrl+D - Duplicate
    if (e.ctrlKey && e.key === 'd' && obj) {
      e.preventDefault();
      obj.clone((cloned) => {
        cloned.set({ left: cloned.left + 10, top: cloned.top + 10 });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
      return;
    }

    // Ctrl+B - Bold
    if (e.ctrlKey && e.key === 'b' && obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
      e.preventDefault();
      const newWeight = obj.fontWeight === 'bold' ? 'normal' : 'bold';
      obj.set('fontWeight', newWeight);
      canvas.renderAll();
      return;
    }

    // Ctrl+I - Italic
    if (e.ctrlKey && e.key === 'i' && obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
      e.preventDefault();
      const newStyle = obj.fontStyle === 'italic' ? 'normal' : 'italic';
      obj.set('fontStyle', newStyle);
      canvas.renderAll();
      return;
    }

    // Ctrl+U - Underline
    if (e.ctrlKey && e.key === 'u' && obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
      e.preventDefault();
      const newUnderline = !obj.underline;
      obj.set('underline', newUnderline);
      canvas.renderAll();
      return;
    }
  });
}

// Async wrapper to allow progress updates during event setup
async function setupModernEventsAsync() {
  console.log('Starting setupModernEventsAsync...');

  // Update progress periodically during setup
  updateLoadingProgress(91, 'Setting up toolbar...');
  await new Promise(resolve => setTimeout(resolve, 10));

  // Break setup into smaller chunks
  await setupUndoRedo();
  updateLoadingProgress(91.5, 'Setting up canvas events...');
  await new Promise(resolve => setTimeout(resolve, 10));

  await setupCanvasEventsForPages();
  updateLoadingProgress(92, 'Setting up navigation...');
  await new Promise(resolve => setTimeout(resolve, 10));

  await setupPageNavigation();
  updateLoadingProgress(92.5, 'Setting up zoom...');
  await new Promise(resolve => setTimeout(resolve, 10));

  await setupZoomControls();
  updateLoadingProgress(93, 'Setting up tools...');
  await new Promise(resolve => setTimeout(resolve, 10));

  await setupTextAndFormatting();
  updateLoadingProgress(93.5, 'Setting up panels...');
  await new Promise(resolve => setTimeout(resolve, 10));

  await setupAllPanels();

  // Setup global keyboard shortcuts
  updateLoadingProgress(94, 'Setting up keyboard shortcuts...');
  await new Promise(resolve => setTimeout(resolve, 10));
  setupGlobalKeyboardShortcuts();

  updateLoadingProgress(95, 'Finalizing setup...');
  await new Promise(resolve => setTimeout(resolve, 10));
}

// Break setupModernEvents into smaller async chunks
async function setupUndoRedo() {
  // Undo/redo functions
  function undo() {
    const canvas = window.modernEditor.canvas;
    if (canvas.undoStack.length > 0) {
      canvas.redoStack.push(canvas.toJSON());
      canvas.loadFromJSON(canvas.undoStack.pop(), () => {
        canvas.renderAll();
      });
    }
  }

  function redo() {
    const canvas = window.modernEditor.canvas;
    if (canvas.redoStack.length > 0) {
      canvas.undoStack.push(canvas.toJSON());
      canvas.loadFromJSON(canvas.redoStack.pop(), () => {
        canvas.renderAll();
      });
    }
  }

  // Make these functions globally available
  window.undo = undo;
  window.redo = redo;
}


function attachPropertyPanelEvents(canvas) {
  console.log('Attaching property panel events to canvas');
  if (canvas._propertyEventsAttached) {
    console.log('Events already attached');
    return;
  }
  canvas._propertyEventsAttached = true;

  const updatePanel = (e) => {
    console.log('Selection event triggered', e.type);
    // Ensure we are on the correct page
    if (window.modernEditor && window.modernEditor.pages) {
      const pageIndex = window.modernEditor.pages.indexOf(canvas);
      if (pageIndex !== -1 && pageIndex !== window.modernEditor.currentPageIndex) {
        console.log('Switching to page', pageIndex);
        switchToPage(pageIndex);
      }
    }

    // Refresh panel
    const obj = (e && e.selected && e.selected.length) ? e.selected[0] : (e && e.target) ? e.target : canvas.getActiveObject();
    refreshPropertyPanelValues(canvas, obj);
  };

  canvas.on('selection:created', updatePanel);
  canvas.on('selection:updated', updatePanel);
  canvas.on('selection:cleared', () => {
    // Small delay to allow new selection to register if switching directly
    setTimeout(() => refreshPropertyPanelValues(canvas, null), 10);
  });
}

async function setupCanvasEventsForPages() {
  // Update status bar
  function updateStatusBar() {
    const wordCountStatus = document.getElementById('wordCountStatus');
    const pageStatus = document.getElementById('pageStatus');

    if (wordCountStatus) {
      let text = '';
      const activeObj = window.modernEditor.canvas.getActiveObject();

      if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text' || activeObj.type === 'textbox')) {
        // Count words in selection
        text = activeObj.text;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCountStatus.textContent = `Words: ${words} (Selection)`;
      } else {
        // Count total words in ALL pages
        let totalWords = 0;
        if (window.modernEditor && window.modernEditor.pages) {
          window.modernEditor.pages.forEach(pageCanvas => {
            pageCanvas.getObjects().forEach(obj => {
              if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
                const text = obj.text || '';
                const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                totalWords += words;
              }
            });
          });
        }
        wordCountStatus.textContent = `Words: ${totalWords}`;
      }
    }

    if (pageStatus) {
      const currentPage = window.modernEditor.currentPageIndex + 1;
      const totalPages = window.modernEditor.pages.length;
      pageStatus.textContent = `Page: ${currentPage} / ${totalPages}`;
    }
  }

  // Setup canvas events for all pages
  window.modernEditor.pages.forEach(canvas => {
    setupCanvasEvents(canvas);
    attachPropertyPanelEvents(canvas);

    // Attach status bar updates
    canvas.on('object:modified', updateStatusBar);
    canvas.on('text:changed', updateStatusBar);
    canvas.on('selection:created', updateStatusBar);
    canvas.on('selection:updated', updateStatusBar);
    canvas.on('selection:cleared', updateStatusBar);
  });

  // Initial update
  updateStatusBar();
}

// Draggable and close button setup moved to setupAllPanels() after DOM elements are created

// Page navigation
async function setupPageNavigation() {
  const addTopPageBtn = document.getElementById('addTopPageBtn');
  const addBottomPageBtn = document.getElementById('addBottomPageBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  if (addTopPageBtn) {
    addTopPageBtn.onclick = () => addPageAtIndex(0);
  }

  if (addBottomPageBtn) {
    addBottomPageBtn.onclick = () => addNewPage();
  }

  if (prevPageBtn) {
    prevPageBtn.onclick = () => switchToPage(window.modernEditor.currentPageIndex - 1);
  }

  if (nextPageBtn) {
    nextPageBtn.onclick = () => switchToPage(window.modernEditor.currentPageIndex + 1);
  }

  // Undo/Redo buttons
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) {
    undoBtn.onclick = undo;
  }

  if (redoBtn) {
    redoBtn.onclick = redo;
  }

}

// Zoom Logic
async function setupZoomControls() {
  let currentZoom = 100;
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomValue = document.getElementById('zoomValue');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomContainer = document.getElementById('zoomContainer');
  function updateZoom(value) {
    currentZoom = parseInt(value);
    if (currentZoom < 50) currentZoom = 50;
    if (currentZoom > 200) currentZoom = 200;

    if (zoomSlider) zoomSlider.value = currentZoom;
    if (zoomValue) zoomValue.textContent = currentZoom + '%';

    const scale = currentZoom / 100;

    // Use Fabric.js native zoom for sharp rendering
    if (window.modernEditor && window.modernEditor.pages) {
      window.modernEditor.pages.forEach(canvas => {
        canvas.setZoom(scale);
        canvas.setDimensions({
          width: 794 * scale,
          height: 1123 * scale
        });
        canvas.renderAll();
      });
    }

    // Reset CSS transform on container since we are scaling the canvases directly
    if (zoomContainer) {
      zoomContainer.style.transform = 'none';
      zoomContainer.style.width = '100%'; // Ensure container fits full width
    }
  }

  if (zoomSlider) {
    zoomSlider.oninput = (e) => updateZoom(e.target.value);
  }

  if (zoomInBtn) {
    zoomInBtn.onclick = () => updateZoom(currentZoom + 10);
  }

  if (zoomOutBtn) {
    zoomOutBtn.onclick = () => updateZoom(currentZoom - 10);
  }

  // Ctrl + Wheel to zoom
  const canvasArea = document.getElementById('canvasArea');
  if (canvasArea) {
    canvasArea.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        updateZoom(currentZoom + delta);
      }
    }, { passive: false });
  }
}

// Text tools
async function setupTextAndFormatting() {
  const addTextBtn = document.getElementById('addTextBtn');
  if (addTextBtn) {
    addTextBtn.onclick = () => {
      const text = new fabric.IText('Click to edit', {
        left: 100,
        top: 100,
        fontSize: 16,
        fill: '#000000',
        fontFamily: 'Arial',
        textAlign: 'justify'
      });
      window.modernEditor.canvas.add(text);
      window.modernEditor.canvas.setActiveObject(text);
      window.modernEditor.canvas.renderAll();
    };
  }

  const addHeadingBtn = document.getElementById('addHeadingBtn');
  if (addHeadingBtn) {
    addHeadingBtn.onclick = () => {
      const heading = new fabric.IText('Heading', {
        left: 100,
        top: 100,
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#667eea',
        fontFamily: 'Arial',
        textAlign: 'justify'
      });
      window.modernEditor.canvas.add(heading);
      window.modernEditor.canvas.setActiveObject(heading);
      window.modernEditor.canvas.renderAll();
    };
  }

  const cleanParagraphsBtn = document.getElementById('cleanParagraphsBtn');
  if (cleanParagraphsBtn) {
    cleanParagraphsBtn.onclick = () => {
      cleanParagraphs();
    };
  }

  // Formatting tools
  const boldBtn = document.getElementById('boldBtn');
  if (boldBtn) {
    boldBtn.onclick = () => {
      const obj = window.modernEditor.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const newWeight = obj.fontWeight === 'bold' ? 'normal' : 'bold';
        obj.set('fontWeight', newWeight);
        boldBtn.classList.toggle('active', newWeight === 'bold');
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  const italicBtn = document.getElementById('italicBtn');
  if (italicBtn) {
    italicBtn.onclick = () => {
      const obj = window.modernEditor.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const newStyle = obj.fontStyle === 'italic' ? 'normal' : 'italic';
        obj.set('fontStyle', newStyle);
        italicBtn.classList.toggle('active', newStyle === 'italic');
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  const underlineBtn = document.getElementById('underlineBtn');
  if (underlineBtn) {
    underlineBtn.onclick = () => {
      const obj = window.modernEditor.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const newUnderline = !obj.underline;
        obj.set('underline', newUnderline);
        underlineBtn.classList.toggle('active', newUnderline);
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Alignment
  const alignments = [
    { id: 'Left', value: 'left' },
    { id: 'Center', value: 'center' },
    { id: 'Right', value: 'right' },
    { id: 'Justify', value: 'justify' },
    { id: 'JustifyLeft', value: 'justify-left' },
    { id: 'JustifyRight', value: 'justify-right' }
  ];

  alignments.forEach(align => {
    const btn = document.getElementById('align' + align.id + 'Btn');
    if (btn) {
      btn.onclick = () => {
        const obj = window.modernEditor.canvas.getActiveObject();
        if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
          obj.set('textAlign', align.value);

          // Clear all active states
          alignments.forEach(a => {
            const b = document.getElementById('align' + a.id + 'Btn');
            if (b) b.classList.remove('active');
          });

          btn.classList.add('active');
          window.modernEditor.canvas.renderAll();
        }
      };
    }
  });
}

async function setupAllPanels() {
  // Move panels to modal root to prevent z-index/overflow issues
  const modal = document.getElementById('modernEditorModal');
  const panelsToMove = ['propertyPanel', 'shapePanel', 'layersPanel', 'backgroundPanel', 'drawingPanel', 'gridPanel'];

  if (modal) {
    panelsToMove.forEach(id => {
      const p = document.getElementById(id);
      if (p) {
        if (id === 'propertyPanel') {
          // Append property panel to body to prevent clipping by modal's overflow: hidden
          document.body.appendChild(p);
        } else if (p.parentElement !== modal) {
          modal.appendChild(p);
        }
      }
    });
  }

  // Make all panels draggable AFTER they're in the DOM
  console.log('Setting up draggable panels...');
  try { makeElementDraggable('propertyPanel', '.property-title'); console.log('✅ propertyPanel draggable'); } catch (e) { console.error('❌ propertyPanel draggable failed', e); }
  try { makeElementDraggable('shapePanel', '.property-title'); console.log('✅ shapePanel draggable'); } catch (e) { console.error('❌ shapePanel draggable failed', e); }
  try { makeElementDraggable('layersPanel', '.property-title'); console.log('✅ layersPanel draggable'); } catch (e) { console.error('❌ layersPanel draggable failed', e); }
  try { makeElementDraggable('backgroundPanel', '.property-title'); console.log('✅ backgroundPanel draggable'); } catch (e) { console.error('❌ backgroundPanel draggable failed', e); }
  try { makeElementDraggable('drawingPanel', '.property-title'); console.log('✅ drawingPanel draggable'); } catch (e) { console.error('❌ drawingPanel draggable failed', e); }
  try { makeElementDraggable('gridPanel', '.property-title'); console.log('✅ gridPanel draggable'); } catch (e) { console.error('❌ gridPanel draggable failed', e); }
  try { makeElementDraggable('aiModalContent', '.ai-modal-header'); console.log('✅ aiModalContent draggable'); } catch (e) { console.error('❌ aiModalContent draggable failed', e); }

  // Setup close buttons for all panels
  const propertyCloseBtn = document.getElementById('propertyCloseBtn');
  if (propertyCloseBtn) {
    propertyCloseBtn.onclick = (ev) => {
      ev.stopPropagation && ev.stopPropagation();
      const panel = document.getElementById('propertyPanel');
      if (panel) {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    };
    console.log('✅ propertyPanel close button');
  }

  const shapeCloseBtnInPanel = document.getElementById('shapeCloseBtn');
  if (shapeCloseBtnInPanel) {
    shapeCloseBtnInPanel.onclick = (ev) => {
      ev.stopPropagation && ev.stopPropagation();
      const panel = document.getElementById('shapePanel');
      if (panel) {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    };
    console.log('✅ shapePanel close button');
  }

  // Image
  const addImageBtn = document.getElementById('addImageBtn');
  if (addImageBtn) {
    addImageBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            fabric.Image.fromURL(event.target.result, (img) => {
              // Use the currently active canvas (page)
              const currentCanvas = window.modernEditor.canvas;

              // Scale to reasonable size
              img.scaleToWidth(300);

              // Center on current viewport or default position
              img.set({
                left: 100,
                top: 100
              });

              currentCanvas.add(img);
              currentCanvas.setActiveObject(img);
              currentCanvas.renderAll();

              // Trigger status update
              if (typeof updateStatusBar === 'function') updateStatusBar();
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    };
  }

  // Shape panel
  const addShapeBtn = document.getElementById('addShapeBtn');
  const shapePanel = document.getElementById('shapePanel');
  if (addShapeBtn && shapePanel) {
    addShapeBtn.onclick = () => {
      shapePanel.classList.toggle('active');
    };

    // Add handlers to each shape button
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.onclick = (ev) => {
        const shape = btn.dataset.shape;
        const canvas = window.modernEditor.canvas;

        if (!canvas) return;

        let obj = null;
        if (shape === 'rect') {
          obj = new fabric.Rect({ left: 100, top: 100, width: 150, height: 100, fill: '#667eea', rx: 8, ry: 8 });
        } else if (shape === 'circle') {
          obj = new fabric.Circle({ left: 140, top: 120, radius: 60, fill: '#667eea' });
        } else if (shape === 'triangle') {
          obj = new fabric.Triangle({ left: 120, top: 110, width: 140, height: 120, fill: '#667eea' });
        } else if (shape === 'line') {
          obj = new fabric.Line([80, 120, 260, 120], { stroke: '#667eea', strokeWidth: 6, left: 80, top: 120 });
        } else if (shape === 'arrow') {
          // Create arrow using line and triangle
          const line = new fabric.Line([80, 120, 200, 120], { stroke: '#667eea', strokeWidth: 6, left: 80, top: 120 });
          const arrowhead = new fabric.Triangle({ left: 190, top: 105, width: 20, height: 30, fill: '#667eea', angle: 90 });
          obj = new fabric.Group([line, arrowhead], { left: 80, top: 120 });
        } else if (shape === 'star') {
          // Create star shape
          const points = [];
          const outerRadius = 50;
          const innerRadius = 25;
          const spikes = 5;

          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            points.push({
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius
            });
          }

          obj = new fabric.Polygon(points, { left: 100, top: 100, fill: '#667eea', stroke: '#667eea', strokeWidth: 2 });
        }

        if (obj) {
          canvas.add(obj);
          // Ensure the new shape is on top of all other objects
          try {
            if (typeof canvas.bringToFront === 'function') canvas.bringToFront(obj);
            if (typeof obj.bringToFront === 'function') obj.bringToFront();
          } catch (e) {
            // ignore if Fabric API differs
          }
          obj.setCoords && obj.setCoords();
          canvas.setActiveObject(obj);
          // Use requestRenderAll if available for smoother rendering
          if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
          else canvas.renderAll && canvas.renderAll();
        }
      };
    });

    // Close shape panel
    const shapeCloseBtn = document.getElementById('shapeCloseBtn');
    if (shapeCloseBtn) {
      shapeCloseBtn.onclick = (ev) => {
        ev.stopPropagation();
        shapePanel.classList.remove('active');
      };
    }
  }


  // Delete & Duplicate
  const deleteBtn = document.getElementById('deleteBtn');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      const currentCanvas = window.modernEditor.pages[window.modernEditor.currentPageIndex];
      const activeSelection = currentCanvas.getActiveObject();
      if (activeSelection) {
        if (activeSelection.type === 'activeSelection') {
          // Multiple objects selected
          activeSelection.forEachObject((obj) => {
            currentCanvas.remove(obj);
          });
          currentCanvas.discardActiveObject();
        } else {
          // Single object selected
          currentCanvas.remove(activeSelection);
        }
        currentCanvas.renderAll();
      } else {
        Toast.error('Please select an element to delete');
      }
    };
  }

  const duplicateBtn = document.getElementById('duplicateBtn');
  if (duplicateBtn) {
    duplicateBtn.onclick = () => {
      const currentCanvas = window.modernEditor.pages[window.modernEditor.currentPageIndex];
      const obj = currentCanvas.getActiveObject();
      if (obj) {
        obj.clone((cloned) => {
          cloned.set({ left: cloned.left + 10, top: cloned.top + 10 });
          currentCanvas.add(cloned);
          currentCanvas.setActiveObject(cloned);
          currentCanvas.renderAll();
        });
      } else {
        Toast.error('Please select an element to duplicate');
      }
    };
  }

  // Move to Page - Dropdown menu
  const moveToPageBtn = document.getElementById('moveToPageBtn');
  const moveToPageMenu = document.getElementById('moveToPageMenu');
  if (moveToPageBtn && moveToPageMenu) {
    // Toggle dropdown
    moveToPageBtn.onclick = (e) => {
      e.stopPropagation();

      // Clear existing options
      moveToPageMenu.innerHTML = '';

      const obj = window.modernEditor.canvas.getActiveObject();
      if (!obj) {
        Toast.error('Please select an element to move');
        return;
      }

      const currentPage = window.modernEditor.currentPageIndex + 1;
      const totalPages = window.modernEditor.pages.length;

      // Populate menu with available pages
      for (let i = 1; i <= totalPages; i++) {
        if (i !== currentPage) {
          const menuItem = document.createElement('button');
          menuItem.className = 'tool-btn';
          menuItem.textContent = `Move to Page ${i} `;
          menuItem.onclick = (ev) => {
            ev.stopPropagation();
            const targetIndex = i - 1;
            moveElementToPage(obj, window.modernEditor.canvas, targetIndex);
            moveToPageMenu.classList.remove('active');
            moveToPageMenu.setAttribute('aria-hidden', 'true');
          };
          moveToPageMenu.appendChild(menuItem);
        }
      }

      // Toggle menu
      const isActive = moveToPageMenu.classList.contains('active');
      moveToPageMenu.classList.toggle('active');
      moveToPageMenu.setAttribute('aria-hidden', isActive ? 'true' : 'false');

      if (!isActive) { // now active
        const rect = moveToPageBtn.getBoundingClientRect();
        moveToPageMenu.style.position = 'fixed';
        moveToPageMenu.style.top = (rect.top + rect.height) + 'px';
        moveToPageMenu.style.left = rect.left + 'px';
        moveToPageMenu.style.zIndex = '10001';
      } else {
        moveToPageMenu.style.position = '';
        moveToPageMenu.style.top = '';
        moveToPageMenu.style.left = '';
        moveToPageMenu.style.zIndex = '';
      }
    };

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!moveToPageMenu.contains(e.target) && e.target !== moveToPageBtn) {
        moveToPageMenu.classList.remove('active');
        moveToPageMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Property inputs - attach handlers
  const fontFamilySelect = document.getElementById('fontFamilySelect');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const opacityInput = document.getElementById('opacityInput');

  // Initial refresh for current canvas
  if (window.modernEditor && window.modernEditor.pages) {
    const currentCanvas = window.modernEditor.pages[window.modernEditor.currentPageIndex];
    if (currentCanvas) {
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    }
  }

  // NOTE: Canvas selection events are now handled in setupCanvasEventsForPages -> attachPropertyPanelEvents

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (e) => {
      const currentCanvas = window.modernEditor && window.modernEditor.pages ? window.modernEditor.pages[window.modernEditor.currentPageIndex] : null;
      if (!currentCanvas) return;
      const obj = currentCanvas.getActiveObject();
      if (!obj) return;
      const val = e.target.value;
      forEachObjectInTarget(obj, o => {
        if (o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox' || o.fontFamily !== undefined)) {
          o.set('fontFamily', val);
        }
      });
      currentCanvas.requestRenderAll ? currentCanvas.requestRenderAll() : currentCanvas.renderAll();
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    });
  }

  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', (e) => {
      const currentCanvas = window.modernEditor && window.modernEditor.pages ? window.modernEditor.pages[window.modernEditor.currentPageIndex] : null;
      if (!currentCanvas) return;
      const obj = currentCanvas.getActiveObject();
      if (!obj) return;
      const val = parseInt(e.target.value) || 12;
      forEachObjectInTarget(obj, o => {
        if (o && (o.type === 'i-text' || o.type === 'text' || o.type === 'textbox' || o.fontSize !== undefined)) {
          o.set('fontSize', val);
        }
      });
      currentCanvas.requestRenderAll ? currentCanvas.requestRenderAll() : currentCanvas.renderAll();
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    });
  }

  if (opacityInput) {
    opacityInput.addEventListener('input', (e) => {
      const currentCanvas = window.modernEditor && window.modernEditor.pages ? window.modernEditor.pages[window.modernEditor.currentPageIndex] : null;
      if (!currentCanvas) return;
      const obj = currentCanvas.getActiveObject();
      if (!obj) return;
      const val = parseFloat(e.target.value);
      forEachObjectInTarget(obj, o => {
        if (o && o.set) o.set('opacity', val);
        if (o && typeof o.setCoords === 'function') o.setCoords();
      });
      currentCanvas.requestRenderAll ? currentCanvas.requestRenderAll() : currentCanvas.renderAll();
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    });
  }

  // Color swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      const currentCanvas = window.modernEditor && window.modernEditor.pages ? window.modernEditor.pages[window.modernEditor.currentPageIndex] : null;
      if (!currentCanvas) return;
      const obj = currentCanvas.getActiveObject();
      if (!obj) return;
      forEachObjectInTarget(obj, o => {
        if (!o) return;
        if (o.type === 'line') {
          o.set('stroke', color);
        } else if (o.type === 'image') {
          // Images don't have a fill color. Skipping color change for images.
        } else {
          if (o.set) o.set('fill', color);
        }
        if (o && typeof o.setCoords === 'function') o.setCoords();
      });
      currentCanvas.requestRenderAll ? currentCanvas.requestRenderAll() : currentCanvas.renderAll();
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    });
  });

  // Color picker
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      const currentCanvas = window.modernEditor && window.modernEditor.pages ? window.modernEditor.pages[window.modernEditor.currentPageIndex] : null;
      if (!currentCanvas) return;
      const obj = currentCanvas.getActiveObject();
      if (!obj) return;
      forEachObjectInTarget(obj, o => {
        if (!o) return;
        if (o.type === 'line') {
          o.set('stroke', color);
        } else if (o.type === 'image') {
          // Images don't have a fill color. Skipping color change for images.
        } else {
          if (o.set) o.set('fill', color);
        }
        if (o && typeof o.setCoords === 'function') o.setCoords();
      });
      currentCanvas.requestRenderAll ? currentCanvas.requestRenderAll() : currentCanvas.renderAll();
      refreshPropertyPanelValues(currentCanvas, currentCanvas.getActiveObject());
    });
  }


  // Preview (show all pages)
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.onclick = () => {
      const previewModal = document.createElement('div');
      previewModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 20000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;';

      // Make preview content transparent so only the page image is visible
      const previewContent = document.createElement('div');
      previewContent.style.cssText = 'background: transparent; border-radius: 12px; padding: 0; max-width: 100%; max-height: 100%; overflow: auto; display:flex; align-items:center; justify-content:center;';

      const closePreviewBtn = document.createElement('button');
      closePreviewBtn.textContent = '✕ Close Preview';
      closePreviewBtn.className = 'modern-btn btn-secondary';
      closePreviewBtn.style.cssText = 'position: absolute; top: 20px; right: 20px;';
      closePreviewBtn.onclick = () => previewModal.remove();

      // Show only the current page (no extra white background)
      const pages = (window.modernEditor && window.modernEditor.pages) ? window.modernEditor.pages : [];
      const currentIndex = (window.modernEditor && typeof window.modernEditor.currentPageIndex === 'number') ? window.modernEditor.currentPageIndex : 0;

      if (!pages || pages.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No pages to preview.';
        emptyMsg.style.cssText = 'color: #fff; font-weight: 600; padding: 20px;';
        previewContent.appendChild(emptyMsg);
      } else {
        // Create a vertical, scrollable container with all pages stacked
        const pagesContainer = document.createElement('div');
        pagesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 28px; align-items: center; padding: 20px; width: 100%; max-width: 900px; max-height: calc(100vh - 80px); overflow-y: auto; box-sizing: border-box;';

        pages.forEach((pg, idx) => {
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'width: 100%; display:flex; flex-direction: column; align-items: center; gap: 8px;';

          const label = document.createElement('div');
          label.textContent = 'Page ' + (idx + 1) + ' of ' + pages.length;
          label.style.cssText = 'color: #fff; font-weight: 700; margin-bottom: 6px;';

          const img = document.createElement('img');
          try {
            img.src = pg.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
          } catch (err) {
            try {
              const el = document.getElementById('canvas-' + idx);
              if (el && el.toDataURL) img.src = el.toDataURL('image/png');
              else img.alt = 'Unable to generate preview for this page.';
            } catch (e) {
              img.alt = 'Unable to generate preview for this page.';
            }
          }

          img.style.cssText = 'width: 100%; height: auto; display: block; border-radius: 6px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); background: transparent;';

          wrapper.appendChild(label);
          wrapper.appendChild(img);
          pagesContainer.appendChild(wrapper);
        });

        // Scroll to current page
        setTimeout(() => {
          const currentWrapper = pagesContainer.children[currentIndex];
          if (currentWrapper && currentWrapper.scrollIntoView) {
            currentWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 30);

        // Keyboard support: PageUp/PageDown and ArrowUp/ArrowDown scroll the container
        function onKeyScroll(e) {
          if (!document.body.contains(previewModal)) return;
          if (e.key === 'PageDown' || e.key === 'ArrowDown') {
            pagesContainer.scrollBy({ top: pagesContainer.clientHeight * 0.8, behavior: 'smooth' });
          }
          if (e.key === 'PageUp' || e.key === 'ArrowUp') {
            pagesContainer.scrollBy({ top: -pagesContainer.clientHeight * 0.8, behavior: 'smooth' });
          }
          if (e.key === 'Escape') {
            previewModal.remove();
            document.removeEventListener('keydown', onKeyScroll);
          }
        }

        document.addEventListener('keydown', onKeyScroll);

        // Cleanup listener when modal removed
        const mo = new MutationObserver(() => {
          if (!document.body.contains(previewModal)) {
            document.removeEventListener('keydown', onKeyScroll);
            mo.disconnect();
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });

        previewContent.appendChild(pagesContainer);
      }

      previewModal.appendChild(closePreviewBtn);
      previewModal.appendChild(previewContent);
      document.body.appendChild(previewModal);

      previewModal.onclick = (e) => {
        if (e.target === previewModal) previewModal.remove();
      };
    };
  }

  // Download
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadHighQualityPDF();
  }

  // AI Modal
  const aiBtn = document.getElementById('aiBtn');
  const aiModal = document.getElementById('aiModal');
  const aiCloseBtn = document.getElementById('aiCloseBtn');
  const reformatBtn = document.getElementById('reformatBtn');

  if (aiBtn && aiModal) {
    aiBtn.onclick = () => {
      aiModal.classList.add('active');
    };
  }

  if (aiCloseBtn && aiModal) {
    aiCloseBtn.onclick = () => {
      aiModal.classList.remove('active');
    };
  }

  if (aiModal) {
    aiModal.onclick = (e) => {
      if (e.target === aiModal) {
        aiModal.classList.remove('active');
      }
    };
  }

  // ========================================================================
  // BACKGROUND ENHANCEMENT EVENT HANDLERS
  // ========================================================================

  const backgroundBtn = document.getElementById('backgroundBtn');
  const backgroundPanel = document.getElementById('backgroundPanel');
  const backgroundCloseBtn = document.getElementById('backgroundCloseBtn');

  // Background button toggle
  if (backgroundBtn && backgroundPanel) {
    backgroundBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = backgroundPanel.style.display === 'block';
      backgroundPanel.style.display = isVisible ? 'none' : 'block';
    };
  }

  // Background panel close button
  if (backgroundCloseBtn && backgroundPanel) {
    backgroundCloseBtn.onclick = () => {
      backgroundPanel.style.display = 'none';
    };
  }

  // Clear background
  const bgClearBtn = document.getElementById('bgClearBtn');
  if (bgClearBtn) {
    bgClearBtn.onclick = () => {
      const canvas = window.modernEditor.canvas;
      if (canvas) {
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        canvas.backgroundImage = null;
        canvas.renderAll();
      }
    };
  }

  // ========================================================================
  // DRAWING TOOLS
  // ========================================================================


  const drawingTool = new window.NewsletterEditorEnhancements.DrawingTool(window.modernEditor.canvas);
  window.modernEditor.drawingTool = drawingTool;

  const drawBtn = document.getElementById('drawBtn');
  const drawingPanel = document.getElementById('drawingPanel');



  const drawingCloseBtn = document.getElementById('drawingCloseBtn');
  const brushToolBtn = document.getElementById('brushToolBtn');
  const eraserToolBtn = document.getElementById('eraserToolBtn');
  const brushSizeSlider = document.getElementById('brushSizeSlider');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const drawColorPicker = document.getElementById('drawColorPicker');
  const clearDrawingsBtn = document.getElementById('clearDrawingsBtn');

  function updateDrawingUI() {
    if (drawingTool.eraserMode) {
      brushToolBtn.style.background = '#f8f9fa';
      brushToolBtn.style.color = '#212529';
      brushToolBtn.style.border = '1px solid #ced4da';

      eraserToolBtn.style.background = '#dc3545';
      eraserToolBtn.style.color = 'white';
      eraserToolBtn.style.border = 'none';
    } else {
      brushToolBtn.style.background = '#0d2747';
      brushToolBtn.style.color = 'white';
      brushToolBtn.style.border = 'none';

      eraserToolBtn.style.background = '#f8f9fa';
      eraserToolBtn.style.color = '#212529';
      eraserToolBtn.style.border = '1px solid #ced4da';
    }
  }

  if (drawBtn && drawingPanel) {

    drawBtn.onclick = (e) => {

      e.stopPropagation();
      const isVisible = drawingPanel.style.display === 'block';

      drawingPanel.style.display = isVisible ? 'none' : 'block';

      if (!isVisible) {
        // Enable drawing mode when opening
        // Update canvas to current page
        drawingTool.canvas = window.modernEditor.pages[window.modernEditor.currentPageIndex];
        drawingTool.enable();
        updateDrawingUI();
      } else {
        drawingTool.disable();
      }
    };
  }


  // ========================================================================
  // GRID & GUIDES
  // ========================================================================

  const gridSystem = new window.NewsletterEditorEnhancements.GridSystem(window.modernEditor.canvas, 30);
  window.modernEditor.gridSystem = gridSystem;

  const gridBtn = document.getElementById('gridBtn');
  const gridPanel = document.getElementById('gridPanel');
  const gridCloseBtn = document.getElementById('gridCloseBtn');
  const gridToggle = document.getElementById('gridToggle');
  const snapToggle = document.getElementById('snapToggle');
  const addVerticalGuide = document.getElementById('addVerticalGuide');
  const addHorizontalGuide = document.getElementById('addHorizontalGuide');
  const clearGuides = document.getElementById('clearGuides');

  // Toggle grid panel
  if (gridBtn && gridPanel) {
    gridBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = gridPanel.style.display === 'block';
      gridPanel.style.display = isVisible ? 'none' : 'block';
    };
  }

  // Close panel
  if (gridCloseBtn) {
    gridCloseBtn.onclick = () => {
      gridPanel.style.display = 'none';
    };
  }

  // Grid toggle
  if (gridToggle) {
    gridToggle.onchange = (e) => {
      if (e.target.checked) {
        gridSystem.show();
      } else {
        gridSystem.hide();
      }
      gridSystem.enabled = e.target.checked;
    };
  }

  // Snap toggle
  if (snapToggle) {
    snapToggle.onchange = (e) => {
      if (e.target.checked) {
        gridSystem.enableSnap();
      } else {
        gridSystem.disableSnap();
      }
      gridSystem.snapEnabled = e.target.checked;
    };
  }

  // Grid spacing buttons
  document.querySelectorAll('.spacing-btn').forEach(btn => {
    btn.onclick = () => {
      const spacing = parseInt(btn.getAttribute('data-spacing'), 10);
      gridSystem.spacing = spacing;

      // Update active state
      document.querySelectorAll('.spacing-btn').forEach(b => {
        b.style.background = '#f8f9fa';
        b.style.color = '#495057';
        b.style.borderColor = '#ced4da';
      });
      btn.style.background = '#0d2747';
      btn.style.color = 'white';
      btn.style.borderColor = '#0d2747';

      // Refresh grid if visible
      if (gridSystem.enabled) {
        gridSystem.show();
      }
    };
  });

  // Add guides
  if (addVerticalGuide) {
    addVerticalGuide.onclick = () => {
      const centerX = window.modernEditor.canvas.width / 2;
      gridSystem.addGuide('vertical', centerX);
    };
  }

  if (addHorizontalGuide) {
    addHorizontalGuide.onclick = () => {
      const centerY = window.modernEditor.canvas.height / 2;
      gridSystem.addGuide('horizontal', centerY);
    };
  }

  // Clear guides
  if (clearGuides) {
    clearGuides.onclick = () => {
      if (confirm('Clear all guide lines?')) {
        gridSystem.clearGuides();
      }
    };
  }


  if (drawingCloseBtn) {
    drawingCloseBtn.onclick = () => {
      drawingPanel.style.display = 'none';
      drawingTool.disable();
    };
  }

  if (brushToolBtn) {
    brushToolBtn.onclick = () => {
      drawingTool.disableEraser();
      updateDrawingUI();
    };
  }

  if (eraserToolBtn) {
    eraserToolBtn.onclick = () => {
      drawingTool.enableEraser();
      updateDrawingUI();
    };
  }

  if (brushSizeSlider) {
    brushSizeSlider.oninput = (e) => {
      const size = parseInt(e.target.value, 10);
      if (brushSizeValue) brushSizeValue.textContent = size;
      drawingTool.setBrushWidth(size);
    };
  }

  if (drawColorPicker) {
    drawColorPicker.oninput = (e) => {
      drawingTool.setBrushColor(e.target.value);
      drawingTool.disableEraser();
      updateDrawingUI();
    };
  }

  // Color swatches
  document.querySelectorAll('.color-swatch[data-draw-color]').forEach(swatch => {
    swatch.onclick = () => {
      const color = swatch.getAttribute('data-draw-color');
      drawingTool.setBrushColor(color);
      if (drawColorPicker) drawColorPicker.value = color;
      drawingTool.disableEraser(); // Switch back to brush when color selected
      updateDrawingUI();
    };
  });

  if (clearDrawingsBtn) {
    clearDrawingsBtn.onclick = () => {
      if (confirm('Are you sure you want to clear all drawings?')) {
        drawingTool.clearDrawings();
      }
    };
  }


  // ========================================================================
  // LAYERS & GROUPING
  // ========================================================================

  const layersBtn = document.getElementById('layersBtn');
  const layersPanel = document.getElementById('layersPanel');
  const layersCloseBtn = document.getElementById('layersCloseBtn');
  const bringToFrontBtn = document.getElementById('bringToFrontBtn');
  const sendToBackBtn = document.getElementById('sendToBackBtn');
  const bringForwardBtn = document.getElementById('bringForwardBtn');
  const sendBackwardBtn = document.getElementById('sendBackwardBtn');
  const groupObjectsBtn = document.getElementById('groupObjectsBtn');
  const ungroupObjectsBtn = document.getElementById('ungroupObjectsBtn');
  const lockLayerToggle = document.getElementById('lockLayerToggle');
  const visibilityToggle = document.getElementById('visibilityToggle');
  const layerOpacitySlider = document.getElementById('layerOpacitySlider');
  const layerOpacityValue = document.getElementById('layerOpacityValue');

  // Toggle layers panel
  if (layersBtn && layersPanel) {
    layersBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = layersPanel.style.display === 'block';
      layersPanel.style.display = isVisible ? 'none' : 'block';
    };
  }

  // Close panel
  if (layersCloseBtn) {
    layersCloseBtn.onclick = () => {
      layersPanel.style.display = 'none';
    };
  }

  // Helper function to get active object
  function getActiveObject() {
    return window.modernEditor.canvas.getActiveObject();
  }

  // Bring to Front
  if (bringToFrontBtn) {
    bringToFrontBtn.onclick = () => {
      const obj = getActiveObject();
      if (obj) {
        window.modernEditor.canvas.bringToFront(obj);
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Send to Back
  if (sendToBackBtn) {
    sendToBackBtn.onclick = () => {
      const obj = getActiveObject();
      if (obj) {
        window.modernEditor.canvas.sendToBack(obj);
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Bring Forward
  if (bringForwardBtn) {
    bringForwardBtn.onclick = () => {
      const obj = getActiveObject();
      if (obj) {
        window.modernEditor.canvas.bringForward(obj);
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Send Backward
  if (sendBackwardBtn) {
    sendBackwardBtn.onclick = () => {
      const obj = getActiveObject();
      if (obj) {
        window.modernEditor.canvas.sendBackward(obj);
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Group Objects
  if (groupObjectsBtn) {
    groupObjectsBtn.onclick = () => {
      const activeSelection = window.modernEditor.canvas.getActiveObject();
      if (activeSelection && activeSelection.type === 'activeSelection') {
        const group = activeSelection.toGroup();
        window.modernEditor.canvas.setActiveObject(group);
        window.modernEditor.canvas.requestRenderAll();
      } else {
        alert('Please select multiple objects to group (hold Shift and click)');
      }
    };
  }

  // Ungroup Objects
  if (ungroupObjectsBtn) {
    ungroupObjectsBtn.onclick = () => {
      const activeObject = window.modernEditor.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'group') {
        activeObject.toActiveSelection();
        window.modernEditor.canvas.requestRenderAll();
      } else {
        alert('Please select a group to ungroup');
      }
    };
  }

  // Lock/Unlock Layer
  if (lockLayerToggle) {
    lockLayerToggle.onchange = (e) => {
      const obj = getActiveObject();
      if (obj) {
        obj.lockMovementX = e.target.checked;
        obj.lockMovementY = e.target.checked;
        obj.lockRotation = e.target.checked;
        obj.lockScalingX = e.target.checked;
        obj.lockScalingY = e.target.checked;
        obj.selectable = !e.target.checked;
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Visibility Toggle
  if (visibilityToggle) {
    visibilityToggle.onchange = (e) => {
      const obj = getActiveObject();
      if (obj) {
        obj.visible = e.target.checked;
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Opacity Slider
  if (layerOpacitySlider && layerOpacityValue) {
    layerOpacitySlider.oninput = (e) => {
      const opacity = parseInt(e.target.value, 10);
      layerOpacityValue.textContent = opacity + '%';

      const obj = getActiveObject();
      if (obj) {
        obj.opacity = opacity / 100;
        window.modernEditor.canvas.renderAll();
      }
    };
  }

  // Update layer controls when object is selected
  window.modernEditor.canvas.on('selection:created', updateLayerControls);
  window.modernEditor.canvas.on('selection:updated', updateLayerControls);
  window.modernEditor.canvas.on('selection:cleared', () => {
    if (lockLayerToggle) lockLayerToggle.checked = false;
    if (visibilityToggle) visibilityToggle.checked = true;
    if (layerOpacitySlider) layerOpacitySlider.value = 100;
    if (layerOpacityValue) layerOpacityValue.textContent = '100%';
  });

  function updateLayerControls() {
    const obj = getActiveObject();
    if (obj) {
      if (lockLayerToggle) lockLayerToggle.checked = obj.lockMovementX || false;
      if (visibilityToggle) visibilityToggle.checked = obj.visible !== false;
      if (layerOpacitySlider && layerOpacityValue) {
        const opacity = Math.round((obj.opacity || 1) * 100);
        layerOpacitySlider.value = opacity;
        layerOpacityValue.textContent = opacity + '%';
      }
    }
  }


  // Solid color swatches
  const bgColorSwatches = document.querySelectorAll('[data-bg-color]');
  bgColorSwatches.forEach(swatch => {
    swatch.onclick = () => {
      const color = swatch.dataset.bgColor;
      const canvas = window.modernEditor.canvas;
      if (canvas) {
        canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      }
    };
  });

  // Custom color picker
  const bgColorPicker = document.getElementById('bgColorPicker');
  const bgColorHex = document.getElementById('bgColorHex');
  const applyBgColorBtn = document.getElementById('applyBgColorBtn');

  if (bgColorPicker && bgColorHex) {
    bgColorPicker.oninput = (e) => {
      bgColorHex.value = e.target.value;
    };

    bgColorHex.oninput = (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        bgColorPicker.value = e.target.value;
      }
    };
  }

  if (applyBgColorBtn) {
    applyBgColorBtn.onclick = () => {
      const color = bgColorPicker ? bgColorPicker.value : '#ffffff';
      const canvas = window.modernEditor.canvas;
      if (canvas) {
        canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      }
    };
  }

  // Background image upload
  const bgImageInput = document.getElementById('bgImageInput');
  const bgImageUrl = document.getElementById('bgImageUrl');
  const loadBgImageUrlBtn = document.getElementById('loadBgImageUrlBtn');
  const bgImageFit = document.getElementById('bgImageFit');
  const applyBgImageBtn = document.getElementById('applyBgImageBtn');

  let currentBgImageUrl = null;

  if (bgImageInput) {
    bgImageInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentBgImageUrl = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
  }

  if (loadBgImageUrlBtn && bgImageUrl) {
    loadBgImageUrlBtn.onclick = () => {
      const url = bgImageUrl.value.trim();
      if (url) {
        currentBgImageUrl = url;
      }
    };
  }

  if (applyBgImageBtn) {
    applyBgImageBtn.onclick = () => {
      if (!currentBgImageUrl) {
        alert('Please upload an image or enter a URL first');
        return;
      }

      const canvas = window.modernEditor.canvas;
      const fit = bgImageFit ? bgImageFit.value : 'cover';

      fabric.Image.fromURL(currentBgImageUrl, (img) => {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        if (fit === 'cover') {
          const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
          img.scale(scale);
          img.set({
            left: (canvasWidth - img.width * scale) / 2,
            top: (canvasHeight - img.height * scale) / 2
          });
        } else if (fit === 'contain') {
          const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
          img.scale(scale);
          img.set({
            left: (canvasWidth - img.width * scale) / 2,
            top: (canvasHeight - img.height * scale) / 2
          });
        } else if (fit === 'stretch') {
          img.scaleToWidth(canvasWidth);
          img.scaleToHeight(canvasHeight);
        } else if (fit === 'repeat') {
          // For repeat, we'll use a pattern
          const patternSourceCanvas = new fabric.StaticCanvas();
          patternSourceCanvas.add(img);
          patternSourceCanvas.renderAll();

          const pattern = new fabric.Pattern({
            source: patternSourceCanvas.getElement(),
            repeat: 'repeat'
          });
          canvas.setBackgroundColor(pattern, canvas.renderAll.bind(canvas));
          return;
        }

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      }, { crossOrigin: 'anonymous' });
    };
  }

  // Gradient controls
  const gradientType = document.getElementById('gradientType');
  const gradientColor1 = document.getElementById('gradientColor1');
  const gradientColor2 = document.getElementById('gradientColor2');
  const gradientAngle = document.getElementById('gradientAngle');
  const gradientAngleValue = document.getElementById('gradientAngleValue');
  const applyGradientBtn = document.getElementById('applyGradientBtn');

  if (gradientAngle && gradientAngleValue) {
    gradientAngle.oninput = (e) => {
      gradientAngleValue.textContent = e.target.value;
    };
  }

  if (applyGradientBtn) {
    applyGradientBtn.onclick = () => {
      const canvas = window.modernEditor.canvas;
      const type = gradientType ? gradientType.value : 'linear';
      const color1 = gradientColor1 ? gradientColor1.value : '#667eea';
      const color2 = gradientColor2 ? gradientColor2.value : '#764ba2';
      const angle = gradientAngle ? parseInt(gradientAngle.value) : 90;

      let gradient;

      if (type === 'linear') {
        // Convert angle to coordinates
        const angleRad = (angle - 90) * Math.PI / 180;
        const x1 = canvas.width / 2 + Math.cos(angleRad) * canvas.width / 2;
        const y1 = canvas.height / 2 + Math.sin(angleRad) * canvas.height / 2;
        const x2 = canvas.width / 2 - Math.cos(angleRad) * canvas.width / 2;
        const y2 = canvas.height / 2 - Math.sin(angleRad) * canvas.height / 2;

        gradient = new fabric.Gradient({
          type: 'linear',
          coords: { x1, y1, x2, y2 },
          colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 }
          ]
        });
      } else {
        // Radial gradient
        gradient = new fabric.Gradient({
          type: 'radial',
          coords: {
            x1: canvas.width / 2,
            y1: canvas.height / 2,
            x2: canvas.width / 2,
            y2: canvas.height / 2,
            r1: 0,
            r2: Math.max(canvas.width, canvas.height) / 2
          },
          colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 }
          ]
        });
      }

      canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas));
    };
  }

  // Background opacity
  const bgOpacitySlider = document.getElementById('bgOpacitySlider');
  const bgOpacityValue = document.getElementById('bgOpacityValue');
  const applyBgOpacityBtn = document.getElementById('applyBgOpacityBtn');

  if (bgOpacitySlider && bgOpacityValue) {
    bgOpacitySlider.oninput = (e) => {
      bgOpacityValue.textContent = e.target.value;
    };
  }

  if (applyBgOpacityBtn) {
    applyBgOpacityBtn.onclick = () => {
      const canvas = window.modernEditor.canvas;
      const opacity = bgOpacitySlider ? parseInt(bgOpacitySlider.value) / 100 : 1;

      if (canvas.backgroundImage) {
        canvas.backgroundImage.opacity = opacity;
        canvas.renderAll();
      }
    };
  }

  // ========================================================================
  // END BACKGROUND ENHANCEMENT EVENT HANDLERS
  // ========================================================================


  if (reformatBtn) {
    reformatBtn.onclick = async () => {
      const tone = document.getElementById('reformatTone').value;
      const canvas = window.modernEditor.canvas;
      let text = '';

      // Get selected text or all text
      const activeObject = canvas.getActiveObject();
      if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox')) {
        text = activeObject.text;
      } else {
        // Collect all text from canvas
        const objects = canvas.getObjects();
        text = objects
          .filter(obj => obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')
          .map(obj => obj.text)
          .join(' ');
      }

      if (!text.trim()) {
        alert('No text found to reformat');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/ai/reformat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, tone })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText} `);
        }

        const data = await response.json();
        if (data.reformattedText) {
          if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox')) {
            activeObject.set('text', data.reformattedText);
          } else {
            // Add new text object
            const newText = new fabric.IText(data.reformattedText, {
              left: 100,
              top: 100,
              fontSize: 16,
              fill: '#000000',
              fontFamily: 'Arial',
              textAlign: 'justify'
            });
            canvas.add(newText);
            canvas.setActiveObject(newText);
          }
          canvas.renderAll();
          aiModal.classList.remove('active');
          showTemporaryMessage('Text reformatted successfully');
        } else {
          alert('Error: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error reformatting text:', error);
        Toast.error('Failed to reformat text: ' + error.message);
      }
    };
  }


  // Close
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      if (confirm('Close editor? Unsaved changes will be lost.')) {
        const modal = document.getElementById('modernEditorModal');
        if (modal) modal.remove();
      }
    };
  }
}

function populateModernSidebar(items) {
  const list = document.getElementById('contentList');
  if (!list) return;

  // Define categories
  const categories = [
    { id: 'research-grant', name: 'Research Grant' },
    { id: 'journal-publications', name: 'Journal Publications' },
    { id: 'book-chapters', name: 'Book Chapter' },
    { id: 'books-and-edited-books', name: 'Books & Edited Books' },
    { id: 'conference-proceeding', name: 'Conference Proceeding' },
    { id: 'conference-presentation', name: 'Conference Presentation' },
    { id: 'seminar-and-workshop', name: 'Seminar & Workshop' },
    { id: 'media', name: 'Media' },
    { id: 'achievements', name: 'Achievements' }
  ];

  // Categorize items
  const categorizedItems = {};
  categories.forEach(cat => {
    categorizedItems[cat.id] = [];
  });

  items.forEach(item => {
    const categoryKey = normalizeCategoryKey(item.category);
    const matchedKey = findBestCategoryMatch(item.category, categories);
    if (categorizedItems[categoryKey]) {
      categorizedItems[categoryKey].push(item);
    } else if (matchedKey && categorizedItems[matchedKey]) {
      categorizedItems[matchedKey].push(item);
    }
  });

  // Display by category
  categories.forEach(category => {
    const categoryItems = categorizedItems[category.id] || [];

    if (categoryItems.length > 0) {
      // Container for this category group
      const groupContainer = document.createElement('div');
      groupContainer.style.marginBottom = '8px';

      // Category header with toggle
      const categoryHeader = document.createElement('div');
      categoryHeader.style.cssText = 'font-weight: 700; font-size: 12px; color: #667eea; padding: 8px 0; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.05);';
      categoryHeader.innerHTML = `
        <span>${category.name} (${categoryItems.length})</span>
        <i class="bi bi-chevron-down"></i>
      `;

      const contentId = `cat-content-${category.id}`;
      categoryHeader.onclick = () => toggleSidebarSection(contentId, categoryHeader);

      groupContainer.appendChild(categoryHeader);

      // Items container
      const itemsContainer = document.createElement('div');
      itemsContainer.id = contentId;
      itemsContainer.style.paddingTop = '8px';

      // Category items
      categoryItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'element-card';
        card.innerHTML = '<div class="element-title">' + getTitleForItem(item).substring(0, 40) + '...</div>';
        card.onclick = () => addItemToCanvas(item);
        itemsContainer.appendChild(card);
      });

      groupContainer.appendChild(itemsContainer);
      list.appendChild(groupContainer);
    }
  });
}

function addItemToCanvas(item) {
  // Use current canvas and cursor position
  const currentCanvas = window.modernEditor.canvas;
  const currentPageIndex = window.modernEditor.currentPageIndex;

  // Get mouse position from last pointer event or use default
  let insertX = 100;
  let insertY = 200;

  // Try to get the last mouse position on the canvas
  if (currentCanvas._lastPointer) {
    insertX = currentCanvas._lastPointer.x || 100;
    insertY = currentCanvas._lastPointer.y || 200;
  }

  // Ensure position is within canvas bounds
  insertX = Math.max(60, Math.min(insertX, currentCanvas.width - 100));
  insertY = Math.max(60, Math.min(insertY, currentCanvas.height - 200));

  // Helper function to create text with italic support (local copy for this function)
  function createTextWithItalics(text, options) {
    // Ensure textAlign is set to justify by default
    if (!options.textAlign) {
      options.textAlign = 'justify';
    }

    // Check if text contains <i> tags
    if (!text.includes('<i>') && !text.includes('</i>')) {
      // No italic tags, create simple text
      return new fabric.Textbox(text, options);
    }

    // Parse HTML and create text with styles
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Create textbox with plain text
    const textbox = new fabric.Textbox(plainText, options);

    // Find italic sections and apply styling
    const italicRegex = /<i>(.*?)<\/i>/g;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      const italicText = match[1];
      const beforeText = text.substring(0, match.index).replace(/<\/?i>/g, '');
      const startIndex = beforeText.length;
      const endIndex = startIndex + italicText.length;

      // Apply italic style to this range
      if (textbox.setSelectionStyles) {
        textbox.setSelectionStyles({
          fontStyle: 'italic'
        }, startIndex, endIndex);
      }
    }

    return textbox;
  }

  // Add article at cursor position - with italic support, ALWAYS bold
  const titleText = getTitleForItem(item);
  const title = createTextWithItalics(titleText, {
    left: insertX,
    top: insertY,
    width: 674,
    fontSize: 18,
    fontWeight: 'bold',
    fill: '#212529',
    fontFamily: 'Georgia'
  });

  // Ensure the entire title is bold (override any style from italic processing)
  if (title.setSelectionStyles) {
    title.setSelectionStyles({
      fontWeight: 'bold'
    }, 0, titleText.length);
  }

  currentCanvas.add(title);
  title.bringToFront(); // Bring to front

  // Remove title from body if it appears at the start to avoid duplication
  let rawBodyText = item.fullText || '';
  // Normalize both for comparison (remove HTML tags, trim)
  const normTitle = titleText.replace(/<[^>]*>/g, '').trim();
  const normBodyStart = rawBodyText.replace(/<[^>]*>/g, '').trim().substring(0, normTitle.length);

  if (normBodyStart === normTitle) {
    // If body starts with title, remove it
    if (rawBodyText.startsWith(titleText)) {
      rawBodyText = rawBodyText.substring(titleText.length);
    } else if (rawBodyText.startsWith(normTitle)) {
      rawBodyText = rawBodyText.substring(normTitle.length);
    } else {
      // Fuzzy removal: find where the title ends in the body
      const titleIndex = rawBodyText.indexOf(normTitle);
      if (titleIndex === 0) {
        rawBodyText = rawBodyText.substring(normTitle.length);
      }
    }
  }

  rawBodyText = rawBodyText.trim();
  // Remove leading punctuation like " - " or ":" that might remain
  rawBodyText = rawBodyText.replace(/^[\s\-:]+/, '');

  const bodyText = rawBodyText.substring(0, 500) + (rawBodyText.length > 500 ? '...' : '');
  const body = createTextWithItalics(bodyText, {
    left: insertX,
    top: insertY + title.height + 15,
    width: 674,
    fontSize: 13,
    fill: '#495057',
    fontFamily: 'Arial',
    lineHeight: 1.5
  });
  currentCanvas.add(body);
  body.bringToFront(); // Bring to front

  // Group title and body together for easier manipulation
  const group = new fabric.Group([title, body], {
    left: insertX,
    top: insertY,
    selectable: true
  });

  // Remove individual objects and add group
  currentCanvas.remove(title);
  currentCanvas.remove(body);
  currentCanvas.add(group);
  group.bringToFront();

  // Select the newly added group
  currentCanvas.setActiveObject(group);
  currentCanvas.renderAll();

  showTemporaryMessage('Article added at cursor position');
}

function moveElementToPage(obj, sourceCanvas, targetPageIndex) {
  obj.clone((cloned) => {
    sourceCanvas.remove(obj);
    sourceCanvas.renderAll();

    const targetCanvas = window.modernEditor.pages[targetPageIndex];
    targetCanvas.add(cloned);
    cloned.bringToFront(); // Bring element to front
    targetCanvas.renderAll();

    switchToPage(targetPageIndex);

    targetCanvas.setActiveObject(cloned);
    targetCanvas.renderAll();

    showTemporaryMessage('Element moved to Page ' + (targetPageIndex + 1));
  });
}

function downloadHighQualityPDF() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error('jsPDF library not loaded');
    }

    const pdf = new jsPDF('p', 'pt', 'a4');

    const pages = window.modernEditor && window.modernEditor.pages;
    if (!pages || pages.length === 0) {
      throw new Error('No pages to export');
    }

    pages.forEach((pageCanvas, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      const imgData = pageCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 595, 842, undefined, 'NONE');
    });

    const filename = 'vc-newsletter-' + new Date().toISOString().split('T')[0] + '.pdf';
    pdf.save(filename);

    showTemporaryMessage('PDF downloaded successfully');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Error downloading PDF: ' + error.message);
  }
}

function downloadWordDoc() {
  try {
    const pages = window.modernEditor && window.modernEditor.pages;
    if (!pages || pages.length === 0) {
      throw new Error('No pages to export');
    }

    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>VC Newsletter</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.5; }
          p { margin-bottom: 12px; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
    `;

    // Process each page
    pages.forEach((pageCanvas, pageIndex) => {
      // Get all objects
      const objects = pageCanvas.getObjects();

      // Sort objects by top position to maintain reading order
      // We also group items that are close vertically to handle columns better if needed, 
      // but for now simple vertical sort is best for linear Word doc
      const sortedObjects = objects.sort((a, b) => a.top - b.top);

      if (pageIndex > 0) {
        // Add page break for subsequent pages
        htmlContent += '<br clear=all style="mso-special-character:line-break;page-break-before:always">';
      }

      sortedObjects.forEach(obj => {
        if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
          // Text handling
          const text = obj.text || '';
          if (!text.trim()) return;

          // Determine style
          let styles = [];
          if (obj.fontWeight === 'bold' || obj.fontWeight === 700) styles.push('font-weight: bold');
          if (obj.fontStyle === 'italic') styles.push('font-style: italic');
          if (obj.underline) styles.push('text-decoration: underline');

          // Map font size roughly (pixels to points approx)
          const fontSize = Math.round((obj.fontSize || 16) * 0.75);
          styles.push(`font-size: ${fontSize}pt`);

          // Color
          if (obj.fill && typeof obj.fill === 'string') styles.push(`color: ${obj.fill}`);

          // Alignment
          if (obj.textAlign) styles.push(`text-align: ${obj.textAlign}`);

          // Convert newlines to <br>
          const formattedText = text.replace(/\n/g, '<br>');

          htmlContent += `<p style="${styles.join('; ')}">${formattedText}</p>`;
        } else if (obj.type === 'image') {
          // Image handling - export to Word with base64 PNG
          try {
            // Use Fabric's toDataURL to get the image as base64
            const imgData = obj.toDataURL({
              format: 'png',
              quality: 1,
              multiplier: 1,
              enableRetinaScaling: false
            });

            // Calculate dimensions for Word (scale to fit page width of ~600pt)
            const scaledWidth = Math.round(obj.width * obj.scaleX);
            const scaledHeight = Math.round(obj.height * obj.scaleY);
            const wordWidth = Math.min(scaledWidth, 600);
            const wordHeight = Math.round((wordWidth / scaledWidth) * scaledHeight);

            // Add image with v:shape for better Word compatibility
            htmlContent += `
              <p style="text-align:center; margin:10px 0;">
                <img src="${imgData}"
                     width="${wordWidth}"
                     height="${wordHeight}"
                     alt="Newsletter Image" />
              </p>`;

            console.log('✅ Image exported:', wordWidth, 'x', wordHeight, 'px');
          } catch (e) {
            console.error('❌ Could not export image:', e);
          }
        } else if (obj.type === 'group') {
          // Handle groups (like the title+body group we create)
          // We need to extract text from groups
          obj.getObjects().forEach(innerObj => {
            if (innerObj.type === 'i-text' || innerObj.type === 'text' || innerObj.type === 'textbox') {
              const text = innerObj.text || '';
              if (!text.trim()) return;

              let styles = [];
              if (innerObj.fontWeight === 'bold' || innerObj.fontWeight === 700) styles.push('font-weight: bold');
              if (innerObj.fontStyle === 'italic') styles.push('font-style: italic');
              const fontSize = Math.round((innerObj.fontSize || 16) * 0.75);
              styles.push(`font-size: ${fontSize}pt`);
              if (innerObj.fill && typeof innerObj.fill === 'string') styles.push(`color: ${innerObj.fill}`);

              const formattedText = text.replace(/\n/g, '<br>');
              htmlContent += `<p style="${styles.join('; ')}">${formattedText}</p>`;
            }
          });
        }
      });
    });

    htmlContent += '</body></html>';

    // Create blob and download
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vc-newsletter-' + new Date().toISOString().split('T')[0] + '.doc';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    showTemporaryMessage('Word document downloaded successfully');

  } catch (error) {
    console.error('Error downloading Word doc:', error);
    alert('Error downloading Word doc: ' + error.message);
  }
}

function getTitleForItem(item) {
  const catKey = (item.category || '').toLowerCase().replace(/[\s_-]+/g, '');
  const fullText = item.fullText || '';
  const firstLine = fullText.split(/\r?\n/)[0] || '';

  const titles = {
    'researchgrant': item.researchTopic || item.topic || firstLine || 'Research Topic',
    'journalpublications': item.journalName || item.journal || firstLine || 'Journal Publication',
    'bookchapters': item.chapterTitle || item.title || firstLine || 'Book Chapter',
    'booksandeditedbooks': item.bookTitle || item.title || firstLine || 'Book',
    'conferenceproceeding': item.conferenceName || item.conference || firstLine || 'Conference Proceeding',
    'conferencepresentation': item.conferenceName || item.conference || firstLine || 'Conference Presentation',
    'seminarandworkshop': item.workTitle || item.title || firstLine || 'Seminar/Workshop',
    'media': item.caption || firstLine || 'Media',
    'achievements': item.achievementTitle || item.title || firstLine || 'Achievement'
  };

  return titles[catKey] || firstLine || 'Newsletter Item';
}

// ========================================================================
// LOADING SCREEN HELPERS
// ========================================================================

function showLoadingScreen() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'pdf-loading-overlay';
  overlay.innerHTML = `
    <style>
      #pdf-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(13, 39, 71, 0.95);
        backdrop-filter: blur(10px);
        z-index: 20000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: 'Segoe UI', sans-serif;
        transition: opacity 0.3s ease;
      }
      
      .loader-content {
        text-align: center;
        width: 300px;
      }
      
      .loader-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 20px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loader-text {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
        letter-spacing: 0.5px;
      }
      
      .loader-subtext {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 20px;
        height: 20px;
      }
      
      .progress-container {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background: #4facfe;
        width: 0%;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
      }
      
      .progress-percentage {
        margin-top: 8px;
        font-size: 14px;
        font-weight: 700;
        color: #4facfe;
      }
    </style>
    <div class="loader-content">
      <div class="loader-spinner"></div>
      <div class="loader-text">Generating PDF Editor</div>
      <div class="loader-subtext" id="loader-status">Initializing...</div>
      <div class="progress-container">
        <div class="progress-bar" id="loader-progress"></div>
      </div>
      <div class="progress-percentage" id="loader-percentage">0%</div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function updateLoadingProgress(percent, status) {
  const progressBar = document.getElementById('loader-progress');
  const percentageText = document.getElementById('loader-percentage');
  const statusText = document.getElementById('loader-status');

  if (progressBar) progressBar.style.width = percent + '%';
  if (percentageText) percentageText.textContent = Math.round(percent) + '%';
  if (statusText && status) statusText.textContent = status;
}

function hideLoadingScreen() {
  const overlay = document.getElementById('pdf-loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

// Helper to toggle sidebar sections
function toggleSidebarSection(elementId, headerElement) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const icon = headerElement.querySelector('i');

  if (element.style.display === 'none') {
    element.style.display = 'block';
    if (icon) {
      icon.classList.remove('bi-chevron-right');
      icon.classList.add('bi-chevron-down');
    }
  } else {
    element.style.display = 'none';
    if (icon) {
      icon.classList.remove('bi-chevron-down');
      icon.classList.add('bi-chevron-right');
    }
  }
}

// Helper to toggle entire sidebar
// Helper to toggle entire sidebar
function toggleModernSidebar() {
  const sidebar = document.getElementById('modernSidebar');
  const btn = document.getElementById('toggleSidebarBtn');
  const floatingBtn = document.getElementById('floatingSidebarBtn');

  if (!sidebar) return;

  if (sidebar.style.display === 'none') {
    sidebar.style.display = 'block';
    if (btn) btn.classList.add('active');
    if (floatingBtn) floatingBtn.style.display = 'none';
  } else {
    sidebar.style.display = 'none';
    if (btn) btn.classList.remove('active');
    if (floatingBtn) floatingBtn.style.display = 'block';
  }
}


// ========================================================================
// MISSING DRAGGABLE PANEL FUNCTIONS
// ========================================================================

function makeBackgroundPanelDraggable() {
  const panel = document.getElementById('backgroundPanel');
  if (!panel) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const title = panel.querySelector('.property-title');
  if (!title) return;

  title.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === title || title.contains(e.target)) {
      isDragging = true;
      panel.classList.add('dragging');
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, panel);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    panel.classList.remove('dragging');
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = 'translate(' + xPos + 'px, ' + yPos + 'px)';
  }
}

function makeDrawingPanelDraggable() {
  const panel = document.getElementById('drawingPanel');
  if (!panel) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const title = panel.querySelector('.property-title');
  if (!title) return;

  title.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === title || title.contains(e.target)) {
      isDragging = true;
      panel.classList.add('dragging');
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, panel);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    panel.classList.remove('dragging');
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = 'translate(' + xPos + 'px, ' + yPos + 'px)';
  }
}

function makeGridPanelDraggable() {
  const panel = document.getElementById('gridPanel');
  if (!panel) return;

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const title = panel.querySelector('.property-title');
  if (!title) return;

  title.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === title || title.contains(e.target)) {
      isDragging = true;
      panel.classList.add('dragging');
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, panel);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    panel.classList.remove('dragging');
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = 'translate(' + xPos + 'px, ' + yPos + 'px)';
  }
}

// ========================================================================
// MISSING HELPER FUNCTIONS
// ========================================================================

function forEachObjectInTarget(target, callback) {
  if (!target) return;

  if (target.type === 'activeSelection') {
    // Multiple objects selected
    target.forEachObject(callback);
  } else if (target.type === 'group') {
    // Group selected
    target.getObjects().forEach(callback);
  } else {
    // Single object
    callback(target);
  }
}

// Duplicate function removed - using the main one above

function undo() {
  const canvas = window.modernEditor.canvas;
  if (canvas && canvas.undoStack && canvas.undoStack.length > 0) {
    const state = canvas.undoStack.pop();
    if (state) {
      canvas.redoStack.push(canvas.toJSON());
      canvas.loadFromJSON(state, canvas.renderAll.bind(canvas));
    }
  }
}

function redo() {
  const canvas = window.modernEditor.canvas;
  if (canvas && canvas.redoStack && canvas.redoStack.length > 0) {
    const state = canvas.redoStack.pop();
    if (state) {
      canvas.undoStack.push(canvas.toJSON());
      canvas.loadFromJSON(state, canvas.renderAll.bind(canvas));
    }
  }
}

function showTemporaryMessage(message) {
  // Create a temporary message overlay
  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 20px; border-radius: 6px; z-index: 10001; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
  document.body.appendChild(msg);

  setTimeout(() => {
    if (msg.parentNode) {
      msg.style.opacity = '0';
      msg.style.transition = 'opacity 0.3s ease';
      setTimeout(() => msg.remove(), 300);
    }
  }, 3000);
}

function normalizeCategoryKey(category) {
  if (!category) return '';
  return category.toLowerCase().replace(/[\s_-]+/g, '');
}

function findBestCategoryMatch(category, categories) {
  if (!category) return null;

  const normalized = normalizeCategoryKey(category);

  // Try exact match first
  for (const cat of categories) {
    if (normalizeCategoryKey(cat.id) === normalized) {
      return cat.id;
    }
  }

  // Try partial match
  for (const cat of categories) {
    if (normalized.includes(normalizeCategoryKey(cat.id)) || normalizeCategoryKey(cat.id).includes(normalized)) {
      return cat.id;
    }
  }

  return null;
}
