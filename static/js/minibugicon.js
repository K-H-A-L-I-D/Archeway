// minibugicon.js - Small floating bug icon for bug reports
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mini bug icon script loaded');
    
    // If current page is the bank research page, don't show icon
    if (window.location.pathname.includes('/projects/bank_failure_extended.html')) {
        console.log('On bank research page, not showing mini bug icon');
        return;
    }
    
    // Check if icon already exists and remove it
    const existingIcon = document.getElementById('mini-bug-icon');
    if (existingIcon) {
        existingIcon.remove();
    }
    
    // Create mini bug icon
    const miniBugIcon = document.createElement('div');
    miniBugIcon.id = 'mini-bug-icon';
    miniBugIcon.style.position = 'fixed';
    miniBugIcon.style.bottom = '20px';
    miniBugIcon.style.right = '20px';
    miniBugIcon.style.background = 'linear-gradient(135deg, #2563eb, #1e40af)';
    miniBugIcon.style.color = 'white';
    miniBugIcon.style.width = '40px';
    miniBugIcon.style.height = '40px';
    miniBugIcon.style.display = 'flex';
    miniBugIcon.style.alignItems = 'center';
    miniBugIcon.style.justifyContent = 'center';
    miniBugIcon.style.borderRadius = '50%';
    miniBugIcon.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    miniBugIcon.style.zIndex = '9999';
    miniBugIcon.style.cursor = 'pointer';
    miniBugIcon.style.display = 'none'; // Initially hidden
    miniBugIcon.style.transition = 'transform 0.3s ease-in-out';
    
    // Improved bug icon centering
    miniBugIcon.innerHTML = `<i class="fas fa-bug" style="font-size: 1.2rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; margin: 0; padding: 0;"></i>`;
    miniBugIcon.title = "Report a bug";
    
    document.body.appendChild(miniBugIcon);
    
    // Check if the notification is visible before showing the mini icon
    function checkAndShowMiniIcon() {
        const notification = document.getElementById('bug-notification');
        
        // Only show mini icon if notification doesn't exist or is hidden
        if (!notification || 
            notification.style.display === 'none' || 
            notification.style.transform === 'translateY(150%)') {
            
            showMiniIcon();
        }
    }
    
    // Function to display the mini icon with animation
    function showMiniIcon() {
        // Show mini bug icon
        miniBugIcon.style.display = 'flex';
        // Add a small animation to draw attention
        setTimeout(() => {
            miniBugIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                miniBugIcon.style.transform = 'scale(1)';
            }, 300);
        }, 50);
    }
    
    // Listen for the notification closed event
    document.addEventListener('bugNotificationClosed', function() {
        console.log('Bug notification closed event received');
        checkAndShowMiniIcon();
    });
    
    // Make mini bug icon clickable to open bug report page in a new tab
    miniBugIcon.addEventListener('click', function() {
        // Open the bug report page in a new tab
        window.open("/bugreport", "_blank", "noopener,noreferrer");
    });
    
    // Add hover effect to mini bug icon
    miniBugIcon.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    miniBugIcon.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Check if the notification exists after a delay
    // This ensures the icon only shows when no notification is present
    setTimeout(() => {
        checkAndShowMiniIcon();
    }, 1500); // Wait a bit longer than the notification appears (1000ms)
    
    // Debug: Add a method to manually toggle the mini icon
    window.toggleMiniBugIcon = function() {
        if (miniBugIcon.style.display === 'none') {
            showMiniIcon();
            console.log('Manually showed mini bug icon');
        } else {
            miniBugIcon.style.display = 'none';
            console.log('Manually hid mini bug icon');
        }
    };
});