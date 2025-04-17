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
});