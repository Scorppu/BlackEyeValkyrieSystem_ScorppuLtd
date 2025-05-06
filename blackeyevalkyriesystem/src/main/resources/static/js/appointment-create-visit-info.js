document.addEventListener('DOMContentLoaded', function() {
    console.log('Visit information page loaded');
    
    const doctorSelect = document.getElementById('doctorName');
    const doctorSearch = document.querySelector('.doctor-search');
    const requiredTimeInput = document.getElementById('requiredTime');
    const scheduledTimeInput = document.getElementById('scheduledTime');
    const scheduledTimeHelp = document.getElementById('scheduledTimeHelp');
    const timelineContainer = document.getElementById('timelineContainer');
    const timelineHeader = document.getElementById('timelineHeader');
    const doctorColumn = document.getElementById('doctorColumn');
    const timelineSlots = document.getElementById('timelineSlots');
    const doctorLoading = document.getElementById('doctorLoading');
    
    let doctorAppointments = []; // Store all fetched appointments
    
    // Function to check if timeline needs scrollbar
    function checkTimelineOverflow() {
        const timelineContent = document.querySelector('.timeline-content');
        const scrollContainer = document.querySelector('.timeline-scroll-container');
        
        if (timelineContent && scrollContainer) {
            // Check if content width exceeds container width
            const needsScroll = timelineContent.scrollWidth > scrollContainer.clientWidth;
            scrollContainer.setAttribute('data-overflow', needsScroll);
            
            // Adjust appearance based on need for scrollbar
            if (needsScroll) {
                scrollContainer.style.overflowX = 'auto';
            } else {
                scrollContainer.style.overflowX = 'hidden';
            }
        }
    }
    
    // Check for overflow when timeline is displayed and on window resize
    window.addEventListener('resize', checkTimelineOverflow);
    
    // Format to YYYY-MM-DDThh:mm
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // Initialize date fields with default date (today)
    const now = new Date();
    const defaultDate = formatDateForInput(now).split('T')[0];
    if (!scheduledTimeInput.value) {
        scheduledTimeInput.value = defaultDate + 'T09:00';
    }
    
    // Parse a datetime string into a Date object
    const parseDateTime = (dateTimeStr) => {
        return new Date(dateTimeStr);
    };
    
    // Format a date for display
    const formatTimeDisplay = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Handle doctor search
    if (doctorSearch && doctorSelect) {
        // Store the initial content container width
        const initialContainerWidth = document.querySelector('.content-container').offsetWidth;
        
        doctorSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const options = doctorSelect.options;
            
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                const text = option.text.toLowerCase();
                
                if (text.includes(searchTerm)) {
                    option.style.display = '';
                    if (i === doctorSelect.selectedIndex) {
                        doctorSearch.value = option.text;
                    }
                } else {
                    option.style.display = 'none';
                }
            }
        });
        
        doctorSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption) {
                doctorSearch.value = selectedOption.text;
                
                // Force container width to stay fixed before timeline displays
                document.querySelector('.content-container').style.width = initialContainerWidth + 'px';
                
                // When a doctor is selected, load their schedule
                if (selectedOption.value) {
                    // Get date from scheduledTimeInput or use current date
                    let selectedDate = scheduledTimeInput.value ? 
                        new Date(scheduledTimeInput.value) : new Date();
                    
                    fetchDoctorSchedule(selectedOption.value, selectedDate);
                } else {
                    // If no doctor selected, hide timeline and disable scheduledTime
                    timelineContainer.style.display = 'none';
                    scheduledTimeInput.disabled = true;
                    scheduledTimeInput.value = '';
                    scheduledTimeHelp.textContent = 'Select a doctor first to see available time slots';
                }
            }
        });
    }
    
    // When required time changes, update the timeline if a doctor is selected
    requiredTimeInput.addEventListener('change', function() {
        const doctorName = doctorSelect.value;
        if (doctorName) {
            // Get date from scheduledTimeInput or use current date
            let selectedDate = scheduledTimeInput.value ? 
                new Date(scheduledTimeInput.value) : new Date();
            
            fetchDoctorSchedule(doctorName, selectedDate);
        }
    });
    
    // When scheduled date changes, update the timeline if a doctor is selected
    scheduledTimeInput.addEventListener('input', function() {
        // Check if the input has a valid date component
        if (this.value && this.value.includes('T')) {
            const doctorName = doctorSelect.value;
            if (doctorName) {
                const selectedDate = new Date(this.value);
                // Only fetch new schedule if date has changed
                const currentDate = new Date(doctorAppointments.length > 0 ? 
                    doctorAppointments[0]?.scheduledTime : null);
                
                if (!currentDate || 
                    currentDate.getDate() !== selectedDate.getDate() ||
                    currentDate.getMonth() !== selectedDate.getMonth() ||
                    currentDate.getFullYear() !== selectedDate.getFullYear()) {
                    fetchDoctorSchedule(doctorName, selectedDate);
                } else {
                    // Just check for conflicts with existing data
                    checkAppointmentConflict(selectedDate);
                }
            }
        }
    });
    
    function fetchDoctorSchedule(doctorName, selectedDate) {
        // Force content containers to fixed width before loading
        document.querySelectorAll('.content-container, .form-card, .form-section').forEach(el => {
            el.style.overflowX = 'hidden';
        });
        
        // Show loading indicator
        doctorLoading.style.display = 'inline-block';
        
        // Get selected date at 00:00
        const startDay = new Date(selectedDate);
        startDay.setHours(0, 0, 0, 0);
        
        // Get end of selected date (23:59:59)
        const endDay = new Date(startDay);
        endDay.setHours(23, 59, 59, 999);
        
        // Format dates for API
        const startTime = startDay.toISOString();
        const endTime = endDay.toISOString();
        
        // Fetch doctor's appointments for selected date
        fetch(`/api/appointments/doctor/${encodeURIComponent(doctorName)}/daterange?startTime=${startTime}&endTime=${endTime}`)
            .then(response => response.json())
            .then(appointments => {
                // Store the appointments for later conflict checking
                doctorAppointments = appointments;
                
                // Find the next available time slot
                const requiredTime = parseInt(requiredTimeInput.value, 10);
                
                // Enable scheduled time selection
                scheduledTimeInput.disabled = false;
                
                // If no time is set yet, find next available time
                if (!scheduledTimeInput.value.includes('T')) {
                    fetch(`/api/appointments/doctor/${encodeURIComponent(doctorName)}/next-available?requiredTime=${requiredTime}`)
                        .then(response => response.json())
                        .then(data => {
                            // Update the scheduled time input with the next available time
                            const nextAvailableTime = data.nextAvailableTime;
                            scheduledTimeInput.value = nextAvailableTime.replace('T', ' ').substring(0, 16).replace(' ', 'T');
                            scheduledTimeHelp.textContent = 'Suggested time based on doctor\'s availability';
                            
                            // Display the timeline
                            displayTimeline(doctorName, appointments, nextAvailableTime, requiredTime);
                            
                            // Hide loading indicator
                            doctorLoading.style.display = 'none';
                        })
                        .catch(error => {
                            console.error('Error fetching next available time:', error);
                            scheduledTimeHelp.textContent = 'Error fetching schedule. Please select a time manually.';
                            doctorLoading.style.display = 'none';
                        });
                } else {
                    // Use the currently selected time
                    const currentSelectedTime = scheduledTimeInput.value;
                    displayTimeline(doctorName, appointments, currentSelectedTime, requiredTime);
                    
                    // Check if current selection conflicts with appointments
                    checkAppointmentConflict(new Date(currentSelectedTime));
                    
                    // Hide loading indicator
                    doctorLoading.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching appointments:', error);
                timelineContainer.style.display = 'none';
                scheduledTimeInput.disabled = false;
                scheduledTimeHelp.textContent = 'Error fetching schedule. Please select a time manually.';
                doctorLoading.style.display = 'none';
            });
    }
    
    // Check if a new appointment would conflict with existing appointments
    function checkAppointmentConflict(selectedTime) {
        if (!selectedTime || !doctorAppointments.length) return false;
        
        const requiredTime = parseInt(requiredTimeInput.value, 10);
        const appointmentStart = new Date(selectedTime);
        const appointmentEnd = new Date(appointmentStart.getTime() + requiredTime * 60000);
        
        // Check each existing appointment for overlap
        let hasConflict = false;
        let conflictingAppointment = null;
        
        for (const appointment of doctorAppointments) {
            const existingStart = new Date(appointment.scheduledTime);
            const existingEnd = new Date(existingStart.getTime() + appointment.requiredTime * 60000);
            
            // Check if appointment times overlap
            // Overlap occurs if:
            // (new start is before existing end) AND (new end is after existing start)
            if (appointmentStart < existingEnd && appointmentEnd > existingStart) {
                hasConflict = true;
                conflictingAppointment = appointment;
                break;
            }
        }
        
        // Update UI to reflect conflict status
        updateConflictUI(hasConflict, conflictingAppointment);
        
        return hasConflict;
    }
    
    // Update UI elements to show conflict status
    function updateConflictUI(hasConflict, conflictingAppointment) {
        // Remove previous dotted appointment
        const previousDotted = timelineSlots.querySelector('.dotted');
        if (previousDotted) {
            previousDotted.remove();
        }
        
        // Get current appointment details
        const selectedTime = new Date(scheduledTimeInput.value);
        const requiredTime = parseInt(requiredTimeInput.value, 10);
        
        // Calculate positions for timeline (same as in displayTimeline)
        const workStartHour = 9;
        const slotWidth = 100;
        
        function calculateTimePosition(time) {
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const slot = (hours - workStartHour) * 2 + (minutes >= 30 ? 1 : 0);
            return slot * slotWidth;
        }
        
        const leftPosition = calculateTimePosition(selectedTime);
        const suggestedDurationSlots = Math.ceil(requiredTime / 30);
        
        // Create the new appointment block
        const updatedAppointmentBlock = document.createElement('div');
        updatedAppointmentBlock.className = `appointment-block dotted ${hasConflict ? 'red' : ''}`;
        
        // Use consistent positioning calculation
        updatedAppointmentBlock.style.left = `${leftPosition}px`;
        updatedAppointmentBlock.style.width = `${suggestedDurationSlots * slotWidth - 10}px`;
        
        if (hasConflict) {
            let conflictMessage = 'Conflict! (New Appointment)';
            if (conflictingAppointment && conflictingAppointment.patient) {
                conflictMessage = `Conflicts with ${conflictingAppointment.patient.firstName} ${conflictingAppointment.patient.lastName}'s appointment`;
            }
            updatedAppointmentBlock.textContent = conflictMessage;
            
            scheduledTimeHelp.textContent = 'Warning: The selected time conflicts with another appointment!';
            scheduledTimeHelp.style.color = '#ef4444';
        } else {
            updatedAppointmentBlock.textContent = 'New Appointment';
            scheduledTimeHelp.textContent = 'Selected time is available';
            scheduledTimeHelp.style.color = 'var(--secondary-text)';
        }
        
        // Add to timeline slots container
        timelineSlots.appendChild(updatedAppointmentBlock);
        
        // Scroll to make the selected time visible
        setTimeout(() => {
            const timelineScrollContainer = document.querySelector('.timeline-scroll-container');
            if (timelineScrollContainer) {
                const scrollPosition = leftPosition;
                timelineScrollContainer.scrollLeft = Math.max(0, scrollPosition - 100);
            }
        }, 100);
    }
    
    function displayTimeline(doctorName, appointments, nextAvailableTime, requiredTime) {
        // Get the current container width before showing the timeline
        const containerWidth = document.querySelector('.content-container').offsetWidth;
        
        // Clear previous timeline
        timelineHeader.innerHTML = '';
        timelineSlots.innerHTML = '';
        doctorColumn.textContent = doctorName;
        
        // Show timeline container but keep content within container bounds
        document.querySelectorAll('.content-container, .form-card, .form-section').forEach(el => {
            el.style.width = '100%';
            el.style.maxWidth = '100%';
            el.style.overflowX = 'hidden';
        });
        
        // Now show the timeline
        timelineContainer.style.display = 'block';
        
        // Appointment working hours: 9 AM to 5 PM
        const workStartHour = 9;
        const workEndHour = 17;
        
        // Calculate time slots for layout
        const timeSlots = (workEndHour - workStartHour) * 2 + 1; // 30-minute slots
        const slotWidth = 100; // Width in pixels of each time slot
        
        // Set min-width for the timeline content based on time slots
        const totalWidth = (timeSlots * slotWidth) + 100; // Add doctor column width
        
        // Get timeline scroll container
        const scrollContainer = timelineContainer.querySelector('.timeline-scroll-container');
        
        // Ensure only the scroll container has scrollbars
        document.querySelectorAll('body, html, .content-container, .form-card, .form-section, .timeline-container, .timeline-content').forEach(el => {
            if (el !== scrollContainer) {
                el.style.overflow = 'hidden';
            }
        });
        
        // Set appropriate width for timeline content
        const timelineContent = document.querySelector('.timeline-content');
        if (timelineContent) {
            timelineContent.style.width = totalWidth + 'px';
            timelineContent.style.minWidth = Math.min(800, totalWidth) + 'px';
            timelineContent.style.maxWidth = 'none'; // Allow content to be wider than container for scrolling
            timelineContent.style.overflow = 'visible';
        }
        
        // Ensure scroll container has proper overflow settings
        if (scrollContainer) {
            scrollContainer.style.overflowX = 'auto';
            scrollContainer.style.overflowY = 'hidden';
            scrollContainer.style.maxWidth = '100%';
            scrollContainer.style.width = '100%';
        }
        
        // Generate time slots (every 30 minutes) in a single row
        for (let hour = workStartHour; hour <= workEndHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === workEndHour && minute > 0) continue; // Skip after 5 PM
                
                const displayTime = `${hour}:${minute === 0 ? '00' : minute}`;
                const timeSlot = document.createElement('div');
                timeSlot.className = 'timeline-time';
                timeSlot.textContent = displayTime;
                timelineHeader.appendChild(timeSlot);
            }
        }
        
        // Sort appointments by scheduled time
        appointments.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        
        // Function to calculate the left position for a given time
        function calculateTimePosition(time) {
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const slot = (hours - workStartHour) * 2 + (minutes >= 30 ? 1 : 0);
            return slot * slotWidth;
        }
        
        // Place existing appointments in the timeline
        appointments.forEach(appointment => {
            const startTime = new Date(appointment.scheduledTime);
            const endTime = new Date(startTime.getTime() + appointment.requiredTime * 60000);
            
            // Skip appointments outside working hours
            if (startTime.getHours() < workStartHour || startTime.getHours() >= workEndHour) {
                return;
            }
            
            // Calculate position
            const leftPosition = calculateTimePosition(startTime);
            const durationSlots = Math.ceil(appointment.requiredTime / 30);
            
            // Create appointment block
            const appointmentBlock = document.createElement('div');
            appointmentBlock.className = 'appointment-block';
            
            // Position the block using absolute positioning - adjust position to align with time markers
            appointmentBlock.style.left = `${leftPosition}px`;
            appointmentBlock.style.width = `${durationSlots * slotWidth - 10}px`; // -10 for margins
            
            // Add patient name or appointment type
            appointmentBlock.textContent = appointment.patient ? 
                `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                appointment.appointmentType;
            
            // Add appointment to the slots container
            timelineSlots.appendChild(appointmentBlock);
        });
        
        // Add the suggested new appointment (dotted outline)
        const suggestedStartTime = typeof nextAvailableTime === 'string' ? 
            new Date(nextAvailableTime) : nextAvailableTime;
        
        const leftPosition = calculateTimePosition(suggestedStartTime);
        const suggestedDurationSlots = Math.ceil(requiredTime / 30);
        
        const newAppointmentBlock = document.createElement('div');
        newAppointmentBlock.className = 'appointment-block dotted';
        
        // Fix the alignment calculation for the appointment block
        newAppointmentBlock.style.left = `${leftPosition}px`;
        newAppointmentBlock.style.width = `${suggestedDurationSlots * slotWidth - 10}px`; // -10 for margins
        newAppointmentBlock.textContent = 'New Appointment';
        
        // Add to timeline slots container
        timelineSlots.appendChild(newAppointmentBlock);
        
        // Check for conflicts with current selection
        if (typeof nextAvailableTime === 'string') {
            checkAppointmentConflict(new Date(nextAvailableTime));
        } else {
            checkAppointmentConflict(nextAvailableTime);
        }
        
        // Scroll to make the suggested time visible
        setTimeout(() => {
            const timelineScrollContainer = document.querySelector('.timeline-scroll-container');
            if (timelineScrollContainer) {
                // Always start at the left side (beginning of the day)
                timelineScrollContainer.scrollLeft = 0;
                
                // Check if timeline needs scrollbar
                checkTimelineOverflow();
            }
        }, 100);
    }
    
    // Form validation
    const visitInfoForm = document.getElementById('visitInfoForm');
    if (visitInfoForm) {
        visitInfoForm.addEventListener('submit', function(event) {
            const doctorValue = doctorSelect.value;
            const scheduledTimeValue = scheduledTimeInput.value;
            
            // Validate that doctor is selected and scheduled time is set
            if (!doctorValue) {
                event.preventDefault();
                alert('Please select a doctor');
                return;
            }
            
            if (!scheduledTimeValue) {
                event.preventDefault();
                alert('Please select a scheduled time');
                return;
            }
            
            // Check for conflicts before submitting
            if (checkAppointmentConflict(new Date(scheduledTimeValue))) {
                event.preventDefault();
                if (!confirm('The selected time conflicts with another appointment. Do you still want to proceed?')) {
                    return;
                }
            }
        });
    }
    
    // Handle window resize to adjust timeline width
    window.addEventListener('resize', function() {
        // Get the timeline content element
        const timelineContent = document.querySelector('.timeline-content');
        if (timelineContent && timelineContainer.style.display === 'block') {
            // Get the container width
            const containerWidth = timelineContainer.clientWidth - 30;
            
            // Ensure we don't exceed viewport width
            const maxViewportWidth = window.innerWidth - 50;
            const finalWidth = Math.min(containerWidth, maxViewportWidth);
            
            timelineContent.style.width = `${finalWidth}px`;
        }
    });
}); 