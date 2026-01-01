// vcNewsletterPdfEditor.js
// PDF generation and editing functionality for VC Newsletter

class VCNewsletterPDFEditor {
  constructor() {
    this.filteredItems = [];
    this.pdfDoc = null;
    this.fabricCanvas = null;
    this.pdfViewer = null;
    this.editorModal = null;
    this.init();
  }

  init() {
    // Create editor modal
    this.createEditorModal();

    // Bind to generate PDF button
    const generatePdfBtn = document.querySelector('.generate-pdf-btn');
    if (generatePdfBtn) {
      generatePdfBtn.addEventListener('click', () => this.generateAndEditPDF());
    }
  }

  createEditorModal() {
    // Create modal HTML
    const modalDiv = document.createElement('div');
    modalDiv.id = 'pdfEditorModal';
    modalDiv.className = 'pdf-editor-modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
      <div class="pdf-editor-overlay"></div>
      <div class="pdf-editor-container">
        <div class="pdf-editor-header">
          <h3>Edit VC Newsletter PDF</h3>
          <button class="pdf-editor-close">&times;</button>
        </div>
        <div class="pdf-editor-toolbar">
          <button id="addTextBtn" class="btn btn-sm btn-outline-primary">Add Text</button>
          <button id="addImageBtn" class="btn btn-sm btn-outline-primary">Add Image</button>
          <button id="undoBtn" class="btn btn-sm btn-outline-secondary">Undo</button>
          <button id="redoBtn" class="btn btn-sm btn-outline-secondary">Redo</button>
          <div class="toolbar-separator"></div>
          <button id="exportPdfBtn" class="btn btn-sm btn-success">Export PDF</button>
        </div>
        <div class="pdf-editor-content">
          <div class="pdf-viewer-container">
            <canvas id="pdfCanvas" class="pdf-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .pdf-editor-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      .pdf-editor-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
      }
      .pdf-editor-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 1200px;
        height: 90%;
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .pdf-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #e9ecef;
      }
      .pdf-editor-header h3 {
        margin: 0;
        color: #0d2747;
      }
      .pdf-editor-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6c757d;
      }
      .pdf-editor-toolbar {
        padding: 10px 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .toolbar-separator {
        width: 1px;
        height: 20px;
        background: #e9ecef;
        margin: 0 10px;
      }
      .pdf-editor-content {
        flex: 1;
        overflow: auto;
        padding: 20px;
      }
      .pdf-viewer-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .pdf-canvas {
        border: 1px solid #e9ecef;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);

    this.editorModal = document.getElementById('pdfEditorModal');

    // Bind modal events
    document.querySelector('.pdf-editor-close').addEventListener('click', () => this.closeEditor());
    document.querySelector('.pdf-editor-overlay').addEventListener('click', () => this.closeEditor());

    // Bind toolbar events
    document.getElementById('addTextBtn').addEventListener('click', () => this.addTextElement());
    document.getElementById('addImageBtn').addEventListener('click', () => this.addImageElement());
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportPDF());
  }

  async generateAndEditPDF() {
    // Get filtered items from the timeline
    this.filteredItems = window.vcNewsletterFilteredItems || [];

    console.log('Filtered items for PDF:', this.filteredItems);

    // If no filtered items, try to get all items
    if (this.filteredItems.length === 0) {
      // Try to get all items from the timeline state
      if (window.vcNewsletterAllItems && window.vcNewsletterAllItems.length > 0) {
        this.filteredItems = window.vcNewsletterAllItems;
        console.log('Using all items instead:', this.filteredItems.length);
      }
    }

    // For testing, create sample data if no items
    if (this.filteredItems.length === 0) {
      console.log('No items found, creating sample data for testing');
      this.filteredItems = [
        {
          category: 'research-grant',
          fullText: 'This is a sample research grant article with some content.',
          createdAt: new Date().toISOString(),
          createdBy: 'Test User'
        },
        {
          category: 'journal-publications',
          fullText: 'This is a sample journal publication article.',
          createdAt: new Date().toISOString(),
          createdBy: 'Test User 2'
        }
      ];
    }

    console.log('Final items for PDF generation:', this.filteredItems);

    try {
      // Generate PDF
      const pdfBytes = await this.generatePDF(this.filteredItems);
      console.log('PDF generated successfully, size:', pdfBytes.length);

      // Open editor
      await this.openEditor(pdfBytes);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Toast.error('Error generating PDF. Please try again.');
    }
  }

  async generatePDF(items) {
    try {
      console.log('Generating PDF with', items.length, 'items');

      const { PDFDocument, rgb } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      console.log('PDF page created, size:', width, 'x', height);

      // Add simple test content first
      page.drawText('Test PDF Content', {
        x: 50,
        y: height - 100,
        size: 20,
        color: rgb(0, 0, 0)
      });

      page.drawText('This is a test to see if PDF generation works', {
        x: 50,
        y: height - 130,
        size: 12,
        color: rgb(0, 0, 0)
      });

      // Add header
      page.drawText('VC Newsletter', {
        x: 50,
        y: height - 50,
        size: 24,
        color: rgb(0.1, 0.3, 0.6)
      });

      page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: height - 80,
        size: 12,
        color: rgb(0.5, 0.5, 0.5)
      });

      let yPosition = height - 160;

      // If no items, add a message
      if (items.length === 0) {
        page.drawText('No items found. Please check your filters.', {
          x: 50,
          y: yPosition,
          size: 14,
          color: rgb(0.5, 0, 0)
        });
      } else {
        // Add items
        for (const item of items) {
          console.log('Processing item:', item);
          if (yPosition < 100) {
            // For simplicity, just add content to current page
            break;
          }

          // Category badge
          const category = item.category || 'General';
          page.drawText(`[${category.toUpperCase()}]`, {
            x: 50,
            y: yPosition,
            size: 10,
            color: rgb(0.8, 0.2, 0.2)
          });

          yPosition -= 20;

          // Title
          const title = this.getTitleForItem(item);
          console.log('Item title:', title);
          page.drawText(title.substring(0, 50), {
            x: 50,
            y: yPosition,
            size: 14,
            color: rgb(0, 0, 0)
          });

          yPosition -= 20;

          // Body text
          const bodyText = item.fullText || item.summary || '';
          console.log('Item body:', bodyText.substring(0, 50));
          page.drawText(bodyText.substring(0, 80), {
            x: 50,
            y: yPosition,
            size: 10,
            color: rgb(0.3, 0.3, 0.3)
          });

          yPosition -= 30;
        }
      }

      const pdfBytes = await pdfDoc.save();
      console.log('PDF generated successfully, size:', pdfBytes.length);
      return pdfBytes;
    } catch (error) {
      console.error('Error in generatePDF:', error);
      throw error;
    }
  }

  wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  getTitleForItem(item) {
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

  async openEditor(pdfBytes) {
    console.log('Opening PDF editor with', pdfBytes.length, 'bytes');
    this.editorModal.style.display = 'block';

    try {
      // Create a blob URL for the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      console.log('PDF blob URL created:', pdfUrl);

      // Create an iframe to display the PDF
      const viewerContainer = document.querySelector('.pdf-viewer-container');
      if (!viewerContainer) {
        console.error('PDF viewer container not found');
        return;
      }

      // Clear existing content
      viewerContainer.innerHTML = '';

      // Create iframe for PDF display
      const iframe = document.createElement('iframe');
      iframe.src = pdfUrl;
      iframe.width = '100%';
      iframe.height = '600px';
      iframe.style.border = '1px solid #e9ecef';
      viewerContainer.appendChild(iframe);

      console.log('PDF iframe created and added to container');

      // Store PDF data for export
      this.pdfBytes = pdfBytes;
      this.pdfUrl = pdfUrl;

      console.log('PDF editor opened successfully with iframe display');
    } catch (error) {
      console.error('Error in openEditor:', error);
      Toast.error('Error opening PDF editor. Please try again.');
    }
  }

  closeEditor() {
    if (this.editorModal) {
      this.editorModal.style.display = 'none';
    }
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    // Clean up blob URL
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
      this.pdfUrl = null;
    }
  }

  addTextElement() {
    Toast.info('Text editing would be implemented here. For now, the PDF is displayed and can be exported.');
  }

  addImageElement() {
    Toast.info('Image editing would be implemented here. For now, the PDF is displayed and can be exported.');
  }

  undo() {
    Toast.info('Undo functionality would be implemented here.');
  }

  redo() {
    Toast.info('Redo functionality would be implemented here.');
  }

  async exportPDF() {
    if (!this.fabricCanvas || !this.pdfBytes) return;

    try {
      // For now, just download the original PDF
      // Full implementation would merge fabric.js objects with PDF using pdf-lib
      const blob = new Blob([this.pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `vc-newsletter-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.closeEditor();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Toast.error('Error exporting PDF. Please try again.');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VCNewsletterPDFEditor();
});

// Export filtered items for PDF generation
window.vcNewsletterFilteredItems = [];