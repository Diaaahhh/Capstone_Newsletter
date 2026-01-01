// Print Page Functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("Print page loaded");

  // Get DOM elements
  const categoryDropdownBtn = document.getElementById("categoryDropdownBtn");
  const categoryDropdownMenu = document.getElementById("categoryDropdownMenu");
  const categoryDropdownText = document.getElementById("categoryDropdownText");
  const selectAllCategories = document.getElementById("selectAllCategories");
  const categoryCheckboxes = document.querySelectorAll(".category-checkbox");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const customRangeSelect = document.getElementById("customRange");
  const generateReportBtn = document.getElementById("generateReport");
  const clearFiltersBtn = document.getElementById("clearFilters");

  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Leave dates empty by default to include all articles
  // Users can set dates to filter if needed

  // Category dropdown functionality
  categoryDropdownBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    categoryDropdownMenu.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!categoryDropdownMenu.contains(e.target) && !categoryDropdownBtn.contains(e.target)) {
      categoryDropdownMenu.classList.remove("show");
    }
  });

  // Prevent dropdown from closing when clicking inside
  categoryDropdownMenu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // Update dropdown text based on selected categories
  function updateCategoryDropdownText() {
    const selectedCategories = Array.from(categoryCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.nextElementSibling.textContent);

    if (selectedCategories.length === 0) {
      categoryDropdownText.textContent = "No categories selected";
      selectAllCategories.checked = false;
    } else if (selectedCategories.length === categoryCheckboxes.length) {
      categoryDropdownText.textContent = "All Categories";
      selectAllCategories.checked = true;
    } else {
      categoryDropdownText.textContent = selectedCategories.join(", ");
      selectAllCategories.checked = false;
    }
  }

  // Handle select all checkbox
  selectAllCategories.addEventListener("change", function () {
    categoryCheckboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
    updateCategoryDropdownText();
  });

  // Handle individual category checkboxes
  categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
      updateCategoryDropdownText();
    });
  });

  // Initialize dropdown text
  updateCategoryDropdownText();

  // Handle custom range selection
  customRangeSelect.addEventListener("change", function () {
    const selectedValue = this.value;
    if (selectedValue) {
      const months = parseInt(selectedValue);
      const endDate = new Date();

      // Calculate start date by going back the specified number of months
      // This method handles month boundaries correctly
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - months);

      // If the day of month changed due to different month lengths,
      // set it to the last day of the previous month
      if (startDate.getDate() !== endDate.getDate()) {
        startDate.setDate(0); // Sets to last day of previous month
      }

      startDateInput.value = formatDate(startDate);
      endDateInput.value = formatDate(endDate);
    }
  });

  // Clear custom range when dates are manually changed
  startDateInput.addEventListener("change", function () {
    customRangeSelect.value = "";
    // Validate that start date is not after end date
    if (endDateInput.value && new Date(this.value) > new Date(endDateInput.value)) {
      Toast.error("Start date cannot be later than end date.");
      this.value = formatDate(lastMonth);
    }
  });

  endDateInput.addEventListener("change", function () {
    customRangeSelect.value = "";
    // Validate that end date is not before start date
    if (startDateInput.value && new Date(this.value) < new Date(startDateInput.value)) {
      Toast.error("End date cannot be earlier than start date.");
      this.value = formatDate(today);
    }
  });

  // Handle generate report button click
  generateReportBtn.addEventListener("click", async function () {
    const selectedCategories = Array.from(categoryCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    const startDate = startDateInput.value.trim();
    const endDate = endDateInput.value.trim();

    // Validate dates if provided
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        Toast.error("Start date cannot be later than end date.");
        return;
      }
    }

    // Validate at least one category is selected
    if (selectedCategories.length === 0) {
      Toast.error("Please select at least one category.");
      return;
    }

    // Show loading state
    generateReportBtn.disabled = true;
    generateReportBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';

    try {
      // Fetch data from backend based on filters
      const items = await fetchNewsletterData(selectedCategories, startDate, endDate);

      if (items.length === 0) {
        Toast.warning("No items found for the selected filters.");
        return;
      }

      // Generate and save the report
      await generateAndSaveReport(items, selectedCategories, startDate, endDate);

      Toast.success("Report generated successfully!");

    } catch (error) {
      console.error("Error generating report:", error);
      Toast.error("Error generating report: " + error.message);
    } finally {
      // Reset button state
      generateReportBtn.disabled = false;
      generateReportBtn.innerHTML = '<i class="bi bi-file-earmark-arrow-down"></i> Generate Report';
    }
  });

  // Function to generate and save report
  async function generateAndSaveReport(items, categories, startDate, endDate) {
    // Create report metadata
    const reportId = 'report_' + Date.now();
    const reportData = {
      id: reportId,
      items: items,
      categories: categories,
      startDate: startDate,
      endDate: endDate,
      generatedAt: new Date().toISOString(),
      itemCount: items.length
    };

    // Save to localStorage
    saveReportToStorage(reportData);

    // Display the report card
    displayReportCard(reportData);
  }

  // Function to save report to localStorage
  function saveReportToStorage(reportData) {
    try {
      // Get existing reports
      const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');

      // Add new report
      reports.push(reportData);

      // Save back to localStorage
      localStorage.setItem('generatedReports', JSON.stringify(reports));
    } catch (error) {
      console.error("Error saving report to storage:", error);
      Toast.error("Error saving report. Storage may be full.");
    }
  }

  // Function to load saved reports on page load
  function loadSavedReports() {
    try {
      const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');

      if (reports.length === 0) {
        // Show empty state
        document.getElementById('emptyReports').style.display = 'block';
      } else {
        // Hide empty state
        document.getElementById('emptyReports').style.display = 'none';

        // Display all reports
        reports.forEach(report => displayReportCard(report));
      }
    } catch (error) {
      console.error("Error loading saved reports:", error);
    }
  }

  // Function to display a report card
  function displayReportCard(reportData) {
    // Hide empty state
    document.getElementById('emptyReports').style.display = 'none';

    const reportsGrid = document.getElementById('reportsGrid');

    // Format dates for display
    const generatedDate = new Date(reportData.generatedAt).toLocaleString();
    let dateRange = 'All time';
    if (reportData.startDate && reportData.endDate) {
      dateRange = `${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}`;
    }

    // Get category names
    const categoryNames = reportData.categories.map(cat => {
      const checkbox = Array.from(categoryCheckboxes).find(cb => cb.value === cat);
      return checkbox ? checkbox.nextElementSibling.textContent : cat;
    }).join(', ');

    // Create report card HTML with horizontal layout
    const reportCard = document.createElement('div');
    reportCard.className = 'report-card';
    reportCard.setAttribute('data-report-id', reportData.id);
    reportCard.innerHTML = `
      <div class="report-icon">
        <i class="bi bi-file-earmark-pdf-fill"></i>
      </div>
      <div class="report-info">
        <div class="report-header">
          <h5 class="report-title">Newsletter Report</h5>
          <p class="report-date">${generatedDate}</p>
        </div>
        <div class="report-metadata">
          <div class="report-metadata-item">
            <span class="report-metadata-label">Date Range</span>
            <span class="report-metadata-value" title="${dateRange}">${dateRange}</span>
          </div>
          <div class="report-metadata-item">
            <span class="report-metadata-label">Categories</span>
            <span class="report-metadata-value" title="${categoryNames}">${categoryNames}</span>
          </div>
          <div class="report-metadata-item">
            <span class="report-metadata-label">Items</span>
            <span class="report-metadata-value">${reportData.itemCount}</span>
          </div>
        </div>
      </div>
      <div class="report-actions">
        <button class="btn btn-view" onclick="viewReport('${reportData.id}')">
          <i class="bi bi-eye"></i> View
        </button>
        <button class="btn btn-edit" onclick="editReport('${reportData.id}')">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button class="btn btn-delete" onclick="deleteReport('${reportData.id}')">
          <i class="bi bi-trash"></i> Delete
        </button>
      </div>
    `;

    // Insert at the beginning (newest first)
    reportsGrid.insertBefore(reportCard, reportsGrid.firstChild);
  }

  // Make functions globally accessible for onclick handlers
  window.viewReport = function (reportId) {
    try {
      const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        Toast.error("Report not found.");
        return;
      }

      // Store data globally for the editor to access
      window.vcNewsletterFilteredItems = report.items;
      window.vcNewsletterAllItems = report.items;
      window.generalNewsletterData = {
        items: report.items,
        categories: report.categories,
        startDate: report.startDate,
        endDate: report.endDate
      };

      // Open the editor in view/preview mode
      openGeneralNewsletterEditor(report.items, report.categories, report.startDate, report.endDate);

    } catch (error) {
      console.error("Error viewing report:", error);
      Toast.error("Error opening report.");
    }
  };

  window.editReport = function (reportId) {
    try {
      const reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        Toast.error("Report not found.");
        return;
      }

      // Store data globally for the editor to access
      window.vcNewsletterFilteredItems = report.items;
      window.vcNewsletterAllItems = report.items;
      window.generalNewsletterData = {
        items: report.items,
        categories: report.categories,
        startDate: report.startDate,
        endDate: report.endDate
      };

      // Open the editor
      openGeneralNewsletterEditor(report.items, report.categories, report.startDate, report.endDate);

    } catch (error) {
      console.error("Error editing report:", error);
      Toast.error("Error opening report for editing.");
    }
  };

  window.deleteReport = function (reportId) {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      // Get existing reports
      let reports = JSON.parse(localStorage.getItem('generatedReports') || '[]');

      // Remove the report
      reports = reports.filter(r => r.id !== reportId);

      // Save back to localStorage
      localStorage.setItem('generatedReports', JSON.stringify(reports));

      // Remove the card from UI
      const reportCard = document.querySelector(`[data-report-id="${reportId}"]`);
      if (reportCard) {
        reportCard.remove();
      }

      // Show empty state if no reports left
      if (reports.length === 0) {
        document.getElementById('emptyReports').style.display = 'block';
      }

      Toast.success("Report deleted successfully.");

    } catch (error) {
      console.error("Error deleting report:", error);
      Toast.error("Error deleting report.");
    }
  };

  // Load saved reports on page load
  loadSavedReports();


  // Function to fetch newsletter data from backend
  async function fetchNewsletterData(categories, startDate, endDate) {
    try {
      const allItems = [];

      // Build date parameters only if dates are provided
      let dateParams = '';
      if (startDate && endDate) {
        dateParams = `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }

      // Map category values to their corresponding API endpoints
      // Include date range parameters for server-side filtering if provided
      const categoryEndpoints = {
        'majorEvents': `/api/newsfeed-general?category=majorEvent${dateParams ? '&' + dateParams : ''}`,
        'cccEvents': `/api/newsfeed-general?category=cccEvents${dateParams ? '&' + dateParams : ''}`,
        'alumniStories': `/api/newsfeed-general?category=alumniStories${dateParams ? '&' + dateParams : ''}`,
        'clubActivities': `/api/newsfeed-general?category=clubActivities${dateParams ? '&' + dateParams : ''}`,
        'scholarships': `/api/newsfeed-general?category=scholarships${dateParams ? '&' + dateParams : ''}`,
        'library': `/api/newsfeed-general?category=library${dateParams ? '&' + dateParams : ''}`,
        'research': `/api/newsfeed-general?category=research${dateParams ? '&' + dateParams : ''}`,
        'recreation': `/api/newsfeed-general?category=recreation${dateParams ? '&' + dateParams : ''}`,
        'degreeReview': `/api/newsfeed-general?category=degreeReview${dateParams ? '&' + dateParams : ''}`,
        'seminars': `/api/newsfeed-general?category=seminars${dateParams ? '&' + dateParams : ''}`,
        'memberships': `/api/newsfeed-general?category=memberships${dateParams ? '&' + dateParams : ''}`,
        'trainingProgram': `/api/newsfeed-general?category=trainingProgram${dateParams ? '&' + dateParams : ''}`,
        'achievements': `/api/newsfeed-general?category=achievements${dateParams ? '&' + dateParams : ''}`,
        'map': `/api/newsfeed-general?category=map${dateParams ? '&' + dateParams : ''}`,
        'deptActivities': `/api/newsfeed-general?category=deptActivities${dateParams ? '&' + dateParams : ''}`,
        'others': `/api/newsfeed-general?category=others${dateParams ? '&' + dateParams : ''}`
      };

      // Fetch data for each selected category
      for (const category of categories) {
        const endpoint = categoryEndpoints[category];
        if (endpoint) {
          const response = await fetch(`http://localhost:5000${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            // No need for client-side date filtering since server handles it
            allItems.push(...data);
          }
        }
      }

      return allItems;
    } catch (error) {
      console.error("Error fetching newsletter data:", error);
      throw error;
    }
  }

  // Function to open General Newsletter Editor
  function openGeneralNewsletterEditor(items, categories, startDate, endDate) {
    // Store data globally for the editor to access
    window.generalNewsletterData = {
      items: items,
      categories: categories,
      startDate: startDate,
      endDate: endDate
    };

    // Store items in the global variable that the modern editor expects
    window.vcNewsletterFilteredItems = items;
    window.vcNewsletterAllItems = items;

    // Load the editor script if not already loaded
    if (!window.generalNewsletterEditorLoaded) {
      const script = document.createElement('script');
      script.src = 'generalNewsletterEditor.js';
      script.onload = () => {
        window.generalNewsletterEditorLoaded = true;
        // Call the modern editor function (now available in generalNewsletterEditor.js)
        if (typeof openModernEditor === 'function') {
          openModernEditor();
        } else if (typeof openGeneralEditor === 'function') {
          // Fallback for backward compatibility
          openGeneralEditor(items);
        } else {
          console.error('Neither openModernEditor nor openGeneralEditor functions are available');
          Toast.error('Error: Newsletter editor functions not found');
        }
      };
      script.onerror = () => {
        console.error('Failed to load generalNewsletterEditor.js');
        Toast.error('Error: Could not load newsletter editor');
      };
      document.head.appendChild(script);
    } else {
      // Editor already loaded, just call the function
      if (typeof openModernEditor === 'function') {
        openModernEditor();
      } else if (typeof openGeneralEditor === 'function') {
        // Fallback for backward compatibility
        openGeneralEditor(items);
      } else {
        console.error('Neither openModernEditor nor openGeneralEditor functions are available');
        Toast.error('Error: Newsletter editor functions not found');
      }
    }
  }

  // Make the function globally accessible
  window.openGeneralNewsletterEditor = openGeneralNewsletterEditor;

  // Handle clear filters button click
  clearFiltersBtn.addEventListener("click", function () {
    // Select all categories
    categoryCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    selectAllCategories.checked = true;
    updateCategoryDropdownText();

    customRangeSelect.value = "";

    // Reset to default date range (30 days)
    const todayDate = new Date();
    const lastMonthDate = new Date(todayDate);
    lastMonthDate.setDate(todayDate.getDate() - 30);

    startDateInput.value = formatDate(lastMonthDate);
    endDateInput.value = formatDate(todayDate);
  });

  // Note: Profile dropdown functionality is handled by profileDropdown.js
  // No need to duplicate the code here
});
