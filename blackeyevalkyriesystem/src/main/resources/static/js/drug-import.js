/**
 * Drug Import JavaScript
 * 
 * This file handles the client-side functionality for importing drug data via CSV files.
 * It provides user interface enhancements for file selection and feedback.
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Initialize the file input enhancement when the DOM is fully loaded.
     * Sets up event listeners to update the file selection display.
     */
    // File input enhancement
    const fileInput = document.getElementById('csvFile');
    const fileLabel = document.getElementById('file-selected');
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            fileLabel.textContent = fileInput.files[0].name;
        } else {
            fileLabel.textContent = 'Choose file';
        }
    });
});

/**
 * Updates the file selection display based on the selected file(s).
 * 
 * @param {HTMLInputElement} input - The file input element containing selected files
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