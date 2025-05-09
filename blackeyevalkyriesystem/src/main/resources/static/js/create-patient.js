// Global variable for drugs data
let allDrugsData = [];

// Function to validate the patient form - moved to global scope
function validatePatientForm() {
    const requiredFields = ['firstName', 'lastName', 'sex', 'dateOfBirth', 'bloodType'];
    const errors = [];
    const invalidFields = [];
    
    // Check each required field
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!input || !input.value.trim()) {
            errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
            invalidFields.push(field);
        }
    });
    
    // Mark invalid fields with red border
    if (invalidFields.length > 0) {
        markInvalidFields(invalidFields);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Function to switch between form sections - moved to global scope
function switchFormSection(targetTabId) {
    // Hide all form sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the target section
    const targetSection = targetTabId === 'personal-info-tab' ? 
        document.getElementById('personal-info-form') : 
        document.getElementById('contact-info-form');
    
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active tab
    document.querySelectorAll('.tab-item').forEach(tab => {
        if (tab.getAttribute('data-target') === targetTabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Function to mark invalid fields with red border
function markInvalidFields(invalidFields) {
    // Clear previous validation styling
    document.querySelectorAll('.form-control').forEach(field => {
        field.classList.remove('invalid-field');
        const existingMsg = field.parentNode.querySelector('.validation-message');
        if (existingMsg) {
            existingMsg.remove();
        }
    });
    
    // Add validation styling to invalid fields
    invalidFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('invalid-field');
            addValidationMessage(fieldId, `${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
        }
    });
}

// Function to add validation message below the field
function addValidationMessage(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Check if message already exists
    const existingMsg = input.parentNode.querySelector('.validation-message');
    if (existingMsg) {
        existingMsg.textContent = message;
        return;
    }
    
    // Create new message
    const msgElement = document.createElement('div');
    msgElement.className = 'validation-message';
    msgElement.textContent = message;
    msgElement.style.color = '#ef4444';
    msgElement.style.fontSize = '0.8rem';
    msgElement.style.marginTop = '0.25rem';
    
    // Insert after the input field
    input.parentNode.insertBefore(msgElement, input.nextSibling);
}

// Function to show validation popup with errors
function showValidationPopup(errors) {
    // Ensure errors is an array
    errors = Array.isArray(errors) ? errors : [];
    
    // Remove any existing popups
    const existingPopup = document.querySelector('.validation-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup
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
    
    // Add to the body
    document.body.appendChild(popup);
    
    // Add event listeners
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
    
    // Add animation class after a small delay
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

// Function to fetch drugs data
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
            // Add a visual error message
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

// Initialize and setup drug allergies component
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
    
    // Create a map of drug IDs to drug names
    function updateDrugMap() {
        if (Array.isArray(allDrugsData)) {
            allDrugsData.forEach(drug => {
                // Handle different property structures
                const drugId = drug.id || '';
                const drugName = drug.name || drug.drugName || drug.genericName || '';
                if (drugId) {
                    drugMap[drugId] = drugName;
                }
            });
        }
        console.log('Drug name mapping:', drugMap);
    }
    
    // Set up input event listener for drug search
    drugAllergyInput.addEventListener('input', function() {
        filterDrugs(this.value);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!drugAllergyInput.contains(e.target) && !drugsDropdown.contains(e.target)) {
            drugsDropdown.style.display = 'none';
        }
    });
    
    // Show dropdown when input is focused
    drugAllergyInput.addEventListener('focus', function() {
        if (this.value.length > 0) {
            filterDrugs(this.value);
        }
    });
    
    // Function to filter and display drugs based on search input
    function filterDrugs(searchText) {
        // Clear the dropdown
        drugsDropdown.innerHTML = '';
        
        if (!searchText || searchText.length < 2) {
            drugsDropdown.style.display = 'none';
            return;
        }
        
        // If drugs data is not loaded yet, fetch it
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
    
    // Internal function to filter drugs after data is available
    function filterDrugsInternal(searchText) {
        // Make sure allDrugsData is an array with the expected properties
        if (!Array.isArray(allDrugsData) || allDrugsData.length === 0) {
            // Show no results message
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No drugs available. Please contact the administrator.';
            drugsDropdown.innerHTML = '';
            drugsDropdown.appendChild(noResults);
            drugsDropdown.style.display = 'block';
            return;
        }
        
        // Filter drugs based on search text
        const searchLower = searchText.toLowerCase();
        const filteredDrugs = allDrugsData.filter(drug => {
            // Determine the property to use for drug name
            const drugName = drug.name || drug.drugName || drug.genericName || '';
            return drugName.toLowerCase().includes(searchLower);
        });
        
        console.log('Filtered drugs:', filteredDrugs);
        drugsDropdown.innerHTML = '';
        
        // Display filtered drugs
        if (filteredDrugs.length > 0) {
            filteredDrugs.forEach(drug => {
                // Determine the drug ID and name properties
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
    
    // Function to select a drug from the dropdown
    function selectDrug(drugId, drugName) {
        drugAllergyInput.value = drugName;
        drugsDropdown.style.display = 'none';
        
        // Store selected drug ID to use when adding to allergies
        drugAllergyInput.setAttribute('data-selected-id', drugId);
    }
    
    // Function to update the hidden input with selected drug IDs
    function updateDrugAllergiesInput() {
        drugAllergiesInput.value = Array.from(selectedAllergies).join(',');
    }
    
    // Function to add a drug allergy
    function addDrugAllergy() {
        const drugInput = document.getElementById('drugAllergyInput');
        const drugId = drugInput.getAttribute('data-selected-id');
        const drugName = drugInput.value;
        
        if (!drugId || !drugName) {
            showValidationPopup(['Please select a valid drug from the list']);
            return;
        }
        
        // Check if this drug is already in the list
        const existingAllergies = document.querySelectorAll('#allergiesList tr[data-drug-id]');
        for (let i = 0; i < existingAllergies.length; i++) {
            if (existingAllergies[i].getAttribute('data-drug-id') === drugId) {
                showValidationPopup(['This drug is already in the allergies list']);
                return;
            }
        }
        
        // Remove empty row if it exists
        const emptyRow = allergiesList.querySelector('.empty-allergies-row');
        if (emptyRow) {
            emptyRow.remove();
        }
        
        // Create new row for the allergy
        const row = document.createElement('tr');
        row.setAttribute('data-drug-id', drugId);
        row.className = 'allergyItem'; // Add allergyItem class for consistent selection
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
        
        // Clear input and selected data
        drugAllergyInput.value = '';
        drugAllergyInput.removeAttribute('data-selected-id');
    }
    
    // Add drug allergy when clicking the add button
    if (addAllergyBtn) {
        addAllergyBtn.addEventListener('click', addDrugAllergy);
    }
    
    // Add drug allergy when pressing Enter in the input field
    if (drugAllergyInput) {
        drugAllergyInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (drugsDropdown.style.display === 'block') {
                    // If dropdown is open and an item is selected, use that
                    const firstItem = drugsDropdown.querySelector('.drug-item');
                    if (firstItem) {
                        selectDrug(firstItem.getAttribute('data-id'), firstItem.getAttribute('data-name'));
                    }
                }
                addDrugAllergy();
            }
        });
    }
    
    // Remove drug allergy when clicking the remove button
    if (allergiesList) {
        allergiesList.addEventListener('click', function(e) {
            const removeBtn = e.target.closest('.remove-allergy-btn');
            if (removeBtn) {
                const row = removeBtn.closest('tr');
                const drugId = row.getAttribute('data-drug-id');
                
                row.remove();
                selectedAllergies.delete(drugId);
                updateDrugAllergiesInput();
                
                // Add empty row if no allergies left
                if (selectedAllergies.size === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.className = 'empty-allergies-row';
                    emptyRow.innerHTML = '<td colspan="2">No drug allergies selected</td>';
                    allergiesList.appendChild(emptyRow);
                }
            }
        });
    }
    
    // Fetch initial drugs data
    fetchDrugsData().then(() => {
        updateDrugMap();
    });
}

// Tab navigation for personal to contact info
function setupTabNavigation() {
    const nextButton = document.getElementById('next-btn');
    const backButton = document.getElementById('back-btn');
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoForm = document.getElementById('personal-info-form');
    const contactInfoForm = document.getElementById('contact-info-form');
    
    // Switch between form sections based on tab
    function switchFormSection(tabId) {
        // Hide all form sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the correct form section
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
    
    // Tab click event handling
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchFormSection(targetId);
        });
    });
    
    // Next button handling
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Validate personal information fields using the validatePatientForm function
            const validation = validatePatientForm();
            if (!validation.isValid) {
                showValidationPopup(validation.errors);
                return;
            }
            
            // Switch to contact information tab
            switchFormSection('contact-info-tab');
        });
    }
    
    // Back button handling
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Switch back to personal information tab
            switchFormSection('personal-info-tab');
        });
    }
}

// Calculate age based on date of birth
function setupAgeCalculation() {
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
        
        // Calculate initial age
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

// Form submission handling
function setupFormSubmission() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
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
            
            console.log('Sending patient data:', JSON.stringify(patientData));
            
            // Add additional validation
            if (!firstName || !lastName || !dateOfBirth) {
                // Use validation popup instead of notification for validation errors
                showValidationPopup(['First Name, Last Name, and Date of Birth are required']);
                return;
            }
            
            // Send data to server
            fetch('/api/patients', {
                method: 'POST',
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
                        console.error('Response status:', response.status, response.statusText);
                        throw new Error(`Server responded with status: ${response.status} ${response.statusText}. Details: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                // Replace alert with sessionStorage
                sessionStorage.setItem('patientNotification', JSON.stringify({
                    type: 'success',
                    message: 'Patient profile created successfully!'
                }));
                
                // Redirect to patient list
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                // Use validation popup instead of notification
                showValidationPopup(['Error creating patient profile: ' + error.message]);
            });
        });
    }
}

// Validation helpers
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

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize drug allergies component
    initializeDrugAllergies();
    
    // Setup tab navigation
    setupTabNavigation();
    
    // Setup age calculation
    setupAgeCalculation();
    
    // Setup form submission
    setupFormSubmission();
    
    // Add validation modals
    addValidationModals();
    
    // Setup validation form
    setupValidationForm();
    
    // Setup unsaved changes tracking
    setupUnsavedChangesTracking();
});

// Setup validation form
function setupValidationForm() {
    const patientForm = document.getElementById('patient-form');
    const contactForm = document.getElementById('contact-form');
    
    // Get modal elements
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    const successOkButton = document.getElementById('successOk');
    
    // Error modal elements
    const errorModal = document.getElementById('errorModal');
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
    
    // Define validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
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
                // Function to check and update input validation
                const validateInput = function() {
                    // Remove existing error message
                    const errorElement = this.parentNode.querySelector('.field-validation-error');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    // Also remove any validation-message elements (from global functions)
                    const validationMsg = this.parentNode.querySelector('.validation-message');
                    if (validationMsg) {
                        validationMsg.remove();
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
                        // Clear any error message for this field
                        this.parentNode.querySelectorAll('.field-validation-error, .validation-message').forEach(el => {
                            el.remove();
                        });
                    }
                };
                
                // Add event listeners for validation
                input.addEventListener('blur', validateInput);
                input.addEventListener('input', validateInput);
                
                // Also check on change for selects
                if (input.tagName === 'SELECT') {
                    input.addEventListener('change', validateInput);
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
        const requiredInputs = [];
        
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
            
            // Form is valid, proceed with submission
            // This will hit the other submit handler to actually submit the form
        });
    }
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