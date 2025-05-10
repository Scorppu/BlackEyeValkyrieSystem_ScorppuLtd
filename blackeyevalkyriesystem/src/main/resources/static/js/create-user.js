document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-form');
    const alertBox = document.getElementById('alerts');
    const alertContent = document.querySelector('.alert-danger');
    const isEditMode = document.getElementById('userId') !== null;
    
    if (isEditMode) {
        const formContainer = document.querySelector('.user-form-container');
        if (formContainer) {
            formContainer.classList.add('edit-mode');
        }
    }
    
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    let passwordModified = false;
    
    const generateLicenseKeyBtn = document.getElementById('generateLicenseKeyBtn');
    const roleSelect = document.getElementById('role');
    const licenseKeyInput = document.getElementById('licenseKey');
    
    if (isEditMode) {
        const licenseKeyGroup = licenseKeyInput.closest('.form-group');
        const roleGroup = roleSelect.closest('.form-group');
        
        if (licenseKeyInput) {
            licenseKeyInput.setAttribute('readonly', 'readonly');
            licenseKeyInput.classList.add('readonly-input');
            const generateBtn = document.getElementById('generateLicenseKeyBtn');
            if (generateBtn) {
                generateBtn.style.display = 'none';
            }
            
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
                            roleSelect.value = data.role.toLowerCase();
                            roleSelect.setAttribute('data-original-role', data.role.toUpperCase());
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching license key data:', error);
                    });
            }
        }
        
        if (roleSelect) {
            roleSelect.setAttribute('disabled', 'disabled');
            roleSelect.classList.add('readonly-input');
        }
    }
    
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    const successOkButton = document.getElementById('successOk');
    
    const errorModal = document.getElementById('errorModal');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    const errorOkButton = document.getElementById('errorOk');
    
    const validationPopup = document.getElementById('validationPopup');
    const validationErrorList = document.getElementById('validationErrorList');
    const validationOkButton = document.getElementById('validationOk');
    
    successOkButton.addEventListener('click', function() {
        successModal.style.display = 'none';
        window.location.href = '/user/list';
    });
    
    errorOkButton.addEventListener('click', function() {
        errorModal.style.display = 'none';
    });
    
    if (validationOkButton) {
        validationOkButton.addEventListener('click', function() {
            validationPopup.style.display = 'none';
        });
    }
    
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
    
    /**
     * Shows a success modal with the specified message
     * @param {string} message - Message to display in the modal
     */
    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = 'block';
    }
    
    /**
     * Shows an error modal with the specified message
     * @param {string} message - Error message to display
     */
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
    
    /**
     * Shows validation errors in a popup
     * @param {string[]} errors - Array of error messages
     */
    function showValidationPopup(errors) {
        validationErrorList.innerHTML = '';
        
        errors.forEach(error => {
            const li = document.createElement('li');
            li.className = 'validation-error-item';
            li.textContent = error;
            validationErrorList.appendChild(li);
        });
        
        validationPopup.style.display = 'block';
    }
    
    /**
     * Marks invalid fields with red border
     * @param {string[]} invalidFields - Array of field IDs to mark as invalid
     */
    function markInvalidFields(invalidFields) {
        const allInputs = form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.classList.remove('invalid-input');
            const errorElement = input.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        invalidFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('invalid-input');
            }
        });
    }
    
    /**
     * Adds validation message below an input field
     * @param {string} inputId - ID of the input element
     * @param {string} message - Validation message to display
     */
    function addValidationMessage(inputId, message) {
        const field = document.getElementById(inputId);
        if (!field) return;
        
        const parent = field.parentNode;
        if (!parent) return;
        
        const existingError = parent.querySelector('.field-validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorElement = document.createElement('span');
        errorElement.className = 'field-validation-error';
        errorElement.textContent = message;
        parent.appendChild(errorElement);
    }
    
    /**
     * Generates a random password with at least one uppercase, one lowercase, and one number
     * @param {number} length - Length of the password to generate (default: 8)
     * @returns {string} The generated password
     */
    function generateRandomPassword(length = 8) {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        
        let password = '';
        password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        
        const allChars = uppercaseChars + lowercaseChars + numberChars;
        for (let i = 3; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        
        return shuffleString(password);
    }
    
    /**
     * Shuffles the characters in a string (Fisher-Yates algorithm)
     * @param {string} string - The string to shuffle
     * @returns {string} The shuffled string
     */
    function shuffleString(string) {
        const array = string.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }
    
    if (generatePasswordBtn) {
        generatePasswordBtn.addEventListener('click', function() {
            const randomPassword = generateRandomPassword(8);
            passwordInput.value = randomPassword;
            
            if (isEditMode) {
                passwordModified = true;
                passwordInput.classList.add('password-modified');
            }
            
            const errorElement = passwordInput.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            passwordInput.classList.remove('invalid-input');
            
            passwordInput.type = 'text';
            setTimeout(() => {
                passwordInput.type = 'password';
            }, 1500);
        });
    }
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
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
    
    if (generateLicenseKeyBtn) {
        generateLicenseKeyBtn.addEventListener('click', function() {
            const selectedRole = roleSelect.value.toLowerCase();
            
            if (!selectedRole) {
                showErrorModal('Please select a role first');
                return;
            }
            
            generateLicenseKeyBtn.textContent = 'Generating...';
            generateLicenseKeyBtn.disabled = true;
            
            fetch('/api/licenses/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: selectedRole,
                    expiryOption: 'custom',
                    customDate: getTwoDaysLaterDate()
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to generate license key');
                }
                return response.json();
            })
            .then(data => {
                licenseKeyInput.value = data.licenseKey;
                
                const expiryDate = data.expiresOn ? new Date(data.expiresOn).toLocaleDateString() : 'No expiry';
                
                generateLicenseKeyBtn.textContent = 'Generate Key';
                generateLicenseKeyBtn.disabled = false;
                
                licenseKeyInput.classList.remove('invalid-input');
                const errorElement = licenseKeyInput.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                const inputEvent = new Event('input', { bubbles: true });
                licenseKeyInput.dispatchEvent(inputEvent);
                
                console.log('License key generated successfully:', data.licenseKey);
            })
            .catch(error => {
                console.error('Error generating license key:', error);
                showErrorModal('Failed to generate license key: ' + error.message);
                
                generateLicenseKeyBtn.textContent = 'Generate Key';
                generateLicenseKeyBtn.disabled = false;
            });
        });
    }
    
    /**
     * Gets a date 2 days later in YYYY-MM-DD format
     * @returns {string} Date string in YYYY-MM-DD format
     */
    function getTwoDaysLaterDate() {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Validates the form
     * @returns {Object} Object containing validation result and errors
     * @returns {boolean} isValid - Whether the form is valid
     * @returns {string[]} errors - Array of error messages
     */
    function validateForm() {
        const errors = [];
        const invalidFields = [];
        
        const requiredFields = [
            { id: 'username', name: 'Username' },
            { id: 'firstName', name: 'First Name' },
            { id: 'lastName', name: 'Last Name' },
            { id: 'email', name: 'Email' }
        ];
        
        if (!isEditMode) {
            requiredFields.push({ id: 'role', name: 'Role' });
            requiredFields.push({ id: 'licenseKey', name: 'License Key' });
        }
        
        if (!isEditMode) {
            requiredFields.push({ id: 'password', name: 'Password' });
        }
        
        const allInputs = form.querySelectorAll('input, select');
        allInputs.forEach(input => {
            const errorElement = input.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                const errorMessage = `${field.name} is required`;
                errors.push(errorMessage);
                invalidFields.push(field.id);
                addValidationMessage(field.id, errorMessage);
            }
        });
        
        const emailInput = document.getElementById('email');
        if (emailInput.value.trim() && !isValidEmail(emailInput.value)) {
            const errorMessage = 'Invalid email adress';
            errors.push(errorMessage);
            invalidFields.push('email');
            addValidationMessage('email', errorMessage);
        }
        
        const licenseKeyInput = document.getElementById('licenseKey');
        if (licenseKeyInput.value.trim() && !licenseKeyPattern.test(licenseKeyInput.value)) {
            const errorMessage = 'License key must be in the format AAAA-BBBB-CCCC-DDDD';
            errors.push(errorMessage);
            invalidFields.push('licenseKey');
            addValidationMessage('licenseKey', errorMessage);
        }
        
        markInvalidFields(invalidFields);
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Validates the license key role
     * @returns {Promise} Promise object containing validation result and errors
     */
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
                if (data.status !== 'Active') {
                    return { 
                        valid: false, 
                        message: `License key is ${data.status.toLowerCase()}. Only active license keys can be used.` 
                    };
                }
                
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
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const validation = validateForm();
            
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            if (!isEditMode) {
                validateLicenseKeyRole().then(result => {
                    if (!result.valid) {
                        showErrorModal(result.message);
                        return;
                    }
                    submitFormData();
                });
            } else {
                submitFormData();
            }
            
            /**
             * Submits form data
             */
            function submitFormData() {
                const formData = {};
                const formInputs = form.querySelectorAll('input, select');
                formInputs.forEach(input => {
                    if (isEditMode && input.id === 'password' && !input.value) {
                        return;
                    }
                    
                    if (input.name) {
                        if (input.type === 'radio') {
                            if (input.checked) {
                                formData[input.name] = input.value === 'true';
                            }
                        } else if (input.id === 'role') {
                            if (isEditMode) {
                                const licenseKey = document.getElementById('licenseKey').value;
                                formData[input.name] = input.getAttribute('data-original-role');
                            } else {
                                formData[input.name] = input.value.toUpperCase();
                            }
                        } else if (input.id === 'active' || input.id === 'activeHidden') {
                            formData[input.name] = input.value === 'true';
                        } else {
                            formData[input.name] = input.value;
                        }
                    }
                });
                
                formData.active = getActiveStatus();
                
                const endpoint = isEditMode ? `/api/users/${formData.id}` : '/api/users';
                const method = isEditMode ? 'PUT' : 'POST';
                
                console.log('Submitting form data:', formData);
                console.log('User active status:', formData.active);
                
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
    
    /**
     * Validates the email
     * @param {string} email - The email to validate
     * @returns {boolean} Whether the email is valid
     */
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
    
    const contentCard = document.querySelector('.content-card');
    const adjustContentCardHeight = () => {
        const contentContainer = document.querySelector('[layout\\:fragment="content"]');
        if (contentContainer) {
            contentCard.style.height = (contentContainer.offsetHeight - 20) + 'px';
        }
    };
    
    adjustContentCardHeight();
    window.addEventListener('resize', adjustContentCardHeight);
    
    if (form) {
        const licenseKeyInput = document.getElementById('licenseKey');
        licenseKeyInput.addEventListener('input', function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            let value = this.value.replace(/-/g, '').toUpperCase();
            
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0 && formattedValue.length < 19) {
                    formattedValue += '-';
                }
                formattedValue += value[i];
            }
            
            this.value = formattedValue;
            
            let newPosition = start;
            if (start > 0 && start % 5 === 0 && this.value.charAt(start - 1) === '-') {
                newPosition++;
            }
            newPosition = Math.min(newPosition, this.value.length);
            
            this.setSelectionRange(newPosition, newPosition);
        });
        
        /**
         * Validates the license key format
         * @returns {string} The error message or null if no error
         */
        function validateLicenseKey() {
            const licenseKey = licenseKeyInput.value;
            if (!licenseKeyPattern.test(licenseKey)) {
                return "License key must be in the format AAAA-BBBB-CCCC-DDDD";
            }
            return null;
        }
        
        const requiredInputs = form.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('blur', function() {
                const errorElement = this.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                if (!this.value.trim()) {
                    this.classList.add('invalid-input');
                    const label = this.previousElementSibling;
                    let fieldName;
                    
                    if (label && label.textContent) {
                        fieldName = label.textContent.replace('*', '').trim();
                    } else {
                        fieldName = this.id.charAt(0).toUpperCase() + this.id.slice(1);
                    }
                    
                    addValidationMessage(this.id, `${fieldName} is required`);
                } else {
                    this.classList.remove('invalid-input');
                }
            });
            
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    if (!this.value.trim()) {
                        this.classList.add('invalid-input');
                        const label = this.previousElementSibling;
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
        

        licenseKeyInput.addEventListener('blur', function() {
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
        
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('blur', function() {
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
        
        if (isEditMode && passwordInput) {
            passwordInput.addEventListener('input', function() {
                passwordModified = true;
                this.classList.add('password-modified');
                
                this.placeholder = 'Please do not enter a simple password';
                
                if (confirmPasswordInput) {
                confirmPasswordInput.setAttribute('required', 'required');
                confirmPasswordInput.placeholder = 'Re-enter your password';
                }
            });
        }
        
        if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            const errorElement = this.parentNode.querySelector('.field-validation-error');
            if (errorElement) {
                errorElement.remove();
            }
            
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
            
            if (isEditMode) {
                confirmPasswordInput.addEventListener('input', function() {
                    this.placeholder = 'Re-enter your password';
                });
            }
        }
        
        if (passwordInput && confirmPasswordInput) {
        passwordInput.addEventListener('input', function() {
            if (confirmPasswordInput.value) {
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
            
            if (isEditMode) {
                if (this.value.trim()) {
                    confirmPasswordInput.setAttribute('required', 'required');
                } else {
                    confirmPasswordInput.removeAttribute('required');
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
    
    /**
     * Updates the license key with user information
     * @param {string} licenseKey - The license key to update
     * @param {string} userId - The user ID to update
     * @returns {Promise} Promise object containing update result and errors
     */
    function updateLicenseKeyWithUser(licenseKey, userId) {
        console.log(`Attempting to update license key ${licenseKey} for user ${userId}`);
            
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
                if (licenseKeyData.status !== 'Active') {
                    throw new Error(`License key is ${licenseKeyData.status.toLowerCase()}. Only active license keys can be used.`);
                }
                
                console.log(`License key found with status: ${licenseKeyData.status} and role: ${licenseKeyData.role}`);
                
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
    
    const activeSelect = document.getElementById('active');
    const activeHidden = document.getElementById('activeHidden');

    if (activeSelect && activeHidden) {
        activeHidden.value = activeSelect.value;
        
        activeSelect.addEventListener('change', function() {
            activeHidden.value = activeSelect.value;
        });
        
        if (activeSelect.value === 'false') {
            const formContainer = document.querySelector('.user-form-container');
            if (formContainer) {
                formContainer.classList.add('inactive-user');
            }
        }
        
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

    /**
     * Gets the correct active status in form submission
     * @returns {boolean} The active status
     */
    function getActiveStatus() {
        if (activeSelect) {
            return activeSelect.value === 'true';
        }
        else if (activeHidden) {
            return activeHidden.value === 'true';
        }
        return true;
    }

    /**
     * Sets the default active status for new users
     */
    if (!isEditMode && activeSelect) {
        activeSelect.value = "true";
        
        const changeEvent = new Event('change', { bubbles: true });
        activeSelect.dispatchEvent(changeEvent);
        
        console.log('New user: Setting default active status to true');
    }
});