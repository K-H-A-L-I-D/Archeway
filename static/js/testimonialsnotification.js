// testimonialsnotification.js - Notification script to urge users to make a testimonial
document.addEventListener('DOMContentLoaded', function() {
    console.log('CCSC notification script loaded');
    
    // If current page is the bank research page, don't show notification
    if (window.location.pathname.includes('/projects/bank_failure_extended.html')) {
        console.log('On bank research page, not showing notification');
        return; // Don't show notification on the bank page itself
    }
    
    // Check if notification already exists and remove it
    const existingNotification = document.getElementById('ccsc-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'ccsc-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.background = 'linear-gradient(135deg, #2563eb, #1e40af)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '10px';
    notification.style.boxShadow = '0 5px 15px rgba(232, 106, 51, 0.3)';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '350px';
    notification.style.transform = 'translateY(150%)'; // Start hidden
    notification.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    notification.style.display = 'none'; // Initially hidden
    
    notification.innerHTML = `
      <div style="display: flex; flex-direction: column; position: relative; padding-right: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <i class="fas fa-comment" style="font-size: 1.5rem; margin-right: 15px; color: #FFFFFF;"></i>
          <p style="margin: 0; font-size: 0.95rem; line-height: 1.4;">
            <strong>Share Your Experience!</strong>
          </p>
        </div>
        <p style="margin: 0; font-size: 0.95rem; line-height: 1.4;">
          We'd love to feature your on our website! Click <a href="/projects/bank_failure_extended.html" style="color: white; font-weight: bold; text-decoration: underline;">here</a> to submit your testimonial!
        </p>
        <button id="close-ccsc-notification" style="position: absolute; top: 0; right: 0; background: transparent; border: none; color: white; cursor: pointer; padding: 8px; font-size: 1rem; opacity: 1; margin: 0;">
          ✖
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Function to check and adjust position relative to other notifications
    function adjustNotificationPosition() {
        // Check for other project notification
        const otherNotification = document.getElementById('project-notification');
        
        if (otherNotification && 
            otherNotification.style.display !== 'none' && 
            otherNotification.style.transform !== 'translateY(150%)') {
            
            // Get the height and margin of the other notification
            const otherHeight = otherNotification.offsetHeight;
            const margin = 10; // Space between notifications
            
            // Position this notification above the other one
            notification.style.bottom = `${otherHeight + margin + 20}px`; // 20px is the original bottom position
            console.log('Positioned CCSC notification above project notification');
        } else {
            // Reset to default position
            notification.style.bottom = '20px';
        }
    }
    
    // Make notification visible and animate in after a slight delay
    setTimeout(() => {
        adjustNotificationPosition();
        notification.style.display = 'block';
        // Need a small delay to ensure display:block is applied before transform
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 50);
    }, 1000); // Show after 1 second for better user experience
    
    // Close button - Immediately clickable
    document.getElementById('close-ccsc-notification').addEventListener('click', function() {
        notification.style.transform = 'translateY(150%)';
        // Hide completely after transition
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    });
    
    // Auto-hide after 2 minutes (120000ms)
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateY(150%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.style.display = 'none';
                }
            }, 500);
        }
    }, 120000);
    
    // Periodically check and adjust position (in case other notifications appear/disappear)
    const positionInterval = setInterval(() => {
        if (document.body.contains(notification) && 
            notification.style.display !== 'none' && 
            notification.style.transform !== 'translateY(150%)') {
            adjustNotificationPosition();
        } else {
            clearInterval(positionInterval);
        }
    }, 1000);
    
    // Debug: Add a method to manually trigger the notification
    window.showCCSCNotification = function() {
        // Show notification
        adjustNotificationPosition();
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 50);
        console.log('Manually triggered CCSC notification');
    };
});