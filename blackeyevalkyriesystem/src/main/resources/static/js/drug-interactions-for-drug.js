document.addEventListener('DOMContentLoaded', function() {
    console.log('Drug interactions for drug page loaded');
    const searchInput = document.getElementById('searchInput');
    const tableRows = document.querySelectorAll('.drug-table tbody tr');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', filterInteractions);
    }
    
    /**
     * Filters the drug interactions table based on the search input
     * Shows only rows that match the search query
     */
    function filterInteractions() {
        const input = document.getElementById('searchInput');
        const filter = input.value.toUpperCase();
        const table = document.getElementById('interactionTable');
        const tr = table.getElementsByTagName('tr');
        
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
     * Checks if there are any visible rows in the table
     * Shows empty state if no rows are visible
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
    
    checkEmptyState();
    
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const interactionId = this.getAttribute('data-id');
            const drugName = this.getAttribute('data-drug');
            
            if (confirm(`Are you sure you want to delete the interaction with ${drugName}?`)) {
                fetch(`/api/drug-interactions/${interactionId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        this.closest('tr').remove();
                        checkEmptyState();
                        
                        const successMessage = document.createElement('div');
                        successMessage.className = 'alert alert-success';
                        successMessage.textContent = `Interaction with ${drugName} was successfully deleted.`;
                        
                        const container = document.querySelector('.drug-list-container');
                        container.insertBefore(successMessage, container.firstChild);
                        
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