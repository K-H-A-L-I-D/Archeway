// Function to initialize Google Sign-In
function initGoogleAuth() {
  // Load the Google Identity Services script dynamically
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = configureGoogleSignIn;
  document.head.appendChild(script);
}

// Configure Google Sign-In
function configureGoogleSignIn() {
  // Check if Google Identity Services library is loaded
  if (typeof google !== 'undefined' && google.accounts) {
    // Initialize Google Sign-In button
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual client ID
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    
    // Render the button
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large', width: 240 }
    );
  } else {
    console.error('Google Identity Services not loaded');
  }
}

// Handle the sign-in response
function handleCredentialResponse(response) {
  // Send the ID token to your backend
  fetch('/verify-google-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      credential: response.credential
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Redirect to dashboard or appropriate page
      window.location.href = '/dashboard';
    } else {
      console.error('Authentication failed');
    }
  })
  .catch(error => {
    console.error('Error during authentication:', error);
  });
}

// Initialize when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
  initGoogleAuth();
}