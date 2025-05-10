document.addEventListener('DOMContentLoaded', function() {
    console.log('Visit information page loaded');
    
    const appointmentForm = document.getElementById('visitInfoForm');
    const requiredTimeInput = document.getElementById('requiredTime');
    const appointmentTypeSelect = document.getElementById('appointmentType');
    const doctorSelect = document.getElementById('doctorName');
    const scheduledTimeInput = document.getElementById('scheduledTime');
    const scheduledTimeHelp = document.getElementById('scheduledTimeHelp');
    const timelineContainer = document.getElementById('timelineContainer');
    const timelineHeader = document.getElementById('timelineHeader');
    const doctorColumn = document.getElementById('doctorColumn');
    const timelineSlots = document.getElementById('timelineSlots');
    const doctorLoading = document.getElementById('doctorLoading');
    const doctorSearch = document.querySelector('.doctor-search-input');
    const backButton = document.getElementById('back-to-list-btn');
    
    let doctorAppointments = [];
    
    setupUnsavedChangesTracking();
    
    /**
     * Checks if timeline needs a scrollbar based on content width
     * and adjusts container styling accordingly
     */
    function checkTimelineOverflow() {
        const timelineContent = document.querySelector('.timeline-content');
        const scrollContainer = document.querySelector('.timeline-scroll-container');
        
        if (timelineContent && scrollContainer) {
            const needsScroll = timelineContent.scrollWidth > scrollContainer.clientWidth;
            scrollContainer.setAttribute('data-overflow', needsScroll);
            
            if (needsScroll) {
                scrollContainer.style.overflowX = 'auto';
            } else {
                scrollContainer.style.overflowX = 'hidden';
            }
        }
    }
    
    window.addEventListener('resize', checkTimelineOverflow);
    
    /**
     * Formats a Date object to YYYY-MM-DDThh:mm string format for input fields
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const now = new Date();
    const defaultDate = formatDateForInput(now).split('T')[0];
    if (!scheduledTimeInput.value) {
        scheduledTimeInput.value = defaultDate + 'T09:00';
    }
    
    /**
     * Parses a datetime string into a Date object
     * @param {string} dateTimeStr - The datetime string to parse
     * @returns {Date} Parsed Date object
     */
    const parseDateTime = (dateTimeStr) => {
        return new Date(dateTimeStr);
    };
    
    /**
     * Formats a date for display with localized time format
     * @param {Date} date - The date to format
     * @returns {string} Formatted time string
     */
    const formatTimeDisplay = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    if (doctorSelect) {
        const initialContainerWidth = document.querySelector('.content-container').offsetWidth;
        
        doctorSelect.addEventListener('change', function() {
            console.log("Doctor selection changed to:", this.value);
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption) {
                if (selectedOption.value) {
                    console.log("Doctor selected:", selectedOption.value);
                    document.querySelector('.content-container').style.width = initialContainerWidth + 'px';
                    
                    let selectedDate = scheduledTimeInput.value && scheduledTimeInput.value.includes('T') ? 
                        new Date(scheduledTimeInput.value) : new Date();
                    
                    console.log("Selected date:", selectedDate);
                    scheduledTimeInput.disabled = true;
                    scheduledTimeHelp.textContent = 'Loading doctor\'s schedule...';
                    
                    doctorLoading.style.display = 'inline-block';
                    
                    fetchDoctorSchedule(selectedOption.value, selectedDate);
                } else {
                    timelineContainer.style.display = 'none';
                    scheduledTimeInput.disabled = true;
                    scheduledTimeInput.value = '';
                    scheduledTimeHelp.textContent = 'Select a doctor first to see available time slots';
                }
            }
        });
    } else {
        console.error("Doctor select element not found!");
    }
    
    if (requiredTimeInput) {
        requiredTimeInput.addEventListener('change', function() {
            console.log("Required time changed to:", this.value);
            const doctorName = doctorSelect.value;
            if (doctorName) {
                let selectedDate = scheduledTimeInput.value && scheduledTimeInput.value.includes('T') ? 
                    new Date(scheduledTimeInput.value) : new Date();
                
                fetchDoctorSchedule(doctorName, selectedDate);
            }
        });
    } else {
        console.error("Required time input element not found!");
    }
    
    if (scheduledTimeInput) {
        scheduledTimeInput.addEventListener('input', function() {
            if (this.value && this.value.includes('T')) {
                const selectedDate = new Date(this.value);
                const hours = selectedDate.getHours();
                const minutes = selectedDate.getMinutes();
                const requiredTimeMinutes = parseInt(requiredTimeInput.value, 10);
                
                const endTime = new Date(selectedDate.getTime() + requiredTimeMinutes * 60000);
                const endHours = endTime.getHours();
                const endMinutes = endTime.getMinutes();
                
                let isValid = true;
                let validationMessage = '';
                
                if (hours < 9) {
                    isValid = false;
                    validationMessage = 'Appointments can only be scheduled after 9:00 AM';
                }
                else if (hours > 17 || (hours === 17 && minutes > 30)) {
                    isValid = false;
                    validationMessage = 'Appointments cannot be scheduled after 5:30 PM';
                }
                else if (endHours > 17 || (endHours === 17 && endMinutes > 30)) {
                    isValid = false;
                    validationMessage = 'With the current duration, the appointment would end after 5:30 PM';
                }
                
                if (isValid) {
                    this.classList.remove('invalid-time');
                    scheduledTimeHelp.textContent = 'Selected time is valid';
                    scheduledTimeHelp.style.color = 'var(--secondary-text)';
                } else {
                    this.classList.add('invalid-time');
                    scheduledTimeHelp.textContent = validationMessage;
                    scheduledTimeHelp.style.color = '#ef4444';
                }
                
                const doctorName = doctorSelect.value;
                if (doctorName) {
                    const currentDate = new Date(doctorAppointments.length > 0 ? 
                        doctorAppointments[0]?.scheduledTime : null);
                    
                    if (!currentDate || 
                        currentDate.getDate() !== selectedDate.getDate() ||
                        currentDate.getMonth() !== selectedDate.getMonth() ||
                        currentDate.getFullYear() !== selectedDate.getFullYear()) {
                        fetchDoctorSchedule(doctorName, selectedDate);
                    } else {
                        checkAppointmentConflict(selectedDate);
                    }
                }
            }
        });
    } else {
        console.error("Scheduled time input element not found!");
    }
    
    /**
     * Fetches a doctor's schedule for the selected date
     * @param {string} doctorName - The name of the doctor
     * @param {Date} selectedDate - The date to fetch schedule for
     */
    function fetchDoctorSchedule(doctorName, selectedDate) {
        console.log("Fetching doctor schedule for:", doctorName, "on date:", selectedDate);
        
        document.querySelectorAll('.content-container, .form-card, .form-section').forEach(el => {
            el.style.overflowX = 'hidden';
        });
        
        doctorLoading.style.display = 'inline-block';
        
        const startDay = new Date(selectedDate);
        startDay.setHours(0, 0, 0, 0);
        
        const endDay = new Date(startDay);
        endDay.setHours(23, 59, 59, 999);
        
        const startTime = startDay.toISOString();
        const endTime = endDay.toISOString();
        
        displayTimeline(doctorName, [], null, parseInt(requiredTimeInput.value, 10));
        timelineContainer.style.display = 'block';
        
        scheduledTimeInput.disabled = false;
        scheduledTimeHelp.textContent = 'Select an available time slot';
        
        if (!scheduledTimeInput.value.includes('T')) {
            const today = new Date();
            today.setHours(9, 0, 0, 0);
            scheduledTimeInput.value = today.toISOString().substring(0, 16);
        }
        
        fetch(`/api/appointments/doctor/${encodeURIComponent(doctorName)}/daterange?startTime=${startTime}&endTime=${endTime}`)
            .then(response => {
                console.log("API response status:", response.status);
                return response.json();
            })
            .then(appointments => {
                console.log("Retrieved appointments:", appointments);
                
                doctorAppointments = appointments;
                
                const requiredTime = parseInt(requiredTimeInput.value, 10);
                
                const currentSelectedTime = scheduledTimeInput.value;
                displayTimeline(doctorName, appointments, currentSelectedTime, requiredTime);
                
                if (currentSelectedTime && currentSelectedTime.includes('T')) {
                    checkAppointmentConflict(new Date(currentSelectedTime));
                }
                
                doctorLoading.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching appointments:', error);
                timelineContainer.style.display = 'block';
                doctorLoading.style.display = 'none';
                scheduledTimeInput.disabled = false;
                scheduledTimeHelp.textContent = 'Error loading appointments. Please select a time manually.';
            });
    }
    
    /**
     * Checks if a new appointment would conflict with existing appointments
     * @param {Date} selectedTime - The proposed appointment start time
     * @returns {boolean} Whether a conflict exists
     */
    function checkAppointmentConflict(selectedTime) {
        if (!selectedTime || !doctorAppointments.length) return false;
        
        const requiredTime = parseInt(requiredTimeInput.value, 10);
        const appointmentStart = new Date(selectedTime);
        const appointmentEnd = new Date(appointmentStart.getTime() + requiredTime * 60000);
        
        let hasConflict = false;
        let conflictingAppointment = null;
        
        for (const appointment of doctorAppointments) {
            const existingStart = new Date(appointment.scheduledTime);
            const existingEnd = new Date(existingStart.getTime() + appointment.requiredTime * 60000);
            
            if (appointmentStart < existingEnd && appointmentEnd > existingStart) {
                hasConflict = true;
                conflictingAppointment = appointment;
                break;
            }
        }
        
        updateConflictUI(hasConflict, conflictingAppointment);
        
        return hasConflict;
    }
    
    /**
     * Updates UI to reflect appointment conflict status
     * @param {boolean} hasConflict - Whether a conflict exists
     * @param {Object} conflictingAppointment - The appointment that conflicts
     */
    function updateConflictUI(hasConflict, conflictingAppointment) {
        const previousDotted = timelineSlots.querySelector('.dotted');
        if (previousDotted) {
            previousDotted.remove();
        }
        
        const selectedTime = new Date(scheduledTimeInput.value);
        const requiredTime = parseInt(requiredTimeInput.value, 10);
        
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
        
        const updatedAppointmentBlock = document.createElement('div');
        updatedAppointmentBlock.className = `appointment-block dotted ${hasConflict ? 'red' : ''}`;
        
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
        
        timelineSlots.appendChild(updatedAppointmentBlock);
        
        setTimeout(() => {
            const timelineScrollContainer = document.querySelector('.timeline-scroll-container');
            if (timelineScrollContainer) {
                const scrollPosition = leftPosition;
                timelineScrollContainer.scrollLeft = Math.max(0, scrollPosition - 100);
            }
        }, 100);
    }
    
    /**
     * Displays the timeline with doctor's appointments
     * @param {string} doctorName - The doctor's name
     * @param {Array} appointments - List of appointments
     * @param {string} nextAvailableTime - Next available time slot
     * @param {number} requiredTime - Required time in minutes
     */
    function displayTimeline(doctorName, appointments, nextAvailableTime, requiredTime) {
        const containerWidth = document.querySelector('.content-container').offsetWidth;
        
        timelineHeader.innerHTML = '';
        timelineSlots.innerHTML = '';
        doctorColumn.textContent = doctorName;
        
        document.querySelectorAll('.content-container, .form-card, .form-section').forEach(el => {
            el.style.width = '100%';
            el.style.maxWidth = '100%';
            el.style.overflowX = 'hidden';
        });
        
        timelineContainer.style.display = 'block';
        
        const workStartHour = 9;
        const workEndHour = 17.5;
        
        const timeSlots = Math.ceil((workEndHour - workStartHour) * 2) + 1;
        const slotWidth = 100;
        
        const totalWidth = (timeSlots * slotWidth) + 100;
        
        const scrollContainer = timelineContainer.querySelector('.timeline-scroll-container');
        
        document.querySelectorAll('body, html, .content-container, .form-card, .form-section, .timeline-container, .timeline-content').forEach(el => {
            if (el !== scrollContainer) {
                el.style.overflow = 'hidden';
            }
        });
        
        const timelineContent = document.querySelector('.timeline-content');
        if (timelineContent) {
            timelineContent.style.width = totalWidth + 'px';
            timelineContent.style.minWidth = Math.min(800, totalWidth) + 'px';
            timelineContent.style.maxWidth = 'none';
            timelineContent.style.overflow = 'visible';
        }
        
        if (scrollContainer) {
            scrollContainer.style.overflowX = 'auto';
            scrollContainer.style.overflowY = 'hidden';
            scrollContainer.style.maxWidth = '100%';
            scrollContainer.style.width = '100%';
        }
        
        for (let hour = workStartHour; hour <= workEndHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === workEndHour && minute > 0) continue;
                
                const displayTime = `${hour}:${minute === 0 ? '00' : minute}`;
                const timeSlot = document.createElement('div');
                timeSlot.className = 'timeline-time';
                timeSlot.textContent = displayTime;
                timelineHeader.appendChild(timeSlot);
            }
        }
        
        appointments.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
        
        function calculateTimePosition(time) {
            if (!time) {
                console.warn("Null time provided to calculateTimePosition, using default 9:00 AM");
                const defaultTime = new Date();
                defaultTime.setHours(9, 0, 0, 0);
                time = defaultTime;
            }
            
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const slot = (hours - workStartHour) * 2 + (minutes >= 30 ? 1 : 0);
            return slot * slotWidth;
        }
        
        appointments.forEach(appointment => {
            const startTime = new Date(appointment.scheduledTime);
            const endTime = new Date(startTime.getTime() + appointment.requiredTime * 60000);
            
            if (startTime.getHours() < workStartHour || startTime.getHours() >= workEndHour) {
                return;
            }
            
            const leftPosition = calculateTimePosition(startTime);
            const durationSlots = Math.ceil(appointment.requiredTime / 30);
            
            const appointmentBlock = document.createElement('div');
            appointmentBlock.className = 'appointment-block';
            
            appointmentBlock.style.left = `${leftPosition}px`;
            appointmentBlock.style.width = `${durationSlots * slotWidth - 10}px`;
            
            appointmentBlock.textContent = appointment.patient ? 
                `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                appointment.appointmentType;
            
            timelineSlots.appendChild(appointmentBlock);
        });
        
        let suggestedStartTime;
        if (nextAvailableTime === null) {
            suggestedStartTime = new Date();
            suggestedStartTime.setHours(9, 0, 0, 0);
            
            if (scheduledTimeInput.value && scheduledTimeInput.value.includes('T')) {
                suggestedStartTime = new Date(scheduledTimeInput.value);
            }
        } else {
            suggestedStartTime = typeof nextAvailableTime === 'string' ? 
                new Date(nextAvailableTime) : nextAvailableTime;
        }
        
        const finalRequiredTime = requiredTime || 30;
        
        const leftPosition = calculateTimePosition(suggestedStartTime);
        const suggestedDurationSlots = Math.ceil(finalRequiredTime / 30);
        
        const newAppointmentBlock = document.createElement('div');
        newAppointmentBlock.className = 'appointment-block dotted';
        
        newAppointmentBlock.style.left = `${leftPosition}px`;
        newAppointmentBlock.style.width = `${suggestedDurationSlots * slotWidth - 10}px`;
        newAppointmentBlock.textContent = 'New Appointment';
        
        timelineSlots.appendChild(newAppointmentBlock);
        
        if (suggestedStartTime) {
            checkAppointmentConflict(suggestedStartTime);
        }
        
        setTimeout(() => {
            const timelineScrollContainer = document.querySelector('.timeline-scroll-container');
            if (timelineScrollContainer) {
                timelineScrollContainer.scrollLeft = Math.max(0, leftPosition - 100);
                
                checkTimelineOverflow();
            }
        }, 100);
    }
    
    /**
     * Sets up tracking of unsaved changes to warn user before navigating away
     */
    function setupUnsavedChangesTracking() {
        if (backButton) {
            backButton.addEventListener('click', function(e) {
                e.preventDefault();
                showUnsavedChangesPopup('/appointment/timeline');
            });
        }
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            if (link && 
                !link.classList.contains('btn-primary') &&
                !link.getAttribute('href').startsWith('#') &&
                !appointmentForm.contains(link)) {
                
                e.preventDefault();
                const targetUrl = link.getAttribute('href');
                showUnsavedChangesPopup(targetUrl);
            }
        });
        
        /**
         * Shows a popup warning about unsaved changes
         * @param {string} targetUrl - The URL to navigate to if changes are discarded
         */
        function showUnsavedChangesPopup(targetUrl = '/appointment/timeline') {
            const existingPopup = document.querySelector('.unsaved-changes-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
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
            
            const cancelButton = popup.querySelector('.unsaved-changes-cancel');
            const discardButton = popup.querySelector('.unsaved-changes-discard');
            
            cancelButton.addEventListener('click', function() {
                popup.remove();
            });
            
            discardButton.addEventListener('click', function() {
                window.location.href = targetUrl;
            });
        }
    }
    
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(event) {
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            document.querySelectorAll('.form-control, .form-select').forEach(el => el.classList.remove('invalid-time'));
            
            const doctorValue = doctorSelect.value;
            const scheduledTimeValue = scheduledTimeInput.value;
            let hasErrors = false;
            
            if (!doctorValue) {
                event.preventDefault();
                hasErrors = true;
                doctorSelect.classList.add('invalid-time');
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Please select a doctor';
                errorMessage.style.color = '#ef4444';
                errorMessage.style.fontSize = '0.8rem';
                errorMessage.style.marginTop = '0.5rem';
                doctorSelect.parentNode.appendChild(errorMessage);
            }
            
            if (!scheduledTimeValue) {
                event.preventDefault();
                hasErrors = true;
                scheduledTimeInput.classList.add('invalid-time');
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Please select a scheduled time';
                errorMessage.style.color = '#ef4444';
                errorMessage.style.fontSize = '0.8rem';
                errorMessage.style.marginTop = '0.5rem';
                scheduledTimeInput.parentNode.appendChild(errorMessage);
            } else {
                const scheduledTime = new Date(scheduledTimeValue);
                const hours = scheduledTime.getHours();
                const minutes = scheduledTime.getMinutes();
                const requiredTimeMinutes = parseInt(requiredTimeInput.value, 10);
                
                const endTime = new Date(scheduledTime.getTime() + requiredTimeMinutes * 60000);
                const endHours = endTime.getHours();
                const endMinutes = endTime.getMinutes();
                
                let isValid = true;
                let validationMessage = '';
                
                if (hours < 9) {
                    isValid = false;
                    validationMessage = 'Appointments can only be scheduled after 9:00 AM';
                }
                else if (hours > 17 || (hours === 17 && minutes > 30)) {
                    isValid = false;
                    validationMessage = 'Appointments cannot be scheduled after 5:30 PM';
                }
                else if (endHours > 17 || (endHours === 17 && endMinutes > 30)) {
                    isValid = false;
                    validationMessage = 'With the current duration, the appointment would end after 5:30 PM';
                }
                
                if (!isValid) {
                    event.preventDefault();
                    hasErrors = true;
                    scheduledTimeInput.classList.add('invalid-time');
                    
                    if (!scheduledTimeHelp.classList.contains('error-message')) {
                        scheduledTimeHelp.textContent = validationMessage;
                        scheduledTimeHelp.style.color = '#ef4444';
                        scheduledTimeHelp.classList.add('error-message');
                    }
                }
            }
            
            if (!hasErrors && checkAppointmentConflict(new Date(scheduledTimeValue))) {
                event.preventDefault();
                if (!confirm('The selected time conflicts with another appointment. Do you still want to proceed?')) {
                    return;
                }
            }
            
            if (hasErrors) {
                const firstError = document.querySelector('.invalid-time');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }
    
    window.addEventListener('resize', function() {
        const timelineContent = document.querySelector('.timeline-content');
        if (timelineContent && timelineContainer.style.display === 'block') {
            const containerWidth = timelineContainer.clientWidth - 30;
            
            const maxViewportWidth = window.innerWidth - 50;
            const finalWidth = Math.min(containerWidth, maxViewportWidth);
            
            timelineContent.style.width = `${finalWidth}px`;
        }
    });
}); 