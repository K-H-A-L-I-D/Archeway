/**
 * Common form validation and CSRF utilities
 * This file contains shared functions for form validation and CSRF handling
 */

/**
 * Get CSRF token from meta tag
 * @returns {string} The CSRF token
 */
function getCSRFToken() {
    const tokenElement = document.querySelector('meta[name="csrf-token"]');
    if (!tokenElement) {
      console.error('CSRF token meta tag not found in the document');
      return '';
    }
    return tokenElement.getAttribute('content');
  }
  
  /**
   * Add CSRF token to fetch options
   * @param {Object} options - The fetch options object
   * @returns {Object} Updated fetch options with CSRF token
   */
  function addCSRFToFetchOptions(options = {}) {
    const token = getCSRFToken();
    
    if (!token) {
      return options;
    }
    
    // Create headers if they don't exist
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add the CSRF token to headers
    options.headers['X-CSRFToken'] = token;
    
    return options;
  }
  
  /**
   * Perform a fetch request with CSRF token
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} The fetch promise
   */
  async function fetchWithCSRF(url, options = {}) {
    const optionsWithCSRF = addCSRFToFetchOptions(options);
    return fetch(url, optionsWithCSRF);
  }
  
  /**
   * Handle form submission with CSRF token
   * @param {string} url - The URL to submit to
   * @param {Object} data - The data to submit
   * @param {string} method - The HTTP method (default: 'POST')
   * @returns {Promise} The fetch promise
   */
  async function submitFormWithCSRF(url, data, method = 'POST') {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify(data)
    };
    
    return fetch(url, options);
  }
  
  /**
   * Validate an email format
   * @param {string} email - The email to validate
   * @returns {boolean} Whether the email is valid
   */
  function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }
  
  /**
   * Validate password strength
   * @param {string} password - The password to validate
   * @returns {object} Validation result with isValid and message
   */
  function validatePasswordStrength(password) {
    const result = {
      isValid: true,
      message: ''
    };
    
    if (!password || password.length < 8) {
      result.isValid = false;
      result.message = 'Password must be at least 8 characters long';
      return result;
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must contain at least one uppercase letter';
      return result;
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must contain at least one lowercase letter';
      return result;
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
      result.isValid = false;
      result.message = 'Password must contain at least one number';
      return result;
    }
    
    return result;
  }
  
  /**
   * Show form validation error
   * @param {HTMLElement} inputElement - The input element
   * @param {string} message - The error message
   */
  function showValidationError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    inputElement.classList.remove('is-valid');
    
    // Find or create error message element
    let errorElement = inputElement.parentElement.querySelector('.input-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'input-error';
      inputElement.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  /**
   * Set input as valid
   * @param {HTMLElement} inputElement - The input element
   */
  function setInputValid(inputElement) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
    
    // Hide error message if it exists
    const errorElement = inputElement.parentElement.querySelector('.input-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * Reset form validation state
   * @param {HTMLFormElement} form - The form element
   */
  function resetFormValidation(form) {
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.classList.remove('is-invalid', 'is-valid');
      
      const errorElement = input.parentElement.querySelector('.input-error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    });
  }