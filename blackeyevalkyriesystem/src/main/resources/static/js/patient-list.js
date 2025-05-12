document.addEventListener('DOMContentLoaded', function() {
    console.log('Patient List page loaded');
    
    displayNotificationFromSession();
    
    /**
     * Retrieves and displays notifications stored in sessionStorage.
     * Parses the notification data from 'patientNotification' key and
     * passes it to the displayNotification function, then removes it from storage.
     */
    function displayNotificationFromSession() {
        const notificationData = sessionStorage.getItem('patientNotification');
        
        if (notificationData) {
            try {
                const notification = JSON.parse(notificationData);
                displayNotification(notification.type, notification.message);
                
                sessionStorage.removeItem('patientNotification');
            } catch (e) {
                console.error('Error parsing notification data:', e);
            }
        }
    }
    
    /**
     * Creates and displays a notification with the specified type and message.
     * Handles creation of notification container if it doesn't exist.
     * Adds appropriate icons based on notification type.
     * Implements auto-removal after 6 seconds and close button functionality.
     * 
     * @param {string} type - The type of notification ('success' or 'error')
     * @param {string} message - The message to display in the notification
     */
    function displayNotification(type, message) {
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            
            const contentSection = document.querySelector('[layout\\:fragment="content"]');
            if (contentSection) {
                contentSection.insertBefore(notificationContainer, contentSection.firstChild);
            } else {
                document.body.insertBefore(notificationContainer, document.body.firstChild);
            }
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'error') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        }
        
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
        
        notificationContainer.appendChild(notification);
        
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    if (notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            });
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    if (notificationContainer && notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            }
        }, 6000);
    }
});