// Particle Network Animation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Particle network script initialized');
    
    // Create canvas if it doesn't exist
    let canvas = document.getElementById('particle-network');
    if (!canvas) {
      console.log('Canvas not found, creating one');
      canvas = document.createElement('canvas');
      canvas.id = 'particle-network';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '-1';
      canvas.style.pointerEvents = 'none';
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    
    initParticleNetwork(canvas);
  });
  
  function initParticleNetwork(canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let animationFrameId;
    
    // Particle properties - adjusted for visibility
    const particleCount = 100;
    const particleColor = 'rgba(77, 180, 250, 0.8)'; // Increased opacity
    const lineColor = 'rgba(151, 71, 255, 0.3)'; // Increased opacity
    const particleRadius = 2; // Slightly larger
    const particleSpeed = 0.3;
    const lineWidth = 0.8; // Slightly thicker
    const interactionRadius = 150;
    const maxConnectionDistance = 150;
    
    // Mouse tracking
    let mouse = {
      x: null,
      y: null,
      radius: interactionRadius
    };
    
    // Handle mouse movement
    window.addEventListener('mousemove', function(event) {
      mouse.x = event.x;
      mouse.y = event.y;
    });
    
    // Handle mouse leaving the window
    window.addEventListener('mouseout', function() {
      mouse.x = null;
      mouse.y = null;
    });
    
    // Handle window resize
    function resizeCanvas() {
      // Set canvas size to window size for full coverage
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reinitialize particles after resize
      init();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize particles
    function init() {
      particlesArray = [];
      for (let i = 0; i < particleCount; i++) {
        const size = particleRadius;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const directionX = (Math.random() * 2) - 1;
        const directionY = (Math.random() * 2) - 1;
        
        particlesArray.push({
          x: x,
          y: y,
          directionX: directionX * particleSpeed,
          directionY: directionY * particleSpeed,
          size: size,
          color: particleColor
        });
      }
    }
    
    // Connect particles with lines based on distance
    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxConnectionDistance) {
            // Opacity based on distance
            const opacity = 1 - (distance / maxConnectionDistance);
            ctx.strokeStyle = lineColor.replace('0.3', opacity * 0.6);
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }
    
    // Update particle positions and handle mouse interaction
    function update() {
      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i];
        
        // Move particles
        p.x += p.directionX;
        p.y += p.directionY;
        
        // Boundary checks - wrap around edges
        if (p.x < 0) {
          p.x = canvas.width;
        }
        if (p.x > canvas.width) {
          p.x = 0;
        }
        if (p.y < 0) {
          p.y = canvas.height;
        }
        if (p.y > canvas.height) {
          p.y = 0;
        }
        
        // Mouse interaction - particles move away from cursor
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < interactionRadius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (interactionRadius - distance) / interactionRadius;
            
            p.x += forceDirectionX * force * 1.5;
            p.y += forceDirectionY * force * 1.5;
          }
        }
        
        // Draw particles
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Animation loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      update();
      connect();
    }
    
    // Cancel previous animation frame if it exists when re-initializing
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Start everything
    resizeCanvas();
    animate();
    
    // Return control functions for later use
    return {
      resize: resizeCanvas,
      stop: () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      }
    };
  }
  
  // Function to adjust particle settings based on theme
  function adjustParticlesForTheme() {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const canvas = document.getElementById('particle-network');
    
    if (canvas) {
      // Adjust canvas opacity based on theme
      canvas.style.opacity = isDarkTheme ? '0.8' : '0.5';
    }
  }
  
  // Call adjustParticlesForTheme when theme changes
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        // Allow time for theme to change
        setTimeout(adjustParticlesForTheme, 100);
      });
    }
    
    // Initial adjustment
    adjustParticlesForTheme();
  });
  
  // Debug function - check if the canvas is properly set up
  function debugParticleCanvas() {
    const canvas = document.getElementById('particle-network');
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    
    console.log('Canvas found:', {
      width: canvas.width,
      height: canvas.height,
      style: canvas.style.cssText,
      visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
    });
    
    // Draw a test shape to verify canvas is working
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, 100, 100);
    console.log('Test rectangle drawn on canvas');
  }