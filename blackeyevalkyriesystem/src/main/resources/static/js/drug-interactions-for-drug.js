/**
 * Drug Interactions Management Script
 * 
 * This script handles the functionality for the drug interactions page for a specific drug.
 * It provides the following features:
 * - Real-time filtering of drug interactions via search input
 * - Empty state handling when no interactions match the search criteria
 * - Confirmation and deletion of drug interactions with success feedback
 * 
 * Functions:
 * - filterInteractions: Filters the interaction table based on the search input
 * - checkEmptyState: Toggles visibility of empty state message and table based on visible rows
 * 
 * The script initializes on DOMContentLoaded and sets up all necessary event listeners.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Drug interactions for drug page loaded');
    const searchInput = document.getElementById('searchInput');
    const tableRows = document.querySelectorAll('.drug-table tbody tr');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', filterInteractions);
    }
    
    /**
     * Filters the drug interactions table based on the search input.
     * 
     * This function searches for matches in the first column (drug name) of the interactions table
     * and hides rows that don't contain the search query. It's triggered on each keyup event
     * in the search input field.
     */
    function filterInteractions() {
        const input = document.getElementById('searchInput');
        const filter = input.value.toUpperCase();
        const table = document.getElementById('interactionTable');
        const tr = table.getElementsByTagName('tr');
        
        // Loop through all table rows, and hide those that don't match the search query
        for (let i = 1; i < tr.length; i++) {
            const tdDrug = tr[i].getElementsByTagName('td')[0];
            
            if (tdDrug) {
                const drugText = tdDrug.textContent || tdDrug.innerText;
                
                if (drugText.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = '';
                } else {
                    tr[i].style.display = 'none';
                }
            }
        }
    }
    
    /**
     * Manages the visibility of empty state message and table.
     * 
     * This function checks if there are any visible rows in the drug table after filtering.
     * If no rows are visible, it displays an empty state message and hides the table.
     * Otherwise, it shows the table and hides the empty state message.
     */
    function checkEmptyState() {
        const visibleRows = document.querySelectorAll('.drug-table tbody tr:not([style*="display: none"])');
        const emptyState = document.querySelector('.empty-state');
        const table = document.querySelector('.drug-table');
        
        if (visibleRows.length === 0) {
            if (emptyState) {
                emptyState.style.display = '';
            }
            if (table) {
                table.style.display = 'none';
            }
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            if (table) {
                table.style.display = '';
            }
        }
    }
    
    // Initialize the empty state check
    checkEmptyState();
    
    /**
     * Setup the interaction deletion functionality.
     * 
     * Adds click event listeners to all delete buttons. When clicked, the user is prompted to confirm
     * the deletion. If confirmed, it sends a DELETE request to the API, removes the row from the table,
     * displays a success message for 3 seconds, and checks if the table is now empty.
     */
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const interactionId = this.getAttribute('data-id');
            const drugName = this.getAttribute('data-drug');
            
            if (confirm(`Are you sure you want to delete the interaction with ${drugName}?`)) {
                // Send delete request
                fetch(`/api/drug-interactions/${interactionId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // Remove row from table
                        this.closest('tr').remove();
                        // Check if table is now empty
                        checkEmptyState();
                        
                        // Show success message
                        const successMessage = document.createElement('div');
                        successMessage.className = 'alert alert-success';
                        successMessage.textContent = `Interaction with ${drugName} was successfully deleted.`;
                        
                        const container = document.querySelector('.drug-list-container');
                        container.insertBefore(successMessage, container.firstChild);
                        
                        // Remove message after 3 seconds
                        setTimeout(() => {
                            successMessage.remove();
                        }, 3000);
                    } else {
                        throw new Error('Failed to delete interaction');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while deleting the interaction. Please try again.');
                });
            }
        });
    });
}); 