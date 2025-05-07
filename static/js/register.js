// characters enclosed in / / are regular expressions
// ^ means start of the string
// $ means end of the string
// [a-zA-Z0-9] means any alphanumeric character
// {1,} means at least 1 character
const NAME_PATTERN = /^[a-zA-Z0-9]{1,}$/;

// Password validation
// \x21-\x7E is a range of ASCII characters from ! to ~s
// you can find a list of ascii characters at https://ss64.com/ascii.html
const PASSWORD_PATTERN = /^[\x21-\x7E]{8,}$/;

// Helper function to get CSRF token
function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

// Helper function to add bootstrap's is-valid class to our element, and remove the is-invalid class.
const setValid = (input) => {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
};

// Helper functions to set error and valid states
const setError = (input, message) => {
  input.classList.add("is-invalid");
  input.classList.remove("is-valid");
  const feedback = input.parentElement.querySelector(".invalid-feedback");
  if (feedback) {
    feedback.textContent = message;
  }
};

async function validateEmail(id) {
  const email = document.getElementById(id);
  const value = email.value.trim();

  // Format check first
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(value)) {
    setError(email, "Please enter a valid email address.");
    return false;
  }

  // Duplication check via API
  const response = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`, {
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  });
  const result = await response.json();

  if (!response.ok || result.exists) {
    setError(email, "An account with this email already exists.");
    return false;
  }

  setValid(email);
  return true;
}

function validatePassword(id) {
  const password = document.getElementById(id);
  // this syntax below is for regular expressions

  // Here, we are checking if the password matches the regular expression
  // this is done via the `test` method
  // We use the `.value` property to get the value of the input element, that is, the
  // text entered by the user.
  if (!PASSWORD_PATTERN.test(password.value)) {
    setError(
      password,
      "Password must be at least 8 characters with no spaces.",
    );
    return false;
  }

  setValid(password);
  return true;
}

// Name validation to handle firstName and lastName fields
function validateNames(ids) {
  let isValid = true;

  ids.forEach((id) => {
    const name = document.getElementById(id);

    if (!NAME_PATTERN.test(name.value)) {
      setError(
        name,
        "Name fields must be alphanumeric and at least 1 character long.",
      );
      isValid = false;
    } else {
      setValid(name);
    }
  });

  return isValid;
}

async function registerCallback(response) {
  const result = await response.json();

  if (!response.ok) {
    // Check if it's a known email error
    if (result.message.toLowerCase().includes("email")) {
      setError(document.getElementById("email"), result.message);
    } else if (result.message.toLowerCase().includes("password")) {
      setError(document.getElementById("password"), result.message);
    } else {
      alert("Registration failed: " + result.message);
    }
    return;
  }

  alert("Registration successful! Redirecting...");
  window.location.href = "/signin";
}

// We validate the register form here
function validateRegisterForm(event) {
  event.preventDefault(); // Prevent default form submission

  let isValid = true; // Initialize isValid to true

  // Validate email
  const validEmail = validateEmail("email");
  if (!validEmail) isValid = false;

  // Validate password
  const validPassword = validatePassword("password");
  if (!validPassword) isValid = false;

  // Validate firstName and lastName
  const validNames = validateNames(["firstName", "lastName"]);
  if (!validNames) isValid = false;

  // Check if passwords match
  const passwordValue = document.getElementById("password").value;
  const confirmPasswordValue = document.getElementById("confirmPassword").value;
  if (passwordValue !== confirmPasswordValue) {
    setError(document.getElementById("confirmPassword"), "Passwords do not match");
    isValid = false;
  }

  // If any validation fails, prevent form submission
  if (!isValid) {
    return false;
  }

  // Collect form data
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const passwordElement = document.getElementById("password");
  const email = document.getElementById("email");

  const formData = {
    firstName: firstName.value,
    lastName: lastName.value,
    password: passwordElement.value,
    email: email.value,
  };

  // Get CSRF token from meta tag
  const csrfToken = getCSRFToken();

  // Updated fetch request to include the CSRF token
  const request = {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    },
    body: JSON.stringify(formData),
  };

  // Fetch API call
  fetch("/api/register", request)
    .then(registerCallback)
    .catch(() => alert("An error occurred. Please try again."));
}

// This onReady ensures that the DOM is loaded before the event listeners are attached
// Which is necessary in the rare case that our script is loaded before the DOM is fully loaded
// This is a good practice to follow when writing JavaScript code.
// If the readyState is not loading, then we can just add our callback anyway.
function onReady(callback) {
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", callback)
    : callback();
}

function clearValidation(event) {
  event.target.classList.remove("is-invalid", "is-valid");
}

function clearForm(id) {
  const form = document.getElementById(id);
  if (form) {
    // reset the form to clear all input elements
    form.reset();
    // We also need to remove the bootstrap classes that indicate validation state
    form.classList.remove("was-validated");
    // for loop, iterate over all children of the form
    for (const input of form.querySelectorAll(".form-control")) {
      // Remove the classes that indicate validation state
      input.classList.remove("is-invalid", "is-valid");
    }
  }
}

// Password visibility toggle function
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const visibilityIcon = document.querySelector(`#${inputId} + .toggle-password i, #${inputId} ~ .toggle-password i`);
  
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

// Update logo based on theme
function updateLogoForTheme() {
  const logo = document.getElementById('registerLogo');
  const isDarkMode = document.body.classList.contains('dark-mode');
  logo.src = isDarkMode ? '/static/img/logo-dark.png' : '/static/img/logo-light.png';
}

// This function adds event listeners to each element
function attachEventListeners() {
  // First, we get the form element
  const registerForm = document.getElementById("registerForm");
  // We add an event listener to the form element
  // `?` is javascript's null coalescing. It does nothing if the value is null or undefined
  registerForm?.addEventListener("submit", validateRegisterForm);
  
  // We add event listeners to each input element so that when they are changed, the validation classes are removed
  for (const input of document.querySelectorAll("input")) {
    input.addEventListener("input", clearValidation);
  }
  
  // We add an event listener to the modal so that when it is hidden, the form is cleared
  // This hidden.bs.modal class is added by bootstrap when the modal is hidden
  const registerModal = document.getElementById("registerModal");
  registerModal?.addEventListener("hidden.bs.modal", clearForm);
  
  // Add event listeners for password toggles
  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      togglePasswordVisibility('password');
    });
  }
  
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', function() {
      togglePasswordVisibility('confirmPassword');
    });
  }
  
  // Check dark mode settings
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    updateLogoForTheme();
  }
}

// The only top-level code in this file is the call to onReady.
// this will handle all of the logic we defined above.
onReady(attachEventListeners);