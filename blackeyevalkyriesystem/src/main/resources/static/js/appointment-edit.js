/**
 * Appointment Creation and Editing JavaScript
 * 
 * This script manages the functionality for creating and editing appointments.
 * It handles patient and doctor selection, appointment scheduling, availability checking,
 * form validation, and status history tracking.
 * 
 * Key features:
 * - Patient and doctor search with real-time filtering and selection
 * - Date and time selection using flatpickr date/time pickers
 * - Real-time availability checking for doctor schedules
 * - Form validation before submission
 * - AJAX form submission for creating/updating appointments
 * - Status history tracking and timeline display
 * - Alert system for user feedback with auto-dismissal
 * - Pre-filling form data when editing existing appointments
 * 
 * The script uses fetch API for all server communications and provides
 * immediate feedback to users throughout the appointment management process.
 */

// Global variables
let selectedPatient = null;
let selectedDoctor = null;
let statusHistory = [];

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize flatpickr for date picker
    flatpickr("#appointmentDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        altInput: true,
        altFormat: "F j, Y",
        onChange: function(selectedDates, dateStr) {
            if (selectedDates.length > 0) {
                checkAvailability();
            }
        }
    });

    // Initialize flatpickr for time picker
    flatpickr("#appointmentTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 15,
        onChange: function(selectedDates, timeStr) {
            if (selectedDates.length > 0) {
                checkAvailability();
            }
        }
    });

    // Initialize patient search
    initializeSearch('#patientSearch', '/api/patients/search', function(item) {
        return `${item.firstName} ${item.lastName} (${item.idNumber})`;
    }, function(item) {
        document.getElementById('patientId').value = item.id;
        document.getElementById('patientName').value = `${item.firstName} ${item.lastName}`;
        displayPatientInfo(item);
    });

    // Initialize doctor search
    initializeSearch('#doctorSearch', '/api/doctors/search', function(item) {
        return `Dr. ${item.firstName} ${item.lastName} (${item.specialty})`;
    }, function(item) {
        document.getElementById('doctorId').value = item.id;
        document.getElementById('doctorName').value = `Dr. ${item.firstName} ${item.lastName}`;
        displayDoctorInfo(item);
        checkAvailability();
    });

    // Handle form submission
    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            submitForm();
        }
    });

    // Handle cancel button
    document.getElementById('cancelButton').addEventListener('click', function() {
        window.location.href = '/appointments';
    });

    // Initialize alert dismiss functionality
    initializeAlerts();

    // Pre-fill values if editing
    if (document.getElementById('appointmentId').value) {
        prefillForm();
    }
});

/**
 * Generic search initialization function
 */
function initializeSearch(inputSelector, searchUrl, formatResult, onSelect) {
    const searchInput = document.querySelector(inputSelector);
    const resultsContainer = searchInput.parentElement.querySelector('.search-results');
    let debounceTimer;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('visible');
            return;
        }

        debounceTimer = setTimeout(function() {
            fetch(`${searchUrl}?query=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    resultsContainer.innerHTML = '';
                    
                    if (data.length === 0) {
                        const noResults = document.createElement('div');
                        noResults.className = 'search-result-item';
                        noResults.textContent = 'No results found';
                        resultsContainer.appendChild(noResults);
                    } else {
                        data.forEach(item => {
                            const resultItem = document.createElement('div');
                            resultItem.className = 'search-result-item';
                            resultItem.textContent = formatResult(item);
                            resultItem.addEventListener('click', function() {
                                onSelect(item);
                                searchInput.value = formatResult(item);
                                resultsContainer.classList.remove('visible');
                            });
                            resultsContainer.appendChild(resultItem);
                        });
                    }
                    
                    resultsContainer.classList.add('visible');
                })
                .catch(error => {
                    console.error('Search error:', error);
                    showAlert('Error searching. Please try again.', 'danger');
                });
        }, 300);
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.remove('visible');
        }
    });

    // Show results when focusing on the input
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length >= 2 && resultsContainer.children.length > 0) {
            resultsContainer.classList.add('visible');
        }
    });
}

/**
 * Display patient information in the info box
 */
function displayPatientInfo(patient) {
    const infoContainer = document.getElementById('patientInfo');
    infoContainer.innerHTML = `
        <div class="info-row">
            <div class="info-label">ID Number:</div>
            <div>${patient.idNumber || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Birth Date:</div>
            <div>${patient.dateOfBirth || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Gender:</div>
            <div>${patient.gender || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Contact:</div>
            <div>${patient.phoneNumber || 'N/A'}</div>
        </div>
    `;
    infoContainer.classList.add('visible');
}

/**
 * Display doctor information in the info box
 */
function displayDoctorInfo(doctor) {
    const infoContainer = document.getElementById('doctorInfo');
    infoContainer.innerHTML = `
        <div class="info-row">
            <div class="info-label">Specialty:</div>
            <div>${doctor.specialty || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Department:</div>
            <div>${doctor.department || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Experience:</div>
            <div>${doctor.yearsOfExperience || 'N/A'} years</div>
        </div>
    `;
    infoContainer.classList.add('visible');
}

/**
 * Check availability of the doctor at the selected time
 */
function checkAvailability() {
    const doctorId = document.getElementById('doctorId').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const appointmentId = document.getElementById('appointmentId').value;
    
    if (!doctorId || !date || !time) {
        return;
    }
    
    const availabilityContainer = document.getElementById('availabilityMessage');
    availabilityContainer.textContent = 'Checking availability...';
    availabilityContainer.className = 'availability-message';
    availabilityContainer.style.display = 'block';
    
    const params = new URLSearchParams();
    params.append('doctorId', doctorId);
    params.append('date', date);
    params.append('time', time);
    if (appointmentId) {
        params.append('appointmentId', appointmentId);
    }
    
    fetch(`/api/appointments/check-availability?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.available) {
                availabilityContainer.textContent = 'The doctor is available at this time.';
                availabilityContainer.className = 'availability-message available';
            } else {
                availabilityContainer.textContent = 'The doctor is NOT available at this time.';
                availabilityContainer.className = 'availability-message unavailable';
            }
        })
        .catch(error => {
            console.error('Error checking availability:', error);
            availabilityContainer.textContent = 'Unable to check availability. Please try again.';
            availabilityContainer.className = 'availability-message unavailable';
        });
}

/**
 * Validate the form before submission
 */
function validateForm() {
    const patientId = document.getElementById('patientId').value;
    const doctorId = document.getElementById('doctorId').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const duration = document.getElementById('duration').value;
    const type = document.getElementById('appointmentType').value;
    const status = document.getElementById('appointmentStatus').value;
    
    if (!patientId) {
        showAlert('Please select a patient.', 'danger');
        return false;
    }
    
    if (!doctorId) {
        showAlert('Please select a doctor.', 'danger');
        return false;
    }
    
    if (!date) {
        showAlert('Please select an appointment date.', 'danger');
        return false;
    }
    
    if (!time) {
        showAlert('Please select an appointment time.', 'danger');
        return false;
    }
    
    if (!duration) {
        showAlert('Please enter an appointment duration.', 'danger');
        return false;
    }
    
    if (!type) {
        showAlert('Please select an appointment type.', 'danger');
        return false;
    }
    
    if (!status) {
        showAlert('Please select an appointment status.', 'danger');
        return false;
    }
    
    return true;
}

/**
 * Submit the form via AJAX
 */
function submitForm() {
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    const appointmentId = document.getElementById('appointmentId').value;
    const isNew = !appointmentId;
    
    const url = isNew ? '/api/appointments/create' : `/api/appointments/update/${appointmentId}`;
    const method = isNew ? 'POST' : 'PUT';
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert(isNew ? 'Appointment created successfully!' : 'Appointment updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = isNew ? `/appointments/edit/${data.appointmentId}` : window.location.href;
            }, 1500);
        } else {
            showAlert(data.message || 'An error occurred. Please try again.', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred. Please try again.', 'danger');
    });
}

/**
 * Display an alert message
 */
function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type}">
            ${message}
            <span class="alert-dismissible" onclick="dismissAlert('${alertId}')">&times;</span>
        </div>
    `;
    
    alertsContainer.innerHTML += alertHTML;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        dismissAlert(alertId);
    }, 5000);
}

/**
 * Dismiss an alert
 */
function dismissAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }
}

/**
 * Initialize alerts
 */
function initializeAlerts() {
    window.dismissAlert = dismissAlert;
}

/**
 * Pre-fill the form when editing an existing appointment
 */
function prefillForm() {
    const appointmentId = document.getElementById('appointmentId').value;
    
    fetch(`/api/appointments/${appointmentId}`)
        .then(response => response.json())
        .then(data => {
            // Pre-fill patient
            if (data.patient) {
                document.getElementById('patientId').value = data.patient.id;
                document.getElementById('patientName').value = `${data.patient.firstName} ${data.patient.lastName}`;
                displayPatientInfo(data.patient);
            }
            
            // Pre-fill doctor
            if (data.doctor) {
                document.getElementById('doctorId').value = data.doctor.id;
                document.getElementById('doctorName').value = `Dr. ${data.doctor.firstName} ${data.doctor.lastName}`;
                displayDoctorInfo(data.doctor);
            }
            
            // Pre-fill date and time
            if (data.appointmentDateTime) {
                const dateTime = new Date(data.appointmentDateTime);
                const date = dateTime.toISOString().split('T')[0];
                const hours = dateTime.getHours().toString().padStart(2, '0');
                const minutes = dateTime.getMinutes().toString().padStart(2, '0');
                const time = `${hours}:${minutes}`;
                
                document.getElementById('appointmentDate').value = date;
                document.getElementById('appointmentTime').value = time;
                
                // Manually trigger flatpickr update
                const dateInstance = document.querySelector("#appointmentDate")._flatpickr;
                const timeInstance = document.querySelector("#appointmentTime")._flatpickr;
                
                if (dateInstance) dateInstance.setDate(date);
                if (timeInstance) timeInstance.setDate(time);
            }
            
            // Pre-fill other fields
            if (data.duration) document.getElementById('duration').value = data.duration;
            if (data.type) document.getElementById('appointmentType').value = data.type;
            if (data.status) document.getElementById('appointmentStatus').value = data.status;
            if (data.reason) document.getElementById('reason').value = data.reason;
            if (data.notes) document.getElementById('notes').value = data.notes;
            
            // Check availability
            checkAvailability();
            
            // Load status history
            loadStatusHistory(appointmentId);
        })
        .catch(error => {
            console.error('Error loading appointment data:', error);
            showAlert('Error loading appointment data. Please try again.', 'danger');
        });
}

/**
 * Load status history for an appointment
 */
function loadStatusHistory(appointmentId) {
    fetch(`/api/appointments/${appointmentId}/history`)
        .then(response => response.json())
        .then(data => {
            const historyContainer = document.getElementById('statusHistory');
            
            if (!data || data.length === 0) {
                historyContainer.innerHTML = '<p class="no-history">No status changes recorded yet.</p>';
                return;
            }
            
            let historyHTML = '<div class="timeline">';
            
            data.forEach(history => {
                const date = new Date(history.timestamp);
                const formattedDate = date.toLocaleString();
                
                historyHTML += `
                    <div class="timeline-item">
                        <div class="timeline-point"></div>
                        <div class="timeline-content">
                            <h5>Status changed to: ${history.newStatus}</h5>
                            <p>Changed by: ${history.changedBy || 'System'}</p>
                            <p>Date: ${formattedDate}</p>
                            ${history.comments ? `<p>Comments: ${history.comments}</p>` : ''}
                        </div>
                    </div>
                `;
            });
            
            historyHTML += '</div>';
            historyContainer.innerHTML = historyHTML;
        })
        .catch(error => {
            console.error('Error loading status history:', error);
            document.getElementById('statusHistory').innerHTML = '<p class="no-history">Unable to load status history.</p>';
        });
} 