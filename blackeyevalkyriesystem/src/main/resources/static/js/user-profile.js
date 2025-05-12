/**
 * User Profile JavaScript Module
 * 
 * This script handles fetching and displaying user profile information.
 * It loads user data from the API endpoint '/api/profile' and updates
 * the UI elements including the user's full name and avatar initials.
 * The script executes when the DOM content is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    const userNameElement = document.querySelector('.user-name');
    const userAvatarElement = document.querySelector('.avatar span');
    
    fetch('/api/profile')
        .then(response => response.json())
        .then(data => {
            if (userNameElement && data.fullName) {
                userNameElement.textContent = data.fullName;
            }
            
            if (userAvatarElement && data.initials) {
                userAvatarElement.textContent = data.initials;
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
});