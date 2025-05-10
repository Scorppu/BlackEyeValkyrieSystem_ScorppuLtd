document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-form');
    const alertBox = document.getElementById('alerts');
    const alertContent = document.querySelector('.alert-danger');
    const isEditMode = document.getElementById('userId') !== null;
    
    // Add edit-mode class to form container if in edit mode
    if (isEditMode) {
        const formContainer = document.querySelector('.user-form-container');
        if (formContainer) {
            formContainer.classList.add('edit-mode');
        }
    }
    
    // Define licenseKeyPattern at the top level
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    // Track if the password has been modified in edit mode
    let passwordModified = false;
    
    // License key generation
    const generateLicenseKeyBtn = document.getElementById('generateLicenseKeyBtn');
    const roleSelect = document.getElementById('role');
    const licenseKeyInput = document.getElementById('licenseKey');
    
    // Hide license key and role fields in edit mode
    if (isEditMode) {
        const licenseKeyGroup = licenseKeyInput.closest('.form-group');
        const roleGroup = roleSelect.closest('.form-group');
        
        // Make license key field read-only instead of hiding it
        if (licenseKeyInput) {
            licenseKeyInput.setAttribute('readonly', 'readonly');
            licenseKeyInput.classList.add('readonly-input');
            // Hide the generate button in edit mode
            const generateBtn = document.getElementById('generateLicenseKeyBtn');
            if (generateBtn) {
                generateBtn.style.display = 'none';
            }
            
            // Get the role from the license key
            const licenseKey = licenseKeyInput.value;
            if (licenseKey) {
                fetch(`/api/licenses/${licenseKey}`)
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error('Failed to fetch license key data');
                    })
                    .then(data => {
                        if (data && data.role) {
                            // Set the role in the select element
                            roleSelect.value = data.role.toLowerCase();
                            // Store the original role value
                            roleSelect.setAttribute('data-original-role', data.role.toUpperCase());
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching license key data:', error);
                    });
            }
        }
        
        // Make role field read-only instead of hiding it
        if (roleSelect) {
            roleSelect.setAttribute('disabled', 'disabled');
            roleSelect.classList.add('readonly-input');
        }
    }
    
    // Password generation and toggle
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    
    // Get confirmPasswordInput (may not exist)
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Success modal elements
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    const successOkButton = document.getElementById('successOk');
    
    // Error modal elements
    const errorModal = document.getElementById('errorModal');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    const errorOkButton = document.getElementById('errorOk');
    
    // Handle success modal
    successOkButton.addEventListener('click', function() {
        successModal.style.display = 'none';
        // Redirect to user list
        window.location.href = '/user/list';
    });
    
    // Handle error modal
    errorOkButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === successModal) {
            successModal.style.display = 'none';
            window.location.href = '/user/list';
        }
        if (event.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
    
    // Function to show success modal
    function showSuccessModal(message) {
        // Replace modal with sessionStorage notification
        sessionStorage.setItem('userNotification', JSON.stringify({
            type: 'success',
            message: message
        }));
        
        // Redirect to user list
        window.location.href = '/user/list';
    }
    
    // Function to show error modal
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
    
    // Function to show validation errors popup
    function showValidationPopup(errors) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.validation-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        const existingOverlay = document.querySelector('.validation-popup-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'validation-popup-overlay';
        document.body.appendChild(overlay);
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'validation-popup';
        
        // Create popup content
        popup.innerHTML = `
            <div class="validation-popup-content">
                <div class="validation-popup-header">
                    Form Validation Error
                    <button class="validation-popup-close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="validation-popup-body">
                    <p class="validation-popup-title">Please fix the following errors:</p>
                    <ul class="validation-error-list">
                        ${errors.map(error => `
                            <li class="validation-error-item">
                                <div class="validation-error-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </div>
                                <div class="validation-error-text">${error}</div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="validation-popup-footer">
                    <button class="validation-popup-button">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add event listeners
        const closeButton = popup.querySelector('.validation-popup-close');
        const okButton = popup.querySelector('.validation-popup-button');
        const closePopup = () => {
            popup.remove();
            overlay.remove();
            document.body.classList.remove('modal-open');
        };
        
        closeButton.addEventListener('click', closePopup);
        okButton.addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
        
        // Add modal-open class to prevent scrolling
        document.body.classList.add('modal-open');
    }
    
    // Function to mark invalid fields
    function markInvalidFields(invalidFields) {
        // Reset all fields first
        const allInputs = form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.classList.remove('invalid-input');
            // Remove any existing validation messages
            const errorElement = input.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        // Mark invalid fields
        invalidFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('invalid-input');
            }
        });
    }
    
    // Function to add validation message below an input
    function addValidationMessage(inputId, message) {
        const field = document.getElementById(inputId);
        if (!field) return;
        
        // Get the parent node safely
        const parent = field.parentNode;
        if (!parent) return;
        
        // Remove any existing error message
        const existingError = parent.querySelector('.field-validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('span');
        errorElement.className = 'field-validation-error';
        errorElement.textContent = message;
        parent.appendChild(errorElement);
    }
    
    // Function to generate a random password
    function generateRandomPassword(length = 8) {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        
        // Ensure at least one of each character type
        let password = '';
        password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        
        // Complete the rest of the password
        const allChars = uppercaseChars + lowercaseChars + numberChars;
        for (let i = 3; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        // Shuffle the password characters
        return shuffleString(password);
    }
    
    // Function to shuffle a string (Fisher-Yates algorithm)
    function shuffleString(string) {
        const array = string.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }
    
    // Add event listener for the generate password button
    if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', function() {
            const randomPassword = generateRandomPassword(8);
            passwordInput.value = randomPassword;
            
            // Mark the password as modified in edit mode
            if (isEditMode) {
                passwordModified = true;
                passwordInput.classList.add('password-modified');
            }
            
            // Clear any validation messages
            const errorElement = passwordInput.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            passwordInput.classList.remove('invalid-input');
            
            // Show password briefly for better user experience
            passwordInput.type = 'text';
            setTimeout(() => {
                passwordInput.type = 'password';
            }, 1500);
            
            // Show toast notification for password generated
            displayNotification('success', 'A random password has been generated.');
        });
    }
    
    // Add event listener for the toggle password button
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            // Toggle the eye icon
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Function to generate a license key
    if (generateLicenseKeyBtn) {
        generateLicenseKeyBtn.addEventListener('click', function() {
            const selectedRole = roleSelect.value.toLowerCase(); // Convert to lowercase
            
            if (!selectedRole) {
                showErrorModal('Please select a role first');
                return;
            }
            
            // Show generating state
            generateLicenseKeyBtn.textContent = 'Generating...';
            generateLicenseKeyBtn.disabled = true;
            
            // Call the API to generate a license key
            fetch('/api/licenses/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: selectedRole,
                    expiryOption: 'custom',
                    customDate: getTwoDaysLaterDate() // Function to get date 2 days later
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate license key');
                }
                return response.json();
            })
            .then(data => {
                // Set the license key in the input field
                licenseKeyInput.value = data.licenseKey;
                
                // Format the expiry date for display in a tooltip or message
                const expiryDate = data.expiresOn ? new Date(data.expiresOn).toLocaleDateString() : 'No expiry';
                
                // Reset button state
                generateLicenseKeyBtn.textContent = 'Generate Key';
                generateLicenseKeyBtn.disabled = false;
                
                // Clear any validation errors on the license key field
                licenseKeyInput.classList.remove('invalid-input');
                const errorElement = licenseKeyInput.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                // Trigger the input event to format the license key
                const inputEvent = new Event('input', { bubbles: true });
                licenseKeyInput.dispatchEvent(inputEvent);
                
                // Show toast notification for license key generated
                displayNotification('success', `A license key for the role '${selectedRole}' has been generated.`);
            })
            .catch(error => {
                console.error('Error generating license key:', error);
                showErrorModal('Failed to generate license key: ' + error.message);
                
                // Reset button state
                generateLicenseKeyBtn.textContent = 'Generate Key';
                generateLicenseKeyBtn.disabled = false;
            });
        });
    }
    
    // Function to get date 2 days later in YYYY-MM-DD format
    function getTwoDaysLaterDate() {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
    
    // Function to validate the form
    function validateForm() {
        const errors = [];
        const invalidFields = [];
        
        // Check required fields
        const requiredFields = [
            { id: 'username', name: 'Username' },
            { id: 'firstName', name: 'First Name' },
            { id: 'lastName', name: 'Last Name' },
            { id: 'email', name: 'Email' }
        ];
        
        // Add role and license key to required fields if not in edit mode
        if (!isEditMode) {
            requiredFields.push({ id: 'role', name: 'Role' });
            requiredFields.push({ id: 'licenseKey', name: 'License Key' });
        }
        
        // Add password to required fields if not in edit mode
        if (!isEditMode) {
            requiredFields.push({ id: 'password', name: 'Password' });
        }
        
        // Clear all existing validation messages first
        const allInputs = form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            const errorElement = input.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        // Check each required field
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                const errorMessage = `${field.name} is required`;
                errors.push(errorMessage);
                invalidFields.push(field.id);
                addValidationMessage(field.id, errorMessage);
            }
        });
        
        // Validate email format
        const emailInput = document.getElementById('email');
        if (emailInput.value.trim() && !isValidEmail(emailInput.value)) {
            const errorMessage = 'Invalid email adress';
            errors.push(errorMessage);
            invalidFields.push('email');
            addValidationMessage('email', errorMessage);
        }
        
        // Validate license key format
        const licenseKeyInput = document.getElementById('licenseKey');
        if (licenseKeyInput.value.trim() && !licenseKeyPattern.test(licenseKeyInput.value)) {
            const errorMessage = 'License key must be in the format AAAA-BBBB-CCCC-DDDD';
            errors.push(errorMessage);
            invalidFields.push('licenseKey');
            addValidationMessage('licenseKey', errorMessage);
        }
        
        // Mark invalid fields
        markInvalidFields(invalidFields);
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Add validation to check if license key role matches selected role
    function validateLicenseKeyRole() {
        const licenseKey = licenseKeyInput.value.trim();
        const selectedRole = roleSelect.value.toLowerCase(); // Convert to lowercase
        
        if (!licenseKey || !selectedRole) {
            return Promise.resolve({ valid: false, message: 'License key and role are required' });
        }
        
        return fetch(`/api/licenses/${licenseKey}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        return { valid: false, message: 'License key not found' };
                    }
                    throw new Error('Error validating license key');
                }
                return response.json();
            })
            .then(data => {
                // Check license key status
                if (data.status !== 'Active') {
                    return { 
                        valid: false, 
                        message: `License key is ${data.status.toLowerCase()}. Only active license keys can be used.` 
                    };
                }
                
                // Check role match - convert both to lowercase for comparison
                if (data.role.toLowerCase() !== selectedRole) {
                    return { 
                        valid: false, 
                        message: `License key is for role ${data.role.toLowerCase()}, but you selected ${selectedRole}` 
                    };
                }
                
                return { valid: true, licenseKeyData: data };
            })
            .catch(error => {
                console.error('Error checking license key:', error);
                return { valid: false, message: 'Error validating license key' };
            });
    }
    
    // Submit form handler - add validation for license key role
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // First validate the form fields
            const validation = validateForm();
            
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            // Skip license key validation in edit mode
            if (!isEditMode) {
                // Then validate license key role
                validateLicenseKeyRole().then(result => {
                    if (!result.valid) {
                        showErrorModal(result.message);
                        return;
                    }
                    submitFormData();
                });
            } else {
                // In edit mode, skip license key validation
                submitFormData();
            }
            
            // Function to submit form data
            function submitFormData() {
                // Get form data
                const formData = {};
                const formInputs = form.querySelectorAll('input, select');
                formInputs.forEach(input => {
                    // Skip empty password in edit mode
                    if (isEditMode && input.id === 'password' && !input.value) {
                        return;
                    }
                    
                    if (input.name) {
                        if (input.type === 'radio') {
                            if (input.checked) {
                                formData[input.name] = input.value === 'true';
                            }
                        } else if (input.id === 'role') {
                            // In edit mode, get the role from the license key
                            if (isEditMode) {
                                const licenseKey = document.getElementById('licenseKey').value;
                                // Use the stored original role from the license key
                                formData[input.name] = input.getAttribute('data-original-role');
                            } else {
                                formData[input.name] = input.value.toUpperCase();
                            }
                        } else if (input.id === 'active' || input.id === 'activeHidden') {
                            // Convert string 'true'/'false' to actual boolean
                            formData[input.name] = input.value === 'true';
                        } else {
                            formData[input.name] = input.value;
                        }
                    }
                });
                
                // Explicitly set the active status based on our helper function
                formData.active = getActiveStatus();
                
                // Get the endpoint and method
                const endpoint = isEditMode ? `/api/users/${formData.id}` : '/api/users';
                const method = isEditMode ? 'PUT' : 'POST';
                
                // Log the form data for debugging
                console.log('Submitting form data:', formData);
                console.log('User active status:', formData.active);
                
                // Submit the form data via AJAX
                fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.message || 'An error occurred');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Now update the license key to associate it with the new user
                    if (!isEditMode) {
                        const licenseKey = document.getElementById('licenseKey').value;
                        updateLicenseKeyWithUser(licenseKey, data.id)
                            .then(() => {
                                showSuccessModal(`User ${isEditMode ? 'updated' : 'created'} successfully`);
                            })
                            .catch(error => {
                                console.error('Error updating license key:', error);
                                showErrorModal(`User created but failed to update license key: ${error.message}`);
                            });
                    } else {
                        showSuccessModal(`User ${isEditMode ? 'updated' : 'created'} successfully`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showErrorModal(error.message || 'An error occurred');
                });
            }
        });
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
    
    // Ensure content card fills available space
    const contentCard = document.querySelector('.content-card');
    const adjustContentCardHeight = () => {
        const contentContainer = document.querySelector('[layout\\:fragment="content"]');
        if (contentContainer) {
            contentCard.style.height = (contentContainer.offsetHeight - 20) + 'px';
        }
    };
    
    // Adjust height on load and resize
    adjustContentCardHeight();
    window.addEventListener('resize', adjustContentCardHeight);
    
    // Setup unsaved changes tracking
    setupUnsavedChangesTracking();
    
    if (form) {
        // Auto-capitalize and format license key input
        const licenseKeyInput = document.getElementById('licenseKey');
        licenseKeyInput.addEventListener('input', function(e) {
            // Store the current cursor position
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Get the raw value without dashes
            let value = this.value.replace(/-/g, '').toUpperCase();
            
            // Format with dashes
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0 && formattedValue.length < 19) { // 19 is the max length (16 chars + 3 dashes)
                    formattedValue += '-';
                }
                formattedValue += value[i];
            }
            
            // Set the formatted value
            this.value = formattedValue;
            
            // Calculate new cursor position (adjust for added dashes)
            let newPosition = start;
            // If we added a dash right before the cursor, move cursor forward
            if (start > 0 && start % 5 === 0 && this.value.charAt(start - 1) === '-') {
                newPosition++;
            }
            // Make sure we don't exceed the length
            newPosition = Math.min(newPosition, this.value.length);
            
            // Restore cursor position
            this.setSelectionRange(newPosition, newPosition);
        });
        
        // Function to validate license key format
        function validateLicenseKey() {
            const licenseKey = licenseKeyInput.value;
            if (!licenseKeyPattern.test(licenseKey)) {
                return "License key must be in the format AAAA-BBBB-CCCC-DDDD";
            }
            return null;
        }
        
        // Add validation to required fields on blur
        const requiredInputs = form.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', function() {
                // Remove existing error message
                const errorElement = this.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                if (!this.value.trim()) {
                    this.classList.add('invalid-input');
                    // Add error message - with safe access to label
                    const label = this.previousElementSibling;
                    let fieldName;
                    
                    if (label && label.textContent) {
                        fieldName = label.textContent.replace('*', '').trim();
                    } else {
                        // Fallback to formatted ID
                        fieldName = this.id.charAt(0).toUpperCase() + this.id.slice(1);
                    }
                    
                    addValidationMessage(this.id, `${fieldName} is required`);
                } else {
                    this.classList.remove('invalid-input');
                }
            });
            
            // Also check on change for selects
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    // Remove existing error message
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    if (!this.value.trim()) {
                        this.classList.add('invalid-input');
                        // Add error message
                        const label = this.previousElementSibling;
                        // Safely get the field name, with fallback
                        const fieldName = label && label.textContent ? 
                            label.textContent.replace('*', '').trim() : 
                            this.id.charAt(0).toUpperCase() + this.id.slice(1);
                        addValidationMessage(this.id, `${fieldName} is required`);
                    } else {
                        this.classList.remove('invalid-input');
                    }
                });
            }
        });
        
        // Add validation on blur for license key
        licenseKeyInput.addEventListener('blur', function() {
            // Remove existing error message
            const errorElement = this.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            
            const errorMessage = validateLicenseKey();
            if (errorMessage && this.value.trim()) {
                this.classList.add('invalid-input');
                addValidationMessage('licenseKey', errorMessage);
            } else if (!this.value.trim()) {
                this.classList.add('invalid-input');
                addValidationMessage('licenseKey', 'License Key is required');
            } else {
                this.classList.remove('invalid-input');
            }
        });
        
        // Add validation on blur for email
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('blur', function() {
            // Remove existing error message
            const errorElement = this.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            
            if (!this.value.trim()) {
                this.classList.add('invalid-input');
                addValidationMessage('email', 'Email is required');
            } else if (!isValidEmail(this.value)) {
                this.classList.add('invalid-input');
                addValidationMessage('email', 'Email format is invalid');
            } else {
                this.classList.remove('invalid-input');
            }
        });
        
        // Add validation for confirm password if it exists in the form
        // In edit mode, track if password has been modified
        if (isEditMode && passwordInput) {
            passwordInput.addEventListener('input', function() {
                passwordModified = true;
                this.classList.add('password-modified');
                
                // Set the placeholder back to normal now that the user is typing
                this.placeholder = 'Please do not enter a simple password';
                
                // Make the confirmPassword required now if it exists
                if (confirmPasswordInput) {
                confirmPasswordInput.setAttribute('required', 'required');
                confirmPasswordInput.placeholder = 'Re-enter your password';
                }
            });
        }
        
        // Only add event listeners to confirmPasswordInput if it exists
        if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            // Remove existing error message
            const errorElement = this.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            
            // In edit mode, only validate if password field has been modified
            const shouldValidate = !isEditMode || (isEditMode && passwordModified);
            
            if (shouldValidate) {
                if (!this.value.trim()) {
                    this.classList.add('invalid-input');
                    addValidationMessage('confirmPassword', 'Confirm Password is required');
                } else if (this.value !== passwordInput.value) {
                    this.classList.add('invalid-input');
                    addValidationMessage('confirmPassword', 'Passwords do not match');
                } else {
                    this.classList.remove('invalid-input');
                }
            } else {
                this.classList.remove('invalid-input');
            }
        });
            
            // Add an event listener to confirmPassword in edit mode
            if (isEditMode) {
                confirmPasswordInput.addEventListener('input', function() {
                    // Set the placeholder back to normal now that the user is typing
                    this.placeholder = 'Re-enter your password';
                });
            }
        }
        
        // Also check password match when password field changes
        if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value) {
                // Remove existing error message
                const errorElement = confirmPasswordInput.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                if (this.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.classList.add('invalid-input');
                    addValidationMessage('confirmPassword', 'Passwords do not match');
                } else {
                    confirmPasswordInput.classList.remove('invalid-input');
                }
            }
            
            // In edit mode, dynamically set confirmPassword as required when password has a value
            if (isEditMode) {
                if (this.value.trim()) {
                    confirmPasswordInput.setAttribute('required', 'required');
                } else {
                    confirmPasswordInput.removeAttribute('required');
                    // Clear any error when password is empty
                    confirmPasswordInput.classList.remove('invalid-input');
                    const errorElement = confirmPasswordInput.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                }
            }
        });
        }
    }
    
    // Function to update license key with user information
    function updateLicenseKeyWithUser(licenseKey, userId) {
        console.log(`Attempting to update license key ${licenseKey} for user ${userId}`);
            
        // First check if the license key exists and is active
        return fetch(`/api/licenses/${licenseKey}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('License key not found');
                    }
                    throw new Error('Error checking license key');
                }
                return response.json();
            })
            .then(licenseKeyData => {
                // Only allow if license key is active
                if (licenseKeyData.status !== 'Active') {
                    throw new Error(`License key is ${licenseKeyData.status.toLowerCase()}. Only active license keys can be used.`);
                }
                
                console.log(`License key found with status: ${licenseKeyData.status} and role: ${licenseKeyData.role}`);
                
                // Use the assignLicenseKeyToUser endpoint available in the backend service
                return fetch(`/api/licenses/assign-to-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        licenseKey: licenseKey,
                        userId: userId
                    })
            })
            .then(response => {
                if (!response.ok) {
                        return response.text().then(text => {
                            // Try to parse as JSON, but handle case where it's not JSON
                            try {
                                const errorData = JSON.parse(text);
                                console.error('License key assignment error response:', errorData);
                                throw new Error(errorData.message || 'Failed to assign license key to user');
                            } catch (e) {
                                console.error('License key assignment error (non-JSON):', text);
                                throw new Error(`Failed to assign license key: ${text || 'Unknown error'}`);
                            }
                        });
                    }
                    
                    console.log('License key assigned successfully');
                    
                    // Just return a success object since the endpoint might not return data
                    return {
                        success: true,
                        message: 'License key assigned successfully'
                    };
                });
            })
            .catch(error => {
                console.error('Error in updateLicenseKeyWithUser:', error);
                return Promise.reject(error);
        });
    }
    
    // Hidden field conflict prevention for active status
    const activeSelect = document.getElementById('active');
    const activeHidden = document.getElementById('activeHidden');

    // If both the select and hidden field exist, ensure they don't conflict
    if (activeSelect && activeHidden) {
        // Initially set the hidden value to match the select
        activeHidden.value = activeSelect.value;
        
        // Update hidden input when select changes
        activeSelect.addEventListener('change', function() {
            activeHidden.value = activeSelect.value;
        });
        
        // Optional: Add visual indication for inactive status
        if (activeSelect.value === 'false') {
            const formContainer = document.querySelector('.user-form-container');
            if (formContainer) {
                formContainer.classList.add('inactive-user');
            }
        }
        
        // Update visual status when changed
        activeSelect.addEventListener('change', function() {
            const formContainer = document.querySelector('.user-form-container');
            if (formContainer) {
                if (this.value === 'false') {
                    formContainer.classList.add('inactive-user');
                } else {
                    formContainer.classList.remove('inactive-user');
                }
            }
        });
    }

    // Make sure we use the correct active status in form submission
    function getActiveStatus() {
        // If admin toggle exists, use its value
        if (activeSelect) {
            return activeSelect.value === 'true';
        }
        // Otherwise, use the hidden input
        else if (activeHidden) {
            return activeHidden.value === 'true';
        }
        // Default fallback
        return true;
    }

    // Set default active status for new users
    if (!isEditMode && activeSelect) {
        // Set to "true" (active) by default for new users
        activeSelect.value = "true";
        
        // Trigger change event to ensure any listeners respond
        const changeEvent = new Event('change', { bubbles: true });
        activeSelect.dispatchEvent(changeEvent);
        
        console.log('New user: Setting default active status to true');
    }
    
    // Track form changes and handle navigation
    function setupUnsavedChangesTracking() {
        let formChanged = false;
        const formInputs = form.querySelectorAll('input, select, textarea');
        const cancelButton = document.querySelector('.form-actions .btn-secondary');
        const initialFormState = captureFormState();
        
        // Capture the initial state of the form
        function captureFormState() {
            const state = {};
            formInputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    state[input.id] = input.checked;
                } else {
                    state[input.id] = input.value;
                }
            });
            return state;
        }
        
        // Check if the form state has changed
        function hasFormChanged() {
            const currentState = captureFormState();
            for (const key in currentState) {
                if (initialFormState[key] !== currentState[key]) {
                    return true;
                }
            }
            return false;
        }
        
        // Track changes to form inputs
        formInputs.forEach(input => {
            input.addEventListener('change', function() {
                formChanged = hasFormChanged();
            });
            
            input.addEventListener('input', function() {
                formChanged = hasFormChanged();
            });
        });
        
        // Handle cancel button click
        if (cancelButton) {
            cancelButton.addEventListener('click', function(e) {
                if (formChanged) {
                    e.preventDefault();
                    showUnsavedChangesPopup();
                }
            });
        }
        
        // Handle clicks on sidebar links or other navigation
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            // Ignore submission buttons and same-page links
            if (link && 
                !link.classList.contains('btn-primary') && 
                !link.getAttribute('href').startsWith('#')) {
                
                if (formChanged) {
                    e.preventDefault();
                    const targetUrl = link.getAttribute('href');
                    showUnsavedChangesPopup(targetUrl);
                }
            }
        });
        
        // Show the unsaved changes popup
        function showUnsavedChangesPopup(targetUrl = '/user/list') {
            // Remove any existing popup
            const existingPopup = document.querySelector('.unsaved-changes-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            // Create the popup
            const popup = document.createElement('div');
            popup.className = 'unsaved-changes-popup';
            
            popup.innerHTML = `
                <div class="unsaved-changes-content">
                    <div class="unsaved-changes-header">
                        Unsaved Changes
                    </div>
                    <div class="unsaved-changes-body">
                        <div class="unsaved-changes-message">
                            You have unsaved changes that will be lost if you leave this page. 
                            Do you want to discard these changes?
                        </div>
                        <div class="unsaved-changes-actions">
                            <button class="unsaved-changes-action unsaved-changes-cancel">Cancel</button>
                            <button class="unsaved-changes-action unsaved-changes-discard">Discard Changes</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(popup);
            
            // Add event listeners
            const cancelButton = popup.querySelector('.unsaved-changes-cancel');
            const discardButton = popup.querySelector('.unsaved-changes-discard');
            
            cancelButton.addEventListener('click', function() {
                popup.remove();
            });
            
            discardButton.addEventListener('click', function() {
                // Redirect to the target URL
                window.location.href = targetUrl;
            });
        }
    }

    // Add displayNotification function if not present
    function displayNotification(type, message) {
        // Create notification container if it doesn't exist
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            
            // Insert at the top of the content section
            const contentSection = document.querySelector('[layout\\:fragment="content"]');
            if (contentSection) {
                contentSection.insertBefore(notificationContainer, contentSection.firstChild);
            } else {
                document.body.insertBefore(notificationContainer, document.body.firstChild);
            }
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = '';
        if (type === 'success') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'error') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        }
        
        // Set notification content
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
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    // Remove container if empty
                    if (notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            });
        }
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    // Remove container if empty
                    if (notificationContainer && notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            }
        }, 6000);
    }
});