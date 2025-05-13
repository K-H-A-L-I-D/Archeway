/**
 * enhanced-dashboard.js - Complete implementation
 */

// Sample job data for initialization
let jobData = [];

// Initialize charts object
const charts = {};

// Default view
let currentView = 'dashboard';

// Calendar variables
let currentCalendarDate = new Date();
let currentCalendarView = 'month';

// Fetch job data when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Fetch job data from server
  fetchJobData();
  
  // Initialize UI
  initUI();

  // Initialize sidebar state
  initSidebar();

  // Render dashboard elements
  renderDashboard();
});

// Sample job data for testing
function createSampleJobData() {
  return [
    {
      id: '1',
      title: 'Frontend Developer',
      company: 'Tech Solutions Inc.',
      type: 'full-time',
      location: 'New York, NY',
      locationType: 'hybrid',
      status: 'Applied',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      dateApplied: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Frontend developer position using React and TypeScript.',
      tags: ['React', 'TypeScript', 'CSS']
    },
    {
      id: '2',
      title: 'Backend Engineer',
      company: 'Data Systems',
      type: 'full-time',
      location: 'San Francisco, CA',
      locationType: 'remote',
      status: 'Interviewing',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      dateApplied: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: null,
      description: 'Backend role focusing on Python and cloud infrastructure.',
      tags: ['Python', 'AWS', 'Django']
    },
    {
      id: '3',
      title: 'UI/UX Designer',
      company: 'Creative Studio',
      type: 'full-time',
      location: 'Chicago, IL',
      locationType: 'in-person',
      status: 'Saved',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      dateApplied: null,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Looking for an experienced designer to join our creative team.',
      tags: ['Figma', 'UI', 'UX Research']
    },
    {
      id: '4',
      title: 'Data Scientist',
      company: 'Analytics Co.',
      type: 'full-time',
      location: 'Boston, MA',
      locationType: 'hybrid',
      status: 'Rejected',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateApplied: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: null,
      description: 'Data science role focused on machine learning and analytics.',
      tags: ['Python', 'ML', 'Data Analysis']
    },
    {
      id: '5',
      title: 'Product Manager',
      company: 'SaaS Platform',
      type: 'full-time',
      location: 'Austin, TX',
      locationType: 'in-person',
      status: 'Offered',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      dateApplied: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: null,
      description: 'Product manager role for a growing SaaS platform.',
      tags: ['Product', 'Agile', 'SaaS']
    }
  ];
}

// Fetch job data from server
function fetchJobData() {
  fetch('/api/jobs')
    .then(response => response.json())
    .then(data => {
      jobData = data;
      renderDashboard();
      updateViewContent();
    })
    .catch(error => {
      console.error('Error fetching job data:', error);
      // For development, initialize with sample data
      console.log('Loading sample job data');
      jobData = createSampleJobData();
      renderDashboard();
      updateViewContent();
    });
}

/**
 * Edit job function
 * @param {string} jobId - ID of the job to edit
 */
function editJob(jobId) {
  const job = jobData.find(j => j.id == jobId);
  if (job) {
    showJobFormModal(job);
  }
}

/**
 * Show job details
 * @param {string} jobId - ID of the job to show
 */
function showJobDetails(jobId) {
  const job = jobData.find(j => j.id == jobId);
  if (!job) return;
  
  const modal = document.getElementById('jobDetailModal');
  if (!modal) return;
  
  // Fill modal with job details
  document.getElementById('modalJobTitle').textContent = job.title;
  document.getElementById('modalCompany').textContent = job.company;
  document.getElementById('modalLocation').textContent = job.location;
  document.getElementById('modalJobType').textContent = job.type.charAt(0).toUpperCase() + job.type.slice(1);
  
  document.getElementById('modalStatus').textContent = job.status;
  document.getElementById('modalStatusBadge').className = `job-status-badge status-${job.status.toLowerCase()}`;
  
  // Fill tags
  const tagsContainer = document.getElementById('modalTags');
  tagsContainer.innerHTML = '';
  job.tags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    tagsContainer.appendChild(tagElement);
  });
  
  // Description
  const descriptionElement = document.getElementById('modalDescription');
  descriptionElement.textContent = job.description || 'No description available.';
  
  // Format dates
  const createdDate = job.createdAt 
    ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown';
    
  const appliedDate = job.dateApplied
    ? new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Not applied yet';
    
  const deadlineDate = job.deadline
    ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'No deadline';
  
  // Set sidebar details
  document.getElementById('sidebarStatus').textContent = job.status;
  document.getElementById('sidebarDeadline').textContent = deadlineDate;
  document.getElementById('sidebarApplied').textContent = appliedDate;
  document.getElementById('sidebarJobType').textContent = job.type.charAt(0).toUpperCase() + job.type.slice(1);
  document.getElementById('sidebarLocationType').textContent = job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1);
  
  // Timeline
  document.getElementById('modalSavedDate').textContent = createdDate;
  document.getElementById('modalAppliedDate').textContent = appliedDate;
  
  // Update timeline markers
  const timelineApplied = document.getElementById('timelineApplied');
  const timelineInterview = document.getElementById('timelineInterview');
  const timelineOffer = document.getElementById('timelineOffer');
  
  // Reset timeline
  timelineApplied.querySelector('.timeline-marker').classList.remove('done');
  timelineInterview.querySelector('.timeline-marker').classList.remove('done');
  timelineOffer.querySelector('.timeline-marker').classList.remove('done');
  
  // Update timeline based on status
  if (job.status === 'Applied' || job.status === 'Interviewing' || job.status === 'Offered' || job.status === 'Accepted') {
    timelineApplied.querySelector('.timeline-marker').classList.add('done');
  }
  
  if (job.status === 'Interviewing' || job.status === 'Offered' || job.status === 'Accepted') {
    timelineInterview.querySelector('.timeline-marker').classList.add('done');
    // Add interview date (for now just estimation)
    document.getElementById('modalInterviewDate').textContent = 'In progress';
  } else {
    document.getElementById('modalInterviewDate').textContent = 'Not yet';
  }
  
  if (job.status === 'Offered' || job.status === 'Accepted') {
    timelineOffer.querySelector('.timeline-marker').classList.add('done');
    // Add offer date (for now just estimation)
    document.getElementById('modalOfferDate').textContent = 'Received';
  } else {
    document.getElementById('modalOfferDate').textContent = 'Not yet';
  }
  
  // Set up edit button
  document.getElementById('editJobBtn').onclick = () => editJob(job.id);
  
  // Set up delete button
  document.getElementById('deleteJobBtn').onclick = () => deleteJob(job.id);
  
  // Set up update status button
  const updateStatusBtn = document.getElementById('updateStatusBtn');
  
  // Determine next status
  let nextStatus;
  let buttonText;
  
  switch (job.status) {
    case 'Saved':
      nextStatus = 'Applied';
      buttonText = 'Mark as Applied';
      break;
      
    case 'Applied':
      nextStatus = 'Interviewing';
      buttonText = 'Mark as Interviewing';
      break;
      
    case 'Interviewing':
      nextStatus = 'Offered';
      buttonText = 'Mark as Offered';
      break;
      
    case 'Offered':
      nextStatus = 'Accepted';
      buttonText = 'Mark as Accepted';
      break;
      
    default:
      nextStatus = null;
      buttonText = '';
  }
  
  if (nextStatus) {
    updateStatusBtn.textContent = buttonText;
    updateStatusBtn.onclick = () => updateJobStatus(job.id, nextStatus);
    updateStatusBtn.style.display = 'block';
  } else {
    updateStatusBtn.style.display = 'none';
  }
  
  // Show modal
  modal.classList.remove('hidden');
}

/**
 * Delete job function
 * @param {string} jobId - ID of the job to delete
 */
function deleteJob(jobId) {
  if (confirm('Are you sure you want to delete this job application?')) {
    fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
      }
    })
    .then(response => {
      if (response.ok) {
        // Remove job from local data
        jobData = jobData.filter(job => job.id != jobId);
        
        // Close modal if open
        document.getElementById('jobDetailModal').classList.add('hidden');
        
        // Update UI
        updateViewContent();
        renderDashboard();
        
        // Show success notification
        showNotification('Job deleted successfully', 'success');
      } else {
        showNotification('Failed to delete job', 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting job:', error);
      showNotification('Error deleting job', 'error');
    });
  }
}

/**
 * Update job status
 * @param {string} jobId - ID of the job to update
 * @param {string} newStatus - New status for the job
 */
function updateJobStatus(jobId, newStatus) {
  const job = jobData.find(j => j.id == jobId);
  if (!job) return;
  
  const oldStatus = job.status;
  
  // Update status in local data
  job.status = newStatus;
  
  // If status changed to Applied, update applied date
  if (newStatus === 'Applied' && oldStatus !== 'Applied') {
    job.dateApplied = new Date().toISOString();
  }
  
  // Update on server
  fetch(`/api/jobs/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({
      status: newStatus,
      dateApplied: job.dateApplied
    })
  })
  .then(response => {
    if (response.ok) {
      // Update UI
      updateViewContent();
      renderDashboard();
      
      // Update modal if open
      if (!document.getElementById('jobDetailModal').classList.contains('hidden')) {
        showJobDetails(jobId);
      }
      
      // Show success notification
      showNotification(`Job marked as ${newStatus}`, 'success');
    } else {
      // Revert change on error
      job.status = oldStatus;
      showNotification('Failed to update job status', 'error');
    }
  })
  .catch(error => {
    console.error('Error updating job status:', error);
    // Revert change on error
    job.status = oldStatus;
    showNotification('Error updating job status', 'error');
  });
}

/**
 * Initialize UI
 */
function initUI() {
  // Set up event listeners
  document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
  document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
  document.getElementById('addNewJobBtn').addEventListener('click', () => showJobFormModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelJobBtn').addEventListener('click', closeModal);
  document.getElementById('submitJobBtn').addEventListener('click', submitJobForm);
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);
  
  // Set up search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('clearSearch').addEventListener('click', clearSearch);
  }
  
  // View switcher for applications view
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const viewType = btn.getAttribute('data-view');
      const jobList = document.getElementById('jobList');
      
      if (viewType === 'grid') {
        jobList.classList.remove('list-view');
        jobList.classList.add('grid-view');
      } else {
        jobList.classList.remove('grid-view');
        jobList.classList.add('list-view');
      }
    });
  });
  
  // Initialize filters
  const filterJobType = document.getElementById('filterJobType');
  const filterStatus = document.getElementById('filterStatus');
  const sortBy = document.getElementById('sortBy');
  
  if (filterJobType) filterJobType.addEventListener('change', updateViewContent);
  if (filterStatus) filterStatus.addEventListener('change', updateViewContent);
  if (sortBy) sortBy.addEventListener('change', updateViewContent);
  
  // Initialize kanban drag and drop
  initKanbanBoard();
  
  // Calendar navigation
  document.getElementById('prevMonth')?.addEventListener('click', () => navigateCalendar('prev'));
  document.getElementById('nextMonth')?.addEventListener('click', () => navigateCalendar('next'));
  document.getElementById('todayBtn')?.addEventListener('click', () => navigateCalendar('today'));
  
  // Calendar view switcher
  const calendarViewBtns = document.querySelectorAll('[data-calendar-view]');
  calendarViewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      calendarViewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const viewType = btn.getAttribute('data-calendar-view');
      switchCalendarView(viewType);
    });
  });
  
  // Time range selector for analytics
  document.getElementById('timeRangeSelect')?.addEventListener('change', (e) => {
    updateChartTimeRange(e.target.value);
  });
  
  // Check for view parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  
  if (viewParam) {
    switchView(viewParam);
  } else {
    // Default view
    switchView('dashboard');
  }
  
  // Initialize dark mode based on user preference
  initDarkMode();
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
  // Check if notification container exists
  let container = document.querySelector('.notification-container');
  
  if (!container) {
    // Create container if it doesn't exist
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Add icon based on type
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to container
  container.appendChild(notification);
  
  // Add close button functionality
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('notification-visible');
  }, 10);
}

/**
 * Render month view in calendar
 * @param {HTMLElement} container - The calendar container
 */
function renderMonthView(container) {
  // Get current month details
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Get first day of month and days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Create calendar grid
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar-grid';
  calendarGrid.style.display = 'grid';
  calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  calendarGrid.style.gap = '1px';
  
  // Day names header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-name';
    dayHeader.textContent = day;
    dayHeader.style.textAlign = 'center';
    dayHeader.style.fontWeight = 'bold';
    dayHeader.style.padding = '0.5rem';
    dayHeader.style.backgroundColor = 'var(--bg-color)';
    dayHeader.style.borderBottom = '1px solid var(--border-color)';
    
    calendarGrid.appendChild(dayHeader);
  });
  
  // Get current date for highlighting today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Days from previous month
  const prevMonthDays = startingDayOfWeek;
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    
    const dayCell = createDayCell(date, true);
    calendarGrid.appendChild(dayCell);
  }
  
  // Days in current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    
    const dayCell = createDayCell(date, false, isToday);
    calendarGrid.appendChild(dayCell);
  }
  
  // Days from next month
  const totalCells = 42; // 6 rows of 7 days
  const nextMonthDays = totalCells - (prevMonthDays + daysInMonth);
  
  for (let day = 1; day <= nextMonthDays; day++) {
    const date = new Date(year, month + 1, day);
    
    const dayCell = createDayCell(date, true);
    calendarGrid.appendChild(dayCell);
  }
  
  // Add grid to container
  container.appendChild(calendarGrid);
  
  // Add events to the calendar
  addCalendarEvents();
}

/**
 * Create a day cell for the calendar
 * @param {Date} date - The date for this cell
 * @param {boolean} isOtherMonth - Whether this date is in another month
 * @param {boolean} isToday - Whether this date is today
 * @returns {HTMLElement} - The created day cell
 */
function createDayCell(date, isOtherMonth = false, isToday = false) {
  const dayCell = document.createElement('div');
  dayCell.className = 'calendar-day';
  if (isOtherMonth) dayCell.classList.add('other-month');
  if (isToday) dayCell.classList.add('today');
  
  // Date header
  const dayHeader = document.createElement('div');
  dayHeader.className = 'calendar-day-header';
  
  const dayNumber = document.createElement('span');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = date.getDate();
  
  dayHeader.appendChild(dayNumber);
  dayCell.appendChild(dayHeader);
  
  // Store date info in data attributes for event handling
  dayCell.setAttribute('data-date', date.toISOString().split('T')[0]);
  
  return dayCell;
}

/**
 * Add events to the calendar view
 */
function addCalendarEvents() {
  // Filter jobs with deadlines or applied dates
  const events = [];
  
  jobData.forEach(job => {
    // Add deadline events
    if (job.deadline) {
      events.push({
        date: new Date(job.deadline),
        type: 'deadline',
        title: `Deadline: ${job.title}`,
        job: job
      });
    }
    
    // Add applied events
    if (job.dateApplied) {
      events.push({
        date: new Date(job.dateApplied),
        type: 'applied',
        title: `Applied: ${job.title}`,
        job: job
      });
    }
    
    // For interviewing jobs, add a future interview placeholder
    if (job.status === 'Interviewing') {
      // Create a placeholder interview date 7 days after applied date or today
      const baseDate = job.dateApplied ? new Date(job.dateApplied) : new Date();
      const interviewDate = new Date(baseDate);
      interviewDate.setDate(baseDate.getDate() + 7);
      
      events.push({
        date: interviewDate,
        type: 'interview',
        title: `Interview: ${job.title}`,
        job: job
      });
    }
  });
  
  // Add events to calendar cells
  events.forEach(event => {
    const dateString = event.date.toISOString().split('T')[0];
    const dayCell = document.querySelector(`.calendar-day[data-date="${dateString}"]`);
    
    if (dayCell) {
      const eventElement = document.createElement('div');
      eventElement.className = `calendar-event ${event.type}`;
      eventElement.textContent = event.title;
      
      // Add click handler to show job details
      eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showJobDetails(event.job.id);
      });
      
      dayCell.appendChild(eventElement);
    }
  });
}

/**
 * Navigate the calendar (previous, next, today)
 * @param {string} direction - The navigation direction ('prev', 'next', or 'today')
 */
function navigateCalendar(direction) {
  switch (direction) {
    case 'prev':
      // Go to previous month/week/day based on current view
      if (currentCalendarView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      } else if (currentCalendarView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
      } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
      }
      break;
      
    case 'next':
      // Go to next month/week/day based on current view
      if (currentCalendarView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      } else if (currentCalendarView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
      } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
      }
      break;
      
    case 'today':
      // Go to current date
      currentCalendarDate = new Date();
      break;
  }
  
  // Update calendar
  updateCalendarHeader();
  renderCalendar();
}

/**
 * Switch between different calendar views (month, week, day)
 * @param {string} view - The calendar view to switch to
 */
function switchCalendarView(view) {
  currentCalendarView = view;
  renderCalendar();
}

/**
 * Update calendar events when job data changes
 */
function updateCalendarEvents() {
  if (currentView === 'calendar') {
    renderCalendar();
  }
}

/**
 * Refresh analytics charts
 */
function refreshAnalyticsCharts() {
  if (currentView !== 'analytics') return;
  
  // Initialize success rate chart
  initSuccessRateChart();
  
  // Initialize job type chart
  initJobTypeChart();
  
  // Initialize timeline chart
  initTimelineChart();
  
  // Initialize sources chart (placeholder for now)
  initSourcesChart();
}

/**
 * Initialize success rate chart
 */
function initSuccessRateChart() {
  const canvas = document.getElementById('successRateChart');
  if (!canvas) return;
  
  // Calculate success metrics
  const totalApplications = jobData.filter(job => job.status !== 'Saved').length;
  const interviews = jobData.filter(job => 
    job.status === 'Interviewing' || job.status === 'Offered' || job.status === 'Accepted'
  ).length;
  const offers = jobData.filter(job => 
    job.status === 'Offered' || job.status === 'Accepted'
  ).length;
  
  // Calculate rates, avoid division by zero
  const applicationToInterviewRate = totalApplications ? (interviews / totalApplications) * 100 : 0;
  const interviewToOfferRate = interviews ? (offers / interviews) * 100 : 0;
  const overallSuccessRate = totalApplications ? (offers / totalApplications) * 100 : 0;
  
  // Prepare chart data
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  const data = {
    labels: ['Application to Interview', 'Interview to Offer', 'Overall Success'],
    datasets: [{
      label: 'Success Rate (%)',
      data: [
        applicationToInterviewRate.toFixed(1),
        interviewToOfferRate.toFixed(1),
        overallSuccessRate.toFixed(1)
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(16, 185, 129, 0.6)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)'
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
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
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
  if (charts.successRate) {
    charts.successRate.data = data;
    charts.successRate.options = options;
    charts.successRate.update();
  } else {
    charts.successRate = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: options
    });
  }
}

/**
 * Initialize job type chart
 */
function initJobTypeChart() {
  const canvas = document.getElementById('jobTypeChart');
  if (!canvas) return;
  
  // Count jobs by type
  const jobTypes = {};
  
  jobData.forEach(job => {
    const type = job.type || 'Other';
    jobTypes[type] = (jobTypes[type] || 0) + 1;
  });
  
  // Prepare chart data
  const labels = Object.keys(jobTypes);
  const data = Object.values(jobTypes);
  
  const backgroundColor = [
    'rgba(59, 130, 246, 0.6)',
    'rgba(16, 185, 129, 0.6)',
    'rgba(245, 158, 11, 0.6)',
    'rgba(139, 92, 246, 0.6)',
    'rgba(156, 163, 175, 0.6)'
  ];
  
  const borderColor = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(156, 163, 175, 1)'
  ];
  
  // Ensure there are enough colors for all job types
  while (backgroundColor.length < labels.length) {
    // Add more colors if needed
    backgroundColor.push(...backgroundColor);
    borderColor.push(...borderColor);
  }
  
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  const chartData = {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: backgroundColor.slice(0, labels.length),
      borderColor: borderColor.slice(0, labels.length),
      borderWidth: 1
    }]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor
        }
      }
    }
  };
  
  // Create or update chart
  if (charts.jobType) {
    charts.jobType.data = chartData;
    charts.jobType.options = options;
    charts.jobType.update();
  } else {
    charts.jobType = new Chart(canvas, {
      type: 'pie',
      data: chartData,
      options: options
    });
  }
}

/**
 * Initialize timeline chart
 */
function initTimelineChart() {
  const canvas = document.getElementById('timelineChart');
  if (!canvas) return;
  
  // Group jobs by month
  const jobsByMonth = {};
  
  jobData.forEach(job => {
    if (!job.createdAt) return;
    
    const date = new Date(job.createdAt);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!jobsByMonth[monthKey]) {
      jobsByMonth[monthKey] = {
        applied: 0,
        interviews: 0,
        offers: 0
      };
    }
    
    // Count all jobs created this month
    if (job.status !== 'Saved') {
      jobsByMonth[monthKey].applied++;
    }
    
    // Count interviews
    if (job.status === 'Interviewing' || job.status === 'Offered' || job.status === 'Accepted') {
      jobsByMonth[monthKey].interviews++;
    }
    
    // Count offers
    if (job.status === 'Offered' || job.status === 'Accepted') {
      jobsByMonth[monthKey].offers++;
    }
  });
  
  // Sort months chronologically
  const sortedMonths = Object.keys(jobsByMonth).sort();
  
  // Format month labels
  const labels = sortedMonths.map(monthKey => {
    const [year, month] = monthKey.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });
  
  // Prepare chart data
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Applications',
        data: sortedMonths.map(month => jobsByMonth[month].applied),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Interviews',
        data: sortedMonths.map(month => jobsByMonth[month].interviews),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1
      },
      {
        label: 'Offers',
        data: sortedMonths.map(month => jobsByMonth[month].offers),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor
        }
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
  if (charts.timeline) {
    charts.timeline.data = chartData;
    charts.timeline.options = options;
    charts.timeline.update();
  } else {
    charts.timeline = new Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: options
    });
  }
}

/**
 * Initialize sources chart (placeholder implementation)
 */
function initSourcesChart() {
  const canvas = document.getElementById('sourcesChart');
  if (!canvas) return;
  
  // This is a placeholder chart since we don't track sources yet
  // In a real implementation, you would track job application sources
  
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#333';
  
  const chartData = {
    labels: ['Company Website', 'LinkedIn', 'Indeed', 'Referral', 'Other'],
    datasets: [{
      label: 'Applications by Source',
      data: [5, 8, 3, 2, 1], // Placeholder data
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)',
        'rgba(16, 185, 129, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(139, 92, 246, 0.6)',
        'rgba(156, 163, 175, 0.6)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(156, 163, 175, 1)'
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
        position: 'right',
        labels: {
          color: textColor
        }
      }
    }
  };
  
  // Create or update chart
  if (charts.sources) {
    charts.sources.data = chartData;
    charts.sources.options = options;
    charts.sources.update();
  } else {
    charts.sources = new Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  }
}

/**
 * Update chart time range
 * @param {string} range - The time range to display ('7', '30', '90', 'all')
 */
function updateChartTimeRange(range) {
  // This would filter the job data based on the selected time range
  // Then update all the charts with the filtered data
  
  // For now, we'll just refresh all charts
  refreshAnalyticsCharts();
}

// Add this function to your dashboard.js file
function showJobFormModal(jobToEdit = null) {
  const modal = document.getElementById('jobFormModal');
  const title = document.getElementById('modalFormTitle');
  const form = document.getElementById('jobForm');
  const submitBtn = document.getElementById('submitJobBtn');
  
  if (!modal || !form) return;
  
  // Set form title
  if (title) {
    title.textContent = jobToEdit ? 'Edit Job' : 'Add New Job';
  }
  
  // Reset form
  form.reset();
  
  // If editing, fill form with job data
  if (jobToEdit) {
    const job = typeof jobToEdit === 'string' 
      ? jobData.find(j => j.id == jobToEdit) 
      : jobToEdit;
    
    if (!job) return;
    
    // Set form values
    document.getElementById('jobTitle').value = job.title || '';
    document.getElementById('jobCompany').value = job.company || '';
    document.getElementById('jobType').value = job.type || 'full-time';
    document.getElementById('jobLocation').value = job.location || '';
    document.getElementById('jobLocationType').value = job.locationType || 'in-person';
    document.getElementById('jobStatus').value = job.status || 'Saved';
    
    // Format dates for the date inputs
    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      document.getElementById('jobDeadline').value = formatDateForInput(deadlineDate);
    }
    
    if (job.dateApplied) {
      const appliedDate = new Date(job.dateApplied);
      document.getElementById('dateApplied').value = formatDateForInput(appliedDate);
    }
    
    document.getElementById('jobDesc').value = job.description || '';
    document.getElementById('jobTags').value = job.tags.join(', ');
    
    // Store job ID for submission
    submitBtn.setAttribute('data-edit-id', job.id);
  } else {
    // Clear edit ID if adding new job
    submitBtn.removeAttribute('data-edit-id');
    
    // Set default values for new job
    document.getElementById('jobStatus').value = 'Saved';
    
    // Set today's date as default for date fields
    const today = formatDateForInput(new Date());
    document.getElementById('dateApplied').value = today;
  }
  
  // Show modal
  modal.classList.remove('hidden');
}

// Helper function to format dates for input fields
function formatDateForInput(date) {
  if (!date) return '';
  
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  
  return [year, month, day].join('-');
}

// Make functions available globally
window.showJobFormModal = showJobFormModal;
window.editJob = editJob;
window.deleteJob = deleteJob;
window.updateJobStatus = updateJobStatus;