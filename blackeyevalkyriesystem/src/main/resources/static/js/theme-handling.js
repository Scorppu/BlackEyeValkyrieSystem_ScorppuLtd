/**
 * Theme Handling Module
 * 
 * This module manages the application's theme switching functionality.
 * It handles theme persistence using localStorage, applies themes based on saved preferences,
 * and manages the theme toggle button UI elements.
 * 
 * @module theme-handling
 */

/**
 * Global error handler to prevent uncaught exceptions from causing page crashes.
 * Logs errors to the console and prevents the default error behavior.
 * 
 * @param {ErrorEvent} event - The error event object containing error details
 * @returns {boolean} - Always returns true to indicate the error was handled
 */
window.addEventListener('error', function(event) {
    console.error('JavaScript Error:', event.error);
    event.preventDefault();
    return true;
});

/**
 * Initializes theme toggle functionality when the DOM is fully loaded.
 * This function:
 * - Retrieves the theme toggle button and its child elements
 * - Applies any previously saved theme from localStorage
 * - Sets up event listeners for theme switching
 * - Updates UI elements (icons and labels) based on the current theme
 * - Saves theme preferences to localStorage for persistence
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get the theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-button');
    if (!themeToggleBtn) return;
    
    // Get theme elements
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const themeLabel = themeToggleBtn.querySelector('.theme-label');
    
    if (!moonIcon || !sunIcon || !themeLabel) {
        console.error('Theme toggle elements not found');
        return;
    }
    
    // Apply saved theme preference
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
    
    // Theme toggle button click handler
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