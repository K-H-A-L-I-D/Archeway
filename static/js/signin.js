// Authentication-related JavaScript for sign-in page

document.addEventListener('DOMContentLoaded', function() {
  // Check if dark mode is saved in localStorage
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
  }

  // Get CSRF token from meta tag
  function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
  }

  // Handle form submission
  const signinForm = document.querySelector('form');
  if (signinForm) {
    signinForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Prepare login data
      const loginData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      };
      
      try {
        // Send login request with CSRF token
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
          },
          body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store user info in localStorage for persistent login
          localStorage.setItem('userId', data.userId);
          localStorage.setItem('displayName', data.displayName);
          
          // Remember me functionality
          if (document.getElementById('remember') && document.getElementById('remember').checked) {
            localStorage.setItem('rememberedEmail', loginData.email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          
          // Redirect to dashboard on success
          window.location.href = '/dashboard';
        } else {
          // Show error message
          const errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent = data.message || 'Login failed';
          
          // Remove any existing error messages
          const existingError = document.querySelector('.error-message');
          if (existingError) {
            existingError.remove();
          }
          
          // Insert error message at the top of the form
          signinForm.insertBefore(errorElement, signinForm.firstChild);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
      }
    });
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