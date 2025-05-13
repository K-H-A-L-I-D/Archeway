document.addEventListener('DOMContentLoaded', function() {
  // Fix sidebar navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-item a');
  
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent default navigation
      
      // Extract view from URL
      const url = new URL(this.href);
      const viewParam = url.searchParams.get('view');
      
      if (viewParam) {
        // Switch to the view without page reload
        switchView(viewParam);
        
        // Update URL without reloading
        history.pushState({view: viewParam}, '', `?view=${viewParam}`);
        
        // Highlight active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        this.closest('.nav-item').classList.add('active');
      } else {
        // If no view parameter, just go to the dashboard
        switchView('dashboard');
        history.pushState({view: 'dashboard'}, '', '?view=dashboard');
      }
    });
  });
  
  // Handle browser back/forward navigation
  window.addEventListener('popstate', function(e) {
    const viewParam = e.state?.view || 'dashboard';
    switchView(viewParam);
  });
  
  // Make dark mode toggle more reliable
  const darkModeToggle = document.getElementById('toggleDarkMode');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function(e) {
      // Toggle dark mode class on body
      document.body.classList.toggle('dark-mode');
      
      // Update logo
      const logo = document.getElementById('sidebarLogo');
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        if (logo) logo.src = '/static/img/logo-light.png';
      } else {
        localStorage.setItem('darkMode', 'disabled');
        if (logo) logo.src = '/static/img/logo-dark.png';
      }
      
      // Refresh any charts if they exist
      if (typeof refreshAnalyticsCharts === 'function') {
        refreshAnalyticsCharts();
      }
      
      // Prevent the event from propagating
      e.stopPropagation();
    });
  }
  
  // Initialize dark mode based on user preference
  const darkModeStored = localStorage.getItem('darkMode');
  if (darkModeStored === 'enabled') {
    document.body.classList.add('dark-mode');
    const logo = document.getElementById('sidebarLogo');
    if (logo) logo.src = '/static/img/logo-light.png';
  }
  
  // Get initial view from URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view') || 'dashboard';
  
  // Set initial view
  switchView(viewParam);
  
  // Highlight active nav item
  const activeLink = document.querySelector(`.nav-item a[href*="${viewParam}"]`);
  if (activeLink) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    activeLink.closest('.nav-item').classList.add('active');
  }
});