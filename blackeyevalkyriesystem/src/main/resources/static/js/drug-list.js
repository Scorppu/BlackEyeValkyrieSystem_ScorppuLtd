/**
 * Drug List page controller script.
 * Handles search functionality, pagination, rows per page selection, and delete confirmations.
 * This script is loaded on the drug list page.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Drug List page loaded');
    
    // Setup search functionality
    const searchInput = document.getElementById('drugSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const drugRows = document.querySelectorAll('.drug-table tbody tr:not(:last-child)');
            
            drugRows.forEach(row => {
                const drugName = row.querySelector('td:first-child').textContent.toLowerCase();
                if (drugName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Update the showing X-Y of Z text based on filter
            updatePaginationInfo(drugRows, searchTerm);
        });
    }
    
    // Handle rows per page change - footer
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1'); // Reset to first page
            window.location.href = url.toString();
        });
    }
    
    // Handle rows per page change - header
    const headerRowsPerPageSelect = document.getElementById('headerRowsPerPage');
    if (headerRowsPerPageSelect) {
        headerRowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1'); // Reset to first page
            window.location.href = url.toString();
        });
    }
    
    // Safely get pagination variables
    const tableElement = document.querySelector('.drug-table');
    const totalDrugs = tableElement ? parseInt(tableElement.getAttribute('data-total-drugs') || '0') : 0;
    const rowsPerPage = rowsPerPageSelect ? parseInt(rowsPerPageSelect.value || '10') : 10;
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1');
    
    // Handle pagination buttons - footer
    const prevPageButton = document.querySelector('.prev-page');
    const nextPageButton = document.querySelector('.next-page');
    
    // Handle pagination buttons - header
    const headerPrevPageButton = document.querySelector('.header-prev-page');
    const headerNextPageButton = document.querySelector('.header-next-page');
    
    // Setup pagination buttons - footer
    setupPaginationButtons(prevPageButton, nextPageButton, currentPage, rowsPerPage, totalDrugs);
    
    // Setup pagination buttons - header
    setupPaginationButtons(headerPrevPageButton, headerNextPageButton, currentPage, rowsPerPage, totalDrugs);
    
    // Setup delete confirmation modal
    setupDeleteConfirmation();
    
    /**
     * Updates the pagination information text based on search results.
     * When search is active, displays "Showing X filtered results".
     * When no search is active, displays "Showing X - Y of Z" pagination info.
     * 
     * @param {NodeList} rows - Collection of table rows to filter
     * @param {string} searchTerm - Current search term
     */
    function updatePaginationInfo(rows, searchTerm) {
        if (!searchTerm) {
            // Reset to original pagination info if search is cleared
            document.querySelectorAll('.pagination-info').forEach(info => {
                const start = (currentPage - 1) * rowsPerPage + 1;
                const end = Math.min((currentPage - 1) * rowsPerPage + rows.length, totalDrugs);
                info.textContent = `Showing ${start} - ${end} of ${totalDrugs}`;
            });
            return;
        }
        
        // Count visible rows after filtering
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
        
        // Update both header and footer pagination info
        document.querySelectorAll('.pagination-info').forEach(info => {
            info.textContent = `Showing ${visibleRows} filtered results`;
        });
    }
    
    /**
     * Sets up pagination button functionality and states.
     * Disables previous button on first page and next button on last page.
     * Adds event listeners to navigate between pages.
     * 
     * @param {HTMLElement} prevButton - Previous page button element
     * @param {HTMLElement} nextButton - Next page button element
     * @param {number} page - Current page number
     * @param {number} rowsPerPage - Number of rows per page
     * @param {number} total - Total number of items
     */
    function setupPaginationButtons(prevButton, nextButton, page, rowsPerPage, total) {
        if (!prevButton || !nextButton) return;
        
        try {
            // Disable prev button on first page
            prevButton.disabled = page <= 1;
            
            // Disable next button on last page
            nextButton.disabled = (page * rowsPerPage) >= total;
            
            // Add event listeners
            prevButton.addEventListener('click', function() {
                if (page > 1) {
                    const url = new URL(window.location);
                    url.searchParams.set('page', (page - 1).toString());
                    window.location.href = url.toString();
                }
            });
            
            nextButton.addEventListener('click', function() {
                if ((page * rowsPerPage) < total) {
                    const url = new URL(window.location);
                    url.searchParams.set('page', (page + 1).toString());
                    window.location.href = url.toString();
                }
            });
        } catch (e) {
            console.error('Error setting up pagination buttons:', e);
        }
    }
});

/**
 * Sets up the delete confirmation modal functionality.
 * Handles showing/hiding the modal, capturing the drug ID to delete,
 * and redirecting to the delete endpoint when confirmed.
 * Prevents page scrolling while the modal is open.
 */
function setupDeleteConfirmation() {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) return;
    
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
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Close modal when clicking cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Handle delete confirmation
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (drugIdToDelete) {
                window.location.href = `/drugs/delete/${drugIdToDelete}`;
            }
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
} 