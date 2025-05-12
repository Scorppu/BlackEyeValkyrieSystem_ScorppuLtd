/** 
 * Global data structures for patient profile information
 */
let patient = {};
let drugNamesMap = {};
let pastConsultations = [];
let isLoading = true;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const patientId = extractPatientIdFromUrl();
        if (!patientId) {
            showErrorMessage("Could not determine patient ID from URL.");
            return;
        }

        showLoadingState();

        await Promise.all([
            fetchPatientData(patientId),
            fetchDrugsData(),
            fetchPastConsultations(patientId)
        ]);

        populatePatientInfo();
        populateDrugAllergies();
        populatePastConsultations();

        setupTabNavigation();

        hideLoadingState();
    } catch (error) {
        console.error("Error initializing patient profile:", error);
        showErrorMessage("Failed to load patient data. Please try refreshing the page.");
    }
});

/**
 * Extracts patient ID from the current URL path
 * @returns {string|null} The patient ID or null if not found
 */
function extractPatientIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    const idIndex = pathParts.indexOf('view') + 1;
    return pathParts[idIndex] || null;
}

/**
 * Displays loading indicators throughout the UI
 */
function showLoadingState() {
    isLoading = true;
    
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

/**
 * Removes all loading indicators from the UI
 */
function hideLoadingState() {
    isLoading = false;
    document.querySelectorAll('.loading-placeholder').forEach(el => {
        el.parentElement.removeChild(el);
    });
}

/**
 * Displays an error notification message that auto-dismisses
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    hideLoadingState();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;';
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'margin-left: 10px; cursor: pointer; font-weight: bold;';
    closeBtn.onclick = function() { document.body.removeChild(errorDiv); };
    errorDiv.appendChild(closeBtn);
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 8000);
}

/**
 * Fetches patient data from the API
 * @param {string} patientId - The ID of the patient to fetch
 * @returns {Promise<void>}
 */
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

/**
 * Fetches drug data and creates a mapping from drug IDs to names
 * @returns {Promise<void>}
 */
async function fetchDrugsData() {
    try {
        const response = await fetch('/api/drugs');
        if (!response.ok) {
            throw new Error(`Failed to fetch drugs data: ${response.status} ${response.statusText}`);
        }
        
        const drugs = await response.json();
        
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

/**
 * Fetches past consultations for a patient and sorts them by date
 * @param {string} patientId - The ID of the patient to fetch consultations for
 * @returns {Promise<void>}
 */
async function fetchPastConsultations(patientId) {
    try {
        const response = await fetch(`/api/consultations/patient/${patientId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch consultations: ${response.status} ${response.statusText}`);
        }
        
        const allConsultations = await response.json();
        
        pastConsultations = allConsultations
            .filter(c => c.status === 'Completed')
            .sort((a, b) => new Date(b.consultationDateTime) - new Date(a.consultationDateTime))
            .slice(0, 10);
        
        console.log("Past consultations fetched successfully:", pastConsultations.length, "consultations found");
    } catch (error) {
        console.error("Error fetching consultations:", error);
        throw error;
    }
}

/**
 * Populates the UI with patient personal and contact information
 */
function populatePatientInfo() {
    if (!patient) return;
    
    document.getElementById('firstName').textContent = patient.firstName || '';
    document.getElementById('lastName').textContent = patient.lastName || '';
    document.getElementById('sex').textContent = patient.sex ? 'Male' : 'Female';
    document.getElementById('relativeName').textContent = patient.relativeName || '';
    document.getElementById('dateOfBirth').textContent = patient.dateOfBirth || '';
    document.getElementById('age').textContent = patient.age || '';
    document.getElementById('maritalStatus').textContent = patient.maritalStatus || '';
    document.getElementById('bloodType').textContent = patient.bloodType || '';
    
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

/**
 * Populates the allergies section with the patient's drug allergies
 */
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
        allergiesList.innerHTML = `
            <tr class="empty-allergies-row">
                <td>No drug allergies recorded</td>
            </tr>
        `;
    }
}

/**
 * Populates the past consultations table with the patient's consultation history
 */
function populatePastConsultations() {
    const consultationsList = document.getElementById('pastConsultationsList');
    consultationsList.innerHTML = '';
    
    if (pastConsultations && pastConsultations.length > 0) {
        pastConsultations.forEach(consult => {
            const row = document.createElement('tr');
            
            const dateObj = new Date(consult.consultationDateTime);
            const formattedDate = dateObj.toISOString().split('T')[0];
            
            const doctorName = consult.doctor ? 
                `${consult.doctor.firstName} ${consult.doctor.lastName}` : 'Unknown';
            
            const height = consult.vitalSigns && consult.vitalSigns.height ? 
                `${consult.vitalSigns.height} cm` : 'N/A';
            const weight = consult.vitalSigns && consult.vitalSigns.weight ? 
                `${consult.vitalSigns.weight} kg` : 'N/A';
            const bp = consult.vitalSigns && consult.vitalSigns.bloodPressure ? 
                consult.vitalSigns.bloodPressure : 'N/A';
                
            const notesPreview = consult.clinicalNotes ? 
                (consult.clinicalNotes.length > 100 ? 
                    consult.clinicalNotes.substring(0, 100) + '...' : 
                    consult.clinicalNotes) : 
                'No notes';
            
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
        consultationsList.innerHTML = `
            <tr class="empty-consultations-row">
                <td colspan="8">No past consultations recorded</td>
            </tr>
        `;
    }
}

/**
 * Sets up tab navigation for switching between different information sections
 */
function setupTabNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');
    const personalInfoSection = document.getElementById('personal-info-section');
    const contactInfoSection = document.getElementById('contact-info-section');
    const consultationsSection = document.getElementById('consultations-section');
    
    /**
     * Switches between different information sections based on tab selection
     * @param {string} tabId - The ID of the tab to switch to
     */
    function switchSection(tabId) {
        document.querySelectorAll('.info-section').forEach(section => {
            section.classList.remove('active');
        });
        
        tabItems.forEach(tab => {
            tab.classList.remove('active');
        });
        
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
    
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchSection(targetId);
        });
    });
}

/**
 * Displays consultation details in a modal window
 * @param {HTMLElement} element - The button element with consultation data attributes
 */
function showConsultationDetails(element) {
    const data = element.dataset;
    
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
    
    document.getElementById('consultationDetailsModal').style.display = 'block';
}

/**
 * Closes the consultation details modal
 */
function closeConsultationModal() {
    document.getElementById('consultationDetailsModal').style.display = 'none';
}

/**
 * Shows full consultation notes in a modal
 * @param {HTMLElement} element - The element containing the notes data
 */
function showFullNotes(element) {
    const fullNotes = element.getAttribute('data-full-notes');
    document.getElementById('fullConsultationNotes').textContent = fullNotes || 'No clinical notes recorded';
    document.getElementById('pastConsultationNotesModal').style.display = 'block';
}

/**
 * Closes the notes modal
 */
function closeNotesModal() {
    document.getElementById('pastConsultationNotesModal').style.display = 'none';
}

/**
 * Shows the vitals history modal for a specified vital type
 * @param {string} vitalType - The type of vital to display ('height' or 'weight')
 */
function showVitalsHistory(vitalType) {
    const modal = document.getElementById('vitalsHistoryModal');
    const title = document.getElementById('vitalsHistoryTitle');
    
    title.textContent = vitalType === 'height' ? 'Height History' : 'Weight History';
    
    modal.style.display = 'block';
    
    const consultations = collectPastConsultationsData();
    displayVitalsHistory(consultations, vitalType);
}

/**
 * Closes the vitals history modal
 */
function closeVitalsHistoryModal() {
    document.getElementById('vitalsHistoryModal').style.display = 'none';
}

/**
 * Collects vital sign data from past consultations
 * @returns {Array} Array of consultation objects with date, height, weight, and doctor
 */
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

/**
 * Displays vitals history in a table and chart
 * @param {Array} data - Array of consultation objects with vital measurements
 * @param {string} vitalType - The type of vital to display ('height' or 'weight')
 */
function displayVitalsHistory(data, vitalType) {
    const tableBody = document.getElementById('vitalsHistoryTableBody');
    const chartDiv = document.getElementById('vitalsHistoryChart');
    
    tableBody.innerHTML = '';
    chartDiv.innerHTML = '';
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No history data available</td></tr>';
        chartDiv.innerHTML = '<p style="text-align: center; padding: 20px;">No history data available</p>';
        return;
    }
    
    const filteredData = data.filter(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        return value !== undefined && value !== null && value !== '' && value !== 'N/A';
    });
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No history data available</td></tr>';
        chartDiv.innerHTML = '<p style="text-align: center; padding: 20px;">No history data available</p>';
        return;
    }
    
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
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
    
    createVitalsChart(chartDiv, filteredData, vitalType);
}

/**
 * Creates a chart visualization for patient vitals history
 * @param {HTMLElement} container - The container element for the chart
 * @param {Array} data - Array of consultation objects with vital measurements
 * @param {string} vitalType - The type of vital to display ('height' or 'weight')
 */
function createVitalsChart(container, data, vitalType) {
    container.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    const chartData = {
        labels: [],
        values: []
    };
    
    data.forEach(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
        chartData.labels.push(item.date);
        chartData.values.push(numericValue);
    });
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: vitalType === 'height' ? 'Height (cm)' : 'Weight (kg)',
                data: chartData.values,
                borderColor: 'rgb(138, 43, 226)',
                backgroundColor: 'rgba(138, 43, 226, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: vitalType === 'height' ? 'Height (cm)' : 'Weight (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: vitalType === 'height' ? 'Height History' : 'Weight History'
                }
            }
        }
    });
}

/**
 * Event handler to close modals when clicking outside of them
 */
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