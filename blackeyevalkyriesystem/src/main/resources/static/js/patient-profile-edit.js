/**
 * Patient Profile Edit Form Handler
 * 
 * This script manages the patient profile edit functionality, including form validation,
 * form submission, tab navigation, age calculation, drug allergies management,
 * and unsaved changes tracking.
 */
document.addEventListener('DOMContentLoaded', function() {
    const patientForm = document.getElementById('patient-form');
    const contactForm = document.getElementById('contact-form');
    const backButton = document.getElementById('back-btn');
    const patientId = document.getElementById('patientId').value;

    setupTabNavigation();
    setupAgeCalculation();
    setupFormValidation();
    setupFormSubmission();
    initializeDrugAllergies();
    
    setupUnsavedChangesTracking();

    /**
     * Sets up tab navigation between form sections
     */
    function setupTabNavigation() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                switchFormSection(targetId);
            });
        });

        /**
         * Switches between form sections based on the selected tab
         * @param {string} tabId - The ID of the tab to switch to
         */
        function switchFormSection(tabId) {
            document.querySelectorAll('.tab-item').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelector(`[data-target="${tabId}"]`).classList.add('active');
            
            document.querySelectorAll('.form-section').forEach(section => {
                section.classList.remove('active');
            });
            
            if (tabId === 'personal-info-tab') {
                document.getElementById('personal-info-form').classList.add('active');
            } else if (tabId === 'contact-info-tab') {
                document.getElementById('contact-info-form').classList.add('active');
            }
        }
    }

    /**
     * Sets up automatic age calculation based on date of birth
     */
    function setupAgeCalculation() {
        const dobField = document.getElementById('dateOfBirth');
        const ageField = document.getElementById('age');
        
        if (dobField && ageField) {
            if (dobField.value) {
                calculateAge();
            }
            
            dobField.addEventListener('change', calculateAge);
            
            /**
             * Calculates age based on date of birth
             */
            function calculateAge() {
                const dob = new Date(dobField.value);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                
                ageField.value = age;
            }
        }
    }

    /**
     * Sets up form validation for patient and contact information
     * @returns {Object} Validation functions for patient and contact forms
     */
    function setupFormValidation() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        addValidationStyles();

        /**
         * Adds validation error message below an input field
         * @param {string} inputId - ID of the input field
         * @param {string} message - Error message to display
         */
        function addValidationMessage(inputId, message) {
            const field = document.getElementById(inputId);
            if (!field) return;
            
            const existingError = field.parentNode.querySelector('.field-validation-error');
            if (existingError) {
                existingError.remove();
            }
            
            const errorElement = document.createElement('span');
            errorElement.className = 'field-validation-error';
            errorElement.textContent = message;
            field.parentNode.appendChild(errorElement);
        }

        /**
         * Marks fields as invalid in the UI
         * @param {Array} invalidFields - Array of field IDs to mark as invalid
         */
        function markInvalidFields(invalidFields) {
            document.querySelectorAll('.invalid-input').forEach(field => {
                field.classList.remove('invalid-input');
            });
            
            document.querySelectorAll('.field-validation-error').forEach(errorElement => {
                errorElement.remove();
            });
            
            invalidFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.classList.add('invalid-input');
                }
            });
        }

        /**
         * Validates patient form fields
         * @returns {Object} Validation result with isValid flag and errors array
         */
        function validatePatientForm() {
            const errors = [];
            const invalidFields = [];
            
            const requiredFields = [
                { id: 'firstName', name: 'First Name' },
                { id: 'lastName', name: 'Last Name' },
                { id: 'sex', name: 'Sex' },
                { id: 'dateOfBirth', name: 'Date of Birth' },
                { id: 'bloodType', name: 'Blood Type' }
            ];
            
            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (!input || !input.value.trim()) {
                    const errorMessage = `${field.name} is required`;
                    errors.push(errorMessage);
                    invalidFields.push(field.id);
                    addValidationMessage(field.id, errorMessage);
                }
            });
            
            markInvalidFields(invalidFields);
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }

        /**
         * Validates contact form fields
         * @returns {Object} Validation result with isValid flag and errors array
         */
        function validateContactForm() {
            const errors = [];
            const invalidFields = [];
            
            const requiredFields = [];
            
            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (!input || !input.value.trim()) {
                    const errorMessage = `${field.name} is required`;
                    errors.push(errorMessage);
                    invalidFields.push(field.id);
                    addValidationMessage(field.id, errorMessage);
                }
            });
            
            const emailInput = document.getElementById('email');
            if (emailInput && emailInput.value.trim() && !emailPattern.test(emailInput.value)) {
                const errorMessage = 'Invalid email address';
                errors.push(errorMessage);
                invalidFields.push('email');
                addValidationMessage('email', errorMessage);
            }
            
            markInvalidFields(invalidFields);
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        }

        if (patientForm) {
            const requiredInputs = ['firstName', 'lastName', 'sex', 'dateOfBirth', 'bloodType'];
            
            requiredInputs.forEach(fieldId => {
                const input = document.getElementById(fieldId);
                if (input) {
                    input.addEventListener('blur', function() {
                        const errorElement = this.parentNode.querySelector('.field-validation-error');
                        if (errorElement) {
                            errorElement.remove();
                        }
                        
                        if (!this.value.trim()) {
                            this.classList.add('invalid-input');
                            const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                .replace('*', '')
                                .trim() : this.id;
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
                                const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                    .replace('*', '')
                                    .trim() : this.id;
                                addValidationMessage(this.id, `${fieldName} is required`);
                            } else {
                                this.classList.remove('invalid-input');
                            }
                        });
                    }
                }
            });
        }

        if (contactForm) {
            const requiredInputs = ['contactNumber', 'country'];
            
            requiredInputs.forEach(fieldId => {
                const input = document.getElementById(fieldId);
                if (input) {
                    input.addEventListener('blur', function() {
                        const errorElement = this.parentNode.querySelector('.field-validation-error');
                        if (errorElement) {
                            errorElement.remove();
                        }
                        
                        if (!this.value.trim()) {
                            this.classList.add('invalid-input');
                            const fieldName = this.previousElementSibling ? this.previousElementSibling.textContent
                                .replace('*', '')
                                .trim() : this.id;
                            addValidationMessage(this.id, `${fieldName} is required`);
                        } else {
                            this.classList.remove('invalid-input');
                        }
                    });
                }
            });
            
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.addEventListener('blur', function() {
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    if (this.value.trim() && !emailPattern.test(this.value)) {
                        this.classList.add('invalid-input');
                        addValidationMessage(this.id, 'Invalid email address');
                    } else {
                        this.classList.remove('invalid-input');
                    }
                });
            }
        }

        const nextButton = document.getElementById('next-btn');
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                const validation = validatePatientForm();
                if (!validation.isValid) {
                    showValidationPopup(validation.errors);
                    return;
                }
                
                document.querySelector('[data-target="contact-info-tab"]').click();
            });
        }

        if (backButton) {
            backButton.addEventListener('click', function() {
                document.querySelector('[data-target="personal-info-tab"]').click();
            });
        }

        /**
         * Displays a popup with validation errors
         * @param {Array} errors - Array of error messages to display
         */
        function showValidationPopup(errors) {
            const existingPopup = document.querySelector('.validation-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            const existingOverlay = document.querySelector('.validation-popup-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            const overlay = document.createElement('div');
            overlay.className = 'validation-popup-overlay';
            document.body.appendChild(overlay);
            
            const popup = document.createElement('div');
            popup.className = 'validation-popup';
            
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

    /**
     * Adds CSS styles for form validation to the document
     */
    function addValidationStyles() {
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

    /**
     * Sets up form submission handling
     */
    function setupFormSubmission() {
        const validation = setupFormValidation();
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const contactValidation = validation.validateContactForm();
                if (!contactValidation.isValid) {
                    showValidationPopup(contactValidation.errors);
                    return;
                }
                
                const patientId = document.getElementById('patientId').value;
                
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const sex = document.getElementById('sex').value === 'Male' ? true : false;
                const relativeName = document.getElementById('relativeName').value;
                const dateOfBirth = document.getElementById('dateOfBirth').value;
                const age = document.getElementById('age').value;
                const maritalStatus = document.getElementById('maritalStatus').value;
                const bloodType = document.getElementById('bloodType').value;
                
                const drugAllergiesInput = document.getElementById('drugAllergies');
                let drugAllergies = [];
                
                if (drugAllergiesInput && drugAllergiesInput.value) {
                    drugAllergies = drugAllergiesInput.value.split(',').filter(Boolean);
                    console.log("Drug allergy IDs to submit:", drugAllergies);
                }
                
                console.log("Formatted drug allergies for submission:", drugAllergies);
                
                const contactNumber = document.getElementById('contactNumber').value;
                const email = document.getElementById('email').value;
                const address1 = document.getElementById('address1').value;
                const address2 = document.getElementById('address2').value;
                const address3 = document.getElementById('address3').value;
                const country = document.getElementById('country').value;
                const state = document.getElementById('state').value;
                const town = document.getElementById('town').value;
                const pinCode = document.getElementById('pinCode').value;
                
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
                
                fetch('/api/patients/' + patientId, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientData)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error('Server error response:', text);
                            throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    sessionStorage.setItem('patientNotification', JSON.stringify({
                        type: 'success',
                        message: 'Patient profile updated successfully!'
                    }));
                    
                    window.location.href = '/patient/list';
                })
                .catch((error) => {
                    console.error('Error:', error);
                    showValidationPopup(['Error updating patient profile: ' + error.message]);
                });
            });
        }

        /**
         * Displays validation popup with error messages
         * @param {Array} errors - Array of error messages to display
         */
        function showValidationPopup(errors) {
            if (errors.length === 0) return;
            
            const errorMessage = 'Please fix the following errors:\n• ' + errors.join('\n• ');
            
            displayNotification('error', errorMessage);
        }
    }

    let allDrugsData = [];

    /**
     * Initializes the drug allergies component
     * Handles adding, removing, and displaying drug allergies
     */
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
        
        if (drugAllergiesInput) {
            drugAllergiesInput.value = drugAllergiesInput.value || '';
        } else {
            console.error('drugAllergies input element not found');
        }
        
        const selectedAllergies = new Set();
        const drugMap = {};
        
        const patientIdElement = document.getElementById('patientId');
        const patientId = patientIdElement ? patientIdElement.value : null;
        
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
                    
                    if (patient && patient.drugAllergies && Array.isArray(patient.drugAllergies)) {
                        console.log("Found drug allergies:", patient.drugAllergies);
                        
                        patient.drugAllergies.forEach(allergyId => {
                            console.log("Processing allergy ID:", allergyId);
                            selectedAllergies.add(allergyId);
                        });
                    } else {
                        console.log("No drug allergies found in patient data or format is unexpected");
                    }
                    
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
                    
                    allDrugsData.forEach(drug => {
                        drugMap[drug.id] = drug.name || drug.drugName || drug.genericName || "Unknown Drug";
                    });
                    
                    updateDrugAllergiesInput();
                    
                    populateExistingAllergies();
                })
                .catch(error => {
                    console.error('Error fetching patient data or drugs:', error);
                });
        } else {
            fetch('/api/drugs')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch drugs data');
                    }
                    return response.json();
                })
                .then(data => {
                    allDrugsData = data;
                    
                    allDrugsData.forEach(drug => {
                        drugMap[drug.id] = drug.name || drug.drugName || drug.genericName || "Unknown Drug";
                    });
                })
                .catch(error => {
                    console.error('Error fetching drugs:', error);
                });
        }
            
        /**
         * Populates the existing drug allergies in the UI
         */
        function populateExistingAllergies() {
            console.log("Populating existing allergies, selected allergies:", selectedAllergies);
            while (allergiesList.firstChild) {
                allergiesList.removeChild(allergiesList.firstChild);
            }
            
            if (selectedAllergies.size === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-allergies-row';
                emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                allergiesList.appendChild(emptyRow);
            } else {
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
                    
                    row.querySelector('.remove-allergy-btn').addEventListener('click', function() {
                        row.remove();
                        selectedAllergies.delete(drugId);
                        updateDrugAllergiesInput();
                        
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
        
        drugAllergyInput.addEventListener('input', function() {
            filterDrugs(this.value);
        });
        
        /**
         * Filters drugs based on search text and displays matches in dropdown
         * @param {string} searchText - Text to search for in drug names
         */
        function filterDrugs(searchText) {
            drugsDropdown.innerHTML = '';
            
            if (!searchText || searchText.length < 2) {
                drugsDropdown.style.display = 'none';
                return;
            }
            
            const searchLower = searchText.toLowerCase();
            const filteredDrugs = allDrugsData.filter(drug => {
                const drugName = drug.name || drug.drugName || drug.genericName || '';
                return drugName.toLowerCase().includes(searchLower);
            });
            
            console.log('Filtered drugs:', filteredDrugs);
            
            if (filteredDrugs.length > 0) {
                filteredDrugs.forEach(drug => {
                    const drugId = drug.id || '';
                    const drugName = drug.name || drug.drugName || drug.genericName || '';
                    
                    const drugItem = document.createElement('div');
                    drugItem.className = 'drug-item';
                    drugItem.setAttribute('data-id', drugId);
                    drugItem.setAttribute('data-name', drugName);
                    drugItem.innerHTML = `<div class="drug-name">${drugName}</div>`;
                    
                    drugItem.addEventListener('click', function() {
                        selectDrug(this.getAttribute('data-id'), this.getAttribute('data-name'));
                    });
                    
                    drugsDropdown.appendChild(drugItem);
                });
                
                drugsDropdown.style.display = 'block';
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No matching drugs found';
                drugsDropdown.appendChild(noResults);
                drugsDropdown.style.display = 'block';
            }
        }
        
        /**
         * Selects a drug from the dropdown
         * @param {string} drugId - ID of the selected drug
         * @param {string} drugName - Name of the selected drug
         */
        function selectDrug(drugId, drugName) {
            drugAllergyInput.value = drugName;
            drugsDropdown.style.display = 'none';
            drugAllergyInput.setAttribute('data-selected-id', drugId);
        }
        
        /**
         * Adds a drug allergy to the list
         */
        function addDrugAllergy() {
            const drugInput = document.getElementById('drugAllergyInput');
            const selectedDrugId = drugInput.getAttribute('data-selected-id');
            const selectedDrugName = drugInput.value;
            
            if (!selectedDrugId || !selectedDrugName) {
                showValidationPopup(['Please select a valid drug from the list']);
                return;
            }
            
            if (selectedAllergies.has(selectedDrugId)) {
                showValidationPopup(['This drug is already in the allergies list']);
                return;
            }
            
            const emptyRow = allergiesList.querySelector('.empty-allergies-row');
            if (emptyRow) {
                emptyRow.remove();
            }
            
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
            
            row.querySelector('.remove-allergy-btn').addEventListener('click', function() {
                row.remove();
                selectedAllergies.delete(selectedDrugId);
                updateDrugAllergiesInput();
                
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
            
            drugInput.value = '';
            drugInput.removeAttribute('data-selected-id');
        }
        
        /**
         * Updates the hidden input with selected drug allergies
         */
        function updateDrugAllergiesInput() {
            if (drugAllergiesInput) {
                drugAllergiesInput.value = Array.from(selectedAllergies).join(',');
                console.log("Updated drugAllergies input value:", drugAllergiesInput.value);
            }
        }
        
        addAllergyBtn.addEventListener('click', addDrugAllergy);
        
        document.addEventListener('click', function(e) {
            if (!drugAllergyInput.contains(e.target) && !drugsDropdown.contains(e.target)) {
                drugsDropdown.style.display = 'none';
            }
        });
    }

    /**
     * Displays a notification message to the user
     * @param {string} type - Type of notification ('success' or 'error')
     * @param {string} message - Message to display
     */
    function displayNotification(type, message) {
        let notificationContainer = document.querySelector('.notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            
            const contentSection = document.querySelector('[layout\\:fragment="content"]');
            if (contentSection) {
                contentSection.insertBefore(notificationContainer, contentSection.firstChild);
            } else {
                document.body.insertBefore(notificationContainer, document.body.firstChild);
            }
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (type === 'error') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        }
        
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
        
        notificationContainer.appendChild(notification);
        
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    if (notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            });
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('closing');
                setTimeout(() => {
                    notification.remove();
                    
                    if (notificationContainer && notificationContainer.children.length === 0) {
                        notificationContainer.remove();
                    }
                }, 300);
            }
        }, 6000);
    }

    /**
     * Sets up tracking of unsaved form changes
     * Warns users before leaving the page if changes have not been saved
     */
    function setupUnsavedChangesTracking() {
        let formChanged = false;
        const formInputs = document.querySelectorAll('input, select, textarea');
        const cancelButton = document.getElementById('cancel-btn');
        const initialFormState = captureFormState();
        
        /**
         * Captures the initial state of all form inputs
         * @returns {Object} Form state with input IDs as keys and their values
         */
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
        
        /**
         * Checks if the form state has changed from the initial state
         * @returns {boolean} True if the form has changed, false otherwise
         */
        function hasFormChanged() {
            const currentState = captureFormState();
            for (const key in currentState) {
                if (initialFormState[key] !== currentState[key]) {
                    return true;
                }
            }
            return false;
        }
        
        formInputs.forEach(input => {
            input.addEventListener('change', function() {
                formChanged = hasFormChanged();
            });
            
            input.addEventListener('input', function() {
                formChanged = hasFormChanged();
            });
        });
        
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
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
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
        
        /**
         * Shows a popup warning about unsaved changes
         * @param {string} targetUrl - URL to navigate to if changes are discarded
         */
        function showUnsavedChangesPopup(targetUrl = '/patient/list') {
            const existingPopup = document.querySelector('.unsaved-changes-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
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
            
            const cancelButton = popup.querySelector('.unsaved-changes-cancel');
            const discardButton = popup.querySelector('.unsaved-changes-discard');
            
            cancelButton.addEventListener('click', function() {
                popup.remove();
            });
            
            discardButton.addEventListener('click', function() {
                window.location.href = targetUrl;
            });
        }
    }
}); 