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