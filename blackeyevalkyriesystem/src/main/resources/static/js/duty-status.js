document.addEventListener('DOMContentLoaded', function() {
    // Doctor search functionality
    const doctorSearch = document.getElementById('doctor-search');
    if (doctorSearch) {
        doctorSearch.addEventListener('keyup', function() {
            filterTable('doctors-table', this.value);
        });
    }
    
    // Nurse search functionality
    const nurseSearch = document.getElementById('nurse-search');
    if (nurseSearch) {
        nurseSearch.addEventListener('keyup', function() {
            filterTable('nurses-table', this.value);
        });
    }
    
    // Add event listeners to all toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-duty-btn');
    toggleButtons.forEach(button => {
        // Initialize button classes based on duty status
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
    
    // Filter table function
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
    
    // Format duration in minutes to a readable string
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
    
    // Function to toggle duty status
    function toggleDutyStatus(staffId, buttonElement) {
        // Disable button during the request
        buttonElement.disabled = true;
        buttonElement.classList.add('loading');
        
        // Make API call to toggle duty status
        fetch(`/api/duty/toggle/${staffId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                // Check the content type to avoid trying to parse HTML as JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Server error: ' + response.status);
                    });
                } else {
                    // For non-JSON responses (like HTML error pages)
                    throw new Error('Server error: ' + response.status + '. Your session may have expired. Please refresh the page and try again.');
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Duty status toggled:', data);
            
            // Update UI based on new status
            const row = buttonElement.closest('tr');
            const statusCell = row.querySelector('td:nth-child(3)');
            const statusSpan = statusCell.querySelector('span');
            
            // Update previous on duty duration column if switching from on to off duty
            if (!data.isOnDuty && data.lastDutyDuration !== null) {
                const durationCell = row.querySelector('td:nth-child(2)');
                const formattedDuration = formatDuration(data.lastDutyDuration);
                durationCell.innerHTML = `<span>${formattedDuration}</span>`;
            }
            
            // Update status text and class
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
            
            // Update stats
            updateStats();
            
            // Re-enable button
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
        })
        .catch(error => {
            console.error('Error toggling duty status:', error.message);
            
            // Check if the error is about no duty status document
            if (error.message && error.message.includes('No duty status document exists')) {
                // Show a more specific error message about missing duty status
                alert('Error: No duty status document exists for this user. Contact your administrator.');
            } else {
                // For other errors
                alert('Error toggling duty status: ' + error.message);
            }
            
            // Re-enable button
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
        });
    }
    
    // Function to update stats
    function updateStats() {
        // Count doctors on duty
        const doctorsOnDuty = document.querySelectorAll('#doctors-table .status-on').length;
        const totalDoctors = document.querySelectorAll('#doctors-table tbody tr:not(.empty-state)').length;
        
        // Count nurses on duty
        const nursesOnDuty = document.querySelectorAll('#nurses-table .status-on').length;
        const totalNurses = document.querySelectorAll('#nurses-table tbody tr:not(.empty-state)').length;
        
        // Update stats in the UI
        const statCards = document.querySelectorAll('.stat-value');
        if (statCards.length >= 4) {
            statCards[0].textContent = totalDoctors;
            statCards[1].textContent = totalNurses;
            statCards[2].textContent = doctorsOnDuty;
            statCards[3].textContent = nursesOnDuty;
        }
    }
});