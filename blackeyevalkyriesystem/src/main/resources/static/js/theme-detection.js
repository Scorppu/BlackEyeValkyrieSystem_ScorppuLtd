/**
 * Theme detection script that runs immediately before rendering to prevent flash of unstyled content.
 * Retrieves the user's theme preference from localStorage and applies appropriate classes.
 * Adds a 'theme-initialized' class after DOM content is loaded to make content visible.
 */
(function() {
    var savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-mode');
    } else {
        document.documentElement.classList.add('light-mode');
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        document.documentElement.classList.add('theme-initialized');
    });
})(); 