// vcNewsletterCategorizedEditor.js
// Categorized Editor with 9 Fixed Category Sections

document.addEventListener('DOMContentLoaded', () => {
  const generatePdfBtn = document.querySelector('.generate-pdf-btn');
  
  if (generatePdfBtn && window.location.pathname.includes('vcNewsletter.html')) {
    // Add a new button for categorized editor
    const categorizedBtn = document.createElement('button');
    categorizedBtn.className = 'btn btn-success ms-2';
    categorizedBtn.innerHTML = '<i class="bi bi-grid-3x3"></i> Categorized Editor';
    generatePdfBtn.parentNode.insertBefore(categorizedBtn, generatePdfBtn.nextSibling);
    
    categorizedBtn.addEventListener('click', openCategorizedEditor);
  }
});

async function openCategorizedEditor() {
  try {
    const items = window.vcNewsletterFilteredItems || window.vcNewsletterAllItems || [];
    
    if (items.length === 0) {
      alert('No items to organize. Please ensure newsletter items are loaded.');
      return;
    }

    createCategorizedEditor(items);
    
  } catch (error) {
    console.error('Error opening categorized editor:', error);
    Toast.error('Error opening categorized editor: '  + error.message);
  }
}

function createCategorizedEditor(items) {
  const modal = document.createElement('div');
  modal.id = 'categorizedEditorModal';
  modal.innerHTML = `
    <style>
      #categorizedEditorModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f5f7fa;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .categorized-header {
        background: white;
        padding: 20px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-bottom: 3px solid #667eea;
      }
      
      .categorized-header h2 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #2d3748;
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
      }
      
      .cat-btn {
        padding: 12px 24px;
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
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
      
      .categorized-content {
        flex: 1;
        overflow-y: auto;
        padding: 32px;
      }
      
      .editor-container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        padding: 40px;
      }
      
      .editor-title {
        font-size: 32px;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 8px;
        text-align: center;
      }
      
      .editor-subtitle {
        font-size: 16px;
        color: #718096;
        margin-bottom: 40px;
        text-align: center;
      }
      
      .category-section {
        margin-bottom: 48px;
      }
      
      .category-section:not(:last-child) {
        border-bottom: 3px solid #e2e8f0;
        padding-bottom: 32px;
      }
      
      .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        border-radius: 8px;
        border-left: 4px solid #667eea;
      }
      
      .category-title {
        font-size: 22px;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .category-count {
        background: #667eea;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
      }
      
      .category-articles {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: 60px;
      }
      
      .category-empty {
        text-align: center;
        padding: 32px;
        color: #a0aec0;
        font-style: italic;
        background: #f7fafc;
        border-radius: 8px;
        border: 2px dashed #e2e8f0;
      }
      
      .article-card {
        background: #f8f9fa;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.3s ease;
        cursor: move;
      }
      
      .article-card:hover {
        border-color: #667eea;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        transform: translateX(4px);
      }
      
      .article-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 12px;
      }
      
      .article-title {
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
        margin: 0 0 8px 0;
        flex: 1;
      }
      
      .article-meta {
        font-size: 13px;
        color: #718096;
        margin-bottom: 12px;
      }
      
      .article-body {
        font-size: 14px;
        color: #4a5568;
        line-height: 1.6;
        max-height: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }
      
      .article-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      
      .article-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .btn-edit {
        background: #667eea;
        color: white;
      }
      
      .btn-edit:hover {
        background: #5568d3;
      }
      
      .btn-remove {
        background: #e53e3e;
        color: white;
      }
      
      .btn-remove:hover {
        background: #c53030;
      }
      
      .btn-move {
        background: #48bb78;
        color: white;
      }
      
      .btn-move:hover {
        background: #38a169;
      }
      
      @media print {
        .categorized-header,
        .article-actions {
          display: none !important;
        }
        
        #categorizedEditorModal {
          background: white;
        }
        
        .editor-container {
          box-shadow: none;
          padding: 20px;
        }
      }
    </style>
    
    <div class="categorized-header">
      <h2>📋 Categorized Newsletter Editor</h2>
      <div class="header-actions">
        <button class="cat-btn btn-secondary" id="printBtn">
          <i class="bi bi-printer"></i> Print
        </button>
        <button class="cat-btn btn-primary" id="downloadPdfBtn">
          <i class="bi bi-download"></i> Download PDF
        </button>
        <button class="cat-btn btn-secondary" id="closeCatBtn">
          <i class="bi bi-x-lg"></i> Close
        </button>
      </div>
    </div>
    
    <div class="categorized-content">
      <div class="editor-container" id="editorContainer">
        <h1 class="editor-title">VC Newsletter</h1>
        <p class="editor-subtitle">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        
        <div id="categorySections">
          <!-- Category sections will be inserted here -->
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize categories
  const categories = [
    { id: 'research-grant', name: 'Research Grant', icon: '🔬' },
    { id: 'journal-publications', name: 'Journal Publications', icon: '📚' },
    { id: 'book-chapters', name: 'Book Chapter', icon: '📖' },
    { id: 'books-and-edited-books', name: 'Books & Edited Books', icon: '📕' },
    { id: 'conference-proceeding', name: 'Conference Proceeding', icon: '🎓' },
    { id: 'conference-presentation', name: 'Conference Presentation', icon: '🎤' },
    { id: 'seminar-and-workshop', name: 'Seminar & Workshop', icon: '🎯' },
    { id: 'media', name: 'Media', icon: '📺' },
    { id: 'achievements', name: 'Achievements', icon: '🏆' }
  ];
  
  // Categorize items
  const categorizedItems = categorizeItems(items, categories);
  
  // Render categories
  renderCategories(categories, categorizedItems);
  
  // Setup event listeners
  setupCategorizedEvents();
}

function categorizeItems(items, categories) {
  const categorized = {};
  
  // Initialize empty arrays for each category
  categories.forEach(cat => {
    categorized[cat.id] = [];
  });
  
  // Categorize each item
  items.forEach(item => {
    const categoryKey = normalizeCategoryKey(item.category);
    if (categorized[categoryKey]) {
      categorized[categoryKey].push(item);
    } else {
      // If category doesn't match, try to find best match
      const matchedKey = findBestCategoryMatch(item.category, categories);
      if (matchedKey && categorized[matchedKey]) {
        categorized[matchedKey].push(item);
      }
    }
  });
  
  return categorized;
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

function renderCategories(categories, categorizedItems) {
  const container = document.getElementById('categorySections');
  
  categories.forEach(category => {
    const articles = categorizedItems[category.id] || [];
    
    const section = document.createElement('div');
    section.className = 'category-section';
    section.id = `section-${category.id}`;
    
    section.innerHTML = `
      <div class="category-header">
        <h3 class="category-title">
          <span>${category.icon}</span>
          <span>${category.name}</span>
          <span class="category-count">${articles.length}</span>
        </h3>
      </div>
      <div class="category-articles" id="articles-${category.id}">
        ${articles.length === 0 ? 
          '<div class="category-empty">No articles in this category yet</div>' :
          articles.map((article, index) => renderArticleCard(article, category.id, index)).join('')
        }
      </div>
    `;
    
    container.appendChild(section);
  });
}

function renderArticleCard(article, categoryId, index) {
  const title = getTitleForArticle(article);
  const body = (article.fullText || '').substring(0, 200);
  const date = article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'N/A';
  
  return `
    <div class="article-card" data-category="${categoryId}" data-index="${index}">
      <div class="article-header">
        <h4 class="article-title">${title}</h4>
      </div>
      <div class="article-meta">
        <i class="bi bi-calendar"></i> ${date}
      </div>
      <div class="article-body">${body}...</div>
      <div class="article-actions">
        <button class="article-btn btn-edit" onclick="editArticle('${categoryId}', ${index})">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button class="article-btn btn-move" onclick="moveArticle('${categoryId}', ${index})">
          <i class="bi bi-arrows-move"></i> Move
        </button>
        <button class="article-btn btn-remove" onclick="removeArticle('${categoryId}', ${index})">
          <i class="bi bi-trash"></i> Remove
        </button>
      </div>
    </div>
  `;
}

function getTitleForArticle(article) {
  const catKey = normalizeCategoryKey(article.category);
  const fullText = article.fullText || '';
  const firstLine = fullText.split(/\r?\n/)[0] || '';

  const titles = {
    'researchgrant': article.researchTopic || article.topic || firstLine || 'Research Topic',
    'journalpublications': article.journalName || article.journal || firstLine || 'Journal Publication',
    'bookchapters': article.chapterTitle || article.title || firstLine || 'Book Chapter',
    'booksandeditedbooks': article.bookTitle || article.title || firstLine || 'Book',
    'conferenceproceeding': article.conferenceName || article.conference || firstLine || 'Conference Proceeding',
    'conferencepresentation': article.conferenceName || article.conference || firstLine || 'Conference Presentation',
    'seminarandworkshop': article.workTitle || article.title || firstLine || 'Seminar/Workshop',
    'media': article.caption || firstLine || 'Media',
    'achievements': article.achievementTitle || article.title || firstLine || 'Achievement'
  };
  
  return titles[catKey] || firstLine || 'Newsletter Item';
}

function setupCategorizedEvents() {
  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
  
  // Download PDF button
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  if (downloadPdfBtn) {
    downloadPdfBtn.onclick = () => {
      downloadCategorizedPDF();
    };
  }
  
  // Close button
  const closeCatBtn = document.getElementById('closeCatBtn');
  if (closeCatBtn) {
    closeCatBtn.onclick = () => {
      if (confirm('Close editor? Any unsaved changes will be lost.')) {
        const modal = document.getElementById('categorizedEditorModal');
        if (modal) modal.remove();
      }
    };
  }
}

// Global functions for article actions
window.editArticle = function(categoryId, index) {
  Toast.info(`Edit functionality for article ${index} in ${categoryId} - Coming soon!`);
};

window.moveArticle = function(categoryId, index) {
  const categories = [
    'research-grant', 'journal-publications', 'book-chapters',
    'books-and-edited-books', 'conference-proceeding', 'conference-presentation',
    'seminar-and-workshop', 'media', 'achievements'
  ];
  
  const categoryNames = {
    'research-grant': 'Research Grant',
    'journal-publications': 'Journal Publications',
    'book-chapters': 'Book Chapter',
    'books-and-edited-books': 'Books & Edited Books',
    'conference-proceeding': 'Conference Proceeding',
    'conference-presentation': 'Conference Presentation',
    'seminar-and-workshop': 'Seminar & Workshop',
    'media': 'Media',
    'achievements': 'Achievements'
  };
  
  let options = categories
    .filter(cat => cat !== categoryId)
    .map((cat, i) => `${i + 1}. ${categoryNames[cat]}`)
    .join('\n');
  
  const choice = prompt(`Move article to which category?\n\n${options}\n\nEnter number (1-8):`);
  
  if (choice) {
    const choiceNum = parseInt(choice) - 1;
    const targetCategories = categories.filter(cat => cat !== categoryId);
    
    if (choiceNum >= 0 && choiceNum < targetCategories.length) {
      const targetCategory = targetCategories[choiceNum];
      
      // Get the article card
      const articleCard = document.querySelector(`[data-category="${categoryId}"][data-index="${index}"]`);
      if (articleCard) {
        // Update data attributes
        articleCard.dataset.category = targetCategory;
        
        // Move to target category
        const targetContainer = document.getElementById(`articles-${targetCategory}`);
        if (targetContainer) {
          // Remove empty message if exists
          const emptyMsg = targetContainer.querySelector('.category-empty');
          if (emptyMsg) emptyMsg.remove();
          
          targetContainer.appendChild(articleCard);
          
          // Update counts
          updateCategoryCount(categoryId);
          updateCategoryCount(targetCategory);
          
          // Check if source category is now empty
          const sourceContainer = document.getElementById(`articles-${categoryId}`);
          if (sourceContainer && sourceContainer.children.length === 0) {
            sourceContainer.innerHTML = '<div class="category-empty">No articles in this category yet</div>';
          }
          
          Toast.info(`Article moved to ${categoryNames[targetCategory]}`);
        }
      }
    } else {
      alert('Invalid choice');
    }
  }
};

window.removeArticle = function(categoryId, index) {
  if (confirm('Remove this article from the newsletter?')) {
    const articleCard = document.querySelector(`[data-category="${categoryId}"][data-index="${index}"]`);
    if (articleCard) {
      articleCard.remove();
      updateCategoryCount(categoryId);
      
      // Check if category is now empty
      const container = document.getElementById(`articles-${categoryId}`);
      if (container && container.children.length === 0) {
        container.innerHTML = '<div class="category-empty">No articles in this category yet</div>';
      }
    }
  }
};

function updateCategoryCount(categoryId) {
  const container = document.getElementById(`articles-${categoryId}`);
  const section = document.getElementById(`section-${categoryId}`);
  
  if (container && section) {
    const count = container.querySelectorAll('.article-card').length;
    const countBadge = section.querySelector('.category-count');
    if (countBadge) {
      countBadge.textContent = count;
    }
  }
}

function downloadCategorizedPDF() {
  const { jsPDF } = window.jspdf;
  
  if (!jsPDF) {
    alert('PDF library not loaded. Please refresh the page and try again.');
    return;
  }
  
  const pdf = new jsPDF('p', 'pt', 'a4');
  const container = document.getElementById('editorContainer');
  
  // Use html2canvas if available, otherwise use basic method
  if (window.html2canvas) {
    html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 595;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 842;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 842;
      }
      
      const filename = 'vc-newsletter-categorized-' + new Date().toISOString().split('T')[0] + '.pdf';
      pdf.save(filename);
    });
  } else {
    Toast.error('Please use the Print button and save as PDF, or install html2canvas library for direct PDF export.');
  }
}