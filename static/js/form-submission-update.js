/**
 * Updated form submission handlers for bug reports and testimonials
 * These functions ensure all form submissions include CSRF protection
 */

// Bug report form handler
document.addEventListener('DOMContentLoaded', function() {
    // Only run this code if we're on the bug report page
    const bugReportForm = document.getElementById('bugReportForm');
    if (!bugReportForm) return;
    
    const thanksMessage = document.getElementById('thanksMessage');
    const submitButton = document.getElementById('submitButton');
    const backArrow = document.querySelector('.back-arrow');
    
    // Back button functionality
    if (backArrow) {
        backArrow.addEventListener('click', function(e) {
            e.preventDefault();
            history.back();
        });
    }
    
    // Get CSRF token
    function getCSRFToken() {
        const tokenElement = document.querySelector('meta[name="csrf-token"]');
        return tokenElement ? tokenElement.getAttribute('content') : '';
    }
    
    // Form submission handling
    bugReportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable the submit button to prevent multiple submissions
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
        
        // Add CSRF token to FormData
        const formData = new FormData(bugReportForm);
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            formData.append('csrf_token', csrfToken);
        }
        
        // Send the form data via fetch
        fetch(bugReportForm.action, {
            method: bugReportForm.method,
            body: formData,
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            // Show success message
            if (thanksMessage) {
                thanksMessage.style.display = 'block';
            }
            
            // Hide form fields
            Array.from(bugReportForm.elements).forEach(element => {
                if (element.className !== 'formspree-hidden' && element.id !== 'submitButton') {
                    if (element.closest('.form-group')) {
                        element.closest('.form-group').style.display = 'none';
                    }
                }
            });
            
            // Hide form rows and footer
            const formRows = document.querySelectorAll('.form-row');
            formRows.forEach(row => {
                row.style.display = 'none';
            });
            
            const formFooter = document.querySelector('.form-footer');
            if (formFooter) {
                formFooter.style.display = 'none';
            }
            
            // Reset form
            bugReportForm.reset();
            
            // Scroll to the success message
            if (thanksMessage) {
                thanksMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Report';
            }
            alert('There was a problem submitting your form. Please try again.');
        });
    });
});

// Testimonial form handler
document.addEventListener('DOMContentLoaded', function() {
    // Only run this code if we're on the testimonial form page
    const testimonialForm = document.getElementById('testimonialForm');
    if (!testimonialForm) return;
    
    const thanksMessage = document.getElementById('thanksMessage');
    const submitButton = document.getElementById('submitButton');
    const backArrow = document.querySelector('.back-arrow');
    const featureSelect = document.getElementById('feature');
    const otherFeatureGroup = document.getElementById('otherFeatureGroup');
    const otherFeatureInput = document.getElementById('otherFeature');
    
    // Back button functionality
    if (backArrow) {
        backArrow.addEventListener('click', function(e) {
            e.preventDefault();
            history.back();
        });
    }
    
    // Show/hide other feature input based on selection
    if (featureSelect && otherFeatureGroup && otherFeatureInput) {
        featureSelect.addEventListener('change', function() {
            if (this.value === 'other') {
                otherFeatureGroup.style.display = 'block';
                otherFeatureInput.setAttribute('required', 'required');
            } else {
                otherFeatureGroup.style.display = 'none';
                otherFeatureInput.removeAttribute('required');
            }
        });
    }
    
    // Get CSRF token
    function getCSRFToken() {
        const tokenElement = document.querySelector('meta[name="csrf-token"]');
        return tokenElement ? tokenElement.getAttribute('content') : '';
    }
    
    // Form submission handling
    testimonialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable the submit button to prevent multiple submissions
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
        
        // Add CSRF token to FormData
        const formData = new FormData(testimonialForm);
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            formData.append('csrf_token', csrfToken);
        }
        
        // Send the form data via fetch
        fetch(testimonialForm.action, {
            method: testimonialForm.method,
            body: formData,
            headers: {
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            // Show success message
            if (thanksMessage) {
                thanksMessage.style.display = 'block';
            }
            
            // Hide form fields
            Array.from(testimonialForm.elements).forEach(element => {
                if (element.className !== 'formspree-hidden' && element.id !== 'submitButton') {
                    if (element.closest('.form-group')) {
                        element.closest('.form-group').style.display = 'none';
                    }
                }
            });
            
            // Hide form rows and footer
            const formRows = document.querySelectorAll('.form-row');
            formRows.forEach(row => {
                row.style.display = 'none';
            });
            
            const formFooter = document.querySelector('.form-footer');
            if (formFooter) {
                formFooter.style.display = 'none';
            }
            
            // Reset form
            testimonialForm.reset();
            
            // Scroll to the success message
            if (thanksMessage) {
                thanksMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Testimonial';
            }
            alert('There was a problem submitting your form. Please try again.');
        });
    });
});