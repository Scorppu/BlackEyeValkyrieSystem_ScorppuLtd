/**
 * User Profile JavaScript Module
 * 
 * This module handles fetching and displaying user profile information.
 * It retrieves profile data from the '/api/profile' endpoint and updates
 * the user interface with the user's full name and avatar initials.
 * 
 * The script runs when the DOM content is fully loaded and updates two UI elements:
 * - '.user-name' element with the user's full name
 * - '.avatar span' element with the user's initials
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const userNameElement = document.querySelector('.user-name');
    const userAvatarElement = document.querySelector('.avatar span');
    
    // Fetch user profile information
    fetch('/api/profile')
        .then(response => response.json())
        .then(data => {
            // Update user name with full name
            if (userNameElement && data.fullName) {
                userNameElement.textContent = data.fullName;
            }
            
            // Update user avatar with initials
            if (userAvatarElement && data.initials) {
                userAvatarElement.textContent = data.initials;
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
}); 