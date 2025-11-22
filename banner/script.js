// Add any interactive functionality here
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for any internal links
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add hover effects to interactive elements
  const figures = document.querySelectorAll('.figure');
  figures.forEach(figure => {
    figure.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
      this.style.transition = 'transform 0.2s ease';
    });
    
    figure.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });

  // Add click functionality to dashboard mockup
  const dashboardMockup = document.querySelector('.dashboard-mockup');
  if (dashboardMockup) {
    dashboardMockup.addEventListener('click', function() {
      console.log('Dashboard mockup clicked - could open full view');
    });
  }

  // Add print functionality
  function addPrintStyles() {
    const printStyles = `
      @media print {
        body { background: white; }
        .document-container { box-shadow: none; }
        .section { page-break-inside: avoid; }
        .figure { page-break-inside: avoid; }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = printStyles;
    document.head.appendChild(styleSheet);
  }
  
  addPrintStyles();
});
