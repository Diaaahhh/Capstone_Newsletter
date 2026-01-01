// newsletterEditorEnhancements.js
// Comprehensive enhancement module for both VC and General Newsletter Editors
// This module adds advanced editing features including:
// - Enhanced text editing with Google Fonts
// - Advanced shapes and drawing tools
// - Image manipulation
// - Icon library
// - Grid and guides
// - Layer management
// - Templates
// - Export options
// - Keyboard shortcuts
// - Color palettes

(function() {
  'use strict';

  // ============================================================================
  // GOOGLE FONTS INTEGRATION
  // ============================================================================

  const GOOGLE_FONTS = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
    'Source Sans Pro', 'Raleway', 'PT Sans', 'Merriweather', 'Ubuntu',
    'Playfair Display', 'Nunito', 'Poppins', 'Inter', 'Mukta',
    'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
    'Karla', 'Barlow', 'Oxygen', 'Cabin', 'Crimson Text',
    'Libre Baskerville', 'Bitter', 'Archivo', 'Hind', 'Titillium Web',
    'Heebo', 'Josefin Sans', 'Arimo', 'Inconsolata', 'Dosis',
    'Exo 2', 'Libre Franklin', 'Varela Round', 'Asap', 'Prompt',
    'Manrope', 'DM Sans', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans',
    'Sora', 'Epilogue', 'Lexend', 'Be Vietnam Pro', 'Red Hat Display'
  ];

  function loadGoogleFonts() {
    if (document.getElementById('google-fonts-link')) return;
    
    const fontFamilies = GOOGLE_FONTS.map(font => font.replace(/ /g, '+')).join('|');
    const link = document.createElement('link');
    link.id = 'google-fonts-link';
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }

  // ============================================================================
  // TEXT STYLE PRESETS
  // ============================================================================

  const TEXT_STYLES = {
    h1: {
      fontSize: 48,
      fontWeight: 'bold',
      lineHeight: 1.2,
      fontFamily: 'Montserrat'
    },
    h2: {
      fontSize: 36,
      fontWeight: 'bold',
      lineHeight: 1.3,
      fontFamily: 'Montserrat'
    },
    h3: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 1.4,
      fontFamily: 'Montserrat'
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 1.6,
      fontFamily: 'Open Sans'
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 1.4,
      fontFamily: 'Open Sans'
    },
    quote: {
      fontSize: 20,
      fontWeight: '300',
      lineHeight: 1.8,
      fontFamily: 'Playfair Display',
      fontStyle: 'italic'
    }
  };

  // ============================================================================
  // COLOR PALETTES
  // ============================================================================

  const COLOR_PALETTES = {
    professional: {
      name: 'Professional',
      colors: ['#0d2747', '#1a4d7a', '#2e7d9e', '#4facfe', '#667eea', '#764ba2', '#f093fb', '#fa709a']
    },
    vibrant: {
      name: 'Vibrant',
      colors: ['#ff6b6b', '#ee5a6f', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#22b8cf']
    },
    pastel: {
      name: 'Pastel',
      colors: ['#ffd8be', '#ffc9c9', '#ffa8a8', '#fcc2d7', '#d0bfff', '#a5d8ff', '#99e9f2', '#96f2d7']
    },
    monochrome: {
      name: 'Monochrome',
      colors: ['#000000', '#212529', '#495057', '#6c757d', '#adb5bd', '#ced4da', '#e9ecef', '#f8f9fa']
    },
    earthy: {
      name: 'Earthy',
      colors: ['#8b4513', '#a0522d', '#cd853f', '#daa520', '#d2691e', '#bc8f8f', '#f4a460', '#ffa07a']
    },
    ocean: {
      name: 'Ocean',
      colors: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']
    }
  };

  // ============================================================================
  // SHAPE TEMPLATES
  // ============================================================================

  function createTriangle(canvas, options = {}) {
    const triangle = new fabric.Triangle({
      left: options.left || 100,
      top: options.top || 100,
      width: options.width || 100,
      height: options.height || 100,
      fill: options.fill || '#667eea',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      opacity: options.opacity || 1
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
    return triangle;
  }

  function createStar(canvas, options = {}) {
    const points = options.points || 5;
    const innerRadius = options.innerRadius || 25;
    const outerRadius = options.outerRadius || 50;
    
    const starPoints = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / points) * i;
      starPoints.push({
        x: radius * Math.sin(angle),
        y: -radius * Math.cos(angle)
      });
    }
    
    const star = new fabric.Polygon(starPoints, {
      left: options.left || 100,
      top: options.top || 100,
      fill: options.fill || '#fee140',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      opacity: options.opacity || 1
    });
    
    canvas.add(star);
    canvas.setActiveObject(star);
    canvas.renderAll();
    return star;
  }

  function createArrow(canvas, options = {}) {
    const arrowPath = 'M 0 0 L 80 0 L 80 -15 L 100 10 L 80 35 L 80 20 L 0 20 Z';
    const arrow = new fabric.Path(arrowPath, {
      left: options.left || 100,
      top: options.top || 100,
      fill: options.fill || '#43e97b',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      opacity: options.opacity || 1,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1
    });
    
    canvas.add(arrow);
    canvas.setActiveObject(arrow);
    canvas.renderAll();
    return arrow;
  }

  function createPolygon(canvas, sides = 6, options = {}) {
    const radius = options.radius || 50;
    const points = [];
    
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    }
    
    const polygon = new fabric.Polygon(points, {
      left: options.left || 100,
      top: options.top || 100,
      fill: options.fill || '#4facfe',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      opacity: options.opacity || 1
    });
    
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.renderAll();
    return polygon;
  }

  // ============================================================================
  // GRID AND GUIDES SYSTEM
  // ============================================================================

  class GridSystem {
    constructor(canvas, spacing = 20) {
      this.canvas = canvas;
      this.spacing = spacing;
      this.enabled = false;
      this.snapEnabled = false;
      this.gridLines = [];
      this.guides = [];
    }

    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) {
        this.show();
      } else {
        this.hide();
      }
    }

    show() {
      this.hide(); // Clear existing grid
      const width = this.canvas.width;
      const height = this.canvas.height;

      // Vertical lines
      for (let x = 0; x <= width; x += this.spacing) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true
        });
        this.gridLines.push(line);
        this.canvas.add(line);
        this.canvas.sendToBack(line);
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += this.spacing) {
        const line = new fabric.Line([0, y, width, y], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true
        });
        this.gridLines.push(line);
        this.canvas.add(line);
        this.canvas.sendToBack(line);
      }

      this.canvas.renderAll();
    }

    hide() {
      this.gridLines.forEach(line => this.canvas.remove(line));
      this.gridLines = [];
      this.canvas.renderAll();
    }

    toggleSnap() {
      this.snapEnabled = !this.snapEnabled;
      if (this.snapEnabled) {
        this.enableSnap();
      } else {
        this.disableSnap();
      }
    }

    enableSnap() {
      this.canvas.on('object:moving', (e) => {
        const obj = e.target;
        obj.set({
          left: Math.round(obj.left / this.spacing) * this.spacing,
          top: Math.round(obj.top / this.spacing) * this.spacing
        });
      });
    }

    disableSnap() {
      this.canvas.off('object:moving');
    }

    addGuide(orientation, position) {
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      let line;
      if (orientation === 'vertical') {
        line = new fabric.Line([position, 0, position, height], {
          stroke: '#667eea',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          hasControls: false,
          hasBorders: false,
          lockMovementY: true,
          excludeFromExport: true,
          guideLine: true
        });
      } else {
        line = new fabric.Line([0, position, width, position], {
          stroke: '#667eea',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          selectable: true,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          excludeFromExport: true,
          guideLine: true
        });
      }
      
      this.guides.push(line);
      this.canvas.add(line);
      this.canvas.renderAll();
      return line;
    }

    clearGuides() {
      this.guides.forEach(guide => this.canvas.remove(guide));
      this.guides = [];
      this.canvas.renderAll();
    }
  }

  // ============================================================================
  // DRAWING TOOLS
  // ============================================================================

  class DrawingTool {
    constructor(canvas) {
      this.canvas = canvas;
      this.isDrawing = false;
      this.drawingMode = false;
      this.brushColor = '#000000';
      this.brushWidth = 2;
      this.eraserMode = false;
    }

    enable() {
      this.drawingMode = true;
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.brushColor;
      this.canvas.freeDrawingBrush.width = this.brushWidth;
    }

    disable() {
      this.drawingMode = false;
      this.canvas.isDrawingMode = false;
    }

    setBrushColor(color) {
      this.brushColor = color;
      if (this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.color = color;
      }
    }

    setBrushWidth(width) {
      this.brushWidth = width;
      if (this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.width = width;
      }
    }

    enableEraser() {
      this.eraserMode = true;
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush.color = this.canvas.backgroundColor || '#ffffff';
      this.canvas.freeDrawingBrush.width = this.brushWidth * 2;
    }

    disableEraser() {
      this.eraserMode = false;
      this.canvas.freeDrawingBrush.color = this.brushColor;
      this.canvas.freeDrawingBrush.width = this.brushWidth;
    }

    clearDrawings() {
      const objects = this.canvas.getObjects();
      objects.forEach(obj => {
        if (obj.type === 'path') {
          this.canvas.remove(obj);
        }
      });
      this.canvas.renderAll();
    }
  }

  // ============================================================================
  // LAYER MANAGEMENT
  // ============================================================================

  class LayerManager {
    constructor(canvas) {
      this.canvas = canvas;
      this.layers = [];
      this.lockedLayers = new Set();
      this.hiddenLayers = new Set();
    }

    updateLayers() {
      this.layers = this.canvas.getObjects();
      return this.layers;
    }

    bringToFront(obj) {
      this.canvas.bringToFront(obj);
      this.canvas.renderAll();
    }

    sendToBack(obj) {
      this.canvas.sendToBack(obj);
      this.canvas.renderAll();
    }

    bringForward(obj) {
      this.canvas.bringForward(obj);
      this.canvas.renderAll();
    }

    sendBackward(obj) {
      this.canvas.sendBackward(obj);
      this.canvas.renderAll();
    }

    lockLayer(obj) {
      obj.selectable = false;
      obj.evented = false;
      this.lockedLayers.add(obj);
      this.canvas.renderAll();
    }

    unlockLayer(obj) {
      obj.selectable = true;
      obj.evented = true;
      this.lockedLayers.delete(obj);
      this.canvas.renderAll();
    }

    hideLayer(obj) {
      obj.visible = false;
      this.hiddenLayers.add(obj);
      this.canvas.renderAll();
    }

    showLayer(obj) {
      obj.visible = true;
      this.hiddenLayers.delete(obj);
      this.canvas.renderAll();
    }

    groupObjects(objects) {
      const group = new fabric.Group(objects, {
        selectable: true
      });
      
      objects.forEach(obj => this.canvas.remove(obj));
      this.canvas.add(group);
      this.canvas.setActiveObject(group);
      this.canvas.renderAll();
      return group;
    }

    ungroupObjects(group) {
      const items = group._objects;
      group._restoreObjectsState();
      this.canvas.remove(group);
      
      items.forEach(item => {
        this.canvas.add(item);
      });
      
      this.canvas.renderAll();
      return items;
    }
  }

  // ============================================================================
  // TEMPLATE SYSTEM
  // ============================================================================

  const TEMPLATES = {
    newsletter_single: {
      name: 'Single Column Newsletter',
      icon: '📄',
      create: function(canvas) {
        // Header
        const header = new fabric.Rect({
          left: 0,
          top: 0,
          width: canvas.width,
          height: 150,
          fill: '#0d2747'
        });
        
        const title = new fabric.IText('Newsletter Title', {
          left: canvas.width / 2,
          top: 75,
          fontSize: 42,
          fill: '#ffffff',
          fontFamily: 'Montserrat',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center'
        });
        
        // Content area
        const contentBg = new fabric.Rect({
          left: 60,
          top: 200,
          width: canvas.width - 120,
          height: 600,
          fill: '#f8f9fa',
          rx: 10,
          ry: 10
        });
        
        const contentTitle = new fabric.IText('Article Title', {
          left: 80,
          top: 230,
          fontSize: 28,
          fill: '#212529',
          fontFamily: 'Montserrat',
          fontWeight: 'bold'
        });
        
        const contentText = new fabric.Textbox('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', {
          left: 80,
          top: 280,
          width: canvas.width - 160,
          fontSize: 16,
          fill: '#495057',
          fontFamily: 'Open Sans',
          lineHeight: 1.6
        });
        
        canvas.add(header, title, contentBg, contentTitle, contentText);
        canvas.renderAll();
      }
    },
    
    newsletter_two_column: {
      name: 'Two Column Newsletter',
      icon: '📰',
      create: function(canvas) {
        const colWidth = (canvas.width - 180) / 2;
        
        // Header
        const header = new fabric.Rect({
          left: 0,
          top: 0,
          width: canvas.width,
          height: 120,
          fill: '#667eea'
        });
        
        const title = new fabric.IText('Newsletter', {
          left: canvas.width / 2,
          top: 60,
          fontSize: 36,
          fill: '#ffffff',
          fontFamily: 'Montserrat',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center'
        });
        
        // Left column
        const leftCol = new fabric.Rect({
          left: 60,
          top: 170,
          width: colWidth,
          height: 700,
          fill: '#ffffff',
          stroke: '#e9ecef',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        });
        
        // Right column
        const rightCol = new fabric.Rect({
          left: 60 + colWidth + 60,
          top: 170,
          width: colWidth,
          height: 700,
          fill: '#ffffff',
          stroke: '#e9ecef',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        });
        
        canvas.add(header, title, leftCol, rightCol);
        canvas.renderAll();
      }
    },
    
    flyer: {
      name: 'Event Flyer',
      icon: '📢',
      create: function(canvas) {
        // Background
        const bg = new fabric.Rect({
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
          fill: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        });
        
        // Main title
        const mainTitle = new fabric.IText('EVENT NAME', {
          left: canvas.width / 2,
          top: 300,
          fontSize: 56,
          fill: '#ffffff',
          fontFamily: 'Montserrat',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
          textAlign: 'center'
        });
        
        // Subtitle
        const subtitle = new fabric.IText('Join us for an amazing event', {
          left: canvas.width / 2,
          top: 380,
          fontSize: 24,
          fill: '#ffffff',
          fontFamily: 'Open Sans',
          originX: 'center',
          originY: 'center'
        });
        
        // Date box
        const dateBox = new fabric.Rect({
          left: canvas.width / 2 - 150,
          top: 500,
          width: 300,
          height: 100,
          fill: '#ffffff',
          rx: 10,
          ry: 10,
          originX: 'left',
          originY: 'top'
        });
        
        const dateText = new fabric.IText('DATE & TIME', {
          left: canvas.width / 2,
          top: 550,
          fontSize: 20,
          fill: '#667eea',
          fontFamily: 'Montserrat',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center'
        });
        
        canvas.add(bg, mainTitle, subtitle, dateBox, dateText);
        canvas.renderAll();
      }
    },
    
    business_card: {
      name: 'Business Card',
      icon: '💼',
      create: function(canvas) {
        // Background
        const bg = new fabric.Rect({
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
          fill: '#ffffff'
        });
        
        // Accent bar
        const accentBar = new fabric.Rect({
          left: 0,
          top: 0,
          width: 10,
          height: canvas.height,
          fill: '#667eea'
        });
        
        // Name
        const name = new fabric.IText('Your Name', {
          left: 60,
          top: 80,
          fontSize: 32,
          fill: '#212529',
          fontFamily: 'Montserrat',
          fontWeight: 'bold'
        });
        
        // Title
        const jobTitle = new fabric.IText('Job Title', {
          left: 60,
          top: 130,
          fontSize: 18,
          fill: '#667eea',
          fontFamily: 'Open Sans'
        });
        
        // Contact info
        const contact = new fabric.Textbox('email@example.com\n+1 234 567 8900\nwww.website.com', {
          left: 60,
          top: 180,
          width: 300,
          fontSize: 14,
          fill: '#6c757d',
          fontFamily: 'Open Sans',
          lineHeight: 1.8
        });
        
        canvas.add(bg, accentBar, name, jobTitle, contact);
        canvas.renderAll();
      }
    }
  };

  // ============================================================================
  // EXPORT SYSTEM
  // ============================================================================

  class ExportManager {
    constructor(canvas) {
      this.canvas = canvas;
    }

    exportAsPNG(quality = 1, filename = 'design.png') {
      const dataURL = this.canvas.toDataURL({
        format: 'png',
        quality: quality,
        multiplier: 2 // 2x resolution for better quality
      });
      
      this.downloadFile(dataURL, filename);
    }

    exportAsJPG(quality = 0.9, filename = 'design.jpg') {
      const dataURL = this.canvas.toDataURL({
        format: 'jpeg',
        quality: quality,
        multiplier: 2
      });
      
      this.downloadFile(dataURL, filename);
    }

    exportAsJSON(filename = 'design.json') {
      const json = JSON.stringify(this.canvas.toJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      this.downloadFile(url, filename);
      URL.revokeObjectURL(url);
    }

    importFromJSON(jsonData) {
      this.canvas.loadFromJSON(jsonData, () => {
        this.canvas.renderAll();
      });
    }

    downloadFile(dataURL, filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    saveToLocalStorage(key = 'newsletter_design') {
      const json = JSON.stringify(this.canvas.toJSON());
      localStorage.setItem(key, json);
      localStorage.setItem(key + '_timestamp', new Date().toISOString());
    }

    loadFromLocalStorage(key = 'newsletter_design') {
      const json = localStorage.getItem(key);
      if (json) {
        this.importFromJSON(JSON.parse(json));
        return true;
      }
      return false;
    }

    autoSave(interval = 30000, key = 'newsletter_design_autosave') {
      setInterval(() => {
        this.saveToLocalStorage(key);
        console.log('Auto-saved at', new Date().toLocaleTimeString());
      }, interval);
    }
  }

  // ============================================================================
  // KEYBOARD SHORTCUTS MANAGER
  // ============================================================================

  class KeyboardShortcuts {
    constructor(canvas) {
      this.canvas = canvas;
      this.setupShortcuts();
    }

    setupShortcuts() {
      document.addEventListener('keydown', (e) => {
        const obj = this.canvas.getActiveObject();
        
        // Prevent shortcuts when typing in text
        if (obj && (obj.isEditing || obj.type === 'i-text' && obj.isEditing)) {
          return;
        }

        // Ctrl/Cmd + B: Bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
          e.preventDefault();
          this.toggleBold();
        }

        // Ctrl/Cmd + I: Italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
          e.preventDefault();
          this.toggleItalic();
        }

        // Ctrl/Cmd + U: Underline
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
          e.preventDefault();
          this.toggleUnderline();
        }

        // Ctrl/Cmd + D: Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault();
          this.duplicate();
        }

        // Delete/Backspace: Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!obj || !obj.isEditing) {
            e.preventDefault();
            this.deleteSelected();
          }
        }

        // Ctrl/Cmd + C: Copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          if (!obj || !obj.isEditing) {
            e.preventDefault();
            this.copy();
          }
        }

        // Ctrl/Cmd + V: Paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          if (!obj || !obj.isEditing) {
            e.preventDefault();
            this.paste();
          }
        }

        // Ctrl/Cmd + X: Cut
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
          if (!obj || !obj.isEditing) {
            e.preventDefault();
            this.cut();
          }
        }

        // Ctrl/Cmd + A: Select All
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          this.selectAll();
        }

        // Ctrl/Cmd + G: Group
        if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          this.group();
        }

        // Ctrl/Cmd + Shift + G: Ungroup
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
          e.preventDefault();
          this.ungroup();
        }

        // Ctrl/Cmd + ]: Bring Forward
        if ((e.ctrlKey || e.metaKey) && e.key === ']' && !e.shiftKey) {
          e.preventDefault();
          this.bringForward();
        }

        // Ctrl/Cmd + [: Send Backward
        if ((e.ctrlKey || e.metaKey) && e.key === '[' && !e.shiftKey) {
          e.preventDefault();
          this.sendBackward();
        }

        // Ctrl/Cmd + Shift + ]: Bring to Front
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '}') {
          e.preventDefault();
          this.bringToFront();
        }

        // Ctrl/Cmd + Shift + [: Send to Back
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '{') {
          e.preventDefault();
          this.sendToBack();
        }

        // Arrow keys: Move object
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          if (obj && !obj.isEditing) {
            e.preventDefault();
            this.moveObject(e.key, e.shiftKey ? 10 : 1);
          }
        }
      });
    }

    toggleBold() {
      const obj = this.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        this.canvas.renderAll();
      }
    }

    toggleItalic() {
      const obj = this.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        this.canvas.renderAll();
      }
    }

    toggleUnderline() {
      const obj = this.canvas.getActiveObject();
      if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        obj.set('underline', !obj.underline);
        this.canvas.renderAll();
      }
    }

    duplicate() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        obj.clone((cloned) => {
          cloned.set({
            left: cloned.left + 10,
            top: cloned.top + 10
          });
          this.canvas.add(cloned);
          this.canvas.setActiveObject(cloned);
          this.canvas.renderAll();
        });
      }
    }

    deleteSelected() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'activeSelection') {
          activeObject.forEachObject((obj) => {
            this.canvas.remove(obj);
          });
          this.canvas.discardActiveObject();
        } else {
          this.canvas.remove(activeObject);
        }
        this.canvas.renderAll();
      }
    }

    copy() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        obj.clone((cloned) => {
          this.clipboard = cloned;
        });
      }
    }

    paste() {
      if (this.clipboard) {
        this.clipboard.clone((cloned) => {
          cloned.set({
            left: cloned.left + 10,
            top: cloned.top + 10,
            evented: true
          });
          if (cloned.type === 'activeSelection') {
            cloned.canvas = this.canvas;
            cloned.forEachObject((obj) => {
              this.canvas.add(obj);
            });
            cloned.setCoords();
          } else {
            this.canvas.add(cloned);
          }
          this.clipboard.top += 10;
          this.clipboard.left += 10;
          this.canvas.setActiveObject(cloned);
          this.canvas.requestRenderAll();
        });
      }
    }

    cut() {
      this.copy();
      this.deleteSelected();
    }

    selectAll() {
      this.canvas.discardActiveObject();
      const sel = new fabric.ActiveSelection(this.canvas.getObjects(), {
        canvas: this.canvas
      });
      this.canvas.setActiveObject(sel);
      this.canvas.requestRenderAll();
    }

    group() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'activeSelection') {
        activeObject.toGroup();
        this.canvas.requestRenderAll();
      }
    }

    ungroup() {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject && activeObject.type === 'group') {
        activeObject.toActiveSelection();
        this.canvas.requestRenderAll();
      }
    }

    bringForward() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        this.canvas.bringForward(obj);
        this.canvas.renderAll();
      }
    }

    sendBackward() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        this.canvas.sendBackward(obj);
        this.canvas.renderAll();
      }
    }

    bringToFront() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        this.canvas.bringToFront(obj);
        this.canvas.renderAll();
      }
    }

    sendToBack() {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        this.canvas.sendToBack(obj);
        this.canvas.renderAll();
      }
    }

    moveObject(direction, distance) {
      const obj = this.canvas.getActiveObject();
      if (obj) {
        switch (direction) {
          case 'ArrowUp':
            obj.set('top', obj.top - distance);
            break;
          case 'ArrowDown':
            obj.set('top', obj.top + distance);
            break;
          case 'ArrowLeft':
            obj.set('left', obj.left - distance);
            break;
          case 'ArrowRight':
            obj.set('left', obj.left + distance);
            break;
        }
        obj.setCoords();
        this.canvas.renderAll();
      }
    }
  }

  // ============================================================================
  // ICON LIBRARY
  // ============================================================================

  const BOOTSTRAP_ICONS = [
    'alarm', 'archive', 'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'bell', 'bookmark', 'calendar', 'camera', 'cart', 'chat', 'check',
    'clock', 'cloud', 'download', 'envelope', 'eye', 'file', 'folder',
    'gear', 'gift', 'globe', 'heart', 'home', 'image', 'info-circle',
    'lightbulb', 'link', 'lock', 'map', 'mic', 'moon', 'music-note',
    'pencil', 'person', 'phone', 'play', 'plus', 'printer', 'search',
    'share', 'shield', 'star', 'sun', 'tag', 'trash', 'trophy',
    'upload', 'user', 'video', 'volume-up', 'wifi', 'x'
  ];

  function createIconElement(iconName, canvas, options = {}) {
    const iconText = new fabric.Text(String.fromCharCode(0xf000 + Math.random() * 1000), {
      left: options.left || 100,
      top: options.top || 100,
      fontSize: options.fontSize || 48,
      fill: options.fill || '#000000',
      fontFamily: 'bootstrap-icons',
      originX: 'center',
      originY: 'center'
    });
    
    canvas.add(iconText);
    canvas.setActiveObject(iconText);
    canvas.renderAll();
    return iconText;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.NewsletterEditorEnhancements = {
    // Load Google Fonts
    loadGoogleFonts: loadGoogleFonts,
    
    // Constants
    GOOGLE_FONTS: GOOGLE_FONTS,
    TEXT_STYLES: TEXT_STYLES,
    COLOR_PALETTES: COLOR_PALETTES,
    TEMPLATES: TEMPLATES,
    BOOTSTRAP_ICONS: BOOTSTRAP_ICONS,
    
    // Shape creators
    createTriangle: createTriangle,
    createStar: createStar,
    createArrow: createArrow,
    createPolygon: createPolygon,
    
    // Icon creator
    createIconElement: createIconElement,
    
    // Classes
    GridSystem: GridSystem,
    DrawingTool: DrawingTool,
    LayerManager: LayerManager,
    ExportManager: ExportManager,
    KeyboardShortcuts: KeyboardShortcuts,
    
    // Initialize all enhancements for a canvas
    initialize: function(canvas) {
      loadGoogleFonts();
      
      return {
        grid: new GridSystem(canvas),
        drawing: new DrawingTool(canvas),
        layers: new LayerManager(canvas),
        export: new ExportManager(canvas),
        keyboard: new KeyboardShortcuts(canvas)
      };
    }
  };

})();
