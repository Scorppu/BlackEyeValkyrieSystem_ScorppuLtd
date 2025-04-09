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