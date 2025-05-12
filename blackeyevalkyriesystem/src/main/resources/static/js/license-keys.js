/**
 * License keys management module.
 * Handles license key copying, date formatting, notifications, and filter persistence.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('License keys JS loaded');
    
    convertDatesToLocalTimezone();
    preserveFilterSettings();
    
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> License key copied to clipboard';
    document.body.appendChild(notification);
    
    document.querySelectorAll('.copy-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            const key = this.dataset.key;
            console.log('Attempting to copy key:', key);
            
            if (!key) {
                console.error('Key not found in data-key attribute');
                showNotification('Error: Failed to copy license key', 'error');
                return;
            }
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(key)
                    .then(() => {
                        showNotification('License key copied to clipboard', 'success');
                        showTooltip(this, 'Copied!');
                    })
                    .catch(err => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopyToClipboard(key, this);
                    });
            } else {
                fallbackCopyToClipboard(key, this);
            }
        });
    });
    
    /**
     * Converts UTC dates to local timezone for display.
     * Finds elements with class 'expires-date' and converts their 'data-utc-timestamp' 
     * attributes to localized date strings.
     */
    function convertDatesToLocalTimezone() {
        try {
            const dateElements = document.querySelectorAll('.expires-date');
            dateElements.forEach(function(element) {
                try {
                    const utcTimestamp = element.getAttribute('data-utc-timestamp');
                    if (utcTimestamp) {
                        const date = new Date(utcTimestamp + 'Z');
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
     * Fallback method for copying text to clipboard using execCommand.
     * Used when the Clipboard API is not supported by the browser.
     * 
     * @param {string} text - The text to copy to clipboard
     * @param {HTMLElement} buttonElement - The button element that triggered the copy
     */
    function fallbackCopyToClipboard(text, buttonElement) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        
        try {
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            const successful = document.execCommand('copy');
            
            if (successful) {
                showNotification('License key copied to clipboard', 'success');
                showTooltip(buttonElement, 'Copied!');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            showNotification('Failed to copy license key', 'error');
        }
        
        document.body.removeChild(textArea);
    }
    
    /**
     * Displays a notification popup with a message.
     * The notification is shown for 1 second before fading out.
     * 
     * @param {string} message - The message to display in the notification
     * @param {string} type - The type of notification ('success' or 'error')
     */
    function showNotification(message, type = 'success') {
        if (type === 'error') {
            notification.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff3b30;"></i> ' + message;
        } else {
            notification.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 1000);
    }
    
    /**
     * Shows a tooltip on a button element.
     * The tooltip is shown for 1.5 seconds before fading out.
     * 
     * @param {HTMLElement} element - The element to attach the tooltip to
     * @param {string} message - The message to display in the tooltip
     */
    function showTooltip(element, message) {
        console.log('Showing tooltip:', message);
        let tooltip = element.querySelector('.tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            element.appendChild(tooltip);
        }
        
        tooltip.textContent = message;
        tooltip.classList.add('show');
        
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => {
                if (tooltip.parentNode === element) {
                    element.removeChild(tooltip);
                }
            }, 300);
        }, 1500);
    }

    /**
     * Preserves filter settings across page loads.
     * Retrieves filter values from URL parameters and localStorage,
     * and sets up event listeners to save filter values when the form is submitted.
     */
    function preserveFilterSettings() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const sortOrder = document.getElementById('sortOrder');
        
        if (statusFilter && urlParams.has('statusFilter')) {
            statusFilter.value = urlParams.get('statusFilter');
        }
        
        if (roleFilter && urlParams.has('roleFilter')) {
            roleFilter.value = urlParams.get('roleFilter');
        }
        
        if (sortOrder && urlParams.has('sortOrder')) {
            sortOrder.value = urlParams.get('sortOrder');
        }

        const filterForm = document.querySelector('.filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                if (statusFilter) localStorage.setItem('licenseKeyStatusFilter', statusFilter.value);
                if (roleFilter) localStorage.setItem('licenseKeyRoleFilter', roleFilter.value);
                if (sortOrder) localStorage.setItem('licenseKeySortOrder', sortOrder.value);
            });
        }
        
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
});