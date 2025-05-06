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
    
    // Get company logo URL (if exists) or use function to generate one
    const logoUrl = job.logo || fetchCompanyLogo(job.company || '');
    
    // Create job card HTML with logo
    jobCard.innerHTML = `
      <div class="job-logo">
        <img src="${logoUrl}" alt="${job.company || 'Company'} Logo" class="company-logo" onerror="this.src='/static/img/default-company-logo.png'">
      </div>
      <div class="job-info">
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
      </div>
    `;
    
    // Add to job list
    jobList.appendChild(jobCard);
  });
  
  // Add click events to job cards AFTER they're all added
  addJobCardClickEvents();


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

// Function to fetch company logo using Logo.dev API 
async function fetchCompanyLogo(companyName) {
  try {
    // Basic company name to domain conversion (can be improved)
    let domain = companyName.toLowerCase()
      .replace(/\s+inc\.?$|\s+corporation$|\s+corp\.?$|\s+llc$|\s+co\.?$|\s+group$|\s+&\s+co\.?$/i, '')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    // Add .com if no TLD is present
    if (!domain.includes('.')) {
      domain += '.com';
    }
    
    // Use your Logo.dev token
    const logoUrl = `https://img.logo.dev/${domain}?token=pk_blG_J2WmSL61BlO0Co0lFQ`;
    
    // For more robust implementation, you could check if the logo exists first
    return logoUrl;
  } catch (error) {
    console.error('Error formatting company domain:', error);
    return '/static/img/default-company-logo.png'; // Fallback to default logo
  }
}

// Add this to your existing code that handles job form submission
document.getElementById('submitJobBtn').addEventListener('click', async function() {
  const jobTitle = document.getElementById('jobTitle').value;
  const jobCompany = document.getElementById('jobCompany').value;
  // ... other form fields
  
  // Store all job data
  const jobData = {
    title: jobTitle,
    company: jobCompany,
    type: document.getElementById('jobType').value,
    location: document.getElementById('jobLocation').value,
    deadline: document.getElementById('jobDeadline').value,
    description: document.getElementById('jobDesc').value,
    tags: document.getElementById('jobTags').value.split(',').map(tag => tag.trim()),
    logo: '', // Will be populated
    dateAdded: new Date().toISOString()
  };
  
  // Fetch company logo if company name is provided
  if (jobCompany) {
    jobData.logo = await fetchCompanyLogo(jobCompany);
  } else {
    jobData.logo = '/static/img/default-company-logo.png';
  }
  
  // Add the job to your storage (localStorage example)
  saveJob(jobData);
  
  // Update the UI
  displayJobs();
  
  // Hide the form
  document.getElementById('jobForm').classList.add('hidden');
});

// Function to save job to localStorage
function saveJob(jobData) {
  const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
  
  // Generate a unique ID for the job
  jobData.id = Date.now().toString();
  
  jobs.push(jobData);
  localStorage.setItem('jobs', JSON.stringify(jobs));
}

// Function to display jobs
function displayJobs() {
  const jobList = document.getElementById('jobList');
  jobList.innerHTML = '';
  
  const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
  
  // Apply current filters and sorting
  const filteredJobs = applyFiltersAndSorting(jobs);
  
  filteredJobs.forEach(job => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.id = job.id;
    
    // Create tags HTML
    const tagsHtml = job.tags && job.tags.length > 0 
      ? `<div class="job-tags">${job.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
      : '';
    
    // Add the company logo and job details
    jobCard.innerHTML = `
      <div class="job-logo">
        <img src="${job.logo}" alt="${job.company} Logo" class="company-logo" onerror="this.src='/static/img/default-company-logo.png'">
      </div>
      <div class="job-info">
        <h3 class="job-title">${job.title}</h3>
        <p class="job-company">${job.company}</p>
        <p class="job-location">${job.location || 'No location specified'}</p>
        ${tagsHtml}
        <div class="job-actions">
          <button class="btn btn-sm btn-edit" data-id="${job.id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-delete" data-id="${job.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    
    // Add event listener to open the job modal
    jobCard.addEventListener('click', function(e) {
      // Don't open modal if clicking on buttons
      if (e.target.closest('.job-actions')) return;
      
      openJobModal(job);
    });
    
    jobList.appendChild(jobCard);
  });
  
  // Add event listeners to edit/delete buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const jobId = btn.dataset.id;
      editJob(jobId);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const jobId = btn.dataset.id;
      deleteJob(jobId);
    });
  });
}

// Function to apply current filters and sorting
function applyFiltersAndSorting(jobs) {
  // Get current filter and sort values
  const filterType = document.getElementById('filterType').value;
  const sortBy = document.getElementById('sortBy').value;
  const searchText = document.getElementById('searchInput').value.toLowerCase();
  
  // Filter jobs
  let filteredJobs = jobs.filter(job => {
    // Filter by type
    if (filterType !== 'all' && job.type !== filterType) {
      return false;
    }
    
    // Filter by search text
    if (searchText && !(
      job.title.toLowerCase().includes(searchText) ||
      job.company.toLowerCase().includes(searchText) ||
      job.description.toLowerCase().includes(searchText) ||
      (job.tags && job.tags.some(tag => tag.toLowerCase().includes(searchText)))
    )) {
      return false;
    }
    
    return true;
  });
  
  // Sort jobs
  filteredJobs.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'oldest':
        return new Date(a.dateAdded) - new Date(b.dateAdded);
      case 'deadline':
        // Handle null deadlines (put them at the end)
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'company':
        return a.company.localeCompare(b.company);
      default:
        return 0;
    }
  });
  
  return filteredJobs;
}

// Make functions available globally
window.editJob = editJob;
window.deleteJob = deleteJob;