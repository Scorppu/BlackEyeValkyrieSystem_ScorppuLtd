/**
 * Drug list management module.
 * Provides functionality for filtering the drug table and handling delete confirmations.
 */

/**
 * Filters the drug table based on search input.
 * Shows only rows that match the search criteria and displays an empty state message when no matches are found.
 */
function filterDrugs() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('drugTable');
    const tr = table.getElementsByTagName('tr');
    
    for (let i = 1; i < tr.length; i++) {
        if (tr[i].classList.contains('empty-state')) continue;
        
        const td = tr[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < td.length - 1; j++) {
            if (td[j]) {
                const text = td[j].textContent || td[j].innerText;
                if (text.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        tr[i].style.display = found ? '' : 'none';
    }
    
    let visibleRowCount = 0;
    for (let i = 1; i < tr.length; i++) {
        if (tr[i].style.display !== 'none' && !tr[i].classList.contains('empty-state')) {
            visibleRowCount++;
        }
    }
    
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

/**
 * Sets up the delete confirmation modal functionality.
 * Handles showing the modal when delete buttons are clicked,
 * closing the modal via various methods, and redirecting to the delete URL when confirmed.
 */
function setupDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelDelete');
    const confirmBtn = document.getElementById('confirmDelete');
    let drugIdToDelete = null;

    const deleteButtons = document.querySelectorAll('.delete-drug-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            drugIdToDelete = this.getAttribute('data-id');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    });
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    confirmBtn.addEventListener('click', function() {
        if (drugIdToDelete) {
            window.location.href = `/drugs/delete/${drugIdToDelete}`;
        }
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterDrugs);
    }
    
    setupDeleteConfirmation();
}); 