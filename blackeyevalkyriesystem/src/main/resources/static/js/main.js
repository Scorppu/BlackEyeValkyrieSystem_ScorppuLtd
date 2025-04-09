document.addEventListener('DOMContentLoaded', function() {
    // Toggle navigation on mobile
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Dropdown menus in sidebar - improved implementation
    const dropdownLinks = document.querySelectorAll('.dropdown-toggle');
    
    if (dropdownLinks.length > 0) {
        // Remove any existing click event listeners first to prevent duplicates
        dropdownLinks.forEach(function(link) {
            // Clone the node to remove all event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        // Re-query the elements after replacing them
        const refreshedDropdownLinks = document.querySelectorAll('.dropdown-toggle');
        
        // Add new click event listeners
        refreshedDropdownLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                console.log('Dropdown toggle clicked'); // Debug log
                e.preventDefault();
                e.stopPropagation(); // Stop event bubbling
                
                // Toggle expanded class
                this.classList.toggle('expanded');
                
                // Handle the dropdown menu
                const submenu = this.nextElementSibling;
                if (submenu && submenu.classList.contains('dropdown-menu')) {
                    if (submenu.classList.contains('active')) {
                        submenu.classList.remove('active');
                        submenu.style.maxHeight = null;
                    } else {
                        submenu.classList.add('active');
                        submenu.style.maxHeight = submenu.scrollHeight + "px";
                    }
                }
            });
        });
        
        // Auto-expand dropdown if a child is active
        refreshedDropdownLinks.forEach(function(link) {
            const submenu = link.nextElementSibling;
            if (submenu && submenu.classList.contains('dropdown-menu')) {
                const hasActiveChild = submenu.querySelector('.active');
                
                if (hasActiveChild) {
                    link.classList.add('expanded');
                    submenu.classList.add('active');
                    submenu.style.maxHeight = submenu.scrollHeight + "px";
                }
            }
        });
    }
    
    // Tab navigation
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabItems.length > 0) {
        tabItems.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const target = this.dataset.target;
                
                // Hide all tab contents
                tabContents.forEach(function(content) {
                    content.classList.remove('active');
                });
                
                // Deactivate all tabs
                tabItems.forEach(function(tab) {
                    tab.classList.remove('active');
                });
                
                // Activate clicked tab and its content
                this.classList.add('active');
                document.getElementById(target).classList.add('active');
            });
        });
        
        // Activate first tab by default
        tabItems[0].click();
    }
    
    // Form submission handling
    const patientForm = document.getElementById('patient-form');
    
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                sex: document.getElementById('sex').value,
                relativeName: document.getElementById('relativeName').value,
                dateOfBirth: document.getElementById('dateOfBirth').value,
                age: document.getElementById('age').value,
                maritalStatus: document.getElementById('maritalStatus').value,
                bloodType: document.getElementById('bloodType').value
            };
            
            fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                alert('Patient profile created successfully!');
                
                // Redirect to patient list
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error creating patient profile. Please try again.');
            });
        });
    }
    
    // Calculate age from date of birth
    const dobField = document.getElementById('dateOfBirth');
    const ageField = document.getElementById('age');
    
    if (dobField && ageField) {
        dobField.addEventListener('change', function() {
            const dob = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            
            // Adjust age if birthday hasn't occurred yet this year
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            
            ageField.value = age;
        });
    }
    
    // User profile dropdown handling
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const profileArrow = document.querySelector('.profile-arrow');
    
    if (userProfileToggle && userProfileDropdown) {
        userProfileToggle.addEventListener('click', function() {
            if (userProfileDropdown.classList.contains('active')) {
                // Add animation class for disappearing
                userProfileDropdown.style.animation = 'popdown 0.2s ease-out forwards';
                
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    userProfileDropdown.classList.remove('active');
                    profileArrow.classList.remove('flipped');
                }, 200);
            } else {
                // Show and animate appearance
                userProfileDropdown.classList.add('active');
                userProfileDropdown.style.animation = 'popup 0.2s ease-out';
                profileArrow.classList.add('flipped');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!userProfileToggle.contains(event.target) && 
                !userProfileDropdown.contains(event.target) && 
                userProfileDropdown.classList.contains('active')) {
                
                // Add animation class for disappearing
                userProfileDropdown.style.animation = 'popdown 0.2s ease-out forwards';
                
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    userProfileDropdown.classList.remove('active');
                    profileArrow.classList.remove('flipped');
                }, 200);
            }
        });
    }
    
    // Duty status toggle
    const dutyToggleBtn = document.getElementById('duty-toggle');
    const dutyStatusText = document.getElementById('duty-status');
    
    if (dutyToggleBtn && dutyStatusText) {
        // Check local storage for duty status
        let isOnDuty = localStorage.getItem('dutyStatus') === 'on';
        let dutyTime = localStorage.getItem('dutyTime') || getCurrentTime();
        
        updateDutyStatus(isOnDuty, dutyTime);
        
        dutyToggleBtn.addEventListener('click', function() {
            isOnDuty = !isOnDuty;
            dutyTime = getCurrentTime();
            
            // Save to localStorage
            localStorage.setItem('dutyStatus', isOnDuty ? 'on' : 'off');
            localStorage.setItem('dutyTime', dutyTime);
            
            updateDutyStatus(isOnDuty, dutyTime);
        });
    }
    
    function updateDutyStatus(isOnDuty, time) {
        if (dutyToggleBtn && dutyStatusText) {
            if (isOnDuty) {
                dutyStatusText.textContent = `On Duty Since ${time}`;
                dutyToggleBtn.textContent = 'Off Duty';
                dutyToggleBtn.classList.remove('off');
            } else {
                dutyStatusText.textContent = `Last On Duty ${time}`;
                dutyToggleBtn.textContent = 'On Duty';
                dutyToggleBtn.classList.add('off');
            }
        }
    }
    
    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}); 