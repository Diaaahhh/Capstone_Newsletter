// frontend/journalMetricsDisplay.js
/**
 * Shared module for displaying journal metrics (SCImago rankings, impact factors, quartiles)
 * Used across journal publications and conference proceedings pages
 */

/**
 * Get quartile badge styling based on quartile value
 * @param {string} quartile - Q1, Q2, Q3, or Q4
 * @returns {object} Style configuration
 */
function getQuartileStyle(quartile) {
  const styles = {
    Q1: {
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      color: '#ffffff',
      icon: 'bi-trophy-fill',
      label: 'Q1 - Top Tier',
      shadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
    },
    Q2: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#ffffff',
      icon: 'bi-award-fill',
      label: 'Q2 - High Quality',
      shadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
    },
    Q3: {
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#ffffff',
      icon: 'bi-star-fill',
      label: 'Q3 - Good Quality',
      shadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
    },
    Q4: {
      gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      color: '#ffffff',
      icon: 'bi-bookmark-fill',
      label: 'Q4 - Standard',
      shadow: '0 2px 8px rgba(107, 114, 128, 0.4)'
    }
  };
  
  return styles[quartile] || styles.Q4;
}

/**
 * Create a metrics badge element
 * @param {object} metrics - Journal metrics data
 * @returns {HTMLElement} Badge container element
 */
function createMetricsBadge(metrics) {
  if (!metrics || (!metrics.ranking && !metrics.impactFactor && !metrics.sjrScore)) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'journal-metrics-badge';
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    align-items: center;
  `;

  // Quartile Badge
  if (metrics.ranking) {
    const style = getQuartileStyle(metrics.ranking);
    const quartileBadge = document.createElement('span');
    quartileBadge.className = 'badge';
    quartileBadge.style.cssText = `
      background: ${style.gradient};
      color: ${style.color};
      font-weight: 600;
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: ${style.shadow};
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: transform 0.2s ease;
    `;
    quartileBadge.innerHTML = `<i class="bi ${style.icon}"></i> ${metrics.ranking}`;
    quartileBadge.title = style.label;
    
    quartileBadge.addEventListener('mouseenter', () => {
      quartileBadge.style.transform = 'translateY(-2px)';
    });
    quartileBadge.addEventListener('mouseleave', () => {
      quartileBadge.style.transform = 'translateY(0)';
    });
    
    container.appendChild(quartileBadge);
  }

  // Impact Factor / SJR Score Badge
  const impactValue = metrics.impactFactor || metrics.sjrScore;
  if (impactValue && impactValue > 0) {
    const impactBadge = document.createElement('span');
    impactBadge.className = 'badge';
    impactBadge.style.cssText = `
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: transform 0.2s ease;
    `;
    impactBadge.innerHTML = `<i class="bi bi-graph-up-arrow"></i> ${metrics.impactFactor ? 'IF' : 'SJR'}: ${impactValue.toFixed(3)}`;
    impactBadge.title = metrics.impactFactor ? 'Impact Factor' : 'SCImago Journal Rank';
    
    impactBadge.addEventListener('mouseenter', () => {
      impactBadge.style.transform = 'translateY(-2px)';
    });
    impactBadge.addEventListener('mouseleave', () => {
      impactBadge.style.transform = 'translateY(0)';
    });
    
    container.appendChild(impactBadge);
  }

  // H-Index Badge
  if (metrics.hIndex && metrics.hIndex > 0) {
    const hIndexBadge = document.createElement('span');
    hIndexBadge.className = 'badge';
    hIndexBadge.style.cssText = `
      background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: transform 0.2s ease;
    `;
    hIndexBadge.innerHTML = `<i class="bi bi-bar-chart-fill"></i> H-Index: ${metrics.hIndex}`;
    hIndexBadge.title = 'H-Index';
    
    hIndexBadge.addEventListener('mouseenter', () => {
      hIndexBadge.style.transform = 'translateY(-2px)';
    });
    hIndexBadge.addEventListener('mouseleave', () => {
      hIndexBadge.style.transform = 'translateY(0)';
    });
    
    container.appendChild(hIndexBadge);
  }

  // Citations Badge
  if (metrics.citedByCount && metrics.citedByCount > 0) {
    const citationBadge = document.createElement('span');
    citationBadge.className = 'badge';
    citationBadge.style.cssText = `
      background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: transform 0.2s ease;
    `;
    citationBadge.innerHTML = `<i class="bi bi-quote"></i> Citations: ${metrics.citedByCount.toLocaleString()}`;
    citationBadge.title = 'Total Citations';
    
    citationBadge.addEventListener('mouseenter', () => {
      citationBadge.style.transform = 'translateY(-2px)';
    });
    citationBadge.addEventListener('mouseleave', () => {
      citationBadge.style.transform = 'translateY(0)';
    });
    
    container.appendChild(citationBadge);
  }

  // Source Badge
  if (metrics.source) {
    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'badge bg-secondary';
    sourceBadge.style.cssText = `
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 4px;
      opacity: 0.8;
    `;
    sourceBadge.innerHTML = `<i class="bi bi-database"></i> ${metrics.source}`;
    sourceBadge.title = `Data source: ${metrics.source}`;
    container.appendChild(sourceBadge);
  }

  return container;
}

/**
 * Fetch journal metrics from backend
 * @param {string} journalName - Name of the journal
 * @param {number} year - Publication year
 * @returns {Promise<object>} Metrics data
 */
async function fetchJournalMetrics(journalName, year) {
  if (!journalName) {
    return null;
  }

  try {
    const response = await fetch('http://localhost:5000/api/journal/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        journalName: journalName.trim(),
        year: year || new Date().getFullYear()
      })
    });

    if (!response.ok) {
      console.warn('Failed to fetch journal metrics:', response.statusText);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return {
        ranking: result.data.journalRanking,
        impactFactor: result.data.impactFactor,
        sjrScore: result.data.sjrScore,
        hIndex: result.data.hIndex,
        citedByCount: result.data.citedByCount,
        source: result.data.source
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching journal metrics:', error);
    return null;
  }
}

/**
 * Add metrics to a card element
 * @param {HTMLElement} card - Card element to add metrics to
 * @param {object} item - Item data containing formData
 */
async function addMetricsToCard(card, item) {
  // Extract journal name from formData
  const formData = item.formData || {};
  const journalName = formData.journalName || formData.conferenceName;
  const year = formData.year;

  if (!journalName) {
    return;
  }

  // Check if metrics already exist in formData
  let metrics = null;
  if (formData.journalRanking || formData.impactFactor) {
    metrics = {
      ranking: formData.journalRanking,
      impactFactor: formData.impactFactor,
      sjrScore: formData.sjrScore,
      hIndex: formData.hIndex,
      citedByCount: formData.citationCount || formData.citedByCount,
      source: formData.metricsSource || 'Stored'
    };
  } else {
    // Fetch metrics from backend
    metrics = await fetchJournalMetrics(journalName, year);
  }

  if (!metrics) {
    return;
  }

  // Create and insert metrics badge
  const metricsBadge = createMetricsBadge(metrics);
  if (metricsBadge) {
    // Try different content div selectors for different page types
    const contentDiv = card.querySelector('.published-event-content') ||
                       card.querySelector('.general-news-content') ||
                       card.querySelector('.vc-news-content');
    
    if (contentDiv) {
      // Try different meta info selectors
      const metaInfo = contentDiv.querySelector('.published-event-meta-info') ||
                       contentDiv.querySelector('.general-news-meta-info') ||
                       contentDiv.querySelector('.vc-news-meta');
      
      if (metaInfo) {
        metaInfo.insertAdjacentElement('afterend', metricsBadge);
      } else {
        // If no meta info found, insert at the beginning of content
        contentDiv.insertBefore(metricsBadge, contentDiv.firstChild);
      }
    }
  }
}

/**
 * Add metrics to modal
 * @param {HTMLElement} modal - Modal element
 * @param {object} item - Item data
 */
async function addMetricsToModal(modal, item) {
  const formData = item.formData || {};
  const journalName = formData.journalName || formData.conferenceName;
  const year = formData.year;

  if (!journalName) {
    return;
  }

  // Check if metrics already exist
  let metrics = null;
  if (formData.journalRanking || formData.impactFactor) {
    metrics = {
      ranking: formData.journalRanking,
      impactFactor: formData.impactFactor,
      sjrScore: formData.sjrScore,
      hIndex: formData.hIndex,
      citedByCount: formData.citationCount || formData.citedByCount,
      source: formData.metricsSource || 'Stored'
    };
  } else {
    metrics = await fetchJournalMetrics(journalName, year);
  }

  if (!metrics) {
    return;
  }

  const metricsBadge = createMetricsBadge(metrics);
  if (metricsBadge) {
    const header = modal.querySelector('.event-modal-header');
    if (header) {
      const meta = header.querySelector('.event-modal-meta');
      if (meta) {
        meta.insertAdjacentElement('afterend', metricsBadge);
      }
    }
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getQuartileStyle,
    createMetricsBadge,
    fetchJournalMetrics,
    addMetricsToCard,
    addMetricsToModal
  };
}