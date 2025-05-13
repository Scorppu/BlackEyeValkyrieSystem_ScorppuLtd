/**
 * Appointment Timeline JavaScript
 * 
 * This script manages the appointment timeline view, displaying scheduled appointments
 * by doctor and time, as well as pending appointments in a tabular format.
 * 
 * Key features:
 * - Timeline visualization of appointments across doctors for a selected date
 * - Interactive appointment blocks with visual indicators for appointment types
 * - Date selection for filtering the timeline and pending appointments
 * - Pending appointments table with date range filtering
 * - Appointment actions (edit, cancel) with confirmation handling
 * - Responsive timeline with proper scrolling behavior
 * - Tooltips for appointment details on hover
 * - Notification system for operation results (creation, updates)
 * - Error handling with fallback data when API calls fail
 * 
 * The script handles the entire lifecycle of displaying and interacting with appointments
 * in a timeline format, from fetching data to rendering visual elements and handling user actions.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Appointment Timeline page loaded');
    
    // Check for notification in URL parameters
    displayNotificationFromUrlParams();
    
    // Constants for timeline calculations
    const slotWidth = 100; // Width in pixels of each time slot
    const workStartHour = 9; // 9 AM
    const workEndHour = 17; // 5 PM
    const timeSlots = (workEndHour - workStartHour) * 2 + 1; // 30-minute slots
    
    // DOM Elements
    const timelineContent = document.getElementById('timelineContent');
    const timelineGrid = document.getElementById('timelineGrid');
    const timelineHeader = document.getElementById('timelineHeader');
    const timelineDateInput = document.getElementById('timelineDate');
    const pendingAppointmentsList = document.getElementById('pendingAppointmentsList');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    /**
     * Returns today's date formatted as YYYY-MM-DD.
     * 
     * @returns {string} The current date in YYYY-MM-DD format
     */
    function getTodayFormatted() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Initializes date input fields with the current date and sets up event listeners.
     * Sets up timeline date input and date range for pending appointments.
     * Triggers initial loading of timeline and pending appointments table.
     */
    function initializeDateInputs() {
        const today = getTodayFormatted();
        
        // Set timeline date
        if (timelineDateInput) {
            timelineDateInput.value = today;
            
            // Initial load of timeline
            updateTimeline(timelineDateInput.value);
            
            // Handle date change events
            timelineDateInput.addEventListener('blur', function() {
                if (timelineDateInput.value) {
                    updateTimeline(timelineDateInput.value);
                }
            });
            
            timelineDateInput.addEventListener('change', function() {
                if (timelineDateInput.value) {
                    setTimeout(() => {
                        updateTimeline(timelineDateInput.value);
                    }, 100);
                }
            });
        }
        
        // Set date range for pending appointments
        if (startDateInput && endDateInput) {
            startDateInput.value = today;
            endDateInput.value = today;
            
            // Initial load of pending appointments
            renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
            
            // Handle date range changes
            startDateInput.addEventListener('blur', function() {
                if (startDateInput.value && endDateInput.value) {
                    if (new Date(endDateInput.value) < new Date(startDateInput.value)) {
                        endDateInput.value = startDateInput.value;
                    }
                    renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
                }
            });
            
            endDateInput.addEventListener('blur', function() {
                if (startDateInput.value && endDateInput.value) {
                    if (new Date(endDateInput.value) < new Date(startDateInput.value)) {
                        alert('End date cannot be earlier than start date');
                        endDateInput.value = startDateInput.value;
                    }
                    renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
                }
            });
            
            startDateInput.addEventListener('change', function() {
                if (startDateInput.value && endDateInput.value) {
                    setTimeout(() => {
                        if (new Date(endDateInput.value) < new Date(startDateInput.value)) {
                            endDateInput.value = startDateInput.value;
                        }
                        renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
                    }, 100);
                }
            });
            
            endDateInput.addEventListener('change', function() {
                if (startDateInput.value && endDateInput.value) {
                    setTimeout(() => {
                        if (new Date(endDateInput.value) < new Date(startDateInput.value)) {
                            alert('End date cannot be earlier than start date');
                            endDateInput.value = startDateInput.value;
                        }
                        renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
                    }, 100);
                }
            });
        }
    }
    
    /**
     * Sets up the timeline content width based on time slots.
     * Calculates the width based on the number of time slots and slot width.
     * Applies minimum width constraints and checks if scrolling is needed.
     */
    function setupTimelineWidth() {
        if (timelineContent) {
            const totalWidth = (timeSlots * slotWidth) + 120; // Add doctor column width
            timelineContent.style.width = totalWidth + 'px';
            timelineContent.style.minWidth = Math.min(800, totalWidth) + 'px';
            
            // Check if timeline needs scrollbar
            checkTimelineOverflow();
        }
    }
    
    /**
     * Checks if the timeline content exceeds its container and adds scrolling if needed.
     * Sets the data-overflow attribute and adjusts overflowX style accordingly.
     */
    function checkTimelineOverflow() {
        const scrollContainer = document.querySelector('.timeline-scroll-container');
        
        if (timelineContent && scrollContainer) {
            // Check if content width exceeds container width
            const needsScroll = timelineContent.scrollWidth > scrollContainer.clientWidth;
            scrollContainer.setAttribute('data-overflow', needsScroll.toString());
            
            // Adjust appearance based on need for scrollbar
            scrollContainer.style.overflowX = needsScroll ? 'auto' : 'hidden';
        }
    }
    
    /**
     * Fetches appointments for the timeline for a specific date.
     * Displays a loading state and makes an API request to get appointments.
     * Provides a fallback response if the API call fails.
     * 
     * @param {string} date - The date in YYYY-MM-DD format to fetch appointments for
     * @returns {Promise<Object>} Promise resolving to the appointments data object
     */
    async function fetchAppointmentsForTimeline(date) {
        try {
            // Show loading state
            if (timelineGrid) {
                timelineGrid.innerHTML = '<div class="timeline-loading"><p>Loading appointments...</p></div>';
            }
            
            // Create API URL with date parameter
            const apiUrl = `/api/appointments/timeline?date=${date}`;
            
            // Fetch appointments from the database
            const response = await fetch(apiUrl);
            
            // Check if the request was successful
            if (!response.ok) {
                console.warn(`API endpoint not available (${response.status}). Using fallback data.`);
                
                // Return hardcoded data as fallback
                return {
                    doctors: [
                        {
                            id: 1,
                            name: '123 123',
                            appointments: []
                        }
                    ]
                };
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            
            // Return hardcoded data as fallback in case of errors
            return {
                doctors: [
                    {
                        id: 1,
                        name: '123 123',
                        appointments: []
                    }
                ]
            };
        }
    }
    
    /**
     * Calculates the horizontal position for an appointment on the timeline based on its time.
     * Converts time from the appointment's start time string to a pixel position.
     * 
     * @param {string} time - Time string in ISO format (e.g., "2023-01-01T09:30:00")
     * @returns {number} The horizontal position in pixels from the left edge
     */
    function calculatePosition(time) {
        // Extract hours and minutes from datetime string
        const timePart = time.split('T')[1];
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Calculate slot position based on time
        // Each slot is 100px wide, position is calculated from left edge
        return ((hours - workStartHour) * 2 + (minutes >= 30 ? 1 : 0)) * slotWidth;
    }
    
    /**
     * Determines the CSS class for an appointment block based on its type.
     * Different appointment types get different visual styling.
     * 
     * @param {string} type - The appointment type (e.g., "Emergency", "Follow-up")
     * @returns {string} The CSS class name to apply
     */
    function getAppointmentClass(type) {
        switch(type) {
            case 'Emergency':
                return 'red';
            case 'Follow-up':
                return 'teal';
            default:
                return '';
        }
    }
    
    /**
     * Updates the timeline display for the specified date.
     * Fetches appointments and renders them on the timeline grid.
     * Creates doctor rows and appointment blocks with proper positioning.
     * 
     * @param {string} date - The date in YYYY-MM-DD format to display on the timeline
     */
    async function updateTimeline(date) {
        // Get data
        const data = await fetchAppointmentsForTimeline(date);
        
        // Get timeline grid and empty it
        if (!timelineGrid) return;
        
        timelineGrid.innerHTML = '';
        
        // If no doctors or appointments, show message
        if (!data.doctors || data.doctors.length === 0) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data-message';
            noDataMessage.textContent = 'No appointments found for this date.';
            timelineGrid.appendChild(noDataMessage);
            return;
        }
        
        // For each doctor
        data.doctors.forEach(doctor => {
            // Create doctor row
            const doctorRow = document.createElement('div');
            doctorRow.className = 'doctor-row';
            
            // Create doctor column
            const doctorColumn = document.createElement('div');
            doctorColumn.className = 'doctor-column';
            doctorColumn.textContent = doctor.name;
            
            // Create timeline slots
            const timelineSlots = document.createElement('div');
            timelineSlots.className = 'timeline-slots';
            
            // Add appointments
            if (doctor.appointments && doctor.appointments.length > 0) {
                doctor.appointments.forEach(appointment => {
                    const leftPosition = calculatePosition(appointment.startTime);
                    
                    // Calculate width: duration in minutes / 30 minutes per slot * slot width
                    // Subtract 2px to ensure gaps between adjacent appointments
                    const width = (appointment.duration / 30) * slotWidth - 2;
                    
                    const appointmentBlock = document.createElement('div');
                    appointmentBlock.className = `appointment-block ${getAppointmentClass(appointment.type)}`;
                    appointmentBlock.style.left = `${leftPosition}px`;
                    appointmentBlock.style.width = `${width}px`;
                    appointmentBlock.textContent = appointment.patientName;
                    appointmentBlock.dataset.appointmentId = appointment.id;
                    
                    // Add title for overflow text
                    appointmentBlock.title = `${appointment.patientName} - ${appointment.type}`;
                    
                    // Add click event
                    appointmentBlock.addEventListener('click', function() {
                        // This would be replaced with a proper detail view
                        alert(`Appointment details for ${appointment.patientName}\nType: ${appointment.type}\nTime: ${appointment.startTime.split('T')[1].substring(0, 5)}\nDuration: ${appointment.duration} mins`);
                    });
                    
                    timelineSlots.appendChild(appointmentBlock);
                });
            }
            
            // Assemble row
            doctorRow.appendChild(doctorColumn);
            doctorRow.appendChild(timelineSlots);
            
            // Add to grid
            timelineGrid.appendChild(doctorRow);
        });
        
        // After adding all appointments, check for overflow again
        checkTimelineOverflow();
    }
    
    /**
     * Fetches pending appointments for a date range.
     * Creates formatted date strings and makes an API request.
     * 
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} Promise resolving to an array of pending appointments
     */
    async function fetchPendingAppointments(startDate, endDate) {
        try {
            // Create formatted date strings for API
            const formattedStartDate = startDate + 'T00:00:00';
            const formattedEndDate = endDate + 'T23:59:59';
            
            // Create API URL with date range parameters
            const apiUrl = `/api/appointments/pending?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
            
            // Fetch pending appointments from the database
            const response = await fetch(apiUrl);
            
            // Check if the request was successful
            if (!response.ok) {
                console.warn(`API endpoint not available (${response.status}). Using fallback data.`);
                return [];
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching pending appointments:', error);
            return [];
        }
    }
    
    /**
     * Formats a date string for display with localized time.
     * Converts an ISO date string to a formatted date-time string.
     * 
     * @param {string} dateString - The date string to format (ISO format)
     * @returns {string} Formatted date string in YYYY-MM-DD HH:MM format
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        
        // Format year, month, day
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Format hours and minutes in 24-hour format
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    
    /**
     * Renders the pending appointments table for a date range.
     * Fetches appointments and creates table rows with appointment details.
     * Handles different priority levels with appropriate styling.
     * 
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     */
    async function renderPendingAppointmentsTable(startDate, endDate) {
        if (!pendingAppointmentsList) return;
        
        // Show loading message
        pendingAppointmentsList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p>Loading pending appointments...</p>
                </td>
            </tr>
        `;
        
        // Fetch appointments
        const appointments = await fetchPendingAppointments(startDate, endDate);
        
        if (appointments.length === 0) {
            pendingAppointmentsList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <p>No pending appointments found for the selected date range.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Build table rows
        let html = '';
        appointments.forEach(appointment => {
            // Create priority badge class
            let priorityClass = 'status-badge';
            if (appointment.priority === 'urgent') {
                priorityClass += ' red';
            } else if (appointment.priority === 'high') {
                priorityClass += ' yellow';
            } else if (appointment.priority === 'medium') {
                priorityClass += ' blue';
            } else {
                priorityClass += ' teal';
            }
            
            html += `
                <tr>
                    <td>${appointment.patientName}</td>
                    <td>${appointment.doctor}</td>
                    <td>${appointment.appointmentType}</td>
                    <td>${formatDate(appointment.scheduledTime)}</td>
                    <td>${appointment.duration} mins</td>
                    <td><span class="${priorityClass}">${appointment.priority}</span></td>
                    <td>
                        <div class="patient-actions">
                            <a href="javascript:void(0);" class="edit-appointment" data-id="${appointment.id}" title="Edit">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </a>
                            <a href="javascript:void(0);" class="cancel-appointment" data-id="${appointment.id}" title="Cancel">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        pendingAppointmentsList.innerHTML = html;
    }
    
    /**
     * Handles appointment editing by navigating to the edit page.
     * Uses window.location to redirect to the edit page for the specified appointment.
     * 
     * @param {string} appointmentId - The ID of the appointment to edit
     */
    function editAppointment(appointmentId) {
        try {
            if (!appointmentId) {
                console.error('Invalid appointment ID');
                alert('Error: Invalid appointment ID');
                return;
            }
            
            // Navigate to the edit page using window.location with proper error handling
            console.log(`Redirecting to edit page for appointment: ${appointmentId}`);
            window.location.href = `/appointment/edit/${appointmentId}`;
        } catch (error) {
            console.error('Error navigating to edit page:', error);
            alert('An error occurred while trying to edit the appointment. Please try again.');
        }
    }
    
    /**
     * Handles appointment cancellation with user confirmation.
     * Makes a DELETE request to the API and refreshes the timeline and pending table on success.
     * 
     * @param {string} appointmentId - The ID of the appointment to cancel
     */
    function cancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            fetch(`/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Successfully cancelled
                    alert('Appointment cancelled successfully');
                    // Refresh the pending appointments list
                    if (startDateInput && endDateInput) {
                        renderPendingAppointmentsTable(startDateInput.value, endDateInput.value);
                    }
                    // Also refresh the timeline
                    if (timelineDateInput) {
                        updateTimeline(timelineDateInput.value);
                    }
                } else {
                    throw new Error('Failed to cancel appointment');
                }
            })
            .catch(error => {
                console.error('Error cancelling appointment:', error);
                alert('Error cancelling appointment. Please try again.');
            });
        }
    }
    
    /**
     * Adds event listeners for appointment action buttons using event delegation.
     * Listens for clicks on edit and cancel buttons throughout the document.
     * Routes each action to the appropriate handler function.
     */
    function addAppointmentActionEventListeners() {
        // Event delegation for edit and cancel buttons
        document.addEventListener('click', function(e) {
            if (e.target && e.target.closest('.edit-appointment')) {
                const appointmentId = e.target.closest('.edit-appointment').dataset.id;
                editAppointment(appointmentId);
                e.preventDefault();
            }
            
            if (e.target && e.target.closest('.cancel-appointment')) {
                const appointmentId = e.target.closest('.cancel-appointment').dataset.id;
                cancelAppointment(appointmentId);
                e.preventDefault();
            }
        });
    }
    
    /**
     * Initializes the tooltip container by creating and appending it to the body.
     * Creates a div with appropriate classes to serve as a tooltip for appointments.
     */
    function initializeTooltip() {
        const tooltipDiv = document.createElement('div');
        tooltipDiv.className = 'appointment-tooltip';
        tooltipDiv.id = 'appointmentTooltip';
        document.body.appendChild(tooltipDiv);
    }
    
    /**
     * Shows the appointment tooltip with details when hovering over an appointment.
     * Positions the tooltip above the appointment block and fills it with appointment data.
     * 
     * @param {Event} event - The mouse event that triggered the tooltip
     */
    function showTooltip(event) {
        const appointment = event.currentTarget;
        const tooltip = document.getElementById('appointmentTooltip');
        
        if (tooltip) {
            tooltip.innerHTML = `
                <div class="tooltip-heading">${appointment.dataset.patientName}</div>
                <div class="tooltip-row">
                    <div class="tooltip-label">Type:</div>
                    <div class="tooltip-value">${appointment.dataset.type}</div>
                </div>
                <div class="tooltip-row">
                    <div class="tooltip-label">Time:</div>
                    <div class="tooltip-value">${appointment.dataset.startTime ? appointment.dataset.startTime.split('T')[1].substring(0, 5) : ''}</div>
                </div>
                <div class="tooltip-row">
                    <div class="tooltip-label">Duration:</div>
                    <div class="tooltip-value">${appointment.dataset.duration} minutes</div>
                </div>
            `;
            
            const rect = appointment.getBoundingClientRect();
            tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
            tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            tooltip.classList.add('visible');
        }
    }
    
    /**
     * Hides the appointment tooltip.
     * Removes the visible class from the tooltip element.
     */
    function hideTooltip() {
        const tooltip = document.getElementById('appointmentTooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
    
    /**
     * Fixes styling issues to ensure proper layout of the timeline and pending appointments.
     * Applies specific overflow settings to different containers to prevent unwanted scrollbars.
     * Ensures proper sizing and expansion of containers for correct display.
     */
    function fixLayoutStyling() {
        // Force proper overflow settings on all parent containers
        document.querySelectorAll('html, body, .main-content, .content-container, .timeline-container').forEach(el => {
            if (el) {
                el.style.overflowX = 'hidden';
                el.style.maxWidth = '100%';
            }
        });
        
        // Make sure only the scroll container has horizontal scrolling
        const scrollContainer = document.querySelector('.timeline-scroll-container');
        if (scrollContainer) {
            scrollContainer.style.overflowX = 'auto';
        }
        
        // Make sure content card for Pending Appointments expands properly
        document.querySelectorAll('.content-card, .pending-appointments-container, .pending-appointments-table').forEach(el => {
            if (el) {
                el.style.overflow = 'visible';
                el.style.maxWidth = '100%';
                el.style.minWidth = '100%';
                el.style.width = '100%';
                el.style.maxHeight = 'none';
                el.style.height = 'auto';
            }
        });
        
        // Remove any inner scrollbars in the timeline
        if (timelineContent) {
            timelineContent.style.overflow = 'visible';
        }
    }
    
    /**
     * Initializes all components of the appointment timeline interface.
     * Sets up the tooltip, timeline width, date inputs, event listeners, and layout styling.
     * Adds a resize event listener to check timeline overflow on window resize.
     */
    function initialize() {
        initializeTooltip();
        setupTimelineWidth();
        initializeDateInputs();
        addAppointmentActionEventListeners();
        fixLayoutStyling();
        
        // Handle window resize
        window.addEventListener('resize', function() {
            checkTimelineOverflow();
        });
    }
    
    // Start it all
    initialize();
});

/**
 * Displays a notification based on URL parameters.
 * Checks for success parameters and appointment IDs to show appropriate notifications.
 * Fetches appointment details to display patient and doctor names in the notification.
 */
function displayNotificationFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const appointmentId = urlParams.get('appointmentId');
    
    if (success === 'created' && appointmentId) {
        // Fetch appointment details to get patient name and doctor name
        fetch(`/api/appointments/${appointmentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch appointment details');
                }
                return response.json();
            })
            .then(appointment => {
                const patientName = appointment.patient.firstName + ' ' + appointment.patient.lastName;
                const doctorName = appointment.doctorName || 'N/A';
                
                displayNotification(
                    'success', 
                    `Successfully created appointment of ${patientName} with Dr. ${doctorName}`
                );
            })
            .catch(error => {
                console.error('Error fetching appointment details:', error);
                displayNotification('success', 'Successfully created the appointment');
            });
    } else if (success === 'appointmentUpdated') {
        fetch(`/api/appointments/${appointmentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch appointment details');
                }
                return response.json();
            })
            .then(appointment => {
                const patientName = appointment.patient.firstName + ' ' + appointment.patient.lastName;
                const doctorName = appointment.doctorName || 'N/A';
                
                displayNotification(
                    'success', 
                    `The appointment of ${patientName} with Dr. ${doctorName} has been updated`
                );
            })
            .catch(error => {
                console.error('Error fetching appointment details:', error);
                displayNotification('success', 'Successfully updated the appointment');
            });
    }
}

/**
 * Displays a notification message with the specified type.
 * Creates a notification container if it doesn't exist and adds the notification to it.
 * Includes automatic removal after a timeout and click-to-dismiss functionality.
 * 
 * @param {string} type - The type of notification ('success', 'error')
 * @param {string} message - The message to display in the notification
 */
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