/**
 * User List Management Script
 * 
 * This script handles the client-side functionality for the user management page, providing:
 * 
 * - Notification System:
 *   - Displays notifications from sessionStorage on page load
 *   - Creates dynamic notification elements with type-specific styling
 *   - Auto-removes notifications after a timeout
 *   - Provides manual close functionality
 * 
 * - Table Row Selection:
 *   - Implements select-all checkbox functionality
 *   - Manages individual row checkbox states
 * 
 * - Real-time Search Filtering:
 *   - Filters table rows by username, email, or role
 *   - Updates visibility as the user types
 * 
 * - Pagination Controls:
 *   - Manages rows per page selection with synchronized controls
 *   - Handles page navigation (previous/next) in both header and footer
 *   - Updates URL parameters to persist pagination state
 * 
 * - User Deletion System:
 *   - Implements a confirmation modal with text verification
 *   - Validates the confirmation text before enabling deletion
 *   - Handles modal opening/closing with appropriate event listeners
 * 
 * - URL Parameter Management:
 *   - Helper function to update URL parameters while preserving state
 *   - Resets page number when changing rows per page
 * 
 * @file user-list.js
 */

// User List specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('User List page loaded');
    
    // Check for notification in sessionStorage
    displayNotificationFromSession();
    
    /**
     * Retrieves notification data from sessionStorage and displays it
     * 
     * Looks for the 'userNotification' key in sessionStorage, parses the
     * JSON data, and passes it to displayNotification. Removes the notification
     * from sessionStorage after displaying to prevent duplicate notifications.
     */
    function displayNotificationFromSession() {
        const notificationData = sessionStorage.getItem('userNotification');
        
        if (notificationData) {
            try {
                const notification = JSON.parse(notificationData);
                displayNotification(notification.type, notification.message);
                
                // Clear the notification after displaying it
                sessionStorage.removeItem('userNotification');
            } catch (e) {
                console.error('Error parsing notification data:', e);
            }
        }
    }
    
    /**
     * Creates and displays a notification element
     * 
     * @param {string} type - The notification type ('success' or 'error')
     * @param {string} message - The notification message to display
     * 
     * Creates a notification container if one doesn't exist, then adds
     * a notification with type-specific styling and icon. Notifications
     * automatically close after 6 seconds or can be closed manually.
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
        }
        
        // Set notification content
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    // Remove container if empty
                    if (notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            });
        }
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    // Remove container if empty
                    if (notificationContainer && notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            }
        }, 6000);
    }
    
    // Handle select all checkbox
    const selectAllCheckbox = document.querySelector('thead .select-checkbox');
    const rowCheckboxes = document.querySelectorAll('tbody .select-checkbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
    
    // Handle search functionality
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.user-table tbody tr');
            
            tableRows.forEach(row => {
                const userName = row.querySelector('td:first-child').textContent.toLowerCase();
                const userEmail = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const userRole = row.querySelector('td:nth-child(3) .role-badge').textContent.toLowerCase();
                
                if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || userRole.includes(searchTerm)) {
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
     * Gets the current page number from URL parameters
     * 
     * @returns {number} The current page number, defaults to 1 if not found
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
    
    // Handle delete modal
    const deleteModal = document.getElementById('deleteModal');
    const confirmInput = document.getElementById('confirmInput');
    const deleteUserIdInput = document.getElementById('deleteUserId');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    /**
     * Opens the user deletion confirmation modal
     *
     * @param {string|number} userId - The ID of the user to delete
     * 
     * Sets the user ID in the hidden input field, displays the modal,
     * clears any previous confirmation text, and ensures the delete
     * button starts in a disabled state.
     */
    window.openDeleteModal = function(userId) {
        deleteUserIdInput.value = userId;
        deleteModal.style.display = 'block';
        confirmInput.value = '';
        confirmDeleteBtn.disabled = true;
    };
    
    // Close modal when clicking cancel
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    // Check confirmation text
    if (confirmInput) {
        confirmInput.addEventListener('input', function() {
            confirmDeleteBtn.disabled = this.value !== 'Confirm';
        });
    }
    
    // Handle delete confirmation
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (confirmInput.value === 'Confirm') {
                window.location.href = '/user/delete/' + deleteUserIdInput.value;
            }
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
});

/**
 * Updates URL parameters while preserving other parameters
 * 
 * @param {string} url - The current URL to modify
 * @param {string} key - The parameter name to update
 * @param {string|number} value - The new value for the parameter
 * @returns {string} The updated URL string
 * 
 * If the parameter is 'rowsPerPage', the page parameter is reset to 1
 * to ensure users start at the first page when changing the rows displayed.
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
    
    // Apply the updated search parameters
    urlObj.search = params.toString();
    return urlObj.toString();
}