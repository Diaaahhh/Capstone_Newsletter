// vcNewsletterCanvaEditor.js
// Canva-like PDF editor for VC Newsletter

document.addEventListener('DOMContentLoaded', () => {
  const generatePdfBtn = document.querySelector('.generate-pdf-btn');
  
  if (generatePdfBtn && window.location.pathname.includes('vcNewsletter.html')) {
    generatePdfBtn.addEventListener('click', generateAndEditPDF);
  }
});

async function generateAndEditPDF() {
  try {
    // Get filtered items
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
    
    console.log('Generating PDF from', items.length, 'items');
    
    if (items.length === 0) {
      Toast.warning('No items to generate PDF from. Please ensure newsletter items are loaded.');
      return;
    }

    // Open Canva-like editor
    openCanvaEditor(items);
    
  } catch (error) {
    console.error('Error opening editor:', error);
    Toast.error('Error opening editor: ' + error.message);
  }
}

function openCanvaEditor(items) {
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'canvaEditorModal';
  modal.innerHTML = `
    <style>
      #canvaEditorModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f0f0f0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
      }
      .canva-header {
        background: white;
        padding: 15px 20px;
        border-bottom: 2px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .canva-toolbar {
        background: white;
        padding: 10px 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .canva-main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .canva-sidebar {
        width: 250px;
        background: white;
        border-right: 1px solid #e0e0e0;
        overflow-y: auto;
        padding: 15px;
      }
      .canva-canvas-area {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        overflow: auto;
      }
      .canvas-wrapper {
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        position: relative;
      }
      .tool-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
      }
      .tool-btn:hover {
        background: #f5f5f5;
        border-color: #0d2747;
      }
      .tool-btn.active {
        background: #0d2747;
        color: white;
      }
      .sidebar-section {
        margin-bottom: 20px;
      }
      .sidebar-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #0d2747;
      }
      .element-item {
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .element-item:hover {
        background: #e9ecef;
        transform: translateX(5px);
      }
      .color-picker {
        width: 40px;
        height: 40px;
        border: 2px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
      }
      .font-size-input {
        width: 60px;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    </style>
    
    <div class="canva-header">
      <h3 style="margin: 0; color: #0d2747;">VC Newsletter Editor</h3>
      <div style="display: flex; gap: 10px;">
        <button id="downloadPdfBtn" class="btn btn-success">
          <i class="bi bi-download"></i> Download PDF
        </button>
        <button id="closeCanvaBtn" class="btn btn-outline-secondary">
          <i class="bi bi-x-lg"></i> Close
        </button>
      </div>
    </div>
    
    <div class="canva-toolbar">
      <button class="tool-btn" id="addTextBtn">
        <i class="bi bi-fonts"></i> Add Text
      </button>
      <button class="tool-btn" id="addHeadingBtn">
        <i class="bi bi-type-h1"></i> Add Heading
      </button>
      <button class="tool-btn" id="addImageBtn">
        <i class="bi bi-image"></i> Add Image
      </button>
      <button class="tool-btn" id="addShapeBtn">
        <i class="bi bi-square"></i> Add Shape
      </button>
      <button class="tool-btn" id="addLineBtn">
        <i class="bi bi-dash-lg"></i> Add Line
      </button>
      <div style="border-left: 1px solid #ddd; height: 30px; margin: 0 5px;"></div>
      <button class="tool-btn" id="deleteBtn">
        <i class="bi bi-trash"></i> Delete
      </button>
      <button class="tool-btn" id="duplicateBtn">
        <i class="bi bi-files"></i> Duplicate
      </button>
      <div style="border-left: 1px solid #ddd; height: 30px; margin: 0 5px;"></div>
      <label style="display: flex; align-items: center; gap: 5px;">
        Color: <input type="color" id="colorPicker" class="color-picker" value="#000000">
      </label>
      <label style="display: flex; align-items: center; gap: 5px;">
        Size: <input type="number" id="fontSizeInput" class="font-size-input" value="16" min="8" max="72">
      </label>
    </div>
    
    <div class="canva-main">
      <div class="canva-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-title">Newsletter Content</div>
          <div id="contentList"></div>
        </div>
        
        <div class="sidebar-section">
          <div class="sidebar-title">Templates</div>
          <div class="element-item" data-template="title">
            <i class="bi bi-type-h1"></i> Title Block
          </div>
          <div class="element-item" data-template="article">
            <i class="bi bi-file-text"></i> Article Block
          </div>
          <div class="element-item" data-template="footer">
            <i class="bi bi-layout-text-sidebar-reverse"></i> Footer Block
          </div>
        </div>
      </div>
      
      <div class="canva-canvas-area">
        <div class="canvas-wrapper">
          <canvas id="fabricCanvas"></canvas>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize Fabric.js canvas
  const canvas = new fabric.Canvas('fabricCanvas', {
    width: 595,  // A4 width in pixels at 72 DPI
    height: 842, // A4 height in pixels at 72 DPI
    backgroundColor: '#ffffff'
  });
  
  window.canvaEditor = {
    canvas: canvas,
    items: items
  };
  
  // Add initial content from items
  addInitialContent(canvas, items);
  
  // Setup event listeners
  setupCanvaEvents(canvas);
  
  // Populate content list
  populateContentList(items);
}

function addInitialContent(canvas, items) {
  let yPosition = 40;
  
  // Add title
  const title = new fabric.Text('VC Newsletter', {
    left: 50,
    top: yPosition,
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#0d2747',
    fontFamily: 'Arial'
  });
  canvas.add(title);
  yPosition += 50;
  
  // Add date
  const date = new fabric.Text(`Generated on ${new Date().toLocaleDateString()}`, {
    left: 50,
    top: yPosition,
    fontSize: 12,
    fill: '#666666',
    fontFamily: 'Arial'
  });
  canvas.add(date);
  yPosition += 40;
  
  // Add items (first 3 for initial view)
  items.slice(0, 3).forEach((item, index) => {
    // Category
    const category = new fabric.Text(`[${(item.category || 'General').toUpperCase()}]`, {
      left: 50,
      top: yPosition,
      fontSize: 10,
      fill: '#c83232',
      fontFamily: 'Arial'
    });
    canvas.add(category);
    yPosition += 20;
    
    // Title
    const itemTitle = getTitleForItem(item);
    const titleText = new fabric.Textbox(itemTitle, {
      left: 50,
      top: yPosition,
      width: 495,
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#000000',
      fontFamily: 'Arial'
    });
    canvas.add(titleText);
    yPosition += titleText.height + 10;
    
    // Body (truncated)
    const body = (item.fullText || '').substring(0, 200);
    const bodyText = new fabric.Textbox(body, {
      left: 50,
      top: yPosition,
      width: 495,
      fontSize: 11,
      fill: '#505050',
      fontFamily: 'Arial'
    });
    canvas.add(bodyText);
    yPosition += bodyText.height + 30;
    
    if (yPosition > 750) return; // Stop if page is full
  });
}

function setupCanvaEvents(canvas) {
  // Add Text
  document.getElementById('addTextBtn').addEventListener('click', () => {
    const text = new fabric.IText('Click to edit text', {
      left: 100,
      top: 100,
      fontSize: 16,
      fill: document.getElementById('colorPicker').value,
      fontFamily: 'Arial'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  });
  
  // Add Heading
  document.getElementById('addHeadingBtn').addEventListener('click', () => {
    const heading = new fabric.IText('Heading Text', {
      left: 100,
      top: 100,
      fontSize: 24,
      fontWeight: 'bold',
      fill: document.getElementById('colorPicker').value,
      fontFamily: 'Arial'
    });
    canvas.add(heading);
    canvas.setActiveObject(heading);
    canvas.renderAll();
  });
  
  // Add Image
  document.getElementById('addImageBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.Image.fromURL(event.target.result, (img) => {
            img.scaleToWidth(200);
            img.set({ left: 100, top: 100 });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  });
  
  // Add Shape
  document.getElementById('addShapeBtn').addEventListener('click', () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: document.getElementById('colorPicker').value,
      stroke: '#000000',
      strokeWidth: 2
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  });
  
  // Add Line
  document.getElementById('addLineBtn').addEventListener('click', () => {
    const line = new fabric.Line([50, 100, 250, 100], {
      stroke: document.getElementById('colorPicker').value,
      strokeWidth: 2
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  });
  
  // Delete
  document.getElementById('deleteBtn').addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  });
  
  // Duplicate
  document.getElementById('duplicateBtn').addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 10,
          top: cloned.top + 10
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  });
  
  // Color picker
  document.getElementById('colorPicker').addEventListener('change', (e) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox') {
        activeObject.set('fill', e.target.value);
      } else {
        activeObject.set('fill', e.target.value);
      }
      canvas.renderAll();
    }
  });
  
  // Font size
  document.getElementById('fontSizeInput').addEventListener('change', (e) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox')) {
      activeObject.set('fontSize', parseInt(e.target.value));
      canvas.renderAll();
    }
  });
  
  // Download PDF
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    downloadCanvasAsPDF(canvas);
  });
  
  // Close
  document.getElementById('closeCanvaBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      document.getElementById('canvaEditorModal').remove();
    }
  });
  
  // Update color picker and font size when selecting objects
  canvas.on('selection:created', updateToolbar);
  canvas.on('selection:updated', updateToolbar);
  
  function updateToolbar() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.fill) {
        document.getElementById('colorPicker').value = activeObject.fill;
      }
      if (activeObject.fontSize) {
        document.getElementById('fontSizeInput').value = activeObject.fontSize;
      }
    }
  }
}

function populateContentList(items) {
  const contentList = document.getElementById('contentList');
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'element-item';
    div.innerHTML = `<i class="bi bi-file-text"></i> ${getTitleForItem(item).substring(0, 30)}...`;
    div.addEventListener('click', () => {
      // Add this item to canvas
      addItemToCanvas(window.canvaEditor.canvas, item);
    });
    contentList.appendChild(div);
  });
}

function addItemToCanvas(canvas, item) {
  const yPosition = 100;
  
  const group = new fabric.Group([
    new fabric.Text(`[${(item.category || 'General').toUpperCase()}]`, {
      fontSize: 10,
      fill: '#c83232',
      top: 0
    }),
    new fabric.Textbox(getTitleForItem(item), {
      width: 400,
      fontSize: 14,
      fontWeight: 'bold',
      top: 20
    }),
    new fabric.Textbox((item.fullText || '').substring(0, 200), {
      width: 400,
      fontSize: 11,
      fill: '#505050',
      top: 50
    })
  ], {
    left: 50,
    top: yPosition
  });
  
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
}

function downloadCanvasAsPDF(canvas) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);
  
  const filename = `vc-newsletter-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

function getTitleForItem(item) {
  const catKey = (item.category || '').toLowerCase().replace(/[\s_-]+/g, '');
  const fullText = item.fullText || '';
  const firstLine = fullText.split(/\r?\n/)[0] || '';

  switch (catKey) {
    case 'researchgrant': return item.researchTopic || item.topic || firstLine || 'Research Topic';
    case 'journalpublications': return item.journalName || item.journal || firstLine || 'Journal Publication';
    case 'bookchapters': return item.chapterTitle || item.title || firstLine || 'Book Chapter';
    case 'booksandeditedbooks': return item.bookTitle || item.title || firstLine || 'Book';
    case 'conferenceproceeding': return item.conferenceName || item.conference || firstLine || 'Conference Proceeding';
    case 'conferencepresentation': return item.conferenceName || item.conference || firstLine || 'Conference Presentation';
    case 'seminarandworkshop': return item.workTitle || item.title || firstLine || 'Seminar/Workshop';
    case 'media': return item.caption || firstLine || 'Media';
    case 'achievements': return item.achievementTitle || item.title || firstLine || 'Achievement';
    default: return firstLine || 'Newsletter Item';
  }
}