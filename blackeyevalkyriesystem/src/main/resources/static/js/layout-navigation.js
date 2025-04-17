// Global error handler to prevent uncaught exceptions from causing page crashes
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    event.preventDefault();
    return true;
});

// Dropdown navigation handling
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const moonIcon = document.getElementById('moon-icon');
        const sunIcon = document.getElementById('sun-icon');
        const themeLabel = themeToggleBtn.querySelector('.theme-label');
        
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('theme');
        
        // Apply saved theme or default to light mode
        if (savedTheme === 'dark') {
            // Dark mode only if explicitly saved as 'dark'
            document.documentElement.classList.remove('light-mode');
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
            themeLabel.textContent = 'Switch to Light Mode';
        } else {
            // Default to light mode
            document.documentElement.classList.add('light-mode');
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
            themeLabel.textContent = 'Switch to Dark Mode';
            
            // Save preference if not already saved
            if (!savedTheme) {
                localStorage.setItem('theme', 'light');
            }
        }
        
        // Theme toggle button click handler
        themeToggleBtn.addEventListener('click', function() {
            // Toggle light mode class on root element
            document.documentElement.classList.toggle('light-mode');
            
            // Check if light mode is now active
            const isLightMode = document.documentElement.classList.contains('light-mode');
            
            // Update icons and label
            if (isLightMode) {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'block';
                themeLabel.textContent = 'Switch to Dark Mode';
                localStorage.setItem('theme', 'light');
            } else {
                moonIcon.style.display = 'block';
                sunIcon.style.display = 'none';
                themeLabel.textContent = 'Switch to Light Mode';
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}); 