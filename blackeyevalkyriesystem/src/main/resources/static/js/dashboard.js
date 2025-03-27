document.addEventListener('DOMContentLoaded', function() {
    // Remove scrollbar from calendar
    const calendarControlsElement = document.querySelector('.calendar-controls');
    if (calendarControlsElement) {
        const calendarCard = calendarControlsElement.closest('.content-card');
        if (calendarCard) {
            calendarCard.style.overflow = 'hidden'; // Hide any overflow content
        }
    }
    
    // Calendar variables
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1);

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
    }
    
    // Create a day element for the calendar
    function createDayElement(day, className) {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-date ${className}`;
        dayElement.textContent = day;
        
        // Style prev-month and next-month dates differently
        if (className === 'prev-month' || className === 'next-month') {
            dayElement.style.color = 'var(--secondary-text)';
            dayElement.style.opacity = '0.5';
        }
        
        // Add click event listener
        dayElement.addEventListener('click', function() {
            // Remove 'selected' class from any previously selected day
            document.querySelectorAll('.calendar-date.selected').forEach(element => {
                element.classList.remove('selected');
                // Reset any inline styles that were applied
                if (element.classList.contains('prev-month') || element.classList.contains('next-month')) {
                    element.style.color = 'var(--secondary-text)';
                    element.style.opacity = '0.5';
                } else if (element.classList.contains('current')) {
                    element.style.backgroundColor = 'var(--accent-color)';
                    element.style.color = 'white';
                } else {
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--primary-text)';
                }
            });
            
            // Add 'selected' class to the clicked day
            dayElement.classList.add('selected');
            
            // Apply highlight styling to the selected date
            if (className === 'prev-month' || className === 'next-month') {
                dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.3)';
                dayElement.style.color = 'var(--primary-text)';
                dayElement.style.opacity = '0.8';
            } else if (className === 'current') {
                // Keep the current day styling but make it more prominent
                dayElement.style.backgroundColor = 'var(--accent-color)';
                dayElement.style.color = 'white';
                dayElement.style.boxShadow = '0 0 0 2px white, 0 0 0 4px var(--accent-color)';
            } else {
                dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.7)';
                dayElement.style.color = 'white';
            }
            
            // Update the month display if selecting a day from prev/next month
            if (className === 'prev-month') {
                // Go to previous month and select this day
                previousMonth();
                // Store the value of firstDayOfWeek in a local variable to use later
                const firstDayWeek = firstDayOfMonth.getDay();
                setTimeout(() => {
                    try {
                        const dayToSelect = document.querySelector(`.calendar-date:not(.prev-month):not(.next-month):nth-child(${day + firstDayWeek})`);
                        if (dayToSelect) {
                            dayToSelect.classList.add('selected');
                        }
                    } catch (error) {
                        console.error("Error selecting day in previous month:", error);
                    }
                }, 100);
            } else if (className === 'next-month') {
                // Go to next month and select this day
                nextMonth();
                setTimeout(() => {
                    try {
                        const dayToSelect = document.querySelector(`.calendar-date:not(.prev-month):not(.next-month):nth-child(${day})`);
                        if (dayToSelect) {
                            dayToSelect.classList.add('selected');
                        }
                    } catch (error) {
                        console.error("Error selecting day in next month:", error);
                    }
                }, 100);
            }
            
            // You can add functionality here to display events for the selected day
            // For example: displayEventsForDate(day, currentMonth, currentYear);
        });
        
        return dayElement;
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
});
