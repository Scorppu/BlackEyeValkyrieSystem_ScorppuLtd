document.addEventListener('DOMContentLoaded', function() {
    const calendarControlsElement = document.querySelector('.calendar-controls');
    if (calendarControlsElement) {
        const calendarCard = calendarControlsElement.closest('.content-card');
        if (calendarCard) {
            calendarCard.style.overflow = 'hidden';
        }
    }
    
    initializeDutyBars();
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    let selectedDay = null;
    
    const calendarNav = document.querySelector('.calendar-nav');
    const calendarMonth = document.querySelector('.calendar-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    
    if (calendarNav && calendarMonth && calendarGrid) {
        initCalendar();

        const prevButton = calendarNav.querySelector('button:first-child');
        const nextButton = calendarNav.querySelector('button:last-child');
        
        if (prevButton) prevButton.addEventListener('click', previousMonth);
        if (nextButton) nextButton.addEventListener('click', nextMonth);
    }

    /**
     * Initializes the calendar UI and selects today's date
     */
    function initCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
        
        selectTodayDate();
    }

    /**
     * Updates calendar header with current month and year
     */
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

    /**
     * Generates day elements for the calendar grid
     * Includes days from previous and next months as needed
     */
    function generateCalendarDays() {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        const totalDaysInMonth = lastDayOfMonth.getDate();
        
        const daysFromPrevMonth = firstDayOfWeek;
        
        const totalCells = Math.ceil((daysFromPrevMonth + totalDaysInMonth) / 7) * 7;
        
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const day = lastDayOfPrevMonth - i;
            const dayElement = createDayElement(day, 'prev-month');
            calendarGrid.appendChild(dayElement);
        }
        
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        const todayDate = today.getDate();
        
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const isToday = isCurrentMonth && i === todayDate;
            const dayElement = createDayElement(i, isToday ? 'current' : '');
            calendarGrid.appendChild(dayElement);
        }
        
        const remainingCells = totalCells - (daysFromPrevMonth + totalDaysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = createDayElement(i, 'next-month');
            calendarGrid.appendChild(dayElement);
        }
        
        if (selectedDay) {
            const { day, month, year } = selectedDay;
            if (month === currentMonth && year === currentYear) {
                const currentMonthDays = document.querySelectorAll('.calendar-date:not(.prev-month):not(.next-month)');
                
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
    
    /**
     * Creates a single day element for the calendar
     * @param {number} day - The day number to display
     * @param {string} className - CSS class to apply to the element
     * @returns {HTMLElement} The created day element
     */
    function createDayElement(day, className) {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-date ${className}`;
        dayElement.textContent = day;
        
        dayElement.style.userSelect = 'none';
        dayElement.style.webkitUserSelect = 'none';
        dayElement.style.mozUserSelect = 'none';
        dayElement.style.msUserSelect = 'none';
        
        if (className === 'prev-month' || className === 'next-month') {
            dayElement.style.color = 'var(--secondary-text)';
            dayElement.style.opacity = '0.5';
        } else if (className === 'current') {
            const isDarkMode = document.documentElement.classList.contains('light-mode') ? false : true;
            
            if (isDarkMode) {
                dayElement.style.backgroundColor = 'transparent';
                dayElement.style.color = 'var(--primary-text)';
                dayElement.style.boxShadow = '0 0 0 2px white';
            } else {
                dayElement.style.backgroundColor = 'transparent';
                dayElement.style.color = 'var(--primary-text)';
                dayElement.style.boxShadow = '0 0 0 2px #333366';
            }
        }
        
        dayElement.addEventListener('click', function() {
            selectDay(dayElement);
            
            if (className === 'prev-month') {
                const targetDay = day;
                
                const prevMonth = currentMonth - 1;
                const prevYear = currentYear;
                if (prevMonth < 0) {
                    selectedDay = { day: targetDay, month: 11, year: prevYear - 1 };
                } else {
                    selectedDay = { day: targetDay, month: prevMonth, year: prevYear };
                }
                
                previousMonth();
            } else if (className === 'next-month') {
                const targetDay = day;
                
                const nextMonthValue = currentMonth + 1;
                const nextYear = currentYear;
                if (nextMonthValue > 11) {
                    selectedDay = { day: targetDay, month: 0, year: nextYear + 1 };
                } else {
                    selectedDay = { day: targetDay, month: nextMonthValue, year: nextYear };
                }
                
                nextMonth();
            } else {
                selectedDay = { day, month: currentMonth, year: currentYear };
            }
        });
        
        return dayElement;
    }
    
    /**
     * Applies selection styling to a day element and removes selection from other days
     * @param {HTMLElement} dayElement - The day element to select
     */
    function selectDay(dayElement) {
        document.querySelectorAll('.calendar-date.selected').forEach(element => {
            element.classList.remove('selected');
            
            if (element.classList.contains('prev-month') || element.classList.contains('next-month')) {
                element.style.color = 'var(--secondary-text)';
                element.style.opacity = '0.5';
                element.style.backgroundColor = 'transparent';
                element.style.boxShadow = 'none';
            } else if (element.classList.contains('current')) {
                const isDarkMode = document.documentElement.classList.contains('light-mode') ? false : true;
                
                if (isDarkMode) {
                    element.style.backgroundColor = 'transparent';
                    element.style.color = 'var(--primary-text)';
                    element.style.boxShadow = '0 0 0 2px white';
                } else {
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
        
        dayElement.classList.add('selected');
        
        if (dayElement.classList.contains('prev-month') || dayElement.classList.contains('next-month')) {
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.3)';
            dayElement.style.color = 'var(--primary-text)';
            dayElement.style.opacity = '0.8';
        } else if (dayElement.classList.contains('current')) {
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.7)';
            dayElement.style.color = 'white';
            dayElement.style.boxShadow = '0 0 0 2px white';
        } else {
            dayElement.style.backgroundColor = 'rgba(138, 43, 226, 0.7)';
            dayElement.style.color = 'white';
        }
    }
    
    /**
     * Navigates to the previous month
     */
    function previousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    }
    
    /**
     * Navigates to the next month
     */
    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    }
    
    /**
     * Updates calendar after month navigation
     */
    function updateCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
    }

    /**
     * Selects today's date in the calendar if visible
     */
    function selectTodayDate() {
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        
        if (isCurrentMonth) {
            const todayElement = document.querySelector('.calendar-date.current');
            if (todayElement) {
                selectDay(todayElement);
                
                selectedDay = { 
                    day: today.getDate(), 
                    month: currentMonth, 
                    year: currentYear 
                };
            }
        }
    }

    const dutyStatusContainer = document.querySelector('.duty-status-container');
    if (dutyStatusContainer) {
        initializeDutyBars();
    }
});

/**
 * Initializes duty bar charts with minimum heights and updates based on existing values
 */
function initializeDutyBars() {
    const doctorsOnDuty = parseInt(document.querySelector('#doctors-on-duty-value')?.textContent || 0);
    const doctorsOffDuty = parseInt(document.querySelector('#doctors-off-duty-value')?.textContent || 0);
    const nursesOnDuty = parseInt(document.querySelector('#nurses-on-duty-value')?.textContent || 0);
    const nursesOffDuty = parseInt(document.querySelector('#nurses-off-duty-value')?.textContent || 0);
    
    const totalDoctors = doctorsOnDuty + doctorsOffDuty || 1;
    const totalNurses = nursesOnDuty + nursesOffDuty || 1;
    
    updateBoxWidth('doctors-on-duty-box', 'doctors-off-duty-box', doctorsOnDuty, doctorsOffDuty, totalDoctors);
    updateBoxWidth('nurses-on-duty-box', 'nurses-off-duty-box', nursesOnDuty, nursesOffDuty, totalNurses);
}

/**
 * Updates the width of on-duty and off-duty boxes based on counts
 * @param {string} onDutyId - ID of the on-duty element
 * @param {string} offDutyId - ID of the off-duty element
 * @param {number} onDutyCount - Number of staff on duty
 * @param {number} offDutyCount - Number of staff off duty
 * @param {number} total - Total number of staff
 */
function updateBoxWidth(onDutyId, offDutyId, onDutyCount, offDutyCount, total) {
    const onDutyElement = document.getElementById(onDutyId);
    const offDutyElement = document.getElementById(offDutyId);
    
    if (onDutyElement && offDutyElement) {
        if (onDutyCount === 0 && offDutyCount === 0) {
            onDutyElement.style.width = '50%';
            offDutyElement.style.width = '50%';
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'flex';
            onDutyElement.querySelector('.box-value').textContent = '';
            offDutyElement.querySelector('.box-value').textContent = '';
        } else if (onDutyCount === 0) {
            onDutyElement.style.width = '0%';
            offDutyElement.style.width = '100%';
            onDutyElement.style.display = 'none';
            offDutyElement.style.display = 'flex';
            offDutyElement.style.borderRadius = '5px';
            onDutyElement.querySelector('.box-value').textContent = '';
            offDutyElement.querySelector('.box-value').textContent = offDutyCount;
        } else if (offDutyCount === 0) {
            onDutyElement.style.width = '100%';
            offDutyElement.style.width = '0%';
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'none';
            onDutyElement.style.borderRadius = '5px';
            onDutyElement.querySelector('.box-value').textContent = onDutyCount;
            offDutyElement.querySelector('.box-value').textContent = '';
        } else {
            const onDutyPercentage = (onDutyCount / total) * 100;
            const offDutyPercentage = 100 - onDutyPercentage;
            
            onDutyElement.style.width = `${onDutyPercentage}%`;
            offDutyElement.style.width = `${offDutyPercentage}%`;
            onDutyElement.style.display = 'flex';
            offDutyElement.style.display = 'flex';
            onDutyElement.style.borderRadius = '5px 0 0 5px';
            offDutyElement.style.borderRadius = '0 5px 5px 0';
            onDutyElement.querySelector('.box-value').textContent = onDutyCount;
            offDutyElement.querySelector('.box-value').textContent = offDutyCount;
        }
    }
}
