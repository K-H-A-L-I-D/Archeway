/**
 * input-validator.js - Client-side input validation and sanitization for Archeway
 * 
 * This module provides functions to validate and sanitize user input on the client side
 * before sending data to the server. While server-side validation is the primary defense,
 * client-side validation improves user experience and adds a first layer of protection.
 */

/**
 * Sanitize a string by encoding HTML entities
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(str) {
    if (!str) return '';
    
    // Create a temporary element
    const temp = document.createElement('div');
    // Set its textContent (not innerHTML) to escape HTML
    temp.textContent = str;
    // Return the escaped HTML as a string
    return temp.innerHTML;
  }
  
  /**
   * Validate an email address format
   * @param {string} email - The email to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateEmail(email) {
    if (!email) return false;
    
    // Basic email validation regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  
  /**
   * Validate a password meets minimum requirements
   * @param {string} password - The password to validate
   * @returns {object} - Contains isValid flag and any error messages
   */
  function validatePassword(password) {
    const result = {
      isValid: true,
      message: ''
    };
    
    if (!password) {
      result.isValid = false;
      result.message = 'Password is required';
      return result;
    }
    
    if (password.length < 8) {
      result.isValid = false;
      result.message = 'Password must be at least 8 characters long';
      return result;
    }
    
    // Check for common passwords (optional - can be expanded)
    const commonPasswords = ['password', '12345678', 'qwerty123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      result.isValid = false;
      result.message = 'Please choose a stronger password';
      return result;
    }
    
    return result;
  }
  
  /**
   * Validate a URL format
   * @param {string} url - The URL to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function validateUrl(url) {
    if (!url) return false;
    
    // Allow relative URLs as well
    if (url.startsWith('/')) return true;
    
    // Basic URL validation regex for absolute URLs
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  }
  
  /**
   * Sanitize and validate form input
   * @param {HTMLFormElement} form - The form element to validate
   * @returns {object} - Contains isValid flag, sanitized data, and any error messages
   */
  function validateForm(form) {
    const result = {
      isValid: true,
      data: {},
      errors: {}
    };
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.name;
      let value = input.value.trim();
      
      // Skip submit buttons, reset buttons, etc.
      if (input.type === 'submit' || input.type === 'reset' || input.type === 'button') {
        return;
      }
      
      // Skip inputs without a name attribute
      if (!name) return;
      
      // Validate by input type
      switch (input.type) {
        case 'email':
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'Email is required';
          } else if (value && !validateEmail(value)) {
            result.isValid = false;
            result.errors[name] = 'Please enter a valid email address';
          } else {
            // For emails, just trim and lowercase, no HTML escaping needed
            result.data[name] = value.toLowerCase();
          }
          break;
          
        case 'password':
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'Password is required';
          } else if (value) {
            const passwordCheck = validatePassword(value);
            if (!passwordCheck.isValid) {
              result.isValid = false;
              result.errors[name] = passwordCheck.message;
            } else {
              // For passwords, don't escape HTML - just use as is
              result.data[name] = value;
            }
          }
          break;
          
        case 'url':
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'URL is required';
          } else if (value && !validateUrl(value)) {
            result.isValid = false;
            result.errors[name] = 'Please enter a valid URL';
          } else {
            result.data[name] = value;
          }
          break;
          
        case 'date':
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'Date is required';
          } else {
            result.data[name] = value;
          }
          break;
          
        case 'checkbox':
          result.data[name] = input.checked;
          break;
          
        case 'radio':
          if (input.checked) {
            result.data[name] = value;
          }
          break;
          
        case 'textarea':
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'This field is required';
          } else {
            // For textareas, determine if HTML is allowed
            const allowHtml = input.dataset.allowHtml === 'true';
            result.data[name] = allowHtml ? value : sanitizeString(value);
          }
          break;
          
        default:
          // For all other inputs (text, number, etc.)
          if (input.required && !value) {
            result.isValid = false;
            result.errors[name] = 'This field is required';
          } else {
            // Sanitize the input value by default
            result.data[name] = sanitizeString(value);
          }
      }
    });
    
    // Handle select elements
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
      const name = select.name;
      const value = select.value;
      
      if (!name) return;
      
      if (select.required && (!value || value === '')) {
        result.isValid = false;
        result.errors[name] = 'Please select an option';
      } else {
        result.data[name] = value;
      }
    });
    
    return result;
  }
  
  /**
   * Display validation errors in a form
   * @param {HTMLFormElement} form - The form element
   * @param {object} errors - Object with field names as keys and error messages as values
   */
  function displayErrors(form, errors) {
    // Clear previous errors
    const errorElements = form.querySelectorAll('.input-error');
    errorElements.forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
    
    // Display new errors
    for (const [field, message] of Object.entries(errors)) {
      const input = form.elements[field];
      if (!input) continue;
      
      // Add error classes to the input
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      
      // Find or create error message element
      let errorElement = input.parentElement.querySelector('.input-error');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        input.parentElement.appendChild(errorElement);
      }
      
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  /**
   * Sanitize job application data before sending to server
   * @param {object} jobData - The job application data to sanitize
   * @returns {object} - Sanitized job data
   */
  function sanitizeJobData(jobData) {
    const sanitized = {};
    
    // List of fields that allow HTML
    const htmlFields = ['description'];
    
    for (const [key, value] of Object.entries(jobData)) {
      if (typeof value === 'string') {
        // Allow HTML in specific fields
        if (htmlFields.includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeString(value);
        }
      } else if (Array.isArray(value)) {
        // For arrays (like tags), sanitize each element
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else {
        // For other types (numbers, booleans, etc.), keep as is
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize search query
   * @param {string} query - The search query to sanitize
   * @returns {string} - Sanitized search query
   */
  function sanitizeSearchQuery(query) {
    if (!query) return '';
    
    // Basic search query sanitization
    return sanitizeString(query.trim());
  }
  
  /**
   * Setup form validation for a specific form
   * @param {string} formId - The ID of the form element
   * @param {function} submitCallback - Callback function to handle form submission
   */
  function setupFormValidation(formId, submitCallback) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate and sanitize form data
      const result = validateForm(form);
      
      if (!result.isValid) {
        displayErrors(form, result.errors);
        return;
      }
      
      // Clear any existing errors
      const errorElements = form.querySelectorAll('.input-error');
      errorElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Call the submit callback with sanitized data
      submitCallback(result.data);
    });
    
    // Add input event listeners to clear errors when user types
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', function() {
        this.classList.remove('is-invalid');
        
        const errorElement = this.parentElement.querySelector('.input-error');
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      });
    });
  }