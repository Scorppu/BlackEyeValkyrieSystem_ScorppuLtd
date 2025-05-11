/** Global variable for drugs data */
let allDrugsData = [];

/**
 * Validates the patient form
 * @returns {Object} Object containing validation result and errors
 * @returns {boolean} isValid - Whether the form is valid
 * @returns {string[]} errors - Array of error messages
 */
function validatePatientForm() {
    const requiredFields = ['firstName', 'lastName', 'sex', 'dateOfBirth', 'bloodType'];
    const errors = [];
    const invalidFields = [];
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!input || !input.value.trim()) {
            errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
            invalidFields.push(field);
        }
    });
    
    if (invalidFields.length > 0) {
        markInvalidFields(invalidFields);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sets up the tab navigation between personal and contact info sections
 */
function setupTabNavigation() {
    const nextButton = document.getElementById('next-btn');
    const backButton = document.getElementById('back-btn');
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoForm = document.getElementById('personal-info-form');
    const contactInfoForm = document.getElementById('contact-info-form');
    
    /**
     * Switches between form sections based on tab ID
     * @param {string} tabId - The ID of the tab to switch to
     */
    function switchFormSection(tabId) {
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        if (tabId === 'personal-info-tab') {
            personalInfoForm.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'personal-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('personal-info-tab').classList.add('active');
            document.getElementById('contact-info-tab').classList.remove('active');
        } else if (tabId === 'contact-info-tab') {
            contactInfoForm.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'contact-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('contact-info-tab').classList.add('active');
            document.getElementById('personal-info-tab').classList.remove('active');
        }
    }
    
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchFormSection(targetId);
        });
    });
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const validation = validatePatientForm();
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            switchFormSection('contact-info-tab');
        });
    }
    
    if (backButton) {
        backButton.addEventListener('click', function() {
            switchFormSection('personal-info-tab');
        });
    }
}

/**
 * Marks form fields as invalid with red border
 * @param {string[]} invalidFields - Array of field IDs to mark as invalid
 */
function markInvalidFields(invalidFields) {
    document.querySelectorAll('.form-control').forEach(field => {
        field.classList.remove('invalid-field');
        const existingMsg = field.parentNode.querySelector('.validation-message');
        if (existingMsg) {
            existingMsg.remove();
        }
    });
    
    invalidFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('invalid-field');
            addValidationMessage(fieldId, `${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
        }
    });
}

/**
 * Adds validation message below the input field
 * @param {string} inputId - ID of the input field
 * @param {string} message - Validation message to display
 */
function addValidationMessage(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const existingMsg = input.parentNode.querySelector('.validation-message');
    if (existingMsg) {
        existingMsg.textContent = message;
        return;
    }
    
    const msgElement = document.createElement('div');
    msgElement.className = 'validation-message';
    msgElement.textContent = message;
    msgElement.style.color = '#ef4444';
    msgElement.style.fontSize = '0.8rem';
    msgElement.style.marginTop = '0.25rem';
    
    input.parentNode.insertBefore(msgElement, input.nextSibling);
}

/**
 * Shows validation popup with errors
 * @param {string[]} errors - Array of error messages
 */
function showValidationPopup(errors) {
    errors = Array.isArray(errors) ? errors : [];
    
    const existingPopup = document.querySelector('.validation-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    const popup = document.createElement('div');
    popup.className = 'validation-popup';
    
    popup.innerHTML = `
        <div class="validation-popup-content">
            <div class="validation-popup-header">
                <h3>Please Fix These Errors</h3>
                <button class="validation-popup-close">&times;</button>
            </div>
            <div class="validation-popup-body">
                <ul class="validation-errors-list">
                    ${errors.length > 0 ? 
                      errors.map(error => `<li>${error}</li>`).join('') : 
                      '<li>Please fill in all required fields</li>'}
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
        popup.classList.add('closing');
        setTimeout(() => {
            popup.remove();
        }, 300);
    };
    
    closeButton.addEventListener('click', closePopup);
    okButton.addEventListener('click', closePopup);
    
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

/**
 * Fetches drug data from the API
 * @returns {Promise<Array>} Promise that resolves to an array of drug data
 */
function fetchDrugsData() {
    return fetch('/api/drugs')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch drugs data from API');
            }
            return response.json();
        })
        .then(data => {
            console.log('Drugs data loaded successfully:', data);
            allDrugsData = data || [];
            return allDrugsData;
        })
        .catch(error => {
            console.error('Error fetching drugs data:', error);
            const warningDiv = document.createElement('div');
            warningDiv.style.color = '#ff9800';
            warningDiv.style.padding = '0.5rem 0';
            warningDiv.textContent = 'Warning: No drugs available in the system. Contact administrator.';
            const container = document.querySelector('.drug-selection-container');
            if (container) {
                container.after(warningDiv);
            }
            return [];
        });
}

/**
 * Initializes and sets up the drug allergies component
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
    
    /**
     * Updates the map of drug IDs to drug names
     */
    function updateDrugMap() {
        if (Array.isArray(allDrugsData)) {
            allDrugsData.forEach(drug => {
                const drugId = drug.id || '';
                const drugName = drug.name || drug.drugName || drug.genericName || '';
                if (drugId) {
                    drugMap[drugId] = drugName;
                }
            });
        }
        console.log('Drug name mapping:', drugMap);
    }
    
    drugAllergyInput.addEventListener('input', function() {
        filterDrugs(this.value);
    });
    
    document.addEventListener('click', function(e) {
        if (!drugAllergyInput.contains(e.target) && !drugsDropdown.contains(e.target)) {
            drugsDropdown.style.display = 'none';
        }
    });
    
    drugAllergyInput.addEventListener('focus', function() {
        if (this.value.length > 0) {
            filterDrugs(this.value);
        }
    });
    
    /**
     * Filters and displays drugs based on search input
     * @param {string} searchText - The search text to filter drugs by
     */
    function filterDrugs(searchText) {
        drugsDropdown.innerHTML = '';
        
        if (!searchText || searchText.length < 2) {
            drugsDropdown.style.display = 'none';
            return;
        }
        
        if (!allDrugsData || allDrugsData.length === 0) {
            drugsDropdown.innerHTML = '<div class="loading">Loading drugs...</div>';
            drugsDropdown.style.display = 'block';
            
            fetchDrugsData().then(() => {
                updateDrugMap();
                filterDrugsInternal(searchText);
            });
        } else {
            filterDrugsInternal(searchText);
        }
    }
    
    /**
     * Internal function to filter drugs after data is available
     * @param {string} searchText - The search text to filter drugs by
     */
    function filterDrugsInternal(searchText) {
        if (!Array.isArray(allDrugsData) || allDrugsData.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No drugs available. Please contact the administrator.';
            drugsDropdown.innerHTML = '';
            drugsDropdown.appendChild(noResults);
            drugsDropdown.style.display = 'block';
            return;
        }
        
        const searchLower = searchText.toLowerCase();
        const filteredDrugs = allDrugsData.filter(drug => {
            const drugName = drug.name || drug.drugName || drug.genericName || '';
            return drugName.toLowerCase().includes(searchLower);
        });
        
        console.log('Filtered drugs:', filteredDrugs);
        drugsDropdown.innerHTML = '';
        
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
     * @param {string} drugId - The ID of the selected drug
     * @param {string} drugName - The name of the selected drug
     */
    function selectDrug(drugId, drugName) {
        drugAllergyInput.value = drugName;
        drugsDropdown.style.display = 'none';
        
        drugAllergyInput.setAttribute('data-selected-id', drugId);
    }
    
    /**
     * Updates the hidden input with selected drug IDs
     */
    function updateDrugAllergiesInput() {
        drugAllergiesInput.value = Array.from(selectedAllergies).join(',');
    }
    
    /**
     * Adds a drug allergy to the list
     */
    function addDrugAllergy() {
        const drugInput = document.getElementById('drugAllergyInput');
        const drugId = drugInput.getAttribute('data-selected-id');
        const drugName = drugInput.value;
        
        if (!drugId || !drugName) {
            showValidationPopup(['Please select a valid drug from the list']);
            return;
        }
        
        const existingAllergies = document.querySelectorAll('#allergiesList tr[data-drug-id]');
        for (let i = 0; i < existingAllergies.length; i++) {
            if (existingAllergies[i].getAttribute('data-drug-id') === drugId) {
                showValidationPopup(['This drug is already in the allergies list']);
                return;
            }
        }
        
        const emptyRow = allergiesList.querySelector('.empty-allergies-row');
        if (emptyRow) {
            emptyRow.remove();
        }
        
        const row = document.createElement('tr');
        row.setAttribute('data-drug-id', drugId);
        row.className = 'allergyItem';
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
        
        allergiesList.appendChild(row);
        selectedAllergies.add(drugId);
        updateDrugAllergiesInput();
        
        drugAllergyInput.value = '';
        drugAllergyInput.removeAttribute('data-selected-id');
    }
    
    if (addAllergyBtn) {
        addAllergyBtn.addEventListener('click', addDrugAllergy);
    }
    
    if (drugAllergyInput) {
        drugAllergyInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (drugsDropdown.style.display === 'block') {
                    const firstItem = drugsDropdown.querySelector('.drug-item');
                    if (firstItem) {
                        selectDrug(firstItem.getAttribute('data-id'), firstItem.getAttribute('data-name'));
                    }
                }
                addDrugAllergy();
            }
        });
    }
    
    if (allergiesList) {
        allergiesList.addEventListener('click', function(e) {
            const removeBtn = e.target.closest('.remove-allergy-btn');
            if (removeBtn) {
                const row = removeBtn.closest('tr');
                const drugId = row.getAttribute('data-drug-id');
                
                row.remove();
                selectedAllergies.delete(drugId);
                updateDrugAllergiesInput();
                
                if (selectedAllergies.size === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.className = 'empty-allergies-row';
                    emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                    allergiesList.appendChild(emptyRow);
                }
            }
        });
    }
    
    fetchDrugsData().then(() => {
        updateDrugMap();
    });
}

/**
 * Sets up tab navigation between personal info and contact info sections
 * Handles next/back button functionality and validates form when switching tabs
 * Controls the active states for tabs and form sections
 */
function setupTabNavigation() {
    const nextButton = document.getElementById('next-btn');
    const backButton = document.getElementById('back-btn');
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoForm = document.getElementById('personal-info-form');
    const contactInfoForm = document.getElementById('contact-info-form');
    
    function switchFormSection(tabId) {
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        if (tabId === 'personal-info-tab') {
            personalInfoForm.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'personal-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('personal-info-tab').classList.add('active');
            document.getElementById('contact-info-tab').classList.remove('active');
        } else if (tabId === 'contact-info-tab') {
            contactInfoForm.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'contact-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('contact-info-tab').classList.add('active');
            document.getElementById('personal-info-tab').classList.remove('active');
        }
    }
    
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchFormSection(targetId);
        });
    });
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const validation = validatePatientForm();
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            switchFormSection('contact-info-tab');
        });
    }
    
    if (backButton) {
        backButton.addEventListener('click', function() {
            switchFormSection('personal-info-tab');
        });
    }
}

/**
 * Sets up automatic age calculation based on date of birth
 * Calculates and updates the age field when date of birth changes
 * Also calculates initial age if date of birth is already set
 */
function setupAgeCalculation() {
    const dobField = document.getElementById('dateOfBirth');
    const ageField = document.getElementById('age');
    
    if (dobField && ageField) {
        dobField.addEventListener('change', function() {
            const dob = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            
            ageField.value = age;
        });
        
        if (dobField.value) {
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
 * Sets up form submission handling including validation and API calls
 */
function setupFormSubmission() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const sex = document.getElementById('sex').value === 'Male' ? true : false;
            const relativeName = document.getElementById('relativeName').value;
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            const age = document.getElementById('age').value;
            const maritalStatus = document.getElementById('maritalStatus').value;
            const bloodType = document.getElementById('bloodType').value;
            const status = document.getElementById('status')?.value || "Active";
            
            const drugAllergiesEl = document.getElementById('drugAllergies');
            const drugAllergies = drugAllergiesEl ? 
                drugAllergiesEl.value.split(',').filter(id => id.trim() !== '') : 
                [];
            
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
            
            console.log('Sending patient data:', JSON.stringify(patientData));
            
            if (!firstName || !lastName || !dateOfBirth) {
                showValidationPopup(['First Name, Last Name, and Date of Birth are required']);
                return;
            }
            
            fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Server error response:', text);
                        console.error('Response status:', response.status, response.statusText);
                        throw new Error(`Server responded with status: ${response.status} ${response.statusText}. Details: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                sessionStorage.setItem('patientNotification', JSON.stringify({
                    type: 'success',
                    message: 'Patient profile created successfully!'
                }));
                
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                showValidationPopup(['Error creating patient profile: ' + error.message]);
            });
        });
    }
}

/**
 * Adds validation modals to the document for error and success messages
 */
function addValidationModals() {
    const modalsContainer = document.createElement('div');
    modalsContainer.id = 'validation-modals-container';
    
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
    
    const validationPopup = `
        <div id="validationPopup" class="validation-popup" style="display: none;">
            <div class="validation-popup-content">
                <h3 class="validation-popup-title">Form Validation Error</h3>
                <div class="validation-popup-body">
                    <p>Please fix the following errors:</p>
                    <ul id="validationErrorList" class="validation-error-list">
                    </ul>
                </div>
                <div class="validation-popup-footer">
                    <button id="validationOk" class="btn btn-error">OK</button>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.innerHTML = successModal + errorModal + validationPopup;
    
    document.body.appendChild(modalsContainer);
    
    addValidationStyles();
}

/**
 * Adds CSS styles for validation to the document
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
 * Main initialization function that sets up all components when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeDrugAllergies();
    
    setupTabNavigation();
    
    setupAgeCalculation();
    
    setupFormSubmission();
    
    addValidationModals();
    
    setupValidationForm();
    
    setupUnsavedChangesTracking();
});

/**
 * Sets up form validation including modal handling and field validation
 */
function setupValidationForm() {
    const patientForm = document.getElementById('patient-form');
    const contactForm = document.getElementById('contact-form');
    
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    const successOkButton = document.getElementById('successOk');
    
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const errorOkButton = document.getElementById('errorOk');
    
    const validationPopup = document.getElementById('validationPopup');
    const validationErrorList = document.getElementById('validationErrorList');
    const validationOkButton = document.getElementById('validationOk');
    
    if (successOkButton) {
        successOkButton.addEventListener('click', function() {
            successModal.style.display = 'none';
            window.location.href = '/patient/list';
        });
    }
    
    if (errorOkButton) {
        errorOkButton.addEventListener('click', function() {
            errorModal.style.display = 'none';
        });
    }
    
    if (validationOkButton) {
        validationOkButton.addEventListener('click', function() {
            validationPopup.style.display = 'none';
        });
    }
    
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
    
    /**
     * Shows success modal with message
     * @param {string} message - Success message to display
     */
    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = 'block';
    }
    
    /**
     * Shows error modal with message
     * @param {string} message - Error message to display
     */
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
    
    /**
     * Shows validation errors popup
     * @param {string[]} errors - Array of error messages
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
    
    /**
     * Marks invalid fields with error styling
     * @param {string[]} invalidFields - Array of field IDs to mark as invalid
     */
    function markInvalidFields(invalidFields) {
        const allInputs = document.querySelectorAll('input, select');
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
     * @param {string} inputId - ID of the input field
     * @param {string} message - Validation message to display
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
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    /**
     * Validates the patient form fields
     * @returns {Object} Validation result and errors
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
     * Validates the contact form fields
     * @returns {Object} Validation result and errors
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
                /**
                 * Validates an input field on change or blur
                 */
                const validateInput = function() {
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    const validationMsg = this.parentNode.querySelector('.validation-message');
                    if (validationMsg) {
                        validationMsg.remove();
                    }
                    
                    if (!this.value.trim()) {
                        this.classList.add('invalid-input');
                        const fieldName = this.previousElementSibling.textContent
                            .replace('*', '')
                            .trim();
                        addValidationMessage(this.id, `${fieldName} is required`);
                    } else {
                        this.classList.remove('invalid-input');
                        this.parentNode.querySelectorAll('.field-validation-error, .validation-message').forEach(el => {
                            el.remove();
                        });
                    }
                };
                
                input.addEventListener('blur', validateInput);
                input.addEventListener('input', validateInput);
                
                if (input.tagName === 'SELECT') {
                    input.addEventListener('change', validateInput);
                }
            }
        });
        
        const nextButton = document.getElementById('next-btn');
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                const validation = validatePatientForm();
                if (!validation.isValid) {
                    showValidationPopup(validation.errors);
                    return;
                }
                
                switchFormSection('contact-info-tab');
            });
        }
    }
    
    if (contactForm) {
        const requiredInputs = [];
        
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
                        const fieldName = this.previousElementSibling.textContent
                            .replace('*', '')
                            .trim();
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
                    addValidationMessage('email', 'Invalid email address');
                } else {
                    this.classList.remove('invalid-input');
                }
            });
        }
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const validation = validateContactForm();
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
        });
    }
}

/**
 * Sets up tracking of unsaved form changes and confirmation before navigation
 */
function setupUnsavedChangesTracking() {
    let formChanged = false;
    const formInputs = document.querySelectorAll('input, select, textarea');
    const cancelButton = document.getElementById('cancel-btn');
    const initialFormState = captureFormState();
    
    /**
     * Captures the current state of all form inputs
     * @returns {Object} Map of input IDs to their current values
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
     * Checks if the form has changed from its initial state
     * @returns {boolean} Whether the form has changed
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
     * Shows a popup for confirming navigation when there are unsaved changes
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

/**
 * Displays a notification message with the specified type
 * @param {string} type - The notification type (success, error)
 * @param {string} message - The message to display in the notification
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