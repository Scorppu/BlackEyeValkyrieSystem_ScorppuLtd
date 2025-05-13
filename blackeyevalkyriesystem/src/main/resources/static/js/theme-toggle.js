/**
 * @fileoverview Theme toggle functionality for the Black Eye Valkyrie System
 * @description This file implements the UI components for theme toggling (light/dark mode).
 * It creates a theme toggle button with appropriate icons and adds it to the sidebar if
 * it doesn't already exist in the DOM. The button includes both sun and moon icons to 
 * represent light and dark modes respectively. Initial state shows the moon icon with
 * "Switch to Light Mode" label.
 * 
 * Note: This file only handles the creation of the toggle button UI element.
 * The actual theme switching functionality should be implemented separately.
 */

// Theme toggling functionality
document.addEventListener('DOMContentLoaded', function() {
    // Ensure visibility when DOM is fully loaded
    document.documentElement.classList.add('theme-initialized');
    
    // Check if a theme toggle button exists before creating one
    if (!document.getElementById('theme-toggle-button')) {
        console.log('No theme toggle button found, creating one');
        createThemeToggleButton();
    }
});

/**
 * Creates and appends a theme toggle button to the sidebar
 * @function createThemeToggleButton
 * @description Dynamically creates a theme toggle button with moon and sun icons
 * and appends it to the sidebar element. The button includes SVG icons for both
 * dark mode (moon) and light mode (sun), with the moon icon displayed by default.
 * The sun icon is initially hidden (display: none).
 * @returns {void}
 */
function createThemeToggleButton() {
    // Create the container
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    
    // Create the button
    const button = document.createElement('button');
    button.id = 'theme-toggle-button';
    button.setAttribute('aria-label', 'Toggle Light/Dark Mode');
    
    // Create moon icon
    const moonIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    moonIcon.setAttribute('width', '16');
    moonIcon.setAttribute('height', '16');
    moonIcon.setAttribute('viewBox', '0 0 16 16');
    moonIcon.setAttribute('fill', 'none');
    
    // Add moon group
    const moonGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    moonGroup.setAttribute('class', 'moon-icon');
    
    const moonPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    moonPath.setAttribute('d', 'M13.5 8.25C13.4889 9.30911 13.1713 10.3467 12.584 11.2419C11.9967 12.1371 11.1659 12.8499 10.1888 13.3023C9.21162 13.7547 8.1235 13.9291 7.04413 13.8071C5.96476 13.6851 4.94572 13.2713 4.10739 12.6116C3.26906 11.9518 2.64595 11.074 2.30517 10.0836C1.9644 9.09323 1.91897 8.02791 2.17358 7.01236C2.42819 5.99682 2.97134 5.07584 3.7374 4.34808C4.50345 3.62033 5.45758 3.11473 6.5 2.89M13.5 4.5L7.5 10.5L6 9');
    moonPath.setAttribute('stroke-width', '1.33333');
    moonPath.setAttribute('stroke-linecap', 'round');
    moonPath.setAttribute('stroke-linejoin', 'round');
    
    moonGroup.appendChild(moonPath);
    moonIcon.appendChild(moonGroup);
    
    // Create sun icon
    const sunIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sunIcon.setAttribute('width', '16');
    sunIcon.setAttribute('height', '16');
    sunIcon.setAttribute('viewBox', '0 0 16 16');
    sunIcon.setAttribute('fill', 'none');
    
    // Add sun group
    const sunGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sunGroup.setAttribute('class', 'sun-icon');
    sunGroup.style.display = 'none';
    
    // Add paths for sun icon
    const sunPaths = [
        'M8 11.5C9.933 11.5 11.5 9.933 11.5 8C11.5 6.067 9.933 4.5 8 4.5C6.067 4.5 4.5 6.067 4.5 8C4.5 9.933 6.067 11.5 8 11.5Z',
        'M8 1.5V2.5',
        'M8 13.5V14.5',
        'M3.21997 3.22L3.92997 3.93',
        'M12.07 12.07L12.78 12.78',
        'M1.5 8H2.5',
        'M13.5 8H14.5',
        'M3.21997 12.78L3.92997 12.07',
        'M12.07 3.93L12.78 3.22'
    ];
    
    sunPaths.forEach(d => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke-width', '1.33333');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        sunGroup.appendChild(path);
    });
    
    sunIcon.appendChild(sunGroup);
    
    // Create label
    const label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = 'Switch to Light Mode';
    
    // Append elements to button
    button.appendChild(moonIcon);
    button.appendChild(sunIcon);
    button.appendChild(label);
    
    // Append button to container
    themeToggle.appendChild(button);
    
    // Find the sidebar and append the theme toggle
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.appendChild(themeToggle);
        console.log('Theme toggle button created and added to sidebar');
    } else {
        console.error('Sidebar not found, cannot add theme toggle button');
    }
} 