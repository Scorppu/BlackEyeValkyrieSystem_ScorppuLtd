/**
 * License Key Generator Form Handling
 * 
 * This script manages the license key generation form, including:
 * - Showing/hiding the custom date field based on expiry option selection
 * - Setting minimum date constraint for custom expiry dates
 * - Form validation with visual feedback
 * - Success notification storage for the redirect page
 * - Displaying validation popups and notifications
 */

document.addEventListener('DOMContentLoaded', function() {
    const expiryOption = document.getElementById('expiryOption');
    const customDateContainer = document.getElementById('customDateContainer');
    const customDateInput = document.getElementById('customDate');
    const roleSelect = document.getElementById('role');
    const form = document.querySelector('form');
    
    /**
     * Event listener to show/hide custom date field based on expiry option selection
     * Shows custom date field when 'custom' is selected and sets it as required
     * Hides the field and removes required attribute for other options
     */
    expiryOption.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateContainer.style.display = 'block';
            customDateInput.setAttribute('required', 'required');
        } else {
            customDateContainer.style.display = 'none';
            customDateInput.removeAttribute('required');
        }
    });
    
    /**
     * Sets minimum date for custom date input to today's date
     * Prevents selection of past dates for license expiry
     */
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    customDateInput.setAttribute('min', formattedDate);

    /**
     * Form validation on submit
     * Validates required fields and shows errors if validation fails
     * Stores success notification in sessionStorage for the redirect page
     */
    form.addEventListener('submit', function(e) {
        let errors = [];
        // Remove previous invalid styles
        roleSelect.classList.remove('invalid-input');
        expiryOption.classList.remove('invalid-input');
        customDateInput.classList.remove('invalid-input');

        // Validate role
        if (!roleSelect.value) {
            errors.push('Role is required');
            roleSelect.classList.add('invalid-input');
        }
        // Validate expiry option
        if (!expiryOption.value) {
            errors.push('Expiry Date is required');
            expiryOption.classList.add('invalid-input');
        }
        // If custom date is shown, validate it
        if (expiryOption.value === 'custom' && !customDateInput.value) {
            errors.push('Custom Expiry Date is required');
            customDateInput.classList.add('invalid-input');
        }
        if (errors.length > 0) {
            e.preventDefault();
            console.log('Validation errors:', errors);
            showValidationPopup(errors);
        } else {
            // If there are no validation errors, store the notification data for the redirect page
            sessionStorage.setItem('licenseKeyNotification', JSON.stringify({
                type: 'success',
                message: 'License key generated successfully!'
            }));
        }
    });

    /**
     * Creates and displays a validation popup with error messages
     * 
     * @param {Array} errors - Array of error messages to display
     */
    function showValidationPopup(errors) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.validation-popup');
        if (existingPopup) existingPopup.remove();
        const existingOverlay = document.querySelector('.validation-popup-overlay');
        if (existingOverlay) existingOverlay.remove();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'validation-popup-overlay';
        document.body.appendChild(overlay);

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'validation-popup';
        popup.innerHTML = `
            <div class="validation-popup-content">
                <div class="validation-popup-header">
                    Form Validation Error
                    <button class="validation-popup-close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="validation-popup-body">
                    <p class="validation-popup-title">Please fix the following errors:</p>
                    <ul class="validation-error-list">
                        ${errors.map(error => `
                            <li class="validation-error-item">
                                <div class="validation-error-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </div>
                                <div class="validation-error-text">${error}</div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="validation-popup-footer">
                    <button class="validation-popup-button">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        // Add event listeners
        const closeButton = popup.querySelector('.validation-popup-close');
        const okButton = popup.querySelector('.validation-popup-button');
        const closePopup = () => {
            popup.remove();
            overlay.remove();
        };
        closeButton.addEventListener('click', closePopup);
        okButton.addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
    }
});

/**
 * Displays a toast notification
 * 
 * Creates and displays a notification toast that auto-dismisses after 6 seconds
 * or can be manually closed. Supports different notification types (success, error)
 * with appropriate icons.
 * 
 * @param {string} type - Notification type ('success' or 'error')
 * @param {string} message - Message to display in the notification
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