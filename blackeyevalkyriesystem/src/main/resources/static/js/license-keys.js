document.addEventListener('DOMContentLoaded', function() {
    console.log('License keys JS loaded');
    
    // Convert UTC dates to local timezone
    convertDatesToLocalTimezone();
    
    // Preserve filter selections
    preserveFilterSettings();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> License key copied to clipboard';
    document.body.appendChild(notification);
    
    // Add click event listeners to all copy buttons
    document.querySelectorAll('.copy-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // Get the license key from data-key attribute
            const key = this.dataset.key;
            console.log('Attempting to copy key:', key);
            
            if (!key) {
                console.error('Key not found in data-key attribute');
                showNotification('Error: Failed to copy license key', 'error');
                return;
            }
            
            // Use the Clipboard API if available (modern browsers)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(key)
                    .then(() => {
                        // Show success notification
                        showNotification('License key copied to clipboard', 'success');
                        // Also show tooltip on button for visual feedback
                        showTooltip(this, 'Copied!');
                    })
                    .catch(err => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopyToClipboard(key, this);
                    });
            } else {
                // Fall back to the older execCommand method
                fallbackCopyToClipboard(key, this);
            }
        });
    });
    
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
    
    // Fallback copy method using execCommand
    function fallbackCopyToClipboard(text, buttonElement) {
        // Create a temporary text element to copy from
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        
        try {
            // Select the text and copy it
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices
            const successful = document.execCommand('copy');
            
            if (successful) {
                // Show success notification
                showNotification('License key copied to clipboard', 'success');
                // Also show tooltip on button for visual feedback
                showTooltip(buttonElement, 'Copied!');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Copy failed:', err);
            showNotification('Failed to copy license key', 'error');
        }
        
        // Remove the temporary element
        document.body.removeChild(textArea);
    }
    
    // Function to show notification popup
    function showNotification(message, type = 'success') {
        // Update notification content
        if (type === 'error') {
            notification.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff3b30;"></i> ' + message;
        } else {
            notification.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Hide notification after 1 second
        setTimeout(() => {
            notification.classList.remove('show');
        }, 1000);
    }
    
    // Function to show tooltip on button (as additional feedback)
    function showTooltip(element, message) {
        console.log('Showing tooltip:', message);
        // Check if tooltip already exists
        let tooltip = element.querySelector('.tooltip');
        
        // If tooltip doesn't exist, create it
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            element.appendChild(tooltip);
        }
        
        // Set tooltip message and show it
        tooltip.textContent = message;
        tooltip.classList.add('show');
        
        // Hide tooltip after 1.5 seconds
        setTimeout(() => {
            tooltip.classList.remove('show');
            // Remove tooltip after fade out animation completes
            setTimeout(() => {
                if (tooltip.parentNode === element) {
                    element.removeChild(tooltip);
                }
            }, 300);
        }, 1500);
    }

    // Function to preserve filter settings and handle responsive filters
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
});