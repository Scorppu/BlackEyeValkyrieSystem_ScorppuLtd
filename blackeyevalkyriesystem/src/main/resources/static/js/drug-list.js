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

// Initialize search on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterDrugs);
    }
}); 