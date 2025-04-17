document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-form');
    const alertBox = document.getElementById('alerts');
    const alertContent = document.querySelector('.alert-danger');
    const isEditMode = document.getElementById('userId') !== null;
    
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
        successMessage.textContent = message;
        successModal.style.display = 'block';
    }
    
    // Function to show error modal
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
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
        // Add license key validation
        const licenseKeyInput = document.getElementById('licenseKey');
        const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        
        // Function to validate license key format
        function validateLicenseKey() {
            const licenseKey = licenseKeyInput.value;
            if (!licenseKeyPattern.test(licenseKey)) {
                return "License key must be in the format AAAA-BBBB-CCCC-DDDD";
            }
            return null;
        }
        
        // Add validation on blur
        licenseKeyInput.addEventListener('blur', function() {
            const errorMessage = validateLicenseKey();
            if (errorMessage) {
                // If there's no error element yet, create one
                let errorElement = document.getElementById('licenseKey-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = 'licenseKey-error';
                    errorElement.className = 'field-error';
                    licenseKeyInput.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = errorMessage;
            } else {
                // Remove error element if exists
                const errorElement = document.getElementById('licenseKey-error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate license key format before submission
            const licenseKeyError = validateLicenseKey();
            if (licenseKeyError) {
                showErrorModal(licenseKeyError);
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
                } else {
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