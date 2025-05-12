/**
 * Theme handling module for managing site appearance
 * Provides functionality for toggling between light and dark themes
 * and persisting user preferences across sessions
 */

window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    event.preventDefault();
    return true;
});

document.addEventListener('DOMContentLoaded', function() {
    const themeToggleBtn = document.getElementById('theme-toggle-button');
    if (!themeToggleBtn) return;
    
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const themeLabel = themeToggleBtn.querySelector('.theme-label');
    
    if (!moonIcon || !sunIcon || !themeLabel) {
        console.error('Theme toggle elements not found');
        return;
    }
    
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
        
        console.log('Theme toggled:', isLightMode ? 'light' : 'dark');
    });
});