document.addEventListener('DOMContentLoaded', function() {
    const dutyToggleBtn = document.getElementById('duty-toggle');
    const dutyStatusDiv = document.getElementById('duty-status');
    const userNameSpan = document.querySelector('.user-name');
    
    if (dutyToggleBtn && dutyStatusDiv) {
        // Initial load of duty status
        updateDutyStatus();
        
        // Add click handler for toggle button
        dutyToggleBtn.addEventListener('click', function() {
            toggleDutyStatus();
        });
    }
    
    function updateDutyStatus() {
        fetch('/api/duty/status')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const isOnDuty = data.isOnDuty;
                
                // Parse the ISO timestamp string
                const timestamp = new Date(data.timestamp);
                
                // Update button text and style based on current status
                dutyToggleBtn.textContent = isOnDuty ? 'Off Duty' : 'On Duty';
                dutyToggleBtn.style.backgroundColor = isOnDuty ? '#ffa500' : '#4CAF50'; // Orange for Off Duty, Green for On Duty
                
                // Format the timestamp in user's local timezone
                const formattedDateTime = formatDateTimeForUser(timestamp);
                
                // Update status text
                dutyStatusDiv.style.display = 'block';
                dutyStatusDiv.innerHTML = isOnDuty 
                    ? `On duty since<br>${formattedDateTime}`
                    : `Last on duty at<br>${formattedDateTime}`;
                
                // Log for debugging
                console.log(`Original timestamp: ${data.timestamp}`);
                console.log(`Parsed date: ${timestamp}`);
                console.log(`Formatted local time: ${formattedDateTime}`);
            })
            .catch(error => {
                console.error('Error fetching duty status:', error);
            });
    }
    
    function toggleDutyStatus() {
        fetch('/api/duty/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update UI with the new status
            const isOnDuty = data.isOnDuty;
            
            // Parse the ISO timestamp string
            const timestamp = new Date(data.timestamp);
            
            // Update button text and style
            dutyToggleBtn.textContent = isOnDuty ? 'Off Duty' : 'On Duty';
            dutyToggleBtn.style.backgroundColor = isOnDuty ? '#ffa500' : '#4CAF50';
            
            // Format the timestamp in user's local timezone
            const formattedDateTime = formatDateTimeForUser(timestamp);
            
            // Update status text
            dutyStatusDiv.style.display = 'block';
            dutyStatusDiv.innerHTML = isOnDuty 
                ? `On duty since<br>${formattedDateTime}`
                : `Last on duty at<br>${formattedDateTime}`;
            
            // Log for debugging
            console.log(`Original timestamp: ${data.timestamp}`);
            console.log(`Parsed date: ${timestamp}`);
            console.log(`Formatted local time: ${formattedDateTime}`);
        })
        .catch(error => {
            console.error('Error toggling duty status:', error);
        });
    }
    
    // Helper function to format date and time in user's local timezone
    function formatDateTimeForUser(date) {
        // Format time as HH:MM
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        // Format date as DD MMM YYYY
        const day = date.getDate();
        const month = date.toLocaleString('en', { month: 'short' });
        const year = date.getFullYear();
        
        // Return in format "HH:MM DD MMM YYYY"
        return `${hours}:${minutes}  ${day} ${month} ${year}`;
    }
}); 