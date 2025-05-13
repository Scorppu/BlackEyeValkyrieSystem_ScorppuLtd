/**
 * Drug Interaction Import JavaScript
 * 
 * Handles the user interface elements for the drug interaction import page.
 * Provides functionality for file selection display and alert message management.
 */
document.addEventListener('DOMContentLoaded', function() {
    /**
     * Initializes event listeners when the DOM content is fully loaded.
     * Sets up the file input enhancement and alert close button functionality.
     */
    
    // File input enhancement
    const fileInput = document.getElementById('csvFile');
    const fileLabel = document.getElementById('file-selected');
    
    fileInput.addEventListener('change', function() {
        /**
         * Updates the displayed file name when a file is selected.
         * If no file is selected, shows "Choose file" text.
         */
        if (fileInput.files.length > 0) {
            fileLabel.textContent = fileInput.files[0].name;
        } else {
            fileLabel.textContent = 'Choose file';
        }
    });
    
    // Handle alert close buttons
    const closeButtons = document.querySelectorAll('.btn-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            /**
             * Handles the closing of alert messages when the close button is clicked.
             * Hides the parent element of the close button.
             */
            this.parentElement.style.display = 'none';
        });
    });
});

/**
 * Updates the displayed file name or count when files are selected.
 * Shows single filename when one file is selected, or a count when multiple files are selected.
 * 
 * @param {HTMLInputElement} input - The file input element
 */
function updateFileList(input) {
    const fileLabel = document.getElementById('file-selected');
    if (input.files.length > 0) {
        if (input.files.length === 1) {
            fileLabel.textContent = input.files[0].name;
        } else {
            fileLabel.textContent = input.files.length + ' files selected';
        }
    } else {
        fileLabel.textContent = 'Choose file(s)';
    }
} 