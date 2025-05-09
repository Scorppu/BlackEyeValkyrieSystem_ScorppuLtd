function filterDrugs() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('drugTable');
    const tr = table.getElementsByTagName('tr');
    
    // Loop through all table rows, and hide those that don't match the search query
    for (let i = 1; i < tr.length; i++) {
        // Skip the empty state row if it exists
        if (tr[i].classList.contains('empty-state')) continue;
        
        const td = tr[i].getElementsByTagName('td');
        let found = false;
        
        // Check all columns except the last one (Actions)
        for (let j = 0; j < td.length - 1; j++) {
            if (td[j]) {
                const text = td[j].textContent || td[j].innerText;
                if (text.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        // Show or hide the row based on search match
        tr[i].style.display = found ? '' : 'none';
    }
    
    // Check if any rows are visible
    let visibleRowCount = 0;
    for (let i = 1; i < tr.length; i++) {
        if (tr[i].style.display !== 'none' && !tr[i].classList.contains('empty-state')) {
            visibleRowCount++;
        }
    }
    
    // Display empty state message if no matches
    let emptyStateRow = document.querySelector('.empty-search-results');
    if (visibleRowCount === 0 && filter !== '') {
        if (!emptyStateRow) {
            emptyStateRow = document.createElement('tr');
            emptyStateRow.className = 'empty-search-results';
            const td = document.createElement('td');
            td.colSpan = 5;
            td.className = 'empty-state';
            td.innerHTML = '<p>No drugs matching your search criteria.</p>';
            emptyStateRow.appendChild(td);
            table.getElementsByTagName('tbody')[0].appendChild(emptyStateRow);
        }
        emptyStateRow.style.display = '';
    } else if (emptyStateRow) {
        emptyStateRow.style.display = 'none';
    }
}

// Delete confirmation modal functionality
function setupDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');
    let drugIdToDelete = null;

    // Get all delete buttons
    const deleteButtons = document.querySelectorAll('.delete-drug-btn');
    
    // Add click event to each delete button
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            drugIdToDelete = this.getAttribute('data-id');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open
        });
    });
    
    // Close modal when clicking the X button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    // Close modal when clicking cancel button
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    // Handle delete confirmation
    confirmBtn.addEventListener('click', function() {
        if (drugIdToDelete) {
            window.location.href = `/drugs/delete/${drugIdToDelete}`;
        }
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterDrugs);
    }
    
    // Setup delete confirmation modal
    setupDeleteConfirmation();
}); 