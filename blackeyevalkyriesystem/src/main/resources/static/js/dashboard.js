document.addEventListener('DOMContentLoaded', function() {
    // Remove scrollbar from calendar
    const calendarControlsElement = document.querySelector('.calendar-controls');
    if (calendarControlsElement) {
        const calendarCard = calendarControlsElement.closest('.content-card');
        if (calendarCard) {
            calendarCard.style.overflow = 'hidden'; // Hide any overflow content
        }
    }
    
    // Initialize duty status bars
    initializeDutyBars();
    
    // Calendar variables
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    let selectedDay = null; // Track the currently selected day
    
    // Check if calendar elements exist before initializing
    const calendarNav = document.querySelector('.calendar-nav');
    const calendarMonth = document.querySelector('.calendar-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    
    // Only initialize the calendar if all required elements exist
    if (calendarNav && calendarMonth && calendarGrid) {
        // Initialize the calendar
        initCalendar();

        // Add event listeners to calendar navigation buttons
        const prevButton = calendarNav.querySelector('button:first-child');
        const nextButton = calendarNav.querySelector('button:last-child');
        
        if (prevButton) prevButton.addEventListener('click', previousMonth);
        if (nextButton) nextButton.addEventListener('click', nextMonth);
    }

    // Initialize calendar
    function initCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
        
        // Select today's date by default
        selectTodayDate();
    }

    // Update calendar header with month and year
    function updateCalendarHeader() {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthYearString = `${months[currentMonth]} ${currentDate.getDate()}, ${currentYear}`;
        const calendarMonthElement = document.querySelector('.calendar-month');
        if (calendarMonthElement) {
            calendarMonthElement.textContent = monthYearString;
        }
    }

    // Generate days for the calendar grid
    function generateCalendarDays() {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        // Get first day of the month
        firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        // Get the day of the week the first day falls on (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        // Get last day of previous month
        const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        // Get total days in current month
        const totalDaysInMonth = lastDayOfMonth.getDate();
        
        // Calculate number of days to display from previous month
        const daysFromPrevMonth = firstDayOfWeek;
        
        // Calculate total cells needed (max 42 for 6 rows of 7 days)
        const totalCells = Math.ceil((daysFromPrevMonth + totalDaysInMonth) / 7) * 7;
        
        // Generate previous month's days
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const day = lastDayOfPrevMonth - i;
            const dayElement = createDayElement(day, 'prev-month');
            calendarGrid.appendChild(dayElement);
        }
        
        // Generate current month's days
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const todayDate = today.getDate();
        
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const isToday = isCurrentMonth && i === todayDate;
            const dayElement = createDayElement(i, isToday ? 'current' : '');
            calendarGrid.appendChild(dayElement);
        }
        
        // Generate next month's days
        const remainingCells = totalCells - (daysFromPrevMonth + totalDaysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = createDayElement(i, 'next-month');
            calendarGrid.appendChild(dayElement);
        }
        
        // Check if we should highlight a selected day after month navigation
        if (selectedDay) {
            const { day, month, year } = selectedDay;
            if (month === currentMonth && year === currentYear) {
                // Find all current month days
                const currentMonthDays = document.querySelectorAll('.calendar-date:not(.prev-month):not(.next-month)');
                
                // Find the day element by text content matching our target day
                let dayToSelect = null;
                currentMonthDays.forEach(element => {
                    if (parseInt(element.textContent) === day) {
                        dayToSelect = element;
                    }
                });
                
                if (dayToSelect) {
                    selectDay(dayToSelect);
                }
            }
        }
    }
    
    // Create a day element for the calendar
    function createDayElement(day, className) {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-date ${className}`;
        dayElement.textContent = day;
        
        // Make text unselectable
        dayElement.style.userSelect = 'none';
        dayElement.style.webkitUserSelect = 'none';
        dayElement.style.mozUserSelect = 'none';
        dayElement.style.msUserSelect = 'none';
        
        // Style prev-month and next-month dates differently
        if (className === 'prev-month' || className === 'next-month') {
            dayElement.style.color = 'var(--secondary-text)';
            dayElement.style.opacity = '0.5';
        } else if (className === 'current') {
            // Apply appropriate styling for today's date
            // Get current theme
            const isDarkMode = document.documentElement.classList.contains('light-mode') ? false : true;
            
            // Style based on theme - transparent background with circle border
            if (isDarkMode) {
                // Dark mode: use white circle border
                dayElement.style.backgroundColor = 'transparent';
                dayElement.style.color = 'var(--primary-text)';
                dayElement.style.boxShadow = '0 0 0 2px white';
            } else {
                // Light mode: use dark blue circle border
                dayElement.style.backgroundColor = 'transparent';
                dayElement.style.color = 'var(--primary-text)';
                dayElement.style.boxShadow = '0 0 0 2px #333366';
            }
        }
        
        // Add click event listener
        dayElement.addEventListener('click', function() {
            // Select this day
            selectDay(dayElement);
            
            // Update the month display if selecting a day from prev/next month
            if (className === 'prev-month') {
                // Remember which day to select after navigation
                const targetDay = day;
                
                // Store information about the day to select BEFORE navigation
                const prevMonth = currentMonth - 1;
                const prevYear = currentYear;
                if (prevMonth < 0) {
                    selectedDay = { day: targetDay, month: 11, year: prevYear - 1 };
                } else {
                    selectedDay = { day: targetDay, month: prevMonth, year: prevYear };
                }
                
                // Go to previous month
                previousMonth();
            } else if (className === 'next-month') {
                // Remember which day to select after navigation
                const targetDay = day;
                
                // Store information about the day to select BEFORE navigation
                const nextMonthValue = currentMonth + 1;
                const nextYear = currentYear;
                if (nextMonthValue > 11) {
                    selectedDay = { day: targetDay, month: 0, year: nextYear + 1 };
                } else {
                    selectedDay = { day: targetDay, month: nextMonthValue, year: nextYear };
                }
                
                // Go to next month - use the function, not the variable
                nextMonth();
            } else {
                // Store information about the selected day in current month
                selectedDay = { day, month: currentMonth, year: currentYear };
            }
            
            // You can add functionality here to display events for the selected day
            // For example: displayEventsForDate(day, currentMonth, currentYear);
        });
        
        return dayElement;
    }
    
    // Function to select a day and handle styling
    function selectDay(dayElement) {
        // Remove selection from any previously selected day
        document.querySelectorAll('.calendar-date.selected').forEach(element => {
            element.classList.remove('selected');
            
            // Reset any inline styles that were applied for selection
            if (element.classList.contains('prev-month') || element.classList.contains('next-month')) {
                element.style.color = 'var(--secondary-text)';
                element.style.opacity = '0.5';
                element.style.backgroundColor = 'transparent';
                element.style.boxShadow = 'none';
            } else if (element.classList.contains('current')) {
                // Reset to current day styling
                const isDarkMode = document.documentElement.classList.contains('light-mode') ? false : true;
                
                if (isDarkMode) {
                    // Dark mode: use white circle border
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--primary-text)';
                    element.style.boxShadow = '0 0 0 2px white';
                } else {
                    // Light mode: use dark blue circle border
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--primary-text)';
                    element.style.boxShadow = '0 0 0 2px #333366';
                }
            } else {
                element.style.backgroundColor = 'transparent';
                element.style.color = 'var(--primary-text)';
                element.style.boxShadow = 'none';
            }
        });
        
        // Add 'selected' class to the clicked day
        dayElement.classList.add('selected');
        
        // Apply highlight styling to the selected date
        if (dayElement.classList.contains('prev-month') || dayElement.classList.contains('next-month')) {
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.3)';
            dayElement.style.color = 'var(--primary-text)';
            dayElement.style.opacity = '0.8';
        } else if (dayElement.classList.contains('current')) {
            // For current day, add additional selection styling while preserving the circle
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.7)';
            dayElement.style.color = 'white';
            dayElement.style.boxShadow = '0 0 0 2px white';
        } else {
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.7)';
            dayElement.style.color = 'white';
        }
    }
    
    // Navigate to previous month
    function previousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    }
    
    // Navigate to next month
    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    }
    
    // Update calendar after month navigation
    function updateCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
    }

    // Function to select today's date
    function selectTodayDate() {
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        
        if (isCurrentMonth) {
            // Find the element with the 'current' class (today's date)
            const todayElement = document.querySelector('.calendar-date.current');
            if (todayElement) {
                // Select today's date
                selectDay(todayElement);
                
                // Store information about the selected day
                selectedDay = { 
                    day: today.getDate(), 
                    month: currentMonth, 
                    year: currentYear 
                };
            }
        }
    }

    // Initialize duty status charts if they exist
    const dutyStatusContainer = document.querySelector('.duty-status-container');
    if (dutyStatusContainer) {
        // Initialize the box plot
        initializeDutyBars();
    }
});

// Initialize duty bar charts with minimum heights and update based on existing values
function initializeDutyBars() {
    // Get counts from the DOM (provided by Thymeleaf)
    const doctorsOnDuty = parseInt(document.querySelector('#doctors-on-duty-value')?.textContent || 0);
    const doctorsOffDuty = parseInt(document.querySelector('#doctors-off-duty-value')?.textContent || 0);
    const nursesOnDuty = parseInt(document.querySelector('#nurses-on-duty-value')?.textContent || 0);
    const nursesOffDuty = parseInt(document.querySelector('#nurses-off-duty-value')?.textContent || 0);
    
    // Calculate totals
    const totalDoctors = doctorsOnDuty + doctorsOffDuty || 1; // Prevent division by zero
    const totalNurses = nursesOnDuty + nursesOffDuty || 1; // Prevent division by zero
    
    // Update box section widths based on proportions
    updateBoxWidth('doctors-on-duty-box', 'doctors-off-duty-box', doctorsOnDuty, doctorsOffDuty, totalDoctors);
    updateBoxWidth('nurses-on-duty-box', 'nurses-off-duty-box', nursesOnDuty, nursesOffDuty, totalNurses);
}

// Helper function to update box section widths
function updateBoxWidth(onDutyId, offDutyId, onDutyCount, offDutyCount, total) {
    const onDutyElement = document.getElementById(onDutyId);
    const offDutyElement = document.getElementById(offDutyId);
    
    if (onDutyElement && offDutyElement) {
        // Check if either count is zero
        if (onDutyCount === 0 && offDutyCount === 0) {
            // If both are zero, show placeholder boxes
            onDutyElement.style.width = '50%';
            offDutyElement.style.width = '50%';
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'flex';
            // Clear values
            onDutyElement.querySelector('.box-value').textContent = '';
            offDutyElement.querySelector('.box-value').textContent = '';
        } else if (onDutyCount === 0) {
            // All off duty - hide on duty box
            onDutyElement.style.width = '0%';
            offDutyElement.style.width = '100%';
            onDutyElement.style.display = 'none';
            offDutyElement.style.display = 'flex';
            // Make off duty box have both rounded corners
            offDutyElement.style.borderRadius = '5px';
            // Clear on duty value but show off duty value
            onDutyElement.querySelector('.box-value').textContent = '';
            offDutyElement.querySelector('.box-value').textContent = offDutyCount;
        } else if (offDutyCount === 0) {
            // All on duty - hide off duty box
            onDutyElement.style.width = '100%';
            offDutyElement.style.width = '0%';
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'none';
            // Make on duty box have both rounded corners
            onDutyElement.style.borderRadius = '5px';
            // Clear off duty value but show on duty value
            onDutyElement.querySelector('.box-value').textContent = onDutyCount;
            offDutyElement.querySelector('.box-value').textContent = '';
        } else {
            // Normal case - both values > 0
            const onDutyPercentage = (onDutyCount / total) * 100;
            const offDutyPercentage = 100 - onDutyPercentage;
            
            // Set widths
            onDutyElement.style.width = `${onDutyPercentage}%`;
            offDutyElement.style.width = `${offDutyPercentage}%`;
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'flex';
            // Reset border radius to defaults
            onDutyElement.style.borderRadius = '5px 0 0 5px';
            offDutyElement.style.borderRadius = '0 5px 5px 0';
            // Show both values
            onDutyElement.querySelector('.box-value').textContent = onDutyCount;
            offDutyElement.querySelector('.box-value').textContent = offDutyCount;
        }
    }
}
