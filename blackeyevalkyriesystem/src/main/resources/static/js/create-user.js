document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-form');
    const alertBox = document.getElementById('alerts');
    const alertContent = document.querySelector('.alert-danger');
    const isEditMode = document.getElementById('userId') !== null;
    
    // Define licenseKeyPattern at the top level
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    // Track if the password has been modified in edit mode
    let passwordModified = false;
    
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
    
    // Validation popup elements
    const validationPopup = document.getElementById('validationPopup');
    const validationErrorList = document.getElementById('validationErrorList');
    const validationOkButton = document.getElementById('validationOk');
    
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
    
    // Handle validation popup
    if (validationOkButton) {
        validationOkButton.addEventListener('click', function() {
            validationPopup.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === successModal) {
            successModal.style.display = 'none';
            window.location.href = '/user/list';
        }
        if (event.target === errorModal) {
            errorModal.style.display = 'none';
        }
        if (event.target === validationPopup) {
            validationPopup.style.display = 'none';
        }
    });
    
    // Function to show success modal
    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = 'block';
    }
    
    // Function to show error modal
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
    
    // Function to show validation errors popup
    function showValidationPopup(errors) {
        // Clear previous errors
        validationErrorList.innerHTML = '';
        
        // Add each error to the list
        errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'validation-error-item';
            li.textContent = error;
            validationErrorList.appendChild(li);
        });
        
        // Show the popup
        validationPopup.style.display = 'block';
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
        
        // Remove any existing error message
        const existingError = field.parentNode.querySelector('.field-validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = document.createElement('span');
        errorElement.className = 'field-validation-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
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
            { id: 'email', name: 'Email' },
            { id: 'licenseKey', name: 'License Key' },
            { id: 'role', name: 'Role' }
        ];
        
        // Add password and confirmPassword to required fields if not in edit mode
        // or if password field has been modified in edit mode
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (!isEditMode) {
            requiredFields.push({ id: 'password', name: 'Password' });
            requiredFields.push({ id: 'confirmPassword', name: 'Confirm Password' });
        } else if (passwordModified) {
            // In edit mode, confirmPassword is required only if password has been modified
            requiredFields.push({ id: 'confirmPassword', name: 'Confirm Password' });
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
        
        // Check if passwords match when not in edit mode or if password field has a value in edit mode
        if (!isEditMode || (isEditMode && passwordInput.value.trim())) {
            if (passwordInput.value && confirmPasswordInput.value && 
                passwordInput.value !== confirmPasswordInput.value) {
                const errorMessage = 'Passwords do not match';
                errors.push(errorMessage);
                invalidFields.push('confirmPassword');
                addValidationMessage('confirmPassword', errorMessage);
            }
        }
        
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
                    // Add error message
                    const fieldName = this.previousElementSibling.textContent.replace('*', '').trim();
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
                        const fieldName = this.previousElementSibling.textContent.replace('*', '').trim();
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
        
        // Add validation for confirm password
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        // In edit mode, track if password has been modified
        if (isEditMode) {
            passwordInput.addEventListener('input', function() {
                passwordModified = true;
                this.classList.add('password-modified');
                
                // Set the placeholder back to normal now that the user is typing
                this.placeholder = 'Please do not enter a simple password';
                
                // Make the confirmPassword required now
                confirmPasswordInput.setAttribute('required', 'required');
                confirmPasswordInput.placeholder = 'Re-enter your password';
            });
        }
        
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
        
        // Also check password match when password field changes
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
        
        // Add an event listener to confirmPassword in edit mode
        if (isEditMode) {
            confirmPasswordInput.addEventListener('input', function() {
                // Set the placeholder back to normal now that the user is typing
                this.placeholder = 'Re-enter your password';
            });
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form before submission
            const validation = validateForm();
            if (!validation.isValid) {
                // Display the validation errors inline AND in the popup
                const requiredFields = [
                    { id: 'username', name: 'Username' },
                    { id: 'firstName', name: 'First Name' },
                    { id: 'lastName', name: 'Last Name' },
                    { id: 'email', name: 'Email' },
                    { id: 'licenseKey', name: 'License Key' },
                    { id: 'role', name: 'Role' }
                ];
                
                if (!isEditMode) {
                    requiredFields.push({ id: 'password', name: 'Password' });
                    requiredFields.push({ id: 'confirmPassword', name: 'Confirm Password' });
                    
                    // Check password match
                    const passwordInput = document.getElementById('password');
                    const confirmPasswordInput = document.getElementById('confirmPassword');
                    if (passwordInput.value && confirmPasswordInput.value && 
                        passwordInput.value !== confirmPasswordInput.value) {
                        addValidationMessage('confirmPassword', 'Passwords do not match');
                    }
                } else if (passwordModified) {
                    // In edit mode, confirm password is required if password is changed
                    requiredFields.push({ id: 'confirmPassword', name: 'Confirm Password' });
                    
                    // Check password match
                    if (passwordInput.value && confirmPasswordInput.value && 
                        passwordInput.value !== confirmPasswordInput.value) {
                        addValidationMessage('confirmPassword', 'Passwords do not match');
                    }
                }
                
                requiredFields.forEach(field => {
                    const input = document.getElementById(field.id);
                    if (!input.value.trim()) {
                        addValidationMessage(field.id, `${field.name} is required`);
                    }
                });
                
                // Check email format again
                if (emailInput.value.trim() && !isValidEmail(emailInput.value)) {
                    addValidationMessage('email', 'Invalid email address');
                }
                
                // Check license key format again
                if (licenseKeyInput.value.trim() && !licenseKeyPattern.test(licenseKeyInput.value)) {
                    addValidationMessage('licenseKey', 'License Key must be in the format AAAA-BBBB-CCCC-DDDD');
                }
                
                // Show the popup with all errors
                showValidationPopup(validation.errors);
                return;
            }
            
            // Hide any previous alerts
            alertBox.style.display = 'none';
            
            // Get form data
            const formData = new FormData(form);
            const userData = {};
            
            formData.forEach((value, key) => {
                // Convert string "true"/"false" to boolean for active field
                if (key === 'active') {
                    userData[key] = value === 'true';
                } else if (key !== 'confirmPassword') {  // Exclude confirmPassword field
                    userData[key] = value;
                }
            });
            
            // Determine endpoint and method based on if we're in edit mode
            const endpoint = isEditMode 
                ? `/api/users/${userData.id}`
                : '/api/users';
                
            const method = isEditMode ? 'PUT' : 'POST';
            
            // Remove empty password if in edit mode
            if (isEditMode && !userData.password) {
                delete userData.password;
            }
            
            // First validate the license key
            fetch('/api/licenses/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseKey: userData.licenseKey })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Invalid license key');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (!data.valid) {
                    throw new Error(data.message || 'Invalid license key');
                }
                
                // If license is valid, proceed with user creation/update
                return fetch(endpoint, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    // Get more detailed error information
                    return response.text().then(text => {
                        console.error('Server error response:', text);
                        
                        // Try to parse the error response as JSON
                        let errorMessage = `Server responded with status: ${response.status} ${response.statusText}`;
                        try {
                            const errorData = JSON.parse(text);
                            if (errorData.error) {
                                // Use the specific error message from the server
                                errorMessage = errorData.error;
                            }
                        } catch (e) {
                            // If the response is not valid JSON, try to extract a meaningful message from the text
                            if (text && text.includes('error')) {
                                const matches = text.match(/"error"\s*:\s*"([^"]+)"/);
                                if (matches && matches.length > 1) {
                                    errorMessage = matches[1];
                                }
                            }
                        }
                        
                        throw new Error(errorMessage);
                    });
                }
                return response.json();
            })
            .then(data => {
                const action = isEditMode ? 'updated' : 'created';
                
                // Show success modal instead of alert
                showSuccessModal(`User ${action} successfully!`);
            })
            .catch((error) => {
                console.error('Error:', error);
                showErrorModal(`Error ${isEditMode ? 'updating' : 'creating'} user: ${error.message}`);
            });
        });
    }
});