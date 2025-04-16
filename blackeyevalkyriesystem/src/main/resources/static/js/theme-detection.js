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