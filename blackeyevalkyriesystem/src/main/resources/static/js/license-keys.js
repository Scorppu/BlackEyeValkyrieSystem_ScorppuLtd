/**
 * License Keys Management JavaScript
 * 
 * This script handles the client-side functionality for the license key management interface.
 * It provides features for searching, filtering, and paginating license key data.
 * 
 * Features:
 * - Search functionality for filtering license keys by key, status, role, or user
 * - Pagination controls with configurable rows per page
 * - Filter persistence across page reloads using localStorage and URL parameters
 * - Date conversion from UTC to local timezone for expiration dates
 * - Toast notification system for displaying success, error, and warning messages
 * 
 * Functions:
 * - convertDatesToLocalTimezone(): Converts UTC timestamps to local timezone
 * - preserveFilterSettings(): Maintains filter selections across page loads
 * - displayNotificationFromSession(): Retrieves and displays notifications from sessionStorage
 * - displayNotification(): Creates and displays toast notifications
 * - updateUrlParameter(): Helper function to update URL parameters
 */

/**
 * Main event listener that initializes all functionality when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('License keys JS loaded');
    
    // Check for notifications in sessionStorage
    displayNotificationFromSession();
    
    // Convert UTC dates to local timezone
    convertDatesToLocalTimezone();
    
    // Preserve filter selections
    preserveFilterSettings();
    
    // Handle search functionality
    const searchInput = document.getElementById('licenseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.data-table tbody tr');
            
            tableRows.forEach(row => {
                const licenseKey = row.querySelector('td:first-child').textContent.toLowerCase();
                const status = row.querySelector('td:nth-child(2) .status-badge').textContent.toLowerCase();
                const role = row.querySelector('td:nth-child(3) .role-badge').textContent.toLowerCase();
                const user = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
                
                if (licenseKey.includes(searchTerm) || 
                    status.includes(searchTerm) || 
                    role.includes(searchTerm) || 
                    user.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Handle pagination - rows per page selection
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    const headerRowsPerPageSelect = document.getElementById('headerRowsPerPage');
    
    // Sync both selects
    if (rowsPerPageSelect && headerRowsPerPageSelect) {
        headerRowsPerPageSelect.addEventListener('change', function() {
            window.location.href = updateUrlParameter(window.location.href, 'rowsPerPage', this.value);
        });
        
        rowsPerPageSelect.addEventListener('change', function() {
            window.location.href = updateUrlParameter(window.location.href, 'rowsPerPage', this.value);
        });
    }
    
    // Handle pagination - next and previous buttons
    const prevButton = document.querySelector('.prev-page');
    const nextButton = document.querySelector('.next-page');
    const headerPrevButton = document.querySelector('.header-prev-page');
    const headerNextButton = document.querySelector('.header-next-page');
    
    /**
     * Gets the current page from URL parameters
     * @returns {number} The current page number (defaults to 1 if not found)
     */
    function getCurrentPage() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('page')) || 1;
    }
    
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', function() {
            if (!prevButton.disabled) {
                const currentPage = getCurrentPage();
                if (currentPage > 1) {
                    window.location.href = updateUrlParameter(window.location.href, 'page', currentPage - 1);
                }
            }
        });
        
        nextButton.addEventListener('click', function() {
            if (!nextButton.disabled) {
                const currentPage = getCurrentPage();
                window.location.href = updateUrlParameter(window.location.href, 'page', currentPage + 1);
            }
        });
    }
    
    if (headerPrevButton && headerNextButton) {
        headerPrevButton.addEventListener('click', function() {
            if (!headerPrevButton.disabled) {
                const currentPage = getCurrentPage();
                if (currentPage > 1) {
                    window.location.href = updateUrlParameter(window.location.href, 'page', currentPage - 1);
                }
            }
        });
        
        headerNextButton.addEventListener('click', function() {
            if (!headerNextButton.disabled) {
                const currentPage = getCurrentPage();
                window.location.href = updateUrlParameter(window.location.href, 'page', currentPage + 1);
            }
        });
    }
    
    /**
     * Converts UTC timestamps to local timezone for display
     * Looks for elements with class 'expires-date' and data-utc-timestamp attribute
     */
    function convertDatesToLocalTimezone() {
        try {
            const dateElements = document.querySelectorAll('.expires-date');
            dateElements.forEach(function(element) {
                try {
                    const utcTimestamp = element.getAttribute('data-utc-timestamp');
                    if (utcTimestamp) {
                        const date = new Date(utcTimestamp + 'Z');  // 'Z' indicates UTC
                        if (!isNaN(date.getTime())) {
                            const options = {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            };
                            element.textContent = date.toLocaleString(undefined, options);
                        }
                    }
                } catch (e) {
                    // Silently handle error - keep original text
                }
            });
        } catch (e) {
            // Silently handle errors
        }
    }

    /**
     * Preserves filter settings across page loads using URL parameters and localStorage
     * Handles status filter, role filter, and sort order
     */
    function preserveFilterSettings() {
        // Get current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get filter elements
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const sortOrder = document.getElementById('sortOrder');
        
        // Set values from URL parameters if present
        if (statusFilter && urlParams.has('statusFilter')) {
            statusFilter.value = urlParams.get('statusFilter');
        }
        
        if (roleFilter && urlParams.has('roleFilter')) {
            roleFilter.value = urlParams.get('roleFilter');
        }
        
        if (sortOrder && urlParams.has('sortOrder')) {
            sortOrder.value = urlParams.get('sortOrder');
        }

        // When filter form is submitted, ensure hidden filter values are preserved
        const filterForm = document.querySelector('.filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                // Store filter values in localStorage before submission
                if (statusFilter) localStorage.setItem('licenseKeyStatusFilter', statusFilter.value);
                if (roleFilter) localStorage.setItem('licenseKeyRoleFilter', roleFilter.value);
                if (sortOrder) localStorage.setItem('licenseKeySortOrder', sortOrder.value);
            });
        }
        
        // Also restore values from localStorage when page loads if URL params are empty
        if (statusFilter && !urlParams.has('statusFilter') && localStorage.getItem('licenseKeyStatusFilter')) {
            statusFilter.value = localStorage.getItem('licenseKeyStatusFilter');
        }
        
        if (roleFilter && !urlParams.has('roleFilter') && localStorage.getItem('licenseKeyRoleFilter')) {
            roleFilter.value = localStorage.getItem('licenseKeyRoleFilter');
        }
        
        if (sortOrder && !urlParams.has('sortOrder') && localStorage.getItem('licenseKeySortOrder')) {
            sortOrder.value = localStorage.getItem('licenseKeySortOrder');
        }
    }

    /**
     * Checks for and displays notifications stored in sessionStorage
     * Used to persist notifications across page reloads
     */
    function displayNotificationFromSession() {
        const notificationData = sessionStorage.getItem('licenseKeyNotification');
        
        if (notificationData) {
            try {
                const notification = JSON.parse(notificationData);
                displayNotification(notification.type, notification.message);
                
                // Clear the notification after displaying it
                sessionStorage.removeItem('licenseKeyNotification');
            } catch (e) {
                console.error('Error parsing notification data:', e);
            }
        }
    }
    
    /**
     * Creates and displays toast notifications
     * @param {string} type - The type of notification: 'success', 'error', or 'warning'
     * @param {string} message - The notification message to display
     */
    function displayNotification(type, message) {
        // Create notification container if it doesn't exist
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            
            // Insert at the top of the content section
            const contentSection = document.querySelector('[layout\\:fragment="content"]');
            if (contentSection) {
                contentSection.insertBefore(notificationContainer, contentSection.firstChild);
            } else {
                document.body.insertBefore(notificationContainer, document.body.firstChild);
            }
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = '';
        if (type === 'success') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'error') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else if (type === 'warning') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        }
        
        // Set notification content
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', function() {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
});

/**
 * Updates a URL parameter while preserving other existing parameters
 * @param {string} url - The URL to update
 * @param {string} key - The parameter key to update
 * @param {string|number} value - The new value for the parameter
 * @returns {string} The updated URL with the new parameter value
 */
function updateUrlParameter(url, key, value) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Update or add the parameter
    params.set(key, value);
    
    // Reset page parameter to 1 if we're changing rows per page
    if (key === 'rowsPerPage') {
        params.set('page', 1);
    }
    
    // Preserve other parameters
    if (params.has('statusFilter')) {
        params.set('statusFilter', params.get('statusFilter'));
    }
    
    if (params.has('roleFilter')) {
        params.set('roleFilter', params.get('roleFilter'));
    }
    
    if (params.has('sortOrder')) {
        params.set('sortOrder', params.get('sortOrder'));
    }
    
    // Apply the updated search parameters
    urlObj.search = params.toString();
    return urlObj.toString();
}