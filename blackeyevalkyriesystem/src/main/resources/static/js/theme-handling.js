/**
 * Global error handler to prevent uncaught exceptions from causing page crashes
 * @param {ErrorEvent} event - The error event object
 * @returns {boolean} - Always returns true to prevent default error handling
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    event.preventDefault();
    return true;
});

/**
 * Initializes and handles theme toggle functionality
 * Sets up theme toggle buttons, applies saved theme preferences,
 * and handles theme switching interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const moonIcon = document.getElementById('moon-icon');
        const sunIcon = document.getElementById('sun-icon');
        const themeLabel = themeToggleBtn.querySelector('.theme-label');
        
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.remove('light-mode');
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
            themeLabel.textContent = 'Switch to Light Mode';
        } else {
            document.documentElement.classList.add('light-mode');
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
            themeLabel.textContent = 'Switch to Dark Mode';
            
            if (!savedTheme) {
                localStorage.setItem('theme', 'light');
            }
        }
        
        themeToggleBtn.addEventListener('click', function() {
            document.documentElement.classList.toggle('light-mode');
            
            const isLightMode = document.documentElement.classList.contains('light-mode');
            
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