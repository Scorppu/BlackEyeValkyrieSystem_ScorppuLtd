document.addEventListener('DOMContentLoaded', function() {
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
                alert('Patient profile updated successfully!');
                
                // Redirect to patient list
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error updating patient profile: ' + error.message);
            });
        });
    }
    
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
});