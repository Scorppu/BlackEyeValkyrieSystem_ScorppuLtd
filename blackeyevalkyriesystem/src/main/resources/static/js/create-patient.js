document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation for personal to contact info
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
            // Validate personal information fields
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const dateOfBirth = document.getElementById('dateOfBirth').value;
            
            if (!firstName || !lastName || !dateOfBirth) {
                alert('Please fill in all required fields.');
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
    
    // Form submission handling
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
                alert('Required fields missing: First Name, Last Name, and Date of Birth are required');
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
                alert('Patient profile created successfully!');
                
                // Redirect to patient list
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error creating patient profile: ' + error.message);
            });
        });
    }
    
    // Calculate age based on date of birth
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
});

// Drug allergies management
document.addEventListener('DOMContentLoaded', function() {
    const drugAllergyInput = document.getElementById('drugAllergyInput');
    const drugsDropdown = document.getElementById('drugsDropdown');
    const addAllergyBtn = document.getElementById('addAllergyBtn');
    const allergiesList = document.getElementById('allergiesList');
    const drugAllergiesInput = document.getElementById('drugAllergies');
    
    // Initialize the hidden input if not set
    if (drugAllergiesInput) {
        drugAllergiesInput.value = drugAllergiesInput.value || '';
    } else {
        console.error('drugAllergies input element not found');
    }
    
    const selectedAllergies = new Set();
    const drugMap = {};
    
    // Get drugs data from the pre-initialized variable
    console.log('Available drugs:', allDrugsData);
    
    // Create a map of drug IDs to drug names
    if (Array.isArray(allDrugsData)) {
        allDrugsData.forEach(drug => {
            // Handle different property structures
            const drugId = drug.id || '';
            const drugName = drug.name || drug.drugName || drug.genericName || '';
            if (drugId) {
                drugMap[drugId] = drugName;
            }
        });
    } else {
        console.error('allDrugs is not properly initialized:', allDrugsData);
    }
    
    console.log('Drug name mapping:', drugMap);
    
    // Show warning if no drugs are loaded
    if (!Array.isArray(allDrugsData) || allDrugsData.length === 0) {
        console.error('No drugs available in the system');
        // Add a visual warning to the page
        const warningDiv = document.createElement('div');
        warningDiv.style.color = '#ff9800';
        warningDiv.style.padding = '0.5rem 0';
        warningDiv.textContent = 'Warning: No drugs available in the system. Contact administrator.';
        document.querySelector('.drug-selection-container').after(warningDiv);
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
        
        // Debugging
        console.log('Filtering drugs with search text:', searchText);
        console.log('Available drugs for filtering:', allDrugsData);
        
        // Make sure allDrugs is an array with the expected properties
        if (!Array.isArray(allDrugsData) || allDrugsData.length === 0) {
            console.error('allDrugs is not properly initialized:', allDrugsData);
            
            // Show no results message
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Error loading drugs. Please try again.';
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
        const drugName = drugAllergyInput.value;
        if (!drugName) return;
        
        // Get the drug ID from the input attribute
        const drugId = drugAllergyInput.getAttribute('data-selected-id');
        
        if (!drugId) {
            alert('Please select a valid drug from the list');
            return;
        }
        
        // Check if drugAllergiesInput exists
        if (!drugAllergiesInput) {
            console.error('drugAllergies input element not found');
            return;
        }
        
        // Check if already selected
        if (selectedAllergies.has(drugId)) {
            alert('This drug is already in the allergies list');
            drugAllergyInput.value = '';
            return;
        }
        
        // Remove empty row if it exists
        const emptyRow = allergiesList.querySelector('.empty-allergies-row');
        if (emptyRow) {
            emptyRow.remove();
        }
        
        // Create new row for the allergy
        const row = document.createElement('tr');
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
});

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