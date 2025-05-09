document.addEventListener('DOMContentLoaded', function() {
    // Variables for form elements
    const patientForm = document.getElementById('patient-form');
    const contactForm = document.getElementById('contact-form');
    const backButton = document.getElementById('back-btn');
    const patientId = document.getElementById('patientId').value;

    // Initialize key components
    setupTabNavigation();
    setupAgeCalculation();
    setupFormValidation();
    setupFormSubmission();
    initializeDrugAllergies();
    
    // Setup unsaved changes tracking
    setupUnsavedChangesTracking();

    // Tab navigation setup
    function setupTabNavigation() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                switchFormSection(targetId);
            });
        });

        // Function to switch form sections
        function switchFormSection(tabId) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-item').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to the clicked tab
            document.querySelector(`[data-target="${tabId}"]`).classList.add('active');
            
            // Hide all form sections
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the corresponding form section based on the tab
            if (tabId === 'personal-info-tab') {
                document.getElementById('personal-info-form').classList.add('active');
            } else if (tabId === 'contact-info-tab') {
                document.getElementById('contact-info-form').classList.add('active');
            }
        }
    }

    // Calculate age from date of birth
    function setupAgeCalculation() {
        const dobField = document.getElementById('dateOfBirth');
        const ageField = document.getElementById('age');
        
        if (dobField && ageField) {
            // Calculate age on load if DOB is set
            if (dobField.value) {
                calculateAge();
            }
            
            // Update age when DOB changes
            dobField.addEventListener('change', calculateAge);
            
            function calculateAge() {
                const dob = new Date(dobField.value);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                
                // Adjust age if birthday hasn't occurred yet this year
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                
                ageField.value = age;
            }
        }
    }

    // Form validation setup
    function setupFormValidation() {
        // Define validation patterns
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Add validation styles
        addValidationStyles();

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

        // Function to mark invalid fields
        function markInvalidFields(invalidFields) {
            // First, clear all invalid markings
            document.querySelectorAll('.invalid-input').forEach(field => {
                field.classList.remove('invalid-input');
            });
            
            document.querySelectorAll('.field-validation-error').forEach(errorElement => {
                errorElement.remove();
            });
            
            // Mark invalid fields
            invalidFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.classList.add('invalid-input');
                }
            });
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
                { id: 'dateOfBirth', name: 'Date of Birth' },
                { id: 'bloodType', name: 'Blood Type' }
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
        function validateContactForm() {
            const errors = [];
            const invalidFields = [];
            
            // Define required fields for contact form - removed phone and country
            const requiredFields = [];
            
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
            
            // Check email format if provided
            const emailInput = document.getElementById('email');
            if (emailInput && emailInput.value.trim() && !emailPattern.test(emailInput.value)) {
                const errorMessage = 'Invalid email address';
                errors.push(errorMessage);
                invalidFields.push('email');
                addValidationMessage('email', errorMessage);
            }
            
            // Mark invalid fields
            markInvalidFields(invalidFields);
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }

        // Add validation to required fields on blur for patient form
        if (patientForm) {
            const requiredInputs = ['firstName', 'lastName', 'sex', 'dateOfBirth', 'bloodType'];
            
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
                            const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                .replace('*', '')  // Remove the asterisk
                                .trim() : this.id; // Fallback to id if label not found
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
                                const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                    .replace('*', '')  // Remove the asterisk
                                    .trim() : this.id; // Fallback to id if label not found
                                addValidationMessage(this.id, `${fieldName} is required`);
                            } else {
                                this.classList.remove('invalid-input');
                            }
                        });
                    }
                }
            });
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
                            const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                .replace('*', '')  // Remove the asterisk
                                .trim() : this.id; // Fallback to id if label not found
                            addValidationMessage(this.id, `${fieldName} is required`);
                        } else {
                            this.classList.remove('invalid-input');
                        }
                    });
                }
            });
            
            // Add email validation on blur
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.addEventListener('blur', function() {
                    // Remove existing error message
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    // Validate email format if provided
                    if (this.value.trim() && !emailPattern.test(this.value)) {
                        this.classList.add('invalid-input');
                        addValidationMessage(this.id, 'Invalid email address');
                    } else {
                        this.classList.remove('invalid-input');
                    }
                });
            }
        }

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
                document.querySelector('[data-target="contact-info-tab"]').click();
            });
        }

        // Add back button functionality
        if (backButton) {
            backButton.addEventListener('click', function() {
                document.querySelector('[data-target="personal-info-tab"]').click();
            });
        }

        // Function to show validation popup
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
            };
            
            closeButton.addEventListener('click', closePopup);
            okButton.addEventListener('click', closePopup);
            overlay.addEventListener('click', closePopup);
        }

        return {
            validatePatientForm,
            validateContactForm
        };
    }

    // Add styles for form validation
    function addValidationStyles() {
        // Add CSS styles for validation
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            .invalid-input {
                border-color: #ff4d4d !important;
                box-shadow: 0 0 0 0.2rem rgba(255, 77, 77, 0.25) !important;
            }
            
            .field-validation-error {
                color: #ff4d4d;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Form submission setup
    function setupFormSubmission() {
        const validation = setupFormValidation();
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validate the contact form before submission
                const contactValidation = validation.validateContactForm();
                if (!contactValidation.isValid) {
                    showValidationPopup(contactValidation.errors);
                    return;
                }
                
                // Get patient ID
                const patientId = document.getElementById('patientId').value;
                
                // Get personal information
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const sex = document.getElementById('sex').value === 'Male' ? true : false;
                const relativeName = document.getElementById('relativeName').value;
                const dateOfBirth = document.getElementById('dateOfBirth').value;
                const age = document.getElementById('age').value;
                const maritalStatus = document.getElementById('maritalStatus').value;
                const bloodType = document.getElementById('bloodType').value;
                
                // Get drug allergies if available
                const drugAllergiesInput = document.getElementById('drugAllergies');
                let drugAllergies = [];
                
                if (drugAllergiesInput && drugAllergiesInput.value) {
                    // Get the array of drug ids
                    drugAllergies = drugAllergiesInput.value.split(',').filter(Boolean);
                    console.log("Drug allergy IDs to submit:", drugAllergies);
                }
                
                console.log("Formatted drug allergies for submission:", drugAllergies);
                
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
                    age: parseInt(age),
                    maritalStatus: maritalStatus,
                    bloodType: bloodType,
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
                
                console.log('Sending updated patient data:', JSON.stringify(patientData));
                
                // Send data to server using PUT request for update
                fetch('/api/patients/' + patientId, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientData)
                })
                .then(response => {
                    if (!response.ok) {
                        // Get more detailed error information
                        return response.text().then(text => {
                            console.error('Server error response:', text);
                            throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    // Replace alert with sessionStorage
                    sessionStorage.setItem('patientNotification', JSON.stringify({
                        type: 'success',
                        message: 'Patient profile updated successfully!'
                    }));
                    
                    // Redirect to patient list
                    window.location.href = '/patient/list';
                })
                .catch((error) => {
                    console.error('Error:', error);
                    // Use validation popup instead of notification for errors
                    showValidationPopup(['Error updating patient profile: ' + error.message]);
                });
            });
        }

        // Function to show validation popup
        function showValidationPopup(errors) {
            if (errors.length === 0) return;
            
            // Create a single error message for the notification
            const errorMessage = 'Please fix the following errors:\n• ' + errors.join('\n• ');
            
            // Display as an error notification instead of an alert
            displayNotification('error', errorMessage);
        }
    }

    // Global variable for drugs data
    let allDrugsData = [];

    // Function to initialize drug allergies component
    function initializeDrugAllergies() {
        const drugAllergyInput = document.getElementById('drugAllergyInput');
        const drugsDropdown = document.getElementById('drugsDropdown');
        const addAllergyBtn = document.getElementById('addAllergyBtn');
        const allergiesList = document.getElementById('allergiesList');
        const drugAllergiesInput = document.getElementById('drugAllergies');
        
        if (!drugAllergyInput || !drugsDropdown || !addAllergyBtn || !allergiesList) {
            console.error('Drug allergies component elements not found');
            return;
        }
        
        // Initialize the hidden input if not set
        if (drugAllergiesInput) {
            drugAllergiesInput.value = drugAllergiesInput.value || '';
        } else {
            console.error('drugAllergies input element not found');
        }
        
        const selectedAllergies = new Set();
        const drugMap = {};
        
        // Get patient ID
        const patientIdElement = document.getElementById('patientId');
        const patientId = patientIdElement ? patientIdElement.value : null;
        
        // Fetch patient-specific drug allergies
        if (patientId) {
            console.log("Fetching allergies for patient ID:", patientId);
            fetch(`/api/patients/${patientId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch patient data');
                    }
                    return response.json();
                })
                .then(patient => {
                    console.log("Full patient data:", patient);
                    
                    // Check for drug allergies which should be a List<String> (array of strings) in the Patient model
                    if (patient && patient.drugAllergies && Array.isArray(patient.drugAllergies)) {
                        console.log("Found drug allergies:", patient.drugAllergies);
                        
                        // Process each drug ID
                        patient.drugAllergies.forEach(allergyId => {
                            console.log("Processing allergy ID:", allergyId);
                            selectedAllergies.add(allergyId);
                        });
                    } else {
                        console.log("No drug allergies found in patient data or format is unexpected");
                    }
                    
                    // Now fetch all drugs to have complete data
                    return fetch('/api/drugs');
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch drugs data');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched drugs data:", data);
                    allDrugsData = data;
                    
                    // Update drug map with all drugs
                    allDrugsData.forEach(drug => {
                        drugMap[drug.id] = drug.name || drug.drugName || drug.genericName || "Unknown Drug";
                    });
                    
                    // Update the hidden input with selected allergies
                    updateDrugAllergiesInput();
                    
                    // Populate existing allergies list
                    populateExistingAllergies();
                })
                .catch(error => {
                    console.error('Error fetching patient data or drugs:', error);
                });
        } else {
            // If no patient ID, just fetch general drug data
            fetch('/api/drugs')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch drugs data');
                    }
                    return response.json();
                })
                .then(data => {
                    allDrugsData = data;
                    
                    // Create map of drug IDs to names
                    allDrugsData.forEach(drug => {
                        drugMap[drug.id] = drug.name || drug.drugName || drug.genericName || "Unknown Drug";
                    });
                })
                .catch(error => {
                    console.error('Error fetching drugs:', error);
                });
        }
            
        // Function to populate existing allergies in the UI
        function populateExistingAllergies() {
            console.log("Populating existing allergies, selected allergies:", selectedAllergies);
            // Clear the list first
            while (allergiesList.firstChild) {
                allergiesList.removeChild(allergiesList.firstChild);
            }
            
            if (selectedAllergies.size === 0) {
                // If no allergies, show empty row
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-allergies-row';
                emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                allergiesList.appendChild(emptyRow);
            } else {
                // Add each allergy to the list
                selectedAllergies.forEach(drugId => {
                    const drugName = drugMap[drugId] || "Unknown Drug";
                    
                    const row = document.createElement('tr');
                    row.className = 'allergyItem';
                    row.setAttribute('data-drug-id', drugId);
                    row.innerHTML = `
                        <td>${drugName}</td>
                        <td>
                            <button type="button" class="remove-allergy-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 4H3.33333H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M5.33334 4V2.66667C5.33334 2.31305 5.47382 1.97391 5.72387 1.72386C5.97392 1.47381 6.31305 1.33334 6.66668 1.33334H9.33334C9.68697 1.33334 10.0261 1.47381 10.2762 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2762 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66668C4.31305 14.6667 3.97392 14.5262 3.72387 14.2761C3.47382 14.0261 3.33334 13.687 3.33334 13.3333V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Remove
                            </button>
                        </td>
                    `;
                    
                    // Add remove button event listener
                    row.querySelector('.remove-allergy-btn').addEventListener('click', function() {
                        row.remove();
                        selectedAllergies.delete(drugId);
                        updateDrugAllergiesInput();
                        
                        // If no allergies left, add empty row back
                        if (selectedAllergies.size === 0) {
                            const emptyRow = document.createElement('tr');
                            emptyRow.className = 'empty-allergies-row';
                            emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                            allergiesList.appendChild(emptyRow);
                        }
                    });
                    
                    allergiesList.appendChild(row);
                });
            }
        }
        
        // Setup drug search functionality
        drugAllergyInput.addEventListener('input', function() {
            filterDrugs(this.value);
        });
        
        // Function to filter drugs based on search input
        function filterDrugs(searchText) {
            // Clear the dropdown
            drugsDropdown.innerHTML = '';
            
            if (!searchText || searchText.length < 2) {
                drugsDropdown.style.display = 'none';
                return;
            }
            
            // Filter drugs based on search text
            const searchLower = searchText.toLowerCase();
            const filteredDrugs = allDrugsData.filter(drug => {
                const drugName = drug.name || drug.drugName || drug.genericName || '';
                return drugName.toLowerCase().includes(searchLower);
            });
            
            console.log('Filtered drugs:', filteredDrugs);
            
            // Display filtered drugs
            if (filteredDrugs.length > 0) {
                filteredDrugs.forEach(drug => {
                    const drugId = drug.id || '';
                    const drugName = drug.name || drug.drugName || drug.genericName || '';
                    
                    const drugItem = document.createElement('div');
                    drugItem.className = 'drug-item';
                    drugItem.setAttribute('data-id', drugId);
                    drugItem.setAttribute('data-name', drugName);
                    drugItem.innerHTML = `<div class="drug-name">${drugName}</div>`;
                    
                    // Add click event to select the drug
                    drugItem.addEventListener('click', function() {
                        selectDrug(this.getAttribute('data-id'), this.getAttribute('data-name'));
                    });
                    
                    drugsDropdown.appendChild(drugItem);
                });
                
                drugsDropdown.style.display = 'block';
            } else {
                // Show no results message
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No matching drugs found';
                drugsDropdown.appendChild(noResults);
                drugsDropdown.style.display = 'block';
            }
        }
        
        // Function to select a drug from dropdown
        function selectDrug(drugId, drugName) {
            drugAllergyInput.value = drugName;
            drugsDropdown.style.display = 'none';
            drugAllergyInput.setAttribute('data-selected-id', drugId);
        }
        
        // Function to add a drug allergy
        function addDrugAllergy() {
            const drugInput = document.getElementById('drugAllergyInput');
            // Fix: Use getAttribute to get the selected ID
            const selectedDrugId = drugInput.getAttribute('data-selected-id');
            // Fix: Use input value for the drug name
            const selectedDrugName = drugInput.value;
            
            if (!selectedDrugId || !selectedDrugName) {
                showValidationPopup(['Please select a valid drug from the list']);
                return;
            }
            
            // Check if this drug is already in the list
            if (selectedAllergies.has(selectedDrugId)) {
                showValidationPopup(['This drug is already in the allergies list']);
                return;
            }
            
            // Remove empty row if it exists
            const emptyRow = allergiesList.querySelector('.empty-allergies-row');
            if (emptyRow) {
                emptyRow.remove();
            }
            
            // Create new row for the allergy
            const row = document.createElement('tr');
            row.className = 'allergyItem';
            row.setAttribute('data-drug-id', selectedDrugId);
            row.innerHTML = `
                <td>${selectedDrugName}</td>
                <td>
                    <button type="button" class="remove-allergy-btn">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H3.33333H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5.33334 4V2.66667C5.33334 2.31305 5.47382 1.97391 5.72387 1.72386C5.97392 1.47381 6.31305 1.33334 6.66668 1.33334H9.33334C9.68697 1.33334 10.0261 1.47381 10.2762 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2762 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66668C4.31305 14.6667 3.97392 14.5262 3.72387 14.2761C3.47382 14.0261 3.33334 13.687 3.33334 13.3333V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Remove
                    </button>
                </td>
            `;
            
            // Add remove button event listener
            row.querySelector('.remove-allergy-btn').addEventListener('click', function() {
                row.remove();
                selectedAllergies.delete(selectedDrugId);
                updateDrugAllergiesInput();
                
                // If no allergies left, add empty row back
                if (selectedAllergies.size === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.className = 'empty-allergies-row';
                    emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                    allergiesList.appendChild(emptyRow);
                }
            });
            
            allergiesList.appendChild(row);
            selectedAllergies.add(selectedDrugId);
            updateDrugAllergiesInput();
            
            // Clear input and selected data
            drugInput.value = '';
            drugInput.removeAttribute('data-selected-id');
        }
        
        // Function to update the hidden input with selected drug IDs
        function updateDrugAllergiesInput() {
            if (drugAllergiesInput) {
                drugAllergiesInput.value = Array.from(selectedAllergies).join(',');
                console.log("Updated drugAllergies input value:", drugAllergiesInput.value);
            }
        }
        
        // Add drug allergy when clicking the add button
        addAllergyBtn.addEventListener('click', addDrugAllergy);
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!drugAllergyInput.contains(e.target) && !drugsDropdown.contains(e.target)) {
                drugsDropdown.style.display = 'none';
            }
        });
    }

    // Add displayNotification function to the file
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

    // Track form changes and handle navigation
    function setupUnsavedChangesTracking() {
        let formChanged = false;
        const formInputs = document.querySelectorAll('input, select, textarea');
        const cancelButton = document.getElementById('cancel-btn');
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
                } else {
                    window.location.href = '/patient/list';
                }
            });
        }
        
        // Handle clicks on sidebar links or other navigation
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            // Ignore submission buttons and same-page links
            if (link && 
                !link.classList.contains('btn-success') && 
                !link.getAttribute('href').startsWith('#')) {
                
                if (formChanged) {
                    e.preventDefault();
                    const targetUrl = link.getAttribute('href');
                    showUnsavedChangesPopup(targetUrl);
                }
            }
        });
        
        // Show the unsaved changes popup
        function showUnsavedChangesPopup(targetUrl = '/patient/list') {
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
}); 