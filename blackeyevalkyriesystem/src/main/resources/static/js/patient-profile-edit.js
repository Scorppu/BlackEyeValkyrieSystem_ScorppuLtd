// Patient Profile Edit JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabItems = document.querySelectorAll('.tab-item');
    
    // Switch between form sections based on tab
    function switchFormSection(tabId) {
        // Hide all form sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the correct form section
        if (tabId === 'personal-info-tab') {
            document.getElementById('personal-info-form').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'personal-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('personal-info-tab').classList.add('active');
            document.getElementById('contact-info-tab').classList.remove('active');
            document.getElementById('allergies-tab').classList.remove('active');
        } else if (tabId === 'contact-info-tab') {
            document.getElementById('contact-info-form').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'contact-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('contact-info-tab').classList.add('active');
            document.getElementById('personal-info-tab').classList.remove('active');
            document.getElementById('allergies-tab').classList.remove('active');
        } else if (tabId === 'allergies-tab') {
            document.getElementById('allergies-form').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'allergies-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            document.getElementById('allergies-tab').classList.add('active');
            document.getElementById('personal-info-tab').classList.remove('active');
            document.getElementById('contact-info-tab').classList.remove('active');
        }
    }
    
    // Tab click event handling
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchFormSection(targetId);
        });
    });
    
    // Calculate age from date of birth
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
    
    // Drug allergies management
    const drugSelect = document.getElementById('drugSelect');
    const addAllergyBtn = document.getElementById('addAllergyBtn');
    const allergiesTableBody = document.getElementById('allergiesTableBody');
    const noAllergiesRow = document.getElementById('noAllergiesRow');
    
    if (addAllergyBtn && drugSelect && allergiesTableBody && noAllergiesRow) {
        addAllergyBtn.addEventListener('click', function() {
            const selectedDrug = drugSelect.value;
            const selectedDrugText = drugSelect.options[drugSelect.selectedIndex].text;
            
            if (selectedDrug) {
                // Hide the "no allergies" row if visible
                if (noAllergiesRow) {
                    noAllergiesRow.style.display = 'none';
                }
                
                // Create a new row for the allergy
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${selectedDrugText}</td>
                    <td>
                        <input type="hidden" name="allergies[]" value="${selectedDrug}">
                        <button type="button" class="remove-allergy-btn">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.6667 4.27337L11.7267 3.33337L8.00001 7.06004L4.27334 3.33337L3.33334 4.27337L7.06001 8.00004L3.33334 11.7267L4.27334 12.6667L8.00001 8.94004L11.7267 12.6667L12.6667 11.7267L8.94001 8.00004L12.6667 4.27337Z" fill="#DC3545"/>
                            </svg>
                            Remove
                        </button>
                    </td>
                `;
                
                allergiesTableBody.appendChild(newRow);
                
                // Add event listener to the remove button
                const removeButton = newRow.querySelector('.remove-allergy-btn');
                removeButton.addEventListener('click', function() {
                    allergiesTableBody.removeChild(newRow);
                    
                    // Show the "no allergies" row if there are no allergies
                    if (allergiesTableBody.children.length === 1) { // 1 because of the noAllergiesRow
                        noAllergiesRow.style.display = 'table-row';
                    }
                });
                
                // Reset the select
                drugSelect.value = '';
            }
        });
    }
}); 