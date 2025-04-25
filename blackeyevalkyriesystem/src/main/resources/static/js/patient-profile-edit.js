document.addEventListener('DOMContentLoaded', function() {
    // Always fetch patient data from API on page load
    const pathParts = window.location.pathname.split('/');
    const patientId = pathParts[pathParts.length - 1];
    
    if (patientId && patientId !== 'edit') {
        // Make the API call to fetch patient data
        fetch(`/api/patients/${patientId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API returned error code ${response.status}`);
                }
                return response.json();
            })
            .then(patient => {
                // Set values to form fields
                document.getElementById('patientId').value = patient.id || '';
                document.getElementById('firstName').value = patient.firstName || '';
                document.getElementById('lastName').value = patient.lastName || '';
                document.getElementById('sex').value = patient.sex ? 'Male' : 'Female';
                document.getElementById('relativeName').value = patient.relativeName || '';
                document.getElementById('dateOfBirth').value = patient.dateOfBirth || '';
                document.getElementById('age').value = patient.age || '';
                document.getElementById('maritalStatus').value = patient.maritalStatus || '';
                document.getElementById('bloodType').value = patient.bloodType || '';
                document.getElementById('contactNumber').value = patient.contactNumber || '';
                document.getElementById('email').value = patient.email || '';
                
                if (patient.address) {
                    document.getElementById('address1').value = patient.address.addressLine1 || '';
                    document.getElementById('address2').value = patient.address.addressLine2 || '';
                    document.getElementById('address3').value = patient.address.addressLine3 || '';
                    document.getElementById('country').value = patient.address.country || '';
                    document.getElementById('state').value = patient.address.state || '';
                    document.getElementById('town').value = patient.address.town || '';
                    document.getElementById('pinCode').value = patient.address.pinCode || '';
                }
            })
            .catch(error => {
            });
    }
    
    // Setup form tabs
    const nextButton = document.getElementById('next-btn');
    const backButton = document.getElementById('back-btn');
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoForm = document.getElementById('personal-info-form');
    const contactInfoForm = document.getElementById('contact-info-form');
    
    // Switch between form sections
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
        } else if (tabId === 'contact-info-tab') {
            contactInfoForm.classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'contact-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
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
            // Basic validation
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            
            if (!firstName || !lastName) {
                alert('Please fill in at least first name and last name fields.');
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
    
    // Calculate age from date of birth
    const dobField = document.getElementById('dateOfBirth');
    const ageField = document.getElementById('age');
    
    if (dobField && ageField) {
        dobField.addEventListener('change', function() {
            if (!this.value) return;
            
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
    }
    
    // Form submission handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get patient ID
            const patientId = document.getElementById('patientId').value;
            if (!patientId) {
                alert('Error: No patient ID available');
                return;
            }
            
            // Create patient data object
            const patientData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                sex: document.getElementById('sex').value === 'Male',
                relativeName: document.getElementById('relativeName').value,
                dateOfBirth: document.getElementById('dateOfBirth').value,
                age: parseInt(document.getElementById('age').value) || 0,
                maritalStatus: document.getElementById('maritalStatus').value,
                bloodType: document.getElementById('bloodType').value,
                drugAllergies: document.getElementById('drugAllergies').value.split(',').filter(id => id.trim() !== ''),
                contactNumber: document.getElementById('contactNumber').value,
                email: document.getElementById('email').value,
                address: {
                    addressLine1: document.getElementById('address1').value,
                    addressLine2: document.getElementById('address2').value,
                    addressLine3: document.getElementById('address3').value,
                    country: document.getElementById('country').value,
                    state: document.getElementById('state').value,
                    town: document.getElementById('town').value,
                    pinCode: document.getElementById('pinCode').value
                }
            };
            
            // Send data to server using PUT for update
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
                        throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                alert('Patient profile updated successfully!');
                
                // Redirect to patient list
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                alert('Error updating patient profile: ' + error.message);
            });
        });
    }
});

// JavaScript for drug allergies
document.addEventListener('DOMContentLoaded', function() {
    const drugAllergyInput = document.getElementById('drugAllergyInput');
    const drugsDropdown = document.getElementById('drugsDropdown');
    const addAllergyBtn = document.getElementById('addAllergyBtn');
    const allergiesList = document.getElementById('allergiesList');
    const drugAllergiesInput = document.getElementById('drugAllergies');
    const selectedAllergies = new Set();
    
    // Get existing allergies
    const patientAllergies = /*[[${patient.drugAllergies}]]*/ [];
    const drugMap = {};
    
    // Get drugs data from Thymeleaf with proper inline JavaScript
    const allDrugs = /*[[${allDrugs}]]*/ [];
    
    // Debugging - log the drugs to console
    console.log('Available drugs:', allDrugs);
    console.log('Patient allergies:', patientAllergies);
    
    // Create a map of drug IDs to drug names
    if (Array.isArray(allDrugs)) {
        allDrugs.forEach(drug => {
            // Handle different property structures
            const drugId = drug.id || '';
            const drugName = drug.name || drug.drugName || drug.genericName || '';
            if (drugId) {
                drugMap[drugId] = drugName;
            }
        });
    } else {
        console.error('allDrugs is not properly initialized:', allDrugs);
    }
    
    console.log('Drug name mapping:', drugMap);
    
    // Initialize with existing allergies
    if (patientAllergies && patientAllergies.length > 0) {
        // Clear any empty row
        const emptyRow = allergiesList.querySelector('.empty-allergies-row');
        if (emptyRow) {
            emptyRow.remove();
        }
        
        // Add existing allergies to the table
        patientAllergies.forEach(drugId => {
            if (drugMap[drugId]) {
                addDrugToTable(drugId, drugMap[drugId]);
                selectedAllergies.add(drugId);
            } else {
                console.warn('Could not find drug name for ID:', drugId);
            }
        });
        
        // Update hidden input
        updateDrugAllergiesInput();
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
        
        // Make sure allDrugs is an array with the expected properties
        if (!Array.isArray(allDrugs) || allDrugs.length === 0) {
            console.error('allDrugs is not properly initialized:', allDrugs);
            
            // Show no results message
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Error loading drugs. Please try again.';
            drugsDropdown.appendChild(noResults);
            drugsDropdown.style.display = 'block';
            return;
        }
        
        // Filter drugs based on search text - check different property names
        const searchLower = searchText.toLowerCase();
        const filteredDrugs = allDrugs.filter(drug => {
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
    
    // Function to add a drug to the table
    function addDrugToTable(drugId, drugName) {
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
        
        // Add the drug to the table
        addDrugToTable(drugId, drugName);
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
    
    // Show warning if no drugs are loaded
    if (!Array.isArray(allDrugs) || allDrugs.length === 0) {
        console.error('No drugs available in the system');
        // Add a visual warning to the page
        const warningDiv = document.createElement('div');
        warningDiv.style.color = '#ff9800';
        warningDiv.style.padding = '0.5rem 0';
        warningDiv.textContent = 'Warning: No drugs available in the system. Contact administrator.';
        document.querySelector('.drug-selection-container').after(warningDiv);
    }
});