// vcNewsletterPdfGenerator.js
// Simple PDF generation from VC Newsletter timeline

document.addEventListener('DOMContentLoaded', () => {
  const generatePdfBtn = document.querySelector('.generate-pdf-btn');
  
  if (generatePdfBtn && window.location.pathname.includes('vcNewsletter.html')) {
    generatePdfBtn.addEventListener('click', generatePDFFromTimeline);
  }
});

async function generatePDFFromTimeline() {
  try {
    // Get filtered items
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
    
    console.log('Generating PDF from', items.length, 'items');
    
    if (items.length === 0) {
      Toast.warning('No items to generate PDF from. Please ensure newsletter items are loaded.');
      return;
    }

    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(13, 39, 71);
    doc.text('VC Newsletter', margin, yPosition);
    yPosition += 10;

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Add items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Category
      doc.setFontSize(9);
      doc.setTextColor(200, 50, 50);
      const category = item.category || 'General';
      doc.text(`[${category.toUpperCase()}]`, margin, yPosition);
      yPosition += 7;

      // Title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const title = getTitleForItem(item);
      const titleLines = doc.splitTextToSize(title, maxWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 7;

      // Body
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const body = item.fullText || item.summary || '';
      const bodyLines = doc.splitTextToSize(body.substring(0, 300), maxWidth);
      doc.text(bodyLines.slice(0, 5), margin, yPosition);
      yPosition += Math.min(bodyLines.length, 5) * 6;

      // Date and author
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date';
      const author = item.createdBy || 'Unknown';
      doc.text(`${date} - ${author}`, margin, yPosition);
      yPosition += 12;
    }

    // Get PDF as blob and open in editor
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    console.log('PDF generated, opening editor');
    openPdfEditor(pdfUrl, doc);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    Toast.error('Error generating PDF: ' + error.message);
  }
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

function openPdfEditor(pdfUrl, jsPdfDoc) {
  // Create modal for PDF editor
  const modal = document.createElement('div');
  modal.id = 'pdfEditorModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      width: 90%;
      max-width: 1200px;
      height: 90%;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #e9ecef;
      ">
        <h3 style="margin: 0; color: #0d2747;">VC Newsletter PDF Editor</h3>
        <button id="closeEditorBtn" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
        ">&times;</button>
      </div>
      
      <div style="
        padding: 10px 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 10px;
      ">
        <button id="downloadPdfBtn" class="btn btn-success">
          <i class="bi bi-download"></i> Download PDF
        </button>
        <button id="addTextBtn" class="btn btn-outline-primary">
          <i class="bi bi-fonts"></i> Add Text
        </button>
        <button id="addPageBtn" class="btn btn-outline-secondary">
          <i class="bi bi-file-plus"></i> Add Page
        </button>
      </div>
      
      <div style="
        flex: 1;
        overflow: auto;
        padding: 20px;
        background: #f5f5f5;
      ">
        <iframe id="pdfViewer" src="${pdfUrl}" style="
          width: 100%;
          height: 100%;
          border: 1px solid #e9ecef;
          background: white;
        "></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Store the jsPDF document for editing
  window.currentPdfDoc = jsPdfDoc;
  window.currentPdfUrl = pdfUrl;

  // Event listeners
  document.getElementById('closeEditorBtn').addEventListener('click', () => {
    URL.revokeObjectURL(pdfUrl);
    document.body.removeChild(modal);
  });

  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const filename = `vc-newsletter-${new Date().toISOString().split('T')[0]}.pdf`;
    jsPdfDoc.save(filename);
  });

  document.getElementById('addTextBtn').addEventListener('click', () => {
    const text = prompt('Enter text to add to PDF:');
    if (text) {
      // Add text to the last page
      const pageCount = jsPdfDoc.internal.getNumberOfPages();
      jsPdfDoc.setPage(pageCount);
      jsPdfDoc.setFontSize(12);
      jsPdfDoc.text(text, 20, jsPdfDoc.internal.pageSize.height - 30);
      
      // Regenerate PDF
      const newPdfBlob = jsPdfDoc.output('blob');
      const newPdfUrl = URL.createObjectURL(newPdfBlob);
      document.getElementById('pdfViewer').src = newPdfUrl;
      
      // Clean up old URL
      URL.revokeObjectURL(window.currentPdfUrl);
      window.currentPdfUrl = newPdfUrl;
    }
  });

  document.getElementById('addPageBtn').addEventListener('click', () => {
    jsPdfDoc.addPage();
    jsPdfDoc.setFontSize(12);
    jsPdfDoc.text('New Page', 20, 20);
    
    // Regenerate PDF
    const newPdfBlob = jsPdfDoc.output('blob');
    const newPdfUrl = URL.createObjectURL(newPdfBlob);
    document.getElementById('pdfViewer').src = newPdfUrl;
    
    // Clean up old URL
    URL.revokeObjectURL(window.currentPdfUrl);
    window.currentPdfUrl = newPdfUrl;
    
    Toast.success('New page added to PDF');
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      URL.revokeObjectURL(pdfUrl);
      document.body.removeChild(modal);
    }
  });
}