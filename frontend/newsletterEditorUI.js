// newsletterEditorUI.js
// Enhanced UI components for newsletter editors
// This file provides the UI integration for all enhancement features

(function () {
    'use strict';

    // Wait for the enhancement module to load
    if (typeof NewsletterEditorEnhancements === 'undefined') {
        console.error('NewsletterEditorEnhancements module not loaded!');
        return;
    }

    const Enhancements = NewsletterEditorEnhancements;

    // ============================================================================
    // ENHANCED PROPERTY PANEL
    // ============================================================================

    function createEnhancedPropertyPanel() {
        return `
      <div class="property-tabs">
        <button class="property-tab active" data-tab="properties">Properties</button>
        <button class="property-tab" data-tab="appearance">Appearance</button>
        <button class="property-tab" data-tab="position">Position</button>
        <button class="property-tab" data-tab="effects">Effects</button>
      </div>

      <div class="property-tab-content active" id="properties-tab">
        <!-- Text Properties -->
        <div class="property-section" id="textProperties" style="display: none;">
          <h4 class="property-section-title">Text</h4>
          
          <div class="property-group">
            <label class="property-label">Font Family</label>
            <select class="property-input" id="fontFamilySelect">
              <optgroup label="Google Fonts">
                ${Enhancements.GOOGLE_FONTS.map(font =>
            `<option value="${font}" style="font-family: ${font}">${font}</option>`
        ).join('')}
              </optgroup>
              <optgroup label="System Fonts">
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
              </optgroup>
            </select>
          </div>

          <div class="property-group">
            <label class="property-label">Text Style Presets</label>
            <div class="button-group">
              <button class="preset-btn" data-style="h1">H1</button>
              <button class="preset-btn" data-style="h2">H2</button>
              <button class="preset-btn" data-style="h3">H3</button>
              <button class="preset-btn" data-style="body">Body</button>
              <button class="preset-btn" data-style="caption">Caption</button>
              <button class="preset-btn" data-style="quote">Quote</button>
            </div>
          </div>

          <div class="property-group">
            <label class="property-label">Font Size: <span id="fontSizeValue">16</span>px</label>
            <div class="slider-input-group">
              <input type="range" class="property-slider" id="fontSizeSlider" min="8" max="200" value="16">
              <input type="number" class="property-input-small" id="fontSizeInput" min="8" max="200" value="16">
            </div>
          </div>

          <div class="property-group">
            <label class="property-label">Font Weight</label>
            <select class="property-input" id="fontWeightSelect">
              <option value="100">Thin (100)</option>
              <option value="200">Extra Light (200)</option>
              <option value="300">Light (300)</option>
              <option value="400" selected>Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi Bold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extra Bold (800)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>

          <div class="property-group">
            <label class="property-label">Line Height: <span id="lineHeightValue">1.5</span></label>
            <input type="range" class="property-slider" id="lineHeightSlider" min="0.5" max="3" step="0.1" value="1.5">
          </div>

          <div class="property-group">
            <label class="property-label">Character Spacing: <span id="charSpacingValue">0</span>px</label>
            <input type="range" class="property-slider" id="charSpacingSlider" min="-50" max="200" value="0">
          </div>

          <div class="property-group">
            <label class="property-label">Text Transform</label>
            <div class="button-group">
              <button class="transform-btn" data-transform="none">None</button>
              <button class="transform-btn" data-transform="uppercase">ABC</button>
              <button class="transform-btn" data-transform="lowercase">abc</button>
              <button class="transform-btn" data-transform="capitalize">Abc</button>
            </div>
          </div>
        </div>

        <!-- Shape Properties -->
        <div class="property-section" id="shapeProperties" style="display: none;">
          <h4 class="property-section-title">Shape</h4>
          
          <div class="property-group">
            <label class="property-label">Corner Radius: <span id="cornerRadiusValue">0</span>px</label>
            <input type="range" class="property-slider" id="cornerRadiusSlider" min="0" max="100" value="0">
          </div>

          <div class="property-group">
            <label class="property-label">Border Width: <span id="borderWidthValue">0</span>px</label>
            <input type="range" class="property-slider" id="borderWidthSlider" min="0" max="20" value="0">
          </div>

          <div class="property-group">
            <label class="property-label">Border Style</label>
            <select class="property-input" id="borderStyleSelect">
              <option value="">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>

        <!-- Image Properties -->
        <div class="property-section" id="imageProperties" style="display: none;">
          <h4 class="property-section-title">Image</h4>
          
          <div class="property-group">
            <label class="property-label">Fit Mode</label>
            <select class="property-input" id="imageFitSelect">
              <option value="fill">Fill</option>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>

          <div class="property-group">
            <label class="property-label">Filters</label>
            <div class="filter-controls">
              <label>Brightness: <span id="brightnessValue">100</span>%</label>
              <input type="range" class="property-slider" id="brightnessSlider" min="0" max="200" value="100">
              
              <label>Contrast: <span id="contrastValue">100</span>%</label>
              <input type="range" class="property-slider" id="contrastSlider" min="0" max="200" value="100">
              
              <label>Saturation: <span id="saturationValue">100</span>%</label>
              <input type="range" class="property-slider" id="saturationSlider" min="0" max="200" value="100">
            </div>
          </div>

          <div class="property-group">
            <button class="property-btn" id="cropImageBtn">
              <i class="bi bi-crop"></i> Crop Image
            </button>
          </div>
        </div>
      </div>

      <div class="property-tab-content" id="appearance-tab">
        <div class="property-group">
          <label class="property-label">Color Palette</label>
          <select class="property-input" id="colorPaletteSelect">
            ${Object.keys(Enhancements.COLOR_PALETTES).map(key =>
            `<option value="${key}">${Enhancements.COLOR_PALETTES[key].name}</option>`
        ).join('')}
          </select>
        </div>

        <div class="property-group">
          <label class="property-label">Fill Color</label>
          <div class="color-grid" id="fillColorGrid">
            <!-- Colors will be populated dynamically -->
          </div>
          <div class="color-picker-container">
            <input type="color" class="property-input color-picker" id="fillColorPicker">
            <input type="text" class="property-input" id="fillColorHex" placeholder="#000000" maxlength="7">
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Stroke Color</label>
          <div class="color-grid" id="strokeColorGrid">
            <!-- Colors will be populated dynamically -->
          </div>
          <div class="color-picker-container">
            <input type="color" class="property-input color-picker" id="strokeColorPicker">
            <input type="text" class="property-input" id="strokeColorHex" placeholder="#000000" maxlength="7">
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Opacity: <span id="opacityValue">100</span>%</label>
          <input type="range" class="property-slider" id="opacitySlider" min="0" max="100" value="100">
        </div>

        <div class="property-group">
          <label class="property-label">Gradient</label>
          <button class="property-btn" id="createGradientBtn">
            <i class="bi bi-palette"></i> Create Gradient
          </button>
        </div>
      </div>

      <div class="property-tab-content" id="position-tab">
        <div class="property-group">
          <label class="property-label">Position</label>
          <div class="position-inputs">
            <div>
              <label>X:</label>
              <input type="number" class="property-input-small" id="positionX" value="0">
            </div>
            <div>
              <label>Y:</label>
              <input type="number" class="property-input-small" id="positionY" value="0">
            </div>
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Size</label>
          <div class="position-inputs">
            <div>
              <label>W:</label>
              <input type="number" class="property-input-small" id="sizeWidth" value="100">
            </div>
            <div>
              <label>H:</label>
              <input type="number" class="property-input-small" id="sizeHeight" value="100">
            </div>
          </div>
          <label class="checkbox-label">
            <input type="checkbox" id="lockAspectRatio">
            Lock Aspect Ratio
          </label>
        </div>

        <div class="property-group">
          <label class="property-label">Rotation: <span id="rotationValue">0</span>°</label>
          <input type="range" class="property-slider" id="rotationSlider" min="0" max="360" value="0">
        </div>

        <div class="property-group">
          <label class="property-label">Flip</label>
          <div class="button-group">
            <button class="property-btn" id="flipHorizontalBtn">
              <i class="bi bi-arrow-left-right"></i> Horizontal
            </button>
            <button class="property-btn" id="flipVerticalBtn">
              <i class="bi bi-arrow-down-up"></i> Vertical
            </button>
          </div>
        </div>
      </div>

      <div class="property-tab-content" id="effects-tab">
        <div class="property-group">
          <label class="property-label">Shadow</label>
          <label class="checkbox-label">
            <input type="checkbox" id="enableShadow">
            Enable Shadow
          </label>
          <div id="shadowControls" style="display: none;">
            <label>Blur: <span id="shadowBlurValue">10</span>px</label>
            <input type="range" class="property-slider" id="shadowBlurSlider" min="0" max="50" value="10">
            
            <label>Offset X: <span id="shadowXValue">5</span>px</label>
            <input type="range" class="property-slider" id="shadowXSlider" min="-50" max="50" value="5">
            
            <label>Offset Y: <span id="shadowYValue">5</span>px</label>
            <input type="range" class="property-slider" id="shadowYSlider" min="-50" max="50" value="5">
            
            <label>Color:</label>
            <input type="color" class="property-input color-picker" id="shadowColorPicker" value="#000000">
          </div>
        </div>

        <div class="property-group">
          <label class="property-label">Blend Mode</label>
          <select class="property-input" id="blendModeSelect">
            <option value="source-over">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
          </select>
        </div>
      </div>
    `;
    }

    // ============================================================================
    // ENHANCED TOOLBAR
    // ============================================================================

    function createEnhancedToolbar() {
        return `
      <style>
        .enhanced-toolbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 20px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .toolbar-section {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f8f9fa;
          border-radius: 8px;
          align-items: center;
        }

        .toolbar-separator {
          width: 1px;
          height: 32px;
          background: #dee2e6;
          margin: 0 8px;
        }

        .toolbar-btn {
          padding: 8px 12px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #495057;
          font-weight: 500;
        }

        .toolbar-btn:hover {
          background: #0d2747;
          color: white;
          transform: translateY(-1px);
        }

        .toolbar-btn.active {
          background: #0d2747;
          color: white;
        }

        .toolbar-dropdown {
          position: relative;
        }

        .toolbar-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          padding: 8px;
          display: none;
          flex-direction: column;
          gap: 4px;
          min-width: 180px;
          z-index: 10000;
          margin-top: 4px;
        }

        .toolbar-dropdown-menu.show {
          display: flex;
        }

        .toolbar-dropdown-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbar-dropdown-item:hover {
          background: #f8f9fa;
        }

        .toolbar-input {
          padding: 6px 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 13px;
          width: 60px;
        }

        .toolbar-input:focus {
          outline: none;
          border-color: #0d2747;
        }
      </style>

      <!-- Drawing Tools Section -->
      <div class="toolbar-section">
        <button class="toolbar-btn" id="drawingModeBtn" title="Drawing Mode">
          <i class="bi bi-pencil"></i> Draw
        </button>
        <button class="toolbar-btn" id="eraserModeBtn" title="Eraser">
          <i class="bi bi-eraser"></i>
        </button>
        <div class="toolbar-dropdown">
          <button class="toolbar-btn" id="brushSizeBtn">
            <i class="bi bi-circle"></i> <span id="brushSizeLabel">2px</span>
          </button>
          <div class="toolbar-dropdown-menu" id="brushSizeMenu">
            <input type="range" min="1" max="50" value="2" id="brushSizeSlider" style="width: 100%;">
          </div>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Grid & Guides Section -->
      <div class="toolbar-section">
        <button class="toolbar-btn" id="toggleGridBtn" title="Toggle Grid">
          <i class="bi bi-grid-3x3"></i> Grid
        </button>
        <button class="toolbar-btn" id="toggleSnapBtn" title="Snap to Grid">
          <i class="bi bi-magnet"></i> Snap
        </button>
        <button class="toolbar-btn" id="addGuideBtn" title="Add Guide">
          <i class="bi bi-rulers"></i> Guide
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Background Section -->
      <div class="toolbar-section">
        <div class="toolbar-dropdown">
          <button class="toolbar-btn" id="backgroundBtn">
            <i class="bi bi-paint-bucket"></i> Background
          </button>
          <div class="toolbar-dropdown-menu" id="backgroundMenu">
            <div class="toolbar-dropdown-item" id="bgColorBtn">
              <i class="bi bi-palette"></i> Solid Color
            </div>
            <div class="toolbar-dropdown-item" id="bgImageBtn">
              <i class="bi bi-image"></i> Image
            </div>
            <div class="toolbar-dropdown-item" id="bgGradientBtn">
              <i class="bi bi-gradient"></i> Gradient
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Template Section -->
      <div class="toolbar-section">
        <div class="toolbar-dropdown">
          <button class="toolbar-btn" id="templateBtn">
            <i class="bi bi-file-earmark-text"></i> Templates
          </button>
          <div class="toolbar-dropdown-menu" id="templateMenu">
            ${Object.keys(Enhancements.TEMPLATES).map(key => {
            const template = Enhancements.TEMPLATES[key];
            return `<div class="toolbar-dropdown-item" data-template="${key}">
                ${template.icon} ${template.name}
              </div>`;
        }).join('')}
          </div>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Export Section -->
      <div class="toolbar-section">
        <div class="toolbar-dropdown">
          <button class="toolbar-btn" id="exportBtn">
            <i class="bi bi-download"></i> Export
          </button>
          <div class="toolbar-dropdown-menu" id="exportMenu">
            <div class="toolbar-dropdown-item" id="exportPNGBtn">
              <i class="bi bi-file-earmark-image"></i> Export as PNG
            </div>
            <div class="toolbar-dropdown-item" id="exportJPGBtn">
              <i class="bi bi-file-earmark-image"></i> Export as JPG
            </div>
            <div class="toolbar-dropdown-item" id="exportJSONBtn">
              <i class="bi bi-file-earmark-code"></i> Export as JSON
            </div>
            <div class="toolbar-dropdown-item" id="saveLocalBtn">
              <i class="bi bi-save"></i> Save to Browser
            </div>
            <div class="toolbar-dropdown-item" id="loadLocalBtn">
              <i class="bi bi-folder-open"></i> Load from Browser
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Zoom Section -->
      <div class="toolbar-section">
        <button class="toolbar-btn" id="zoomOutBtn" title="Zoom Out">
          <i class="bi bi-zoom-out"></i>
        </button>
        <span id="zoomLevel" style="min-width: 50px; text-align: center; font-weight: 600;">100%</span>
        <button class="toolbar-btn" id="zoomInBtn" title="Zoom In">
          <i class="bi bi-zoom-in"></i>
        </button>
        <button class="toolbar-btn" id="zoomResetBtn" title="Reset Zoom">
          <i class="bi bi-aspect-ratio"></i>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Help Section -->
      <div class="toolbar-section">
        <button class="toolbar-btn" id="keyboardShortcutsBtn" title="Keyboard Shortcuts">
          <i class="bi bi-keyboard"></i>
        </button>
      </div>
    `;
    }

    // ============================================================================
    // KEYBOARD SHORTCUTS MODAL
    // ============================================================================

    function createKeyboardShortcutsModal() {
        return `
      <div class="shortcuts-modal" id="shortcutsModal" style="display: none;">
        <div class="shortcuts-modal-content">
          <div class="shortcuts-modal-header">
            <h3>Keyboard Shortcuts</h3>
            <button class="shortcuts-close-btn" id="shortcutsCloseBtn">×</button>
          </div>
          <div class="shortcuts-modal-body">
            <div class="shortcuts-section">
              <h4>Text Formatting</h4>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>B</kbd>
                <span>Bold</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>I</kbd>
                <span>Italic</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>U</kbd>
                <span>Underline</span>
              </div>
            </div>

            <div class="shortcuts-section">
              <h4>Editing</h4>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>C</kbd>
                <span>Copy</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>V</kbd>
                <span>Paste</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>X</kbd>
                <span>Cut</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>D</kbd>
                <span>Duplicate</span>
              </div>
              <div class="shortcut-item">
                <kbd>Delete</kbd>
                <span>Delete Selected</span>
              </div>
            </div>

            <div class="shortcuts-section">
              <h4>Layers</h4>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>]</kbd>
                <span>Bring Forward</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>[</kbd>
                <span>Send Backward</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>]</kbd>
                <span>Bring to Front</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>[</kbd>
                <span>Send to Back</span>
              </div>
            </div>

            <div class="shortcuts-section">
              <h4>Grouping</h4>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>G</kbd>
                <span>Group</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>G</kbd>
                <span>Ungroup</span>
              </div>
            </div>

            <div class="shortcuts-section">
              <h4>Movement</h4>
              <div class="shortcut-item">
                <kbd>Arrow Keys</kbd>
                <span>Move 1px</span>
              </div>
              <div class="shortcut-item">
                <kbd>Shift</kbd> + <kbd>Arrow Keys</kbd>
                <span>Move 10px</span>
              </div>
            </div>

            <div class="shortcuts-section">
              <h4>Other</h4>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                <span>Undo</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                <span>Redo</span>
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>A</kbd>
                <span>Select All</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        .shortcuts-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10003;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shortcuts-modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .shortcuts-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .shortcuts-modal-header h3 {
          margin: 0;
          color: #0d2747;
        }

        .shortcuts-close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #6c757d;
          line-height: 1;
        }

        .shortcuts-modal-body {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .shortcuts-section h4 {
          margin: 0 0 12px 0;
          color: #0d2747;
          font-size: 16px;
        }

        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .shortcut-item:last-child {
          border-bottom: none;
        }

        kbd {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: monospace;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .shortcut-item span {
          color: #6c757d;
          font-size: 14px;
        }
      </style>
    `;
    }

    // ============================================================================
    // EXPORT API
    // ============================================================================

    window.NewsletterEditorUI = {
        createEnhancedPropertyPanel: createEnhancedPropertyPanel,
        createEnhancedToolbar: createEnhancedToolbar,
        createKeyboardShortcutsModal: createKeyboardShortcutsModal
    };

})();
