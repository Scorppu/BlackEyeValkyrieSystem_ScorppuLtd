/**
 * Theme Detection Script
 * 
 * This script is executed immediately to prevent flash of unstyled content (FOUC)
 * by detecting and applying the user's preferred theme before the page renders.
 * 
 * Functionality:
 * - Checks localStorage for saved theme preference
 * - Applies 'light-mode' class to document root based on saved preference
 * - Adds 'theme-initialized' class when DOM is fully loaded to signal theme initialization is complete
 * 
 * Note: This script must be included in the head section to execute before page rendering
 */
// Immediate theme detection script - must run before any rendering
(function() {
    // Get saved theme preference
    var savedTheme = localStorage.getItem('theme');
    // Set the theme class before any rendering
    if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-mode');
    } else {
        document.documentElement.classList.add('light-mode');
    }
    // Flag that theme is initialized to make content visible
    document.addEventListener('DOMContentLoaded', function() {
        document.documentElement.classList.add('theme-initialized');
    });
})(); 