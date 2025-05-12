/**
 * Settings UI management script
 * 
 * Handles functionality for the settings page including:
 * - Panel navigation between different settings sections
 * - Theme toggling between light and dark modes with local storage and server persistence
 * - Form submission with success/error feedback
 */
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generalPanel').style.display = 'block';
    document.getElementById('generalMenuItem').classList.add('active');
    
    const menuItems = document.querySelectorAll('.settings-menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPanelId = this.getAttribute('data-target');
            
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            document.getElementById(targetPanelId).style.display = 'block';
            
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        themeToggle.checked = currentTheme === 'dark';
        
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            localStorage.setItem('theme', newTheme);
            
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
    
    const settingsForms = document.querySelectorAll('.settings-form');
    
    settingsForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            
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
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-success';
                alertContainer.textContent = data.message || 'Settings saved successfully';
                
                this.parentNode.insertBefore(alertContainer, this);
                
                setTimeout(() => {
                    alertContainer.remove();
                }, 3000);
            })
            .catch(error => {
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-danger';
                alertContainer.textContent = 'Error saving settings: ' + error.message;
                
                this.parentNode.insertBefore(alertContainer, this);
                
                setTimeout(() => {
                    alertContainer.remove();
                }, 5000);
            });
        });
    });
}); 