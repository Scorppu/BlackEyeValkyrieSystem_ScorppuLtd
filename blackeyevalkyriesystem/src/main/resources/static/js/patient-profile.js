// Initialize empty data structures that will be populated via API calls
let patient = {};
let drugNamesMap = {};
let pastConsultations = [];
let isLoading = true;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Extract patient ID from URL path
        const patientId = extractPatientIdFromUrl();
        if (!patientId) {
            showErrorMessage("Could not determine patient ID from URL.");
            return;
        }

        // Show loading indicators
        showLoadingState();

        // Fetch all required data
        await Promise.all([
            fetchPatientData(patientId),
            fetchDrugsData(),
            fetchPastConsultations(patientId)
        ]);

        // Populate the UI with the data
        populatePatientInfo();
        populateDrugAllergies();
        populatePastConsultations();

        // Set up event listeners for tab navigation
        setupTabNavigation();

        // Hide loading indicators
        hideLoadingState();
    } catch (error) {
        console.error("Error initializing patient profile:", error);
        showErrorMessage("Failed to load patient data. Please try refreshing the page.");
    }
});

// Extract patient ID from the current URL
function extractPatientIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('view') + 1;
    return pathParts[idIndex] || null;
}

// Show loading indicators throughout the UI
function showLoadingState() {
    isLoading = true;
    
    // Add loading indicators to key sections
    document.querySelectorAll('.info-value').forEach(el => {
        el.innerHTML = '<span class="loading-placeholder">Loading...</span>';
    });
    
    document.getElementById('allergiesList').innerHTML = `
        <tr><td><span class="loading-placeholder">Loading allergies...</span></td></tr>
    `;
    
    document.getElementById('pastConsultationsList').innerHTML = `
        <tr><td colspan="8"><span class="loading-placeholder">Loading consultations...</span></td></tr>
    `;
}

// Hide loading indicators
function hideLoadingState() {
    isLoading = false;
    document.querySelectorAll('.loading-placeholder').forEach(el => {
        el.parentElement.removeChild(el);
    });
}

// Show an error message to the user
function showErrorMessage(message) {
    hideLoadingState();
    
    // Create an error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;';
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'margin-left: 10px; cursor: pointer; font-weight: bold;';
    closeBtn.onclick = function() { document.body.removeChild(errorDiv); };
    errorDiv.appendChild(closeBtn);
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 8000);
}

// Fetch patient data from API
async function fetchPatientData(patientId) {
    try {
        const response = await fetch(`/api/patients/${patientId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch patient data: ${response.status} ${response.statusText}`);
        }
        
        patient = await response.json();
        console.log("Patient data fetched successfully:", patient);
    } catch (error) {
        console.error("Error fetching patient data:", error);
        throw error;
    }
}

// Fetch drug data for mapping drug IDs to names
async function fetchDrugsData() {
    try {
        const response = await fetch('/api/drugs');
        if (!response.ok) {
            throw new Error(`Failed to fetch drugs data: ${response.status} ${response.statusText}`);
        }
        
        const drugs = await response.json();
        
        // Convert the array to a map of id -> name
        drugNamesMap = drugs.reduce((map, drug) => {
            map[drug.id] = drug.name;
            return map;
        }, {});
        
        console.log("Drugs data fetched successfully:", drugs.length, "drugs loaded");
    } catch (error) {
        console.error("Error fetching drugs data:", error);
        throw error;
    }
}

// Fetch past consultations for this patient
async function fetchPastConsultations(patientId) {
    try {
        const response = await fetch(`/api/consultations/patient/${patientId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch consultations: ${response.status} ${response.statusText}`);
        }
        
        const allConsultations = await response.json();
        
        // Filter to only include completed consultations
        pastConsultations = allConsultations
            .filter(c => c.status === 'Completed')
            .sort((a, b) => new Date(b.consultationDateTime) - new Date(a.consultationDateTime))
            .slice(0, 10); // Limit to 10 most recent
        
        console.log("Past consultations fetched successfully:", pastConsultations.length, "consultations found");
    } catch (error) {
        console.error("Error fetching consultations:", error);
        throw error;
    }
}

// Populate personal information in the UI
function populatePatientInfo() {
    if (!patient) return;
    
    // Populate personal information
    document.getElementById('firstName').textContent = patient.firstName || '';
    document.getElementById('lastName').textContent = patient.lastName || '';
    document.getElementById('sex').textContent = patient.sex ? 'Male' : 'Female';
    document.getElementById('relativeName').textContent = patient.relativeName || '';
    document.getElementById('dateOfBirth').textContent = patient.dateOfBirth || '';
    document.getElementById('age').textContent = patient.age || '';
    document.getElementById('maritalStatus').textContent = patient.maritalStatus || '';
    document.getElementById('bloodType').textContent = patient.bloodType || '';
    
    // Populate contact information
    if (patient.address) {
        document.getElementById('contactNumber').textContent = patient.contactNumber || '';
        document.getElementById('email').textContent = patient.email || '';
        document.getElementById('address1').textContent = patient.address.addressLine1 || '';
        document.getElementById('address2').textContent = patient.address.addressLine2 || '';
        document.getElementById('address3').textContent = patient.address.addressLine3 || '';
        document.getElementById('country').textContent = patient.address.country || '';
        document.getElementById('state').textContent = patient.address.state || '';
        document.getElementById('town').textContent = patient.address.town || '';
        document.getElementById('pinCode').textContent = patient.address.pinCode || '';
    }
}

// Populate drug allergies section
function populateDrugAllergies() {
    const allergiesList = document.getElementById('allergiesList');
    allergiesList.innerHTML = '';
    
    if (patient.drugAllergies && patient.drugAllergies.length > 0) {
        patient.drugAllergies.forEach(drugId => {
            const drugName = drugNamesMap[drugId] || 'Unknown Drug';
            const row = document.createElement('tr');
            row.innerHTML = `<td>${drugName}</td>`;
            allergiesList.appendChild(row);
        });
    } else {
        // Show empty state
        allergiesList.innerHTML = `
            <tr class="empty-allergies-row">
                <td>No drug allergies recorded</td>
            </tr>
        `;
    }
}

// Populate past consultations table
function populatePastConsultations() {
    const consultationsList = document.getElementById('pastConsultationsList');
    consultationsList.innerHTML = '';
    
    if (pastConsultations && pastConsultations.length > 0) {
        pastConsultations.forEach(consult => {
            const row = document.createElement('tr');
            
            // Format date from consultationDateTime
            const dateObj = new Date(consult.consultationDateTime);
            const formattedDate = dateObj.toISOString().split('T')[0];
            
            // Calculate doctor name
            const doctorName = consult.doctor ? 
                `${consult.doctor.firstName} ${consult.doctor.lastName}` : 'Unknown';
            
            // Format height, weight and blood pressure with units
            const height = consult.vitalSigns && consult.vitalSigns.height ? 
                `${consult.vitalSigns.height} cm` : 'N/A';
            const weight = consult.vitalSigns && consult.vitalSigns.weight ? 
                `${consult.vitalSigns.weight} kg` : 'N/A';
            const bp = consult.vitalSigns && consult.vitalSigns.bloodPressure ? 
                consult.vitalSigns.bloodPressure : 'N/A';
                
            // Create shortened notes preview
            const notesPreview = consult.clinicalNotes ? 
                (consult.clinicalNotes.length > 100 ? 
                    consult.clinicalNotes.substring(0, 100) + '...' : 
                    consult.clinicalNotes) : 
                'No notes';
            
            // Create row content
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${doctorName}</td>
                <td>${height}</td>
                <td>${weight}</td>
                <td>${bp}</td>
                <td>${consult.diagnosis || 'N/A'}</td>
                <td>
                    <div class="consultation-notes" style="cursor: pointer;" 
                         data-full-notes="${consult.clinicalNotes || ''}" onclick="showFullNotes(this)">
                        ${notesPreview}
                    </div>
                </td>
                <td>
                    <button type="button" class="btn-secondary" style="background-color: var(--secondary-bg); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px; cursor: pointer;"
                        data-id="${consult.id}"
                        data-date="${formattedDate}"
                        data-doctor="${doctorName}"
                        data-type="${consult.consultationType || 'Regular'}"
                        data-status="${consult.status || 'Completed'}"
                        data-diagnosis="${consult.diagnosis || ''}"
                        data-notes="${consult.clinicalNotes || ''}"
                        data-bp="${bp}"
                        data-temp="${consult.vitalSigns ? consult.vitalSigns.temperature : ''}"
                        data-hr="${consult.vitalSigns ? consult.vitalSigns.heartRate : ''}"
                        data-rr="${consult.vitalSigns ? consult.vitalSigns.respiratoryRate : ''}"
                        data-height="${consult.vitalSigns ? consult.vitalSigns.height : ''}"
                        data-weight="${consult.vitalSigns ? consult.vitalSigns.weight : ''}"
                        data-o2="${consult.vitalSigns ? consult.vitalSigns.oxygenSaturation : ''}"
                        data-bmi="${consult.vitalSigns ? consult.vitalSigns.bmi : ''}"
                        onclick="showConsultationDetails(this)">
                        View
                    </button>
                </td>
            `;
            
            consultationsList.appendChild(row);
        });
    } else {
        // Show empty state
        consultationsList.innerHTML = `
            <tr class="empty-consultations-row">
                <td colspan="8">No past consultations recorded</td>
            </tr>
        `;
    }
}

// Set up tab navigation
function setupTabNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoSection = document.getElementById('personal-info-section');
    const contactInfoSection = document.getElementById('contact-info-section');
    const consultationsSection = document.getElementById('consultations-section');
    
    // Switch between sections based on tab
    function switchSection(tabId) {
        // Hide all sections
        document.querySelectorAll('.info-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all tabs
        tabItems.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show the correct section and set active tab
        if (tabId === 'personal-info-tab') {
            personalInfoSection.classList.add('active');
            document.querySelector(`.tab-item[data-target="personal-info-tab"]`).classList.add('active');
        } else if (tabId === 'contact-info-tab') {
            contactInfoSection.classList.add('active');
            document.querySelector(`.tab-item[data-target="contact-info-tab"]`).classList.add('active');
        } else if (tabId === 'consultations-tab') {
            consultationsSection.classList.add('active');
            document.querySelector(`.tab-item[data-target="consultations-tab"]`).classList.add('active');
        }
    }
    
    // Tab click event handling
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchSection(targetId);
        });
    });
}

// Function to show consultation details in modal
function showConsultationDetails(element) {
    const data = element.dataset;
    
    // Populate modal with consultation data
    document.getElementById('modalDate').textContent = data.date || 'N/A';
    document.getElementById('modalDoctor').textContent = data.doctor || 'Unknown';
    document.getElementById('modalType').textContent = data.type || 'Regular';
    document.getElementById('modalStatus').textContent = data.status || 'Completed';
    document.getElementById('modalDiagnosis').textContent = data.diagnosis || 'No diagnosis recorded';
    document.getElementById('modalNotes').textContent = data.notes || 'No notes recorded';
    document.getElementById('modalBP').textContent = data.bp ? data.bp : 'Not recorded';
    document.getElementById('modalTemp').textContent = data.temp ? data.temp + ' °C' : 'Not recorded';
    document.getElementById('modalHR').textContent = data.hr ? data.hr + ' bpm' : 'Not recorded';
    document.getElementById('modalRR').textContent = data.rr ? data.rr + ' breaths/min' : 'Not recorded';
    document.getElementById('modalO2').textContent = data.o2 ? data.o2 + '%' : 'Not recorded';
    document.getElementById('modalWeight').textContent = data.weight ? data.weight + ' kg' : 'Not recorded';
    document.getElementById('modalHeight').textContent = data.height ? data.height + ' cm' : 'Not recorded';
    document.getElementById('modalBMI').textContent = data.bmi ? data.bmi : 'Not recorded';
    
    // Show the modal
    document.getElementById('consultationDetailsModal').style.display = 'block';
}

// Function to close the consultation details modal
function closeConsultationModal() {
    document.getElementById('consultationDetailsModal').style.display = 'none';
}

// Function to show full notes modal
function showFullNotes(element) {
    const fullNotes = element.getAttribute('data-full-notes');
    document.getElementById('fullConsultationNotes').textContent = fullNotes || 'No clinical notes recorded';
    document.getElementById('pastConsultationNotesModal').style.display = 'block';
}

// Function to close notes modal
function closeNotesModal() {
    document.getElementById('pastConsultationNotesModal').style.display = 'none';
}

// Function to show vitals history modal
function showVitalsHistory(vitalType) {
    const modal = document.getElementById('vitalsHistoryModal');
    const title = document.getElementById('vitalsHistoryTitle');
    
    // Set the title based on the vital type
    title.textContent = vitalType === 'height' ? 'Height History' : 'Weight History';
    
    // Show the modal
    modal.style.display = 'block';
    
    // Collect data from the past consultations
    const consultations = collectPastConsultationsData();
    displayVitalsHistory(consultations, vitalType);
}

// Function to close vitals history modal
function closeVitalsHistoryModal() {
    document.getElementById('vitalsHistoryModal').style.display = 'none';
}

// Function to collect data from past consultations table
function collectPastConsultationsData() {
    const consultations = [];
    
    const rows = document.querySelectorAll('.past-consultations-container tbody tr');
    
    rows.forEach(row => {
        const button = row.querySelector('button.btn-secondary');
        if (!button) return;
        
        const data = button.dataset;
        
        if (data.date && (data.height || data.weight)) {
            consultations.push({
                date: data.date,
                height: data.height,
                weight: data.weight,
                doctor: data.doctor
            });
        }
    });
    
    return consultations;
}

// Function to display vitals history
function displayVitalsHistory(data, vitalType) {
    const tableBody = document.getElementById('vitalsHistoryTableBody');
    const chartDiv = document.getElementById('vitalsHistoryChart');
    
    // Clear previous data
    tableBody.innerHTML = '';
    chartDiv.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No history data available</td></tr>';
        return;
    }
    
    // Filter to only include items with the requested vital type data
    const filteredData = data.filter(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        return value !== undefined && value !== null && value !== '' && value !== 'N/A';
    });
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No history data available</td></tr>';
        return;
    }
    
    // Sort data by date (oldest first for table)
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add table rows
    filteredData.forEach(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${item.date}</td>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${value}</td>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-color);">${item.doctor || 'Unknown'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('consultationDetailsModal');
    const notesModal = document.getElementById('pastConsultationNotesModal');
    const vitalsHistoryModal = document.getElementById('vitalsHistoryModal');
    
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    if (event.target === notesModal) {
        notesModal.style.display = 'none';
    }
    if (event.target === vitalsHistoryModal) {
        vitalsHistoryModal.style.display = 'none';
    }
};