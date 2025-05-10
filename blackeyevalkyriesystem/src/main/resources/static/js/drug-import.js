/**
 * Initializes file input enhancement for CSV file uploads
 * Sets up event listeners for file input changes
 */
document.addEventListener('DOMContentLoaded', function() {
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
 * Updates the file label text based on selected files
 * @param {HTMLInputElement} input - The file input element that triggered the change
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