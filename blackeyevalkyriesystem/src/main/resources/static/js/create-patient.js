document.addEventListener('DOMContentLoaded', function() {
    const patientForm = document.getElementById('patient-form');
    const contactForm = document.getElementById('contact-form');
    const isEditMode = document.getElementById('patientId') !== null;
    
    // Define validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Add modal elements to the page
    addValidationModals();
    
    // Get modal elements
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
    if (successOkButton) {
        successOkButton.addEventListener('click', function() {
            successModal.style.display = 'none';
            // Redirect to patient list
            window.location.href = '/patient/list';
        });
    }
    
    // Handle error modal
    if (errorOkButton) {
        errorOkButton.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    }
    
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
            window.location.href = '/patient/list';
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
        const allInputs = document.querySelectorAll('input, select');
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
    
    // Function to validate patient form fields
    function validatePatientForm() {
        const errors = [];
        const invalidFields = [];
        
        // Define required fields for patient form
        const requiredFields = [
            { id: 'firstName', name: 'First Name' },
            { id: 'lastName', name: 'Last Name' },
            { id: 'sex', name: 'Sex' },
            { id: 'dateOfBirth', name: 'Date of Birth' }
        ];
        
        // Check each required field
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input || !input.value.trim()) {
                const errorMessage = `${field.name} is required`;
                errors.push(errorMessage);
                invalidFields.push(field.id);
                addValidationMessage(field.id, errorMessage);
            }
        });
        
        // Mark invalid fields
        markInvalidFields(invalidFields);
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Function to validate contact form fields
    // function validateContactForm() {
    //     const errors = [];
    //     const invalidFields = [];
        
    //     // Define required fields for contact form
    //     const requiredFields = [
    //         { id: 'contactNumber', name: 'Phone / Mobile' },
    //         { id: 'country', name: 'Country' }
    //     ];
        
    //     // Check each required field
    //     requiredFields.forEach(field => {
    //         const input = document.getElementById(field.id);
    //         if (!input || !input.value.trim()) {
    //             const errorMessage = `${field.name} is required`;
    //             errors.push(errorMessage);
    //             invalidFields.push(field.id);
    //             addValidationMessage(field.id, errorMessage);
    //         }
    //     });
        
    //     // Check email format if provided
    //     const emailInput = document.getElementById('email');
    //     if (emailInput && emailInput.value.trim() && !emailPattern.test(emailInput.value)) {
    //         const errorMessage = 'Invalid email address';
    //         errors.push(errorMessage);
    //         invalidFields.push('email');
    //         addValidationMessage('email', errorMessage);
    //     }
        
    //     // Mark invalid fields
    //     markInvalidFields(invalidFields);
        
    //     return {
    //         isValid: errors.length === 0,
    //         errors: errors
    //     };
    // }
    
    // Add validation to required fields on blur for patient form
    if (patientForm) {
        const requiredInputs = ['firstName', 'lastName', 'sex', 'dateOfBirth'];
        
        requiredInputs.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('blur', function() {
                    // Remove existing error message
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    if (!this.value.trim()) {
                        this.classList.add('invalid-input');
                        // Add error message - clean label text to remove asterisk
                        const fieldName = this.previousElementSibling.textContent
                            .replace('*', '')  // Remove the asterisk
                            .trim();           // Trim any whitespace
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
                            // Add error message - clean label text to remove asterisk
                            const fieldName = this.previousElementSibling.textContent
                                .replace('*', '')  // Remove the asterisk
                                .trim();           // Trim any whitespace
                            addValidationMessage(this.id, `${fieldName} is required`);
                        } else {
                            this.classList.remove('invalid-input');
                        }
                    });
                }
            }
        });
        
        // Add next button validation
        const nextButton = document.getElementById('next-btn');
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                // Validate the patient form before proceeding to next step
                const validation = validatePatientForm();
                if (!validation.isValid) {
                    showValidationPopup(validation.errors);
                    return;
                }
                
                // If valid, proceed to next step
                switchFormSection('contact-info-tab');
            });
        }
    }
    
    // Add validation to required fields on blur for contact form
    if (contactForm) {
        const requiredInputs = ['contactNumber', 'country'];
        
        requiredInputs.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('blur', function() {
                    // Remove existing error message
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    if (!this.value.trim()) {
                        this.classList.add('invalid-input');
                        // Add error message - clean label text to remove asterisk
                        const fieldName = this.previousElementSibling.textContent
                            .replace('*', '')  // Remove the asterisk
                            .trim();           // Trim any whitespace
                        addValidationMessage(this.id, `${fieldName} is required`);
                    } else {
                        this.classList.remove('invalid-input');
                    }
                });
            }
        });
        
        // Add email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                // Remove existing error message
                const errorElement = this.parentNode.querySelector('.field-validation-error');
                if (errorElement) {
                    errorElement.remove();
                }
                
                if (this.value.trim() && !emailPattern.test(this.value)) {
                    this.classList.add('invalid-input');
                    addValidationMessage('email', 'Invalid email address');
                } else {
                    this.classList.remove('invalid-input');
                }
            });
        }
        
        // Handle form submission
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate the contact form
            const validation = validateContactForm();
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            // Get personal information
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const sex = document.getElementById('sex').value === 'Male' ? true : false;
            const relativeName = document.getElementById('relativeName').value;
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            const age = document.getElementById('age').value;
            const maritalStatus = document.getElementById('maritalStatus').value;
            const bloodType = document.getElementById('bloodType').value;
            const status = document.getElementById('status')?.value || "Active"; // Use default if not found
            
            // Get drug allergies - safely access the element
            const drugAllergiesEl = document.getElementById('drugAllergies');
            const drugAllergies = drugAllergiesEl ? 
                drugAllergiesEl.value.split(',').filter(id => id.trim() !== '') : 
                [];
            
            // Get contact information
            const contactNumber = document.getElementById('contactNumber').value;
            const email = document.getElementById('email').value;
            const address1 = document.getElementById('address1').value;
            const address2 = document.getElementById('address2').value;
            const address3 = document.getElementById('address3').value;
            const country = document.getElementById('country').value;
            const state = document.getElementById('state').value;
            const town = document.getElementById('town').value;
            const pinCode = document.getElementById('pinCode').value;
            
            // Create combined data object
            const patientData = {
                firstName: firstName,
                lastName: lastName,
                sex: sex,
                relativeName: relativeName,
                dateOfBirth: dateOfBirth,
                age: parseInt(age) || 0,
                maritalStatus: maritalStatus,
                bloodType: bloodType,
                status: status,
                drugAllergies: drugAllergies,
                contactNumber: contactNumber,
                email: email,
                address: {
                    addressLine1: address1,
                    addressLine2: address2,
                    addressLine3: address3,
                    country: country,
                    state: state,
                    town: town,
                    pinCode: pinCode
                }
            };
            
            // Make API call to save patient
            fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errorMessage = `Server responded with status: ${response.status}`;
                        try {
                            const errorData = JSON.parse(text);
                            if (errorData.error) {
                                errorMessage = errorData.error;
                            }
                        } catch (e) {
                            console.error('Error parsing error response', e);
                        }
                        throw new Error(errorMessage);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Show success modal
                showSuccessModal('Patient created successfully!');
            })
            .catch((error) => {
                console.error('Error:', error);
                showErrorModal(`Error creating patient: ${error.message}`);
            });
        });
    }
    
    // Function to switch form sections
    function switchFormSection(tabId) {
        // Get all tabs and content sections
        const tabItems = document.querySelectorAll('.tab-item');
        const tabContents = document.querySelectorAll('.tab-content');
        const formSections = document.querySelectorAll('.form-section');
        
        // Remove active class from all tabs and contents
        tabItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        formSections.forEach(section => section.classList.remove('active'));
        
        // Add active class to the selected tab and corresponding content
        const selectedTab = document.getElementById(tabId);
        const tabNumber = tabId === 'personal-info-tab' ? 0 : 1;
        
        if (selectedTab) {
            tabItems[tabNumber].classList.add('active');
            selectedTab.classList.add('active');
            
            // Show corresponding form section
            const formSectionId = tabId === 'personal-info-tab' ? 'personal-info-form' : 'contact-info-form';
            const formSection = document.getElementById(formSectionId);
            if (formSection) {
                formSection.classList.add('active');
            }
        }
    }
    
    // Function to add modal elements to the page
    function addValidationModals() {
        // Create modal container
        const modalsContainer = document.createElement('div');
        modalsContainer.id = 'validation-modals-container';
        
        // Create success modal
        const successModal = `
            <div id="successModal" class="modal">
                <div class="modal-content">
                    <h3 id="successTitle" class="modal-title success">Success</h3>
                    <div class="modal-body">
                        <p id="successMessage">Operation completed successfully.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="successOk" class="btn btn-success">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        // Create error modal
        const errorModal = `
            <div id="errorModal" class="modal">
                <div class="modal-content">
                    <h3 id="errorTitle" class="modal-title error">Error</h3>
                    <div class="modal-body">
                        <p id="errorMessage">An error occurred.</p>
                    </div>
                    <div class="modal-footer">
                        <button id="errorOk" class="btn btn-error">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        // Create validation popup
        const validationPopup = `
            <div id="validationPopup" class="validation-popup" style="display: none;">
                <div class="validation-popup-content">
                    <h3 class="validation-popup-title">Form Validation Error</h3>
                    <div class="validation-popup-body">
                        <p>Please fix the following errors:</p>
                        <ul id="validationErrorList" class="validation-error-list">
                            <!-- Validation errors will be inserted here dynamically -->
                        </ul>
                    </div>
                    <div class="validation-popup-footer">
                        <button id="validationOk" class="btn btn-error">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modals to container
        modalsContainer.innerHTML = successModal + errorModal + validationPopup;
        
        // Add container to document body
        document.body.appendChild(modalsContainer);
        
        // Add CSS styles for modals if not already present
        addValidationStyles();
    }
    
    // Function to add necessary CSS styles
    function addValidationStyles() {
        // Check if styles already exist
        if (document.getElementById('validation-styles')) {
            return;
        }
        
        // Create style element
        const styleElement = document.createElement('style');
        styleElement.id = 'validation-styles';
        
        // Define styles
        const styles = `
            /* Required field asterisk styling */
            .required {
                color: #ff4d4d;
                margin-left: 2px;
            }
            
            /* Invalid input styling */
            .invalid-input {
                border-color: #ff4d4d !important;
                box-shadow: 0 0 0 1px #ff4d4d !important;
            }
            
            /* Field validation message */
            .field-validation-error {
                color: #ff4d4d;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
            
            /* Modal styles */
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }
            
            .modal-content {
                background-color: var(--primary-bg, #ffffff);
                margin: 15% auto;
                padding: 20px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .modal-title {
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            
            .modal-title.success {
                color: #23b27e;
            }
            
            .modal-title.error {
                color: #ff4d4d;
            }
            
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .btn-success {
                background-color: #23b27e;
                color: white;
            }
            
            .btn-error {
                background-color: #ff4d4d;
                color: white;
            }
            
            /* Validation popup */
            .validation-popup {
                position: fixed;
                z-index: 1100;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .validation-popup-content {
                background-color: var(--primary-bg, #ffffff);
                padding: 20px;
                border-radius: 8px;
                width: 400px;
                max-width: 90%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                margin: 0;
            }
            
            .validation-popup-title {
                color: #ff4d4d;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            
            .validation-error-list {
                margin-bottom: 20px;
                padding-left: 20px;
            }
            
            .validation-error-item {
                margin-bottom: 5px;
                color: #333;
            }
        `;
        
        // Add styles to the style element
        styleElement.textContent = styles;
        
        // Add style element to document head
        document.head.appendChild(styleElement);
    }
}); 