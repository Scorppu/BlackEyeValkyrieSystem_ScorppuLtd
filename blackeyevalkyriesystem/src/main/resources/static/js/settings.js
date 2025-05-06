document.addEventListener('DOMContentLoaded', function() {
    // Show the default panel (general settings) on load
    document.getElementById('generalPanel').style.display = 'block';
    document.getElementById('generalMenuItem').classList.add('active');
    
    // Panel navigation
    const menuItems = document.querySelectorAll('.settings-menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Get the target panel ID from the data attribute
            const targetPanelId = this.getAttribute('data-target');
            
            // Hide all panels
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show the target panel
            document.getElementById(targetPanelId).style.display = 'block';
            
            // Update active menu item
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Handle theme toggle switch
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        // Set initial state based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        themeToggle.checked = currentTheme === 'dark';
        
        // Add event listener for theme switch
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Save preference to local storage
            localStorage.setItem('theme', newTheme);
            
            // Save preference to server (if user is logged in)
            if (document.querySelector('[data-user-id]')) {
                const userId = document.querySelector('[data-user-id]').getAttribute('data-user-id');
                fetch('/api/users/' + userId + '/preferences', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ theme: newTheme })
                });
            }
        });
    }
    
    // Form submission handling
    const settingsForms = document.querySelectorAll('.settings-form');
    
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            
            // Send form data to server
            fetch(this.action, {
                method: this.method,
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Show success message
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-success';
                alertContainer.textContent = data.message || 'Settings saved successfully';
                
                // Insert alert before the form
                this.parentNode.insertBefore(alertContainer, this);
                
                // Remove the alert after 3 seconds
                setTimeout(() => {
                    alertContainer.remove();
                }, 3000);
            })
            .catch(error => {
                // Show error message
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-danger';
                alertContainer.textContent = 'Error saving settings: ' + error.message;
                
                // Insert alert before the form
                this.parentNode.insertBefore(alertContainer, this);
                
                // Remove the alert after 5 seconds
                setTimeout(() => {
                    alertContainer.remove();
                }, 5000);
            });
        });
    });
}); 