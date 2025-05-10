// User List specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('User List page loaded');
    
    // Check for notification in sessionStorage
    displayNotificationFromSession();
    
    // Function to display notification from session storage
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
    
    // Function to display notification
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
    
    // Delete modal functionality
    const modal = document.getElementById('deleteModal');
    const confirmInput = document.getElementById('confirmInput');
    const deleteUserId = document.getElementById('deleteUserId');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    // Close modal when cancel is clicked
    cancelDelete.addEventListener('click', function() {
        modal.style.display = 'none';
        confirmInput.value = '';
    });
    
    // Handle confirm delete button
    confirmDelete.addEventListener('click', function() {
        if (confirmInput.value === 'Confirm') {
            window.location.href = '/user/delete/' + deleteUserId.value;
        } else {
            alert('Please type "Confirm" to proceed with deletion.');
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            confirmInput.value = '';
        }
    });
});

// Function to open delete modal
function openDeleteModal(userId) {
    const modal = document.getElementById('deleteModal');
    const deleteUserId = document.getElementById('deleteUserId');
    
    deleteUserId.value = userId;
    modal.style.display = 'block';
    document.getElementById('confirmInput').focus();
}