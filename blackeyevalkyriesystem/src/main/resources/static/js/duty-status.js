/**
 * Duty status management module.
 * Provides functionality for filtering staff tables, toggling duty status,
 * and updating the statistics display.
 */

document.addEventListener('DOMContentLoaded', function() {
    const doctorSearch = document.getElementById('doctor-search');
    if (doctorSearch) {
        doctorSearch.addEventListener('keyup', function() {
            filterTable('doctors-table', this.value);
        });
    }
    
    const nurseSearch = document.getElementById('nurse-search');
    if (nurseSearch) {
        nurseSearch.addEventListener('keyup', function() {
            filterTable('nurses-table', this.value);
        });
    }
    
    const toggleButtons = document.querySelectorAll('.toggle-duty-btn');
    toggleButtons.forEach(button => {
        const row = button.closest('tr');
        const statusCell = row.querySelector('td:nth-child(3)');
        const statusSpan = statusCell.querySelector('span');
        
        if (statusSpan.classList.contains('status-on')) {
            button.classList.add('btn-on-duty');
        } else {
            button.classList.add('btn-off-duty');
        }
        
        button.addEventListener('click', function() {
            const staffId = this.getAttribute('data-staff-id');
            toggleDutyStatus(staffId, this);
        });
    });
    
    /**
     * Filters a table based on search query.
     * Shows rows that match the query and hides those that don't.
     * 
     * @param {string} tableId - The ID of the table to filter
     * @param {string} query - The search query to filter by
     */
    function filterTable(tableId, query) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        const term = query.toLowerCase();
        
        rows.forEach(row => {
            let found = false;
            const cells = row.querySelectorAll('td');
            
            cells.forEach(cell => {
                if (cell.textContent.toLowerCase().includes(term)) {
                    found = true;
                }
            });
            
            row.style.display = found ? '' : 'none';
        });
    }
    
    /**
     * Formats a duration in minutes to a human-readable string.
     * 
     * @param {number} minutes - The duration in minutes to format
     * @returns {string} The formatted duration string
     */
    function formatDuration(minutes) {
        if (minutes <= 0) {
            return 'Never on Duty';
        }
        
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
        
        if (remainingMinutes > 0) {
            result += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
        }
        
        return result;
    }
    
    /**
     * Toggles the duty status of a staff member.
     * Makes an API call to update the status and updates the UI accordingly.
     * 
     * @param {string} staffId - The ID of the staff member
     * @param {HTMLElement} buttonElement - The button element that was clicked
     */
    function toggleDutyStatus(staffId, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.classList.add('loading');
        
        fetch(`/api/duty/toggle/${staffId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Server error: ' + response.status);
                    });
                } else {
                    throw new Error('Server error: ' + response.status + '. Your session may have expired. Please refresh the page and try again.');
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Duty status toggled:', data);
            
            const row = buttonElement.closest('tr');
            const statusCell = row.querySelector('td:nth-child(3)');
            const statusSpan = statusCell.querySelector('span');
            
            if (!data.isOnDuty && data.lastDutyDuration !== null) {
                const durationCell = row.querySelector('td:nth-child(2)');
                const formattedDuration = formatDuration(data.lastDutyDuration);
                durationCell.innerHTML = `<span>${formattedDuration}</span>`;
            }
            
            if (data.isOnDuty) {
                statusSpan.textContent = 'On Duty';
                statusSpan.classList.remove('status-off');
                statusSpan.classList.add('status-on');
                buttonElement.querySelector('span').textContent = 'Mark Off Duty';
                buttonElement.classList.remove('btn-off-duty');
                buttonElement.classList.add('btn-on-duty');
            } else {
                statusSpan.textContent = 'Off Duty';
                statusSpan.classList.remove('status-on');
                statusSpan.classList.add('status-off');
                buttonElement.querySelector('span').textContent = 'Mark On Duty';
                buttonElement.classList.remove('btn-on-duty');
                buttonElement.classList.add('btn-off-duty');
            }
            
            updateStats();
            
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
        })
        .catch(error => {
            console.error('Error toggling duty status:', error.message);
            
            if (error.message && error.message.includes('No duty status document exists')) {
                alert('Error: No duty status document exists for this user. Contact your administrator.');
            } else {
                alert('Error toggling duty status: ' + error.message);
            }
            
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
        });
    }
    
    /**
     * Updates the statistics display on the page.
     * Calculates the number of staff members on duty and updates the UI elements.
     */
    function updateStats() {
        const doctorsOnDuty = document.querySelectorAll('#doctors-table .status-on').length;
        const totalDoctors = document.querySelectorAll('#doctors-table tbody tr:not(.empty-state)').length;
        
        const nursesOnDuty = document.querySelectorAll('#nurses-table .status-on').length;
        const totalNurses = document.querySelectorAll('#nurses-table tbody tr:not(.empty-state)').length;
        
        const statCards = document.querySelectorAll('.stat-value');
        if (statCards.length >= 4) {
            statCards[0].textContent = totalDoctors;
            statCards[1].textContent = totalNurses;
            statCards[2].textContent = doctorsOnDuty;
            statCards[3].textContent = nursesOnDuty;
        }
    }
});