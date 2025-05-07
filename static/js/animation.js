// Animation sequence
document.addEventListener('DOMContentLoaded', function() {
    // Position settings for each job card - much wider spread
    const positions = {
      job1: { x: -350, y: 0 },      // Software Developer - far left middle
      job2: { x: -120, y: -180 },   // UX Designer - top left
      job3: { x: 0, y: 220 },       // Data Analyst - bottom middle
      job4: { x: 120, y: -180 },    // Business Analyst - top right
      job5: { x: 350, y: 0 },       // Marketing Intern - far right middle
      job6: { x: 280, y: 140 },     // Product Manager - right bottom
      job7: { x: 160, y: 180 },     // Research Assistant - bottom right
      job8: { x: -160, y: 180 },    // Finance Intern - bottom left
      job9: { x: -280, y: 140 },    // Customer Success - left bottom
      job10: { x: 0, y: -220 }      // UI Designer - top middle
    };
    
    // Show job cards with delay and start moving them immediately
    setTimeout(function() {
      document.querySelectorAll('.job-card').forEach(function(card, index) {
        setTimeout(function() {
          // Set final position in data attribute
          const pos = positions[card.id];
          card.style.transitionDelay = "0s"; // Ensure no delay on the transform
          
          // Make card visible and start moving it immediately
          card.style.opacity = '1';
          card.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`;
        }, index * 200);
      });
    }, 1000);
    
    // Reveal brand name
    setTimeout(function () {
      const brandReveal = document.getElementById('brand-reveal');
      brandReveal.classList.add('fade-cycle');
    }, 3500);
    
    // Start the fade out animation for all elements
    setTimeout(function() {
      // Fade out job cards
      document.querySelectorAll('.job-card').forEach(card => {
        card.classList.add('fade-out');
      });
      
      // Fade out archway
      document.querySelector('.archway').classList.add('fade-out');
    }, 7000);
    
    // Complete animation and show main content
    setTimeout(function() {
      document.getElementById('animation-container').style.display = 'none';
      document.getElementById('main-content').classList.remove('hidden');
    }, 8600);
  });