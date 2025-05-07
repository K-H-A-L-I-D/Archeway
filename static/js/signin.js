// Authentication-related JavaScript for sign-in page
console.log("signin.js loaded");

document.addEventListener('DOMContentLoaded', function() {
  // Check if dark mode is saved in localStorage
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    updateLogoForTheme();
  }
  
  // Add event listener for password toggle
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', togglePasswordVisibility);
  }

  // Fill in remembered email if available
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail && document.getElementById('email')) {
    document.getElementById('email').value = rememberedEmail;
    if (document.getElementById('remember')) {
      document.getElementById('remember').checked = true;
    }
  }
});

// Handle password visibility toggle
function togglePasswordVisibility() {
  console.log("Toggle password clicked");
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

function updateLogoForTheme() {
  const logo = document.getElementById('signinLogo');
  const isDarkMode = document.body.classList.contains('dark-mode');
  logo.src = isDarkMode ? '/static/img/logo-dark.png' : '/static/img/logo-light.png';
}