// Initialize job data array
let jobData = [];
let currentUserId = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Initialize dark mode
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.getElementById('toggleDarkMode').innerHTML = '<i class="fas fa-sun"></i>'; // Remove the text
  }

  // Get current user ID if available (for testing, we'll use a default)
  currentUserId = localStorage.getItem('userId') || 1;

  // Set up event listeners
  setupEventListeners();

  // Load jobs from backend
  loadJobs();
});

function updateLogoForTheme() {
  const logo = document.getElementById('archewayLogo');
  const isDarkMode = document.body.classList.contains('dark-mode');
  logo.src = isDarkMode ? '/static/img/logo-dark.png' : '/static/img/logo-light.png';
}

// Set up all event listeners
function setupEventListeners() {
  // Toggle dark mode
  document.getElementById('toggleDarkMode').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('darkMode', 'enabled');
      this.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      localStorage.removeItem('darkMode');
      this.innerHTML = '<i class="fas fa-moon"></i>';
    }

    // 🔄 Update the logo based on current theme
    updateLogoForTheme();
  });

  // Show job form
  document.getElementById('addNewJobBtn').addEventListener('click', function() {
    showJobForm();
  });

  // Cancel job form
  document.getElementById('cancelJobBtn').addEventListener('click', function() {
    hideJobForm();
  });

  // Submit job form
  document.getElementById('submitJobBtn').addEventListener('click', function() {
    submitJob();
  });

  // Search functionality
  document.getElementById('searchInput').addEventListener('input', function() {
    filterJobs();
  });

  // Filter functionality
  document.getElementById('filterType').addEventListener('change', function() {
    filterJobs();
  });

  // Sort functionality
  document.getElementById('sortBy').addEventListener('change', function() {
    filterJobs();
  });
}


// Load jobs from backend API
async function loadJobs() {
  try {
    // Show loading state
    // Show loading state
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '<div class="loading-spinner">Loading jobs...</div>';
    
    // Fetch jobs from backend (no userId parameter)
    const response = await fetch('/api/jobs');
    
    if (!response.ok) {
      throw new Error(`Failed to load jobs: ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("BACKEND DATA:", data);

    
    // Transform data for our application
    jobData = data.map(job => {
      // Process tags string to array if it exists
      let tags = [];
      // Check both potential sources of tags
      // Prefer 'tags' field first, fallback to 'notes'
      if (job.tags && typeof job.tags === 'string' && job.tags.trim() !== '') {
        tags = job.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (job.notes && typeof job.notes === 'string' && job.notes.trim() !== '') {
        tags = job.notes.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      
      return {
        id: job.jobId,
        title: job.title,
        company: job.company,
        type: job.jobType,
        location: job.location,
        deadline: job.deadline,
        description: job.description,
        tags: tags, // Tags from 'tags' field or fallback to 'notes'
        status: job.status || 'Saved',
        createdAt: job.created_at,
        updatedAt: job.updated_at
      };
    });
    
    // Render jobs
    renderJobs();
  } catch (error) {
    console.error('Error loading jobs:', error);
    
    // Show error message
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = `<div class="error-message">Failed to load jobs: ${error.message}</div>`;
  }
}

// Show job form for adding a new job
function showJobForm(jobToEdit = null) {
  // Reset form
  document.getElementById('jobTitle').value = '';
  document.getElementById('jobCompany').value = '';
  document.getElementById('jobType').value = 'full-time';
  document.getElementById('jobLocation').value = '';
  document.getElementById('jobDeadline').value = '';
  document.getElementById('jobDesc').value = '';
  document.getElementById('jobTags').value = '';
  
  // Change form title based on whether we're editing or adding
  document.getElementById('formTitle').textContent = jobToEdit ? 'Edit Job' : 'Add New Job';
  
  // If editing, fill the form with job data
  if (jobToEdit) {
    document.getElementById('jobTitle').value = jobToEdit.title || '';
    document.getElementById('jobCompany').value = jobToEdit.company || '';
    document.getElementById('jobType').value = jobToEdit.type || 'full-time';
    document.getElementById('jobLocation').value = jobToEdit.location || '';
    document.getElementById('jobDeadline').value = jobToEdit.deadline ? jobToEdit.deadline.split('T')[0] : '';
    document.getElementById('jobDesc').value = jobToEdit.description || '';
    let tagList = Array.isArray(jobToEdit.tags)
    ? jobToEdit.tags
    : (jobToEdit.tags || '').split(',').map(tag => tag.trim()).filter(tag => tag);
  
    document.getElementById('jobTags').value = tagList.join(', ');
  

    // Store the job ID for editing
    document.getElementById('submitJobBtn').dataset.editId = jobToEdit.id;
  } else {
    // Clear edit ID if adding new job
    delete document.getElementById('submitJobBtn').dataset.editId;
  }
  
  // Show the form with animation
  document.getElementById('jobForm').classList.remove('hidden');
  document.getElementById('jobForm').classList.add('animate-fade-in');
}

function showJobModal(job) {
  document.getElementById('modalJobTitle').textContent = job.title;
  document.getElementById('modalCompany').textContent = job.company;
  document.getElementById('modalLocation').textContent = job.location;
  document.getElementById('modalDeadline').textContent = `Apply by: ${new Date(job.deadline).toLocaleDateString()}`;
  document.getElementById('modalDescription').textContent = job.description;

  const tagsContainer = document.getElementById('modalTags');
  tagsContainer.innerHTML = '';
  job.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'job-tag';
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });

  document.getElementById('jobModal').classList.remove('hidden');
}

document.getElementById('closeModalBtn').addEventListener('click', () => {
  document.getElementById('jobModal').classList.add('hidden');
});

window.addEventListener('click', (e) => {
  const modal = document.getElementById('jobModal');
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Hide job form
function hideJobForm() {
  document.getElementById('jobForm').classList.add('hidden');
  delete document.getElementById('submitJobBtn').dataset.editId;
}

// Submit job form (add or edit job)
async function submitJob() {
  // Get form values
  const title = document.getElementById('jobTitle').value.trim();
  const company = document.getElementById('jobCompany').value.trim();
  const type = document.getElementById('jobType').value;
  const location = document.getElementById('jobLocation').value.trim();
  const deadline = document.getElementById('jobDeadline').value;
  const description = document.getElementById('jobDesc').value.trim();
  const tagsString = document.getElementById('jobTags').value.trim();
  
  // Validate required fields
  if (!title || !description) {
    alert('Please fill in the job title and description');
    return;
  }
  
  // Parse tags
  const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  // Prepare job data for API
  const jobData = {
    title,
    company,
    type,
    location,
    deadline,
    description,
    notes: tags.join(','), // optional storage field
    tags: tags.join(','),   // ensure this is available explicitly
    status: 'Saved'
  };
  
  try {
    // Check if we're editing an existing job
    const editId = document.getElementById('submitJobBtn').dataset.editId;
    let response;
    
    if (editId) {
      // Update existing job
      response = await fetch(`/api/jobs/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });
    } else {
      // Create new job
      response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Server responded with status: ${response.status}`);
    }
    
    // Hide the form
    hideJobForm();
    
    // Reload jobs to get updated list
    await loadJobs();
    
  } catch (error) {
    console.error('Error saving job:', error);
    alert(`Failed to save job: ${error.message}`);
  }
}

// Delete a job
async function deleteJob(id) {
  if (confirm('Are you sure you want to delete this job?')) {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }
      
      // Reload jobs to get updated list
      await loadJobs();
      
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(`Failed to delete job: ${error.message}`);
    }
  }
}

// Filter and sort jobs based on search input, filter, and sort selection
function filterJobs() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filterValue = document.getElementById('filterType').value;
  const sortValue = document.getElementById('sortBy').value;
  
  // Start with all jobs
  let filteredJobs = [...jobData];
  
  // Apply search filter
  if (searchTerm) {
    filteredJobs = filteredJobs.filter(job => 
      (job.title && job.title.toLowerCase().includes(searchTerm)) ||
      (job.company && job.company.toLowerCase().includes(searchTerm)) ||
      (job.description && job.description.toLowerCase().includes(searchTerm)) ||
      (job.location && job.location.toLowerCase().includes(searchTerm)) ||
      (job.tags && job.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }
  
  // Apply type filter
  if (filterValue !== 'all') {
    filteredJobs = filteredJobs.filter(job => job.type === filterValue);
  }
  
  // Apply sorting
  switch (sortValue) {
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
  
  // Render the filtered and sorted jobs
  renderJobsList(filteredJobs);
}

// Render jobs list
function renderJobs() {
  // Apply current filters and sorting
  filterJobs();
}

// Render jobs to the DOM
function renderJobsList(jobs) {
  // Clear the job list
  const jobList = document.getElementById('jobList');
  jobList.innerHTML = '';
  
  // Check if there are no jobs
  if (jobs.length === 0) {
    jobList.innerHTML = '<div class="no-jobs">No jobs found. Add a new job to get started!</div>';
    return;
  }
  
  // Loop through jobs and create job cards
  jobs.forEach(job => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card animate-fade-in';
    jobCard.dataset.jobId = job.id;
    
    // Format date
    const createdDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown date';
    
    // Format deadline if exists
    const deadlineDate = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline';
    
    // Determine badge class based on job type
    const jobTypeValue = job.type ? job.type.toLowerCase() : 'default';
    const badgeClass = `job-type-${jobTypeValue.replace(/\s+/g, '-')}`;
    
    // Create job card HTML
    jobCard.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.title || 'Untitled Job'}</h3>
        <span class="job-type-badge ${badgeClass}">${job.type || 'Job Type'}</span>
      </div>
      <p class="job-company">${job.company || 'Company not specified'}</p>
      <div class="job-location">
        <i class="fas fa-map-marker-alt"></i>
        <span>${job.location || 'Location not specified'}</span>
      </div>
      <div class="job-deadline">
        <i class="fas fa-calendar-alt"></i>
        <span>Apply by: ${deadlineDate}</span>
      </div>
      <p class="job-description">${job.description || 'No description provided'}</p>
      <div class="job-tags">
        ${
          typeof job.tags === 'string' && job.tags.trim()
            ? job.tags.split(',').map(tag => `<span class="job-tag">${tag.trim()}</span>`).join('')
            : Array.isArray(job.tags) && job.tags.length > 0
              ? job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join('')
              : '<span class="no-tags">No tags</span>'
        }
      </div>
      <div class="job-footer">
        <span class="job-date">Added on ${createdDate}</span>
        <div class="job-actions">
          <button class="btn btn-icon btn-edit" onclick="editJob('${job.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-icon btn-delete" onclick="deleteJob('${job.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  
    
    // Add to job list
    jobList.appendChild(jobCard);
  });
  
  // Add click events to job cards AFTER they're all added
  addJobCardClickEvents();
}

function addJobCardClickEvents() {
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // Prevent click from edit/delete buttons
      if (e.target.closest('.job-actions') || e.target.closest('.btn')) return;

      const jobId = this.dataset.jobId;
      const job = jobData.find(j => j.id == jobId);
      if (!job) return;

      // Populate modal
      document.getElementById('modalJobTitle').textContent = job.title || '';
      document.getElementById('modalCompany').textContent = job.company || '';
      document.getElementById('modalLocation').textContent = job.location || '';
      document.getElementById('modalDeadline').textContent = job.deadline ? `Apply by: ${new Date(job.deadline).toLocaleDateString()}` : '';
      document.getElementById('modalDescription').textContent = job.description || '';

      const tagContainer = document.getElementById('modalTags');
      tagContainer.innerHTML = '';
      (Array.isArray(job.tags) ? job.tags : []).forEach(tag => {
        const span = document.createElement('span');
        span.className = 'job-tag';
        span.textContent = tag;
        tagContainer.appendChild(span);
      });

      // Show modal
      document.getElementById('jobModal').classList.remove('hidden');
    });
  });

  // Close on "X" click
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('jobModal').classList.add('hidden');
  });

  // Close when clicking outside modal content
  document.getElementById('jobModal').addEventListener('click', e => {
    if (e.target.id === 'jobModal') {
      document.getElementById('jobModal').classList.add('hidden');
    }
  });
}

// Edit a job
function editJob(id) {
  const jobToEdit = jobData.find(job => job.id == id);
  
  if (jobToEdit) {
    showJobForm(jobToEdit);
  } else {
    console.error(`Job with ID ${id} not found for editing`);
  }
}

// Make functions available globally
window.editJob = editJob;
window.deleteJob = deleteJob;