/**
 * Initializes the appointment creation page with event listeners and form handling
 * Sets up patient selection, pagination, sorting, search functionality, and unsaved changes tracking
 */
document.addEventListener('DOMContentLoaded', function() {              
    const selectAllCheckbox = document.getElementById('selectAll');
    const patientCheckboxes = document.querySelectorAll('.patient-select');
    const backButton = document.getElementById('back-to-list-btn');
    const appointmentForm = document.getElementById('appointmentForm');
    
    setupUnsavedChangesTracking();
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            if (this.checked) {
                patientCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                if (patientCheckboxes.length > 0) {
                    patientCheckboxes[0].checked = true;
                }
                
                this.checked = false;
            }
        });
    }
    
    patientCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                patientCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            }
        });
    });
    
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1');
            window.location.href = url.toString();
        });
    }
    
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
    
    const nextButton = document.getElementById('nextButton');
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const selectedPatients = document.querySelectorAll('.patient-select:checked');
            if (selectedPatients.length === 0) {
                alert('Please select at least one patient to continue.');
                return;
            }else if (selectedPatients.length > 1) {
                alert('Please select only one patient to continue.');
                return;
            }
            
            document.getElementById('appointmentForm').submit();
        });
    }
    
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#patientTableBody tr');
            
            rows.forEach(row => {
                if (row.cells.length > 1) {
                    const name = row.cells[1].textContent.toLowerCase();
                    const id = row.cells[2].textContent.toLowerCase();
                    const visible = name.includes(searchTerm) || id.includes(searchTerm);
                    row.style.display = visible ? '' : 'none';
                }
            });
        });
    }
    
    /**
     * Sets up tracking of form changes and handles navigation to prevent data loss
     */
    function setupUnsavedChangesTracking() {
        let formChanged = false;
        const formInputs = document.querySelectorAll('input, select, textarea');
        const initialFormState = captureFormState();
        
        /**
         * Captures the initial state of all form inputs
         * @returns {Object} State of all form inputs
         */
        function captureFormState() {
            const state = {};
            formInputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    state[input.id] = input.checked;
                } else {
                    state[input.id] = input.value;
                }
            });
            return state;
        }
        
        /**
         * Checks if the form state has changed since initial load
         * @returns {boolean} Whether the form has changed
         */
        function hasFormChanged() {
            const currentState = captureFormState();
            for (const key in currentState) {
                if (initialFormState[key] !== currentState[key]) {
                    return true;
                }
            }
            
            const initialSelectedCount = Object.values(initialFormState).filter(value => value === true).length;
            const currentSelectedCount = document.querySelectorAll('.patient-select:checked').length;
            
            return initialSelectedCount !== currentSelectedCount;
        }
        
        formInputs.forEach(input => {
            input.addEventListener('change', function() {
                formChanged = hasFormChanged();
            });
            
            input.addEventListener('input', function() {
                formChanged = hasFormChanged();
            });
        });
        
        patientCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                formChanged = true;
            });
        });
        
        if (backButton) {
            backButton.addEventListener('click', function(e) {
                if (formChanged) {
                    e.preventDefault();
                    showUnsavedChangesPopup('/appointment/timeline');
                }
            });
        }
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            
            if (link && 
                link.id !== 'nextButton' &&
                !link.getAttribute('href').startsWith('#') &&
                !appointmentForm.contains(link)) {
                
                if (formChanged) {
                    e.preventDefault();
                    const targetUrl = link.getAttribute('href');
                    showUnsavedChangesPopup(targetUrl);
                }
            }
        });
        
        /**
         * Displays a confirmation popup when unsaved changes are detected
         * @param {string} targetUrl - URL to navigate to if changes are discarded
         */
        function showUnsavedChangesPopup(targetUrl = '/appointment/timeline') {
            const existingPopup = document.querySelector('.unsaved-changes-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            const popup = document.createElement('div');
            popup.className = 'unsaved-changes-popup';
            
            popup.innerHTML = `
                <div class="unsaved-changes-content">
                    <div class="unsaved-changes-header">
                        Unsaved Changes
                    </div>
                    <div class="unsaved-changes-body">
                        <div class="unsaved-changes-message">
                            You have unsaved changes that will be lost if you leave this page. 
                            Do you want to discard these changes?
                        </div>
                        <div class="unsaved-changes-actions">
                            <button class="unsaved-changes-action unsaved-changes-cancel">Cancel</button>
                            <button class="unsaved-changes-action unsaved-changes-discard">Discard Changes</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(popup);
            
            const cancelButton = popup.querySelector('.unsaved-changes-cancel');
            const discardButton = popup.querySelector('.unsaved-changes-discard');
            
            cancelButton.addEventListener('click', function() {
                popup.remove();
            });
            
            discardButton.addEventListener('click', function() {
                window.location.href = targetUrl;
            });
        }
    }
});