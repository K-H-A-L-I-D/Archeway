// Check if dark mode is saved in localStorage and update accordingly
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'enabled') {
      document.body.classList.add('dark-mode');
      updateLogoForTheme();
    }
    
    // Add event listener for password toggle
    document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);
  });
  
  function updateLogoForTheme() {
    const logo = document.getElementById('signinLogo');
    const isDarkMode = document.body.classList.contains('dark-mode');
    logo.src = isDarkMode ? '/static/img/logo-dark.png' : '/static/img/logo-light.png';
  }
  
  // Password visibility toggle
  function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const visibilityIcon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      visibilityIcon.classList.remove('fa-eye');
      visibilityIcon.classList.add('fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      visibilityIcon.classList.remove('fa-eye-slash');
      visibilityIcon.classList.add('fa-eye');
    }
  }