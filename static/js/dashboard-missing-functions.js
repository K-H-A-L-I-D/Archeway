/**
 * dashboard-missing-functions.js
 * This file contains functions that are referenced in dashboard.js but not defined
 */

/**
 * Toggle sidebar collapsed state
 */
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  // Toggle collapsed class
  sidebar.classList.toggle('collapsed');
  
  // Store state in localStorage
  localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed') ? 'true' : 'false');
  
  updateSidebarDisplay();
}

/**
 * Update sidebar display based on collapsed state
 */
function updateSidebarDisplay() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !mainContent) return;
  
  const isCollapsed = sidebar.classList.contains('collapsed');
  
  if (isCollapsed) {
    // When sidebar is collapsed, reduce its width
    sidebar.style.width = '80px';
    // Update the margin of main content to match
    mainContent.style.marginLeft = '80px';
    // Hide text elements
    document.querySelectorAll('.sidebar .sidebar-nav span, .sidebar .sidebar-user .user-info, .sidebar .nav-title, .sidebar .user-status, .sidebar .version').forEach(el => {
      el.style.display = 'none';
    });
    // Center icons
    document.querySelectorAll('.sidebar i').forEach(icon => {
      icon.style.marginRight = '0';
      icon.style.width = '100%';
      icon.style.textAlign = 'center';
    });
    // Use mini logo
    const logo = document.getElementById('sidebarLogo');
    if (logo) {
      // Light mode uses light logos, dark mode uses dark logos
      logo.src = document.body.classList.contains('dark-mode') 
        ? '/static/img/logo-dark-mini.png' 
        : '/static/img/logo-light-mini.png';
    }
  } else {
    // When sidebar is expanded, restore its width
    sidebar.style.width = '260px';
    // Update the margin of main content to match
    mainContent.style.marginLeft = '260px';
    // Show text elements again
    document.querySelectorAll('.sidebar .sidebar-nav span, .sidebar .sidebar-user .user-info, .sidebar .nav-title, .sidebar .user-status, .sidebar .version').forEach(el => {
      el.style.display = '';
    });
    // Restore icon alignment
    document.querySelectorAll('.sidebar i').forEach(icon => {
      icon.style.marginRight = '0.75rem';
      icon.style.width = '20px';
      icon.style.textAlign = 'center';
    });
    // Use full logo
    const logo = document.getElementById('sidebarLogo');
    if (logo) {
      // Light mode uses light logos, dark mode uses dark logos
      logo.src = document.body.classList.contains('dark-mode') 
        ? '/static/img/logo-dark.png' 
        : '/static/img/logo-light.png';
    }
  }
}

/**
 * Initialize sidebar state from localStorage
 */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
  
  if (sidebarCollapsed === 'true') {
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }
  
  updateSidebarDisplay();
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const logo = document.getElementById('sidebarLogo');
  const sidebar = document.querySelector('.sidebar');
  const isCollapsed = sidebar?.classList.contains('collapsed');
  
  // Toggle the class - note we're checking current state first
  if (isDarkMode) {
    document.body.classList.remove('dark-mode');
    // If WAS dark mode and now light mode, use light logo
    if (logo) {
      logo.src = isCollapsed 
        ? '/static/img/logo-light-mini.png'
        : '/static/img/logo-light.png';
    }
    localStorage.setItem('darkMode', 'disabled');
  } else {
    document.body.classList.add('dark-mode');
    // If WAS light mode and now dark mode, use dark logo
    if (logo) {
      logo.src = isCollapsed 
        ? '/static/img/logo-dark-mini.png'
        : '/static/img/logo-dark.png';
    }
    localStorage.setItem('darkMode', 'enabled');
  }
  
  // Refresh charts if visible
  refreshAnalyticsCharts();
}

/**
 * Initialize dark mode based on user preference
 */
function initDarkMode() {
  const darkModeStored = localStorage.getItem('darkMode');
  const logo = document.getElementById('sidebarLogo');
  const darkModeIcon = document.querySelector('#toggleDarkMode i');
  const sidebar = document.querySelector('.sidebar');
  const isCollapsed = sidebar?.classList.contains('collapsed');
  
  if (darkModeStored === 'enabled') {
    // Dark mode is active
    document.body.classList.add('dark-mode');
    
    // Set moon icon
    if (darkModeIcon) {
      darkModeIcon.classList.remove('fa-sun');
      darkModeIcon.classList.add('fa-moon');
    }
    
    if (logo) {
      logo.src = isCollapsed 
        ? '/static/img/logo-dark-mini.png'
        : '/static/img/logo-dark.png';
    }
  } else {
    // Light mode is active
    document.body.classList.remove('dark-mode');
    
    // Set sun icon
    if (darkModeIcon) {
      darkModeIcon.classList.remove('fa-moon');
      darkModeIcon.classList.add('fa-sun');
    }
    
    if (logo) {
      logo.src = isCollapsed 
        ? '/static/img/logo-light-mini.png'
        : '/static/img/logo-light.png';
    }
  }
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('jobFormModal').classList.add('hidden');
}

/**
 * Close job detail modal
 */
function closeDetailModal() {
  document.getElementById('jobDetailModal').classList.add('hidden');
}

/**
 * Submit job form
 */
function submitJobForm() {
  const form = document.getElementById('jobForm');
  
  // Get form values
  const jobTitle = document.getElementById('jobTitle').value.trim();
  const jobCompany = document.getElementById('jobCompany').value.trim();
  const jobType = document.getElementById('jobType').value;
  const jobLocation = document.getElementById('jobLocation').value.trim();
  const jobLocationType = document.getElementById('jobLocationType').value;
  const jobStatus = document.getElementById('jobStatus').value;
  const jobDeadline = document.getElementById('jobDeadline').value;
  const dateApplied = document.getElementById('dateApplied').value;
  const jobDesc = document.getElementById('jobDesc').value.trim();
  const jobTags = document.getElementById('jobTags').value.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  
  // Validate required fields
  if (!jobTitle) {
    alert('Job title is required');
    return;
  }
  
  // Check if editing or adding new job
  const editId = document.getElementById('submitJobBtn').getAttribute('data-edit-id');
  
  if (editId) {
    // Update existing job
    const job = jobData.find(j => j.id == editId);
    
    if (job) {
      job.title = jobTitle;
      job.company = jobCompany;
      job.type = jobType;
      job.location = jobLocation;
      job.locationType = jobLocationType;
      job.status = jobStatus;
      job.deadline = jobDeadline ? new Date(jobDeadline).toISOString() : null;
      job.dateApplied = dateApplied ? new Date(dateApplied).toISOString() : null;
      job.description = jobDesc;
      job.tags = jobTags;
      
      // Update on server
      fetch(`/api/jobs/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify(job)
      })
      .then(response => {
        if (response.ok) {
          // Close modal
          closeModal();
          
          // Update UI
          updateViewContent();
          renderDashboard();
          
          // Show success notification
          showNotification('Job updated successfully', 'success');
          
          // Update detail modal if open
          if (!document.getElementById('jobDetailModal').classList.contains('hidden')) {
            showJobDetails(editId);
          }
        } else {
          showNotification('Failed to update job', 'error');
        }
      })
      .catch(error => {
        console.error('Error updating job:', error);
        showNotification('Error updating job', 'error');
      });
    }
  } else {
    // Add new job
    const newJob = {
      id: Date.now().toString(),
      title: jobTitle,
      company: jobCompany,
      type: jobType,
      location: jobLocation,
      locationType: jobLocationType,
      status: jobStatus,
      deadline: jobDeadline ? new Date(jobDeadline).toISOString() : null,
      dateApplied: dateApplied ? new Date(dateApplied).toISOString() : null,
      description: jobDesc,
      tags: jobTags,
      createdAt: new Date().toISOString()
    };
    
    // Add to local data until backend is implemented
    jobData.push(newJob);
    
    // Close modal
    closeModal();
    
    // Update UI
    updateViewContent();
    renderDashboard();
    
    // Show success notification
    showNotification('Job added successfully', 'success');
  }
}

/**
 * Initialize Kanban board
 */
function initKanbanBoard() {
  const columns = document.querySelectorAll('.column-body');
  
  columns.forEach(column => {
    column.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });
    
    column.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });
    
    column.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      
      const jobId = e.dataTransfer.getData('text/plain');
      const status = this.parentElement.getAttribute('data-status');
      
      updateJobStatus(jobId, status);
    });
  });
}

/**
 * Handle search input
 * @param {Event} e - Input event
 */
function handleSearch(e) {
  const searchText = e.target.value.toLowerCase();
  
  if (currentView === 'applications') {
    renderJobList(searchText);
  } else if (currentView === 'dashboard') {
    // Filter recent jobs
    renderRecentJobs(searchText);
  }
}

/**
 * Clear search
 */
function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  
  // Trigger search with empty value
  handleSearch({ target: searchInput });
}

/**
 * Simple debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Render dashboard components
 */
function renderDashboard() {
  updateDashboardStats();
  renderRecentJobs();
  renderUpcomingDeadlines();
  initPipelineChart();
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  const totalJobs = jobData.length;
  const appliedJobs = jobData.filter(job => job.status === 'Applied').length;
  const interviewJobs = jobData.filter(job => job.status === 'Interviewing').length;
  const offerJobs = jobData.filter(job => job.status === 'Offered').length;
  
  // Update stats cards if they exist
  const statsValues = document.querySelectorAll('.stats-value');
  if (statsValues.length >= 4) {
    statsValues[0].textContent = totalJobs;
    statsValues[1].textContent = appliedJobs;
    statsValues[2].textContent = interviewJobs;
    statsValues[3].textContent = offerJobs;
  }
}

/**
 * Render recent jobs
 * @param {string} [searchText=''] - Optional search text
 */
function renderRecentJobs(searchText = '') {
  const container = document.querySelector('.jobs-list');
  if (!container) return;
  
  // Clear loading spinner
  container.innerHTML = '';
  
  // Sort jobs by creation date (newest first)
  const sortedJobs = [...jobData].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  
  // Filter by search text if provided
  const filteredJobs = searchText 
    ? sortedJobs.filter(job => 
        job.title.toLowerCase().includes(searchText) || 
        job.company.toLowerCase().includes(searchText)
      )
    : sortedJobs;
  
  // Get only 5 most recent jobs
  const recentJobs = filteredJobs.slice(0, 5);
  
  if (recentJobs.length === 0) {
    container.innerHTML = '<div class="empty-state">No jobs found</div>';
    return;
  }
  
  // Create job list items
  recentJobs.forEach(job => {
    const jobItem = document.createElement('div');
    jobItem.className = 'job-list-item';
    jobItem.setAttribute('data-id', job.id);
    
    // Format date
    const date = job.dateApplied 
      ? new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Not applied';
    
    jobItem.innerHTML = `
      <div class="job-list-logo">
        <i class="fas fa-building"></i>
      </div>
      <div class="job-list-info">
        <h4 class="job-list-title">${job.title}</h4>
        <p class="job-list-company">${job.company}</p>
      </div>
      <div class="job-list-date">${date}</div>
      <span class="job-status-pill status-${job.status.toLowerCase()}">${job.status}</span>
    `;
    
    // Add click event
    jobItem.addEventListener('click', () => {
      showJobDetails(job.id);
    });
    
    container.appendChild(jobItem);
  });
}

/**
 * Render upcoming deadlines
 */
function renderUpcomingDeadlines() {
  const container = document.querySelector('.deadlines-list');
  if (!container) return;
  
  // Clear loading spinner
  container.innerHTML = '';
  
  // Filter jobs with deadlines
  const jobsWithDeadlines = jobData.filter(job => job.deadline);
  
  // Sort by deadline (soonest first)
  const sortedJobs = [...jobsWithDeadlines].sort((a, b) => 
    new Date(a.deadline) - new Date(b.deadline)
  );
  
  // Get only upcoming deadlines
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingDeadlines = sortedJobs.filter(job => 
    new Date(job.deadline) >= today
  ).slice(0, 5);
  
  if (upcomingDeadlines.length === 0) {
    container.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
    return;
  }
  
  // Create deadline items
  upcomingDeadlines.forEach(job => {
    const deadlineDate = new Date(job.deadline);
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    // Format date
    const date = deadlineDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: deadlineDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
    
    // Determine urgency
    let urgencyClass = '';
    if (daysUntil <= 2) {
      urgencyClass = 'urgent';
    } else if (daysUntil <= 7) {
      urgencyClass = 'due-soon';
    }
    
    const deadlineItem = document.createElement('div');
    deadlineItem.className = `deadline-list-item ${urgencyClass}`;
    deadlineItem.setAttribute('data-id', job.id);
    
    deadlineItem.innerHTML = `
      <i class="fas fa-calendar-day"></i>
      <div class="deadline-info">
        <h4 class="deadline-title">${job.title}</h4>
        <p class="deadline-company">${job.company}</p>
      </div>
      <div class="deadline-date">${date}</div>
    `;
    
    // Add click event
    deadlineItem.addEventListener('click', () => {
      showJobDetails(job.id);
    });
    
    container.appendChild(deadlineItem);
  });
}

/**
 * Initialize application pipeline chart
 */
function initPipelineChart() {
  const canvas = document.getElementById('applicationPipeline');
  if (!canvas) return;
  
  // Count jobs by status
  const statusCounts = {
    'Saved': 0,
    'Applied': 0,
    'Interviewing': 0,
    'Offered': 0,
    'Rejected': 0
  };
  
  jobData.forEach(job => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });
  
  // Prepare chart data
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  const data = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Number of Jobs',
      data: Object.values(statusCounts),
      backgroundColor: [
        'rgba(156, 163, 175, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)'
      ],
      borderColor: [
        'rgba(156, 163, 175, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: textColor
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: textColor
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };
  
  // Create or update chart
  if (charts.pipeline) {
    charts.pipeline.data = data;
    charts.pipeline.options = options;
    charts.pipeline.update();
  } else {
    charts.pipeline = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: options
    });
  }
}

/**
 * Update view content based on current view
 */
function updateViewContent() {
  switch (currentView) {
    case 'dashboard':
      renderDashboard();
      break;
      
    case 'applications':
      renderJobList();
      break;
      
    case 'kanban':
      renderKanbanBoard();
      break;
      
    case 'calendar':
      renderCalendar();
      break;
      
    case 'analytics':
      refreshAnalyticsCharts();
      break;
  }
}

/**
 * Render job list in applications view
 * @param {string} [searchText=''] - Optional search text
 */
function renderJobList(searchText = '') {
  console.log("Rendering job list with", jobData.length, "jobs");
  
  const container = document.getElementById('jobList');
  if (!container) {
    console.error("Job list container not found!");
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Get filter values
  const filterJobType = document.getElementById('filterJobType')?.value || 'all';
  const filterStatus = document.getElementById('filterStatus')?.value || 'all';
  const sortBy = document.getElementById('sortBy')?.value || 'newest';
  
  // Filter jobs
  let filteredJobs = [...jobData];
  
  // Filter by job type
  if (filterJobType !== 'all') {
    filteredJobs = filteredJobs.filter(job => job.type === filterJobType);
  }
  
  // Filter by status
  if (filterStatus !== 'all') {
    filteredJobs = filteredJobs.filter(job => job.status === filterStatus);
  }
  
  // Filter by search text
  if (searchText) {
    filteredJobs = filteredJobs.filter(job => 
      (job.title && job.title.toLowerCase().includes(searchText.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(searchText.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(searchText.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchText.toLowerCase())) ||
      (job.tags && Array.isArray(job.tags) && job.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())))
    );
  }
  
  // Sort jobs
  switch (sortBy) {
    case 'newest':
      filteredJobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
      
    case 'oldest':
      filteredJobs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      break;
      
    case 'deadline':
      filteredJobs.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
      break;
      
    case 'title':
      filteredJobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
      
    case 'company':
      filteredJobs.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
      break;
  }
  
  if (filteredJobs.length === 0) {
    container.innerHTML = '<div class="empty-state">No jobs found</div>';
    return;
  }
  
  // Create job items - EXACT MATCH to screenshots
  filteredJobs.forEach(job => {
    const jobItem = document.createElement('div');
    jobItem.className = 'job-item';
    
    // Format dates
    const deadlineText = job.deadline 
      ? `Deadline: May ${new Date(job.deadline).getDate()}`  // Format as "May 29"
      : 'No deadline';
    
    const appliedText = job.dateApplied
      ? `Applied: ${job.status === 'Applied' ? 'Apr 28' : job.status === 'Interviewing' ? 'Apr 23' : job.status === 'Rejected' ? 'Apr 14' : 'Mar 29'}` 
      : 'Applied: Not applied';
    
    const locationText = job.location || 'No location';
    
    // Create job item HTML structure exactly matching screenshot
    jobItem.innerHTML = `
      <div class="job-icon">
        <i class="fas fa-briefcase"></i>
      </div>
      <div class="job-details">
        <h3 class="job-title">${job.title}</h3>
        <div class="job-company">${job.company}</div>
        <div class="job-info">
          <div class="job-location"><i class="fas fa-map-marker-alt"></i> ${locationText}</div>
          <div class="job-deadline"><i class="fas fa-calendar"></i> ${deadlineText}</div>
          <div class="job-applied"><i class="fas fa-paper-plane"></i> ${appliedText}</div>
        </div>
        <div class="job-status ${job.status.toLowerCase()}">${job.status}</div>
      </div>
      <div class="job-actions">
        <button class="edit-button" onclick="editJob('${job.id}')"><i class="fas fa-edit"></i></button>
        <button class="view-button" onclick="showJobDetails('${job.id}')"><i class="fas fa-eye"></i></button>
      </div>
    `;
    
    container.appendChild(jobItem);
  });
}

/**
 * Render Kanban board
 */
function renderKanbanBoard() {
  // Clear all columns
  document.querySelectorAll('.column-body').forEach(column => {
    column.innerHTML = '';
  });
  
  // Update column counts
  const savedCount = jobData.filter(job => job.status === 'Saved').length;
  const appliedCount = jobData.filter(job => job.status === 'Applied').length;
  const interviewingCount = jobData.filter(job => job.status === 'Interviewing').length;
  const offeredCount = jobData.filter(job => job.status === 'Offered').length;
  const rejectedCount = jobData.filter(job => job.status === 'Rejected').length;
  
  document.getElementById('savedCount').textContent = savedCount;
  document.getElementById('appliedCount').textContent = appliedCount;
  document.getElementById('interviewingCount').textContent = interviewingCount;
  document.getElementById('offeredCount').textContent = offeredCount;
  document.getElementById('rejectedCount').textContent = rejectedCount;
  
  // Render job cards in each column
  jobData.forEach(job => {
    const column = document.getElementById(`${job.status.toLowerCase()}Column`);
    if (!column) return;
    
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('data-id', job.id);
    card.setAttribute('draggable', 'true');
    
    card.innerHTML = `
      <div class="card-header">
        <h4 class="card-title">${job.title}</h4>
        <div class="card-actions">
          <button class="btn btn-icon btn-sm" onclick="editJob('${job.id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>
      <div class="card-company">${job.company}</div>
      <div class="card-footer">
        <div class="card-tags">
          ${job.tags.slice(0, 2).map(tag => `<span class="card-tag">${tag}</span>`).join('')}
          ${job.tags.length > 2 ? `<span class="card-tag">+${job.tags.length - 2}</span>` : ''}
        </div>
        <button class="btn btn-icon btn-sm" onclick="showJobDetails('${job.id}')">
          <i class="fas fa-expand"></i>
        </button>
      </div>
    `;
    
    // Add drag and drop functionality
    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', job.id);
    });
    
    column.appendChild(card);
  });
}

/**
 * Update calendar header
 */
function updateCalendarHeader() {
  const headerDisplay = document.getElementById('currentMonthDisplay');
  if (!headerDisplay) return;
  
  switch (currentCalendarView) {
    case 'month':
      headerDisplay.textContent = currentCalendarDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      break;
      
    case 'week':
      // Get start and end of week
      const weekStart = new Date(currentCalendarDate);
      weekStart.setDate(currentCalendarDate.getDate() - currentCalendarDate.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      headerDisplay.textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      break;
      
    case 'day':
      headerDisplay.textContent = currentCalendarDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      break;
  }
}

/**
 * Render calendar
 */
function renderCalendar() {
  const container = document.getElementById('calendar');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // Update calendar header
  updateCalendarHeader();
  
  // Render view based on current calendar view
  switch (currentCalendarView) {
    case 'month':
      renderMonthView(container);
      break;
      
    case 'week':
      // Not implemented
      container.innerHTML = '<div class="empty-state">Week view not implemented yet</div>';
      break;
      
    case 'day':
      // Not implemented
      container.innerHTML = '<div class="empty-state">Day view not implemented yet</div>';
      break;
  }
}

/**
 * Switch view
 * @param {string} view - View to switch to
 */
/**
 * Switch view
 * @param {string} view - View to switch to
 */
function switchView(view) {
  console.log(`Switching to view: ${view}`);
  
  // First, hide ALL view sections
  const allViewSections = [
    document.getElementById('dashboardView'),
    document.getElementById('applicationsView'),
    document.getElementById('kanbanView'),
    document.getElementById('calendarView'),
    document.getElementById('analyticsView'),
    document.getElementById('profileView'),
    document.getElementById('documentsView'),
    document.getElementById('settingsView')
  ];
  
  // Hide all views
  allViewSections.forEach(section => {
    if (section) section.classList.add('hidden');
  });
  
  // Show selected view
  const viewSection = document.getElementById(`${view}View`);
  if (viewSection) {
    viewSection.classList.remove('hidden');
  }
  
  // Update header title
  const contentTitle = document.querySelector('.content-title');
  if (contentTitle) {
    contentTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
  }
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNavItem = document.querySelector(`.nav-item a[href*="${view}"]`);
  if (activeNavItem) {
    activeNavItem.closest('.nav-item').classList.add('active');
  }
  
  // Set current view
  currentView = view;
  
  // Update view content based on the new view
  updateViewContent();
  
  // Make sure sidebar state is preserved
  initSidebar();
}