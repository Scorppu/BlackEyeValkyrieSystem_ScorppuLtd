document.addEventListener('DOMContentLoaded', function() {
    // Toggle navigation on mobile
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Dropdown menus in sidebar
    const dropdownLinks = document.querySelectorAll('.dropdown-toggle');
    
    if (dropdownLinks.length > 0) {
        dropdownLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('expanded');
                const submenu = this.nextElementSibling;
                if (submenu.style.maxHeight) {
                    submenu.style.maxHeight = null;
                } else {
                    submenu.style.maxHeight = submenu.scrollHeight + "px";
                }
            });
        });
        
        // Auto-expand dropdown if a child is active
        dropdownLinks.forEach(function(link) {
            const submenu = link.nextElementSibling;
            const hasActiveChild = submenu.querySelector('.active');
            
            if (hasActiveChild) {
                link.classList.add('expanded');
                submenu.style.maxHeight = submenu.scrollHeight + "px";
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
}); 