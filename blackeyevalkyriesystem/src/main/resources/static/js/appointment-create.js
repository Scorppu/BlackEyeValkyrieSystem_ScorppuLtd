document.addEventListener('DOMContentLoaded', function() {              
    // Handle select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    const patientCheckboxes = document.querySelectorAll('.patient-select');
    
    // check if exist
    if (selectAllCheckbox) {
        // Remove the select all functionality since we only want one checkbox checked at a time
        selectAllCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck all patient checkboxes first
                patientCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Check only the first patient checkbox if any exist
                if (patientCheckboxes.length > 0) {
                    patientCheckboxes[0].checked = true;
                }
                
                // Uncheck the select all box (it's just used as a trigger now)
                this.checked = false;
            }
        });
    }
    
    // Add event listeners to patient checkboxes for radio-button-like behavior
    patientCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // If this checkbox is checked, uncheck all other patient checkboxes
                patientCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            }
        });
    });
    
    // Handle rows per page change
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1'); // Reset to first page
            window.location.href = url.toString();
        });
    }
    
    // Handle pagination buttons
    const prevPageButton = document.querySelector('.prev-page');
    const nextPageButton = document.querySelector('.next-page');
    
    if (prevPageButton && nextPageButton) {
        const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1');
        
        prevPageButton.disabled = currentPage <= 1;
        prevPageButton.addEventListener('click', function() {
            if (currentPage > 1) {
                const url = new URL(window.location);
                url.searchParams.set('page', (currentPage - 1).toString());
                window.location.href = url.toString();
            }
        });
        
        nextPageButton.addEventListener('click', function() {
            const url = new URL(window.location);
            url.searchParams.set('page', (currentPage + 1).toString());
            window.location.href = url.toString();
        });
    }
    
    // Handle sorting
    const sortLinks = document.querySelectorAll('.sort-link');
    sortLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sort = this.getAttribute('data-sort');
            const currentSort = new URLSearchParams(window.location.search).get('sortBy') || 'lastName';
            const currentDirection = new URLSearchParams(window.location.search).get('direction') || 'asc';
            
            const url = new URL(window.location);
            url.searchParams.set('sortBy', sort);
            url.searchParams.set('direction', sort === currentSort && currentDirection === 'asc' ? 'desc' : 'asc');
            window.location.href = url.toString();
        });
    });
    
    // Handle next button
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if at least one patient is selected
            const selectedPatients = document.querySelectorAll('.patient-select:checked');
            if (selectedPatients.length === 0) {
                alert('Please select at least one patient to continue.');
                return;
            }else if (selectedPatients.length > 1) {
                alert('Please select only one patient to continue.');
                return;
            }
            
            // Submit the form
            document.getElementById('appointmentForm').submit();
        });
    }
    
    // Handle search
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#patientTableBody tr');
            
            rows.forEach(row => {
                if (row.cells.length > 1) { // Skip empty state row
                    const name = row.cells[1].textContent.toLowerCase();
                    const id = row.cells[2].textContent.toLowerCase();
                    const visible = name.includes(searchTerm) || id.includes(searchTerm);
                    row.style.display = visible ? '' : 'none';
                }
            });
        });
    }
});