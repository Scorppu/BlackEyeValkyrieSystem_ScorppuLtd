document.addEventListener('DOMContentLoaded', function() {
    // Elements for license key verification
    const licenseKeyInput = document.getElementById('licenseKey');
    const verifyButton = document.getElementById('verifyLicenseButton');
    const verificationStep = document.getElementById('license-key-verification');
    const registrationFormPart1 = document.getElementById('registration-form-part1');
    const registrationFormPart2 = document.getElementById('registration-form-part2');
    const verifiedLicenseKeyInput = document.getElementById('verifiedLicenseKey');
    const finalLicenseKeyInput = document.getElementById('final-licenseKey');
    const modal = document.getElementById('verificationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const roleTypeSpan = document.getElementById('roleType');
    const proceedButton = document.getElementById('proceedButton');
    const cancelButton = document.getElementById('cancelButton');
    
    // Container elements for width control
    const mainContainer = document.getElementById('mainContainer');
    const mainForm = document.getElementById('mainForm');
    
    // Elements for form navigation
    const continueToStep2Button = document.getElementById('continueToStep2Button');
    const backToStep1Button = document.getElementById('backToStep1Button');
    const registrationForm = document.getElementById('registration-form');
    
    // Form fields
    const usernameInput = document.getElementById('username');
    const usernameStatus = document.getElementById('username-status');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const fullNameInput = document.getElementById('fullName');
    
    // Final form values
    const finalUsernameInput = document.getElementById('final-username');
    const finalPasswordInput = document.getElementById('final-password');
    const finalConfirmPasswordInput = document.getElementById('final-confirmPassword');
    
    // Username check debounce timer
    let usernameCheckTimer = null;
    let usernameIsAvailable = false;
    
    // Toggle password visibility
    document.querySelectorAll('.password-toggle').forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Check if username exists
    usernameInput.addEventListener('input', function() {
        const username = this.value.trim();
        
        // Clear any existing timer
        if (usernameCheckTimer) {
            clearTimeout(usernameCheckTimer);
        }
        
        // Reset status
        usernameStatus.className = '';
        usernameStatus.innerHTML = '';
        usernameIsAvailable = false;
        
        if (username.length < 3) {
            return;
        }
        
        // Show pending status
        usernameStatus.className = 'validation-pending';
        usernameStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Set timer to check username after user stops typing
        usernameCheckTimer = setTimeout(function() {
            checkUsernameAvailability(username);
        }, 500);
    });
    
    // Function to check username availability
    function checkUsernameAvailability(username) {
        fetch('/api/users/check-username?username=' + encodeURIComponent(username))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server error: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                if (data.available) {
                    usernameStatus.className = 'validation-success';
                    usernameStatus.innerHTML = '<i class="fas fa-check-circle"></i> Available';
                    usernameIsAvailable = true;
                } else {
                    usernameStatus.className = 'validation-error';
                    // Check if there's a specific message about reserved username
                    if (data.message) {
                        usernameStatus.innerHTML = '<i class="fas fa-times-circle"></i> Reserved';
                        document.getElementById('username-error').textContent = data.message;
                    } else {
                        usernameStatus.innerHTML = '<i class="fas fa-times-circle"></i> Already taken';
                    }
                    usernameIsAvailable = false;
                }
            })
            .catch(error => {
                console.error('Error checking username:', error);
                usernameStatus.className = 'validation-error';
                usernameStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error checking';
            });
    }
    
    // Normalize license key format
    licenseKeyInput.addEventListener('blur', function() {
        // Format as uppercase with dashes
        let key = this.value.trim().toUpperCase();
        
        // Remove existing dashes
        key = key.replace(/-/g, '');
        
        // Add dashes if we have at least 16 characters
        if (key.length >= 16) {
            key = key.substring(0, 4) + '-' + key.substring(4, 8) + '-' + 
                  key.substring(8, 12) + '-' + key.substring(12, 16);
            this.value = key;
        }
    });
    
    // Verify license key
    verifyButton.addEventListener('click', function() {
        const licenseKey = licenseKeyInput.value.trim();
        
        if (!licenseKey) {
            alert('Please enter a license key.');
            return;
        }
        
        console.log('Verifying license key:', licenseKey);
        
        // Send license key to server for verification
        fetch('/api/verify-license-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ licenseKey: licenseKey })
        })
        .then(response => {
            console.log('License key verification response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('License key verification response:', data);
            if (data.valid) {
                // Format role display for user (capitalize first letter)
                let displayRole = data.role;
                if (displayRole) {
                    displayRole = displayRole.charAt(0).toUpperCase() + displayRole.slice(1).toLowerCase();
                    roleTypeSpan.textContent = displayRole;
                } else {
                    roleTypeSpan.textContent = "User";
                }
                
                // Show confirmation modal
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            } else {
                alert('Invalid or expired license key. Please try again with a valid key.');
            }
        })
        .catch(error => {
            console.error('Error verifying license key:', error);
            alert('Error verifying license key. Please try again.');
        });
    });
    
    // Modal proceed button
    proceedButton.addEventListener('click', function() {
        // Hide modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Set the verified license key in the hidden input
        verifiedLicenseKeyInput.value = licenseKeyInput.value.trim();
        finalLicenseKeyInput.value = licenseKeyInput.value.trim();
        
        // Switch to registration form part 1
        verificationStep.classList.remove('active');
        registrationFormPart1.classList.add('active');
    });
    
    // Modal cancel button
    cancelButton.addEventListener('click', function() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });
    
    // Validate first part of registration form
    continueToStep2Button.addEventListener('click', function() {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        
        // Validate username
        if (!usernameInput.value.trim()) {
            document.getElementById('username-error').textContent = 'Username is required';
            isValid = false;
        } else if (usernameInput.value.trim().length < 3) {
            document.getElementById('username-error').textContent = 'Username must be at least 3 characters';
            isValid = false;
        } else if (!usernameIsAvailable) {
            document.getElementById('username-error').textContent = 'This username is not available. Please choose another one.';
            isValid = false;
        }
        
        // Validate password
        if (!passwordInput.value) {
            document.getElementById('password-error').textContent = 'Password is required';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
            isValid = false;
        }
        
        // Validate password confirmation
        if (passwordInput.value !== confirmPasswordInput.value) {
            document.getElementById('confirmPassword-error').textContent = 'Passwords do not match';
            isValid = false;
        }
        
        if (isValid) {
            // Set values for the final form submission
            finalUsernameInput.value = usernameInput.value;
            finalPasswordInput.value = passwordInput.value;
            finalConfirmPasswordInput.value = confirmPasswordInput.value;
            
            // Transition to step 2 with animation
            registrationFormPart1.classList.remove('active');
            
            // No need to expand width since it's already 800px
            
            // Show step 2
            setTimeout(() => {
                registrationFormPart2.classList.add('active');
                
                // Update step indicators
                document.querySelectorAll('.step-indicator .step-dot').forEach((dot, index) => {
                    if (index === 0) dot.classList.remove('active');
                    if (index === 1) dot.classList.add('active');
                });
            }, 100);
        }
    });
    
    // Back button to return to step 1
    backToStep1Button.addEventListener('click', function() {
        // Transition back to step 1 with animation
        registrationFormPart2.classList.remove('active');
        
        // Update step indicators
        document.querySelectorAll('.step-indicator .step-dot').forEach((dot, index) => {
            if (index === 0) dot.classList.add('active');
            if (index === 1) dot.classList.remove('active');
        });
        
        // Show step 1 after a short delay
        setTimeout(() => {
            registrationFormPart1.classList.add('active');
        }, 100);
    });
    
    // Handle form submission
    registrationForm.addEventListener('submit', function(e) {
        // Combine first and last name
        fullNameInput.value = firstNameInput.value + ' ' + lastNameInput.value;
        
        // Form validation for part 2
        let isValid = true;
        
        if (!firstNameInput.value.trim()) {
            document.getElementById('firstName-error').textContent = 'First name is required';
            isValid = false;
        }
        
        if (!lastNameInput.value.trim()) {
            document.getElementById('lastName-error').textContent = 'Last name is required';
            isValid = false;
        }
        
        if (!emailInput.value.trim()) {
            document.getElementById('email-error').textContent = 'Email is required';
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            document.getElementById('email-error').textContent = 'Please enter a valid email address';
            isValid = false;
        }
        
        if (!isValid) {
            e.preventDefault();
        }
    });
    
    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});