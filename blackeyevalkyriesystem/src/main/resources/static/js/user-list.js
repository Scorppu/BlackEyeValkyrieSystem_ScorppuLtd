// User List specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('User List page loaded');
    
    // Handle select all checkbox
    const selectAllCheckbox = document.querySelector('thead .select-checkbox');
    const rowCheckboxes = document.querySelectorAll('tbody .select-checkbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
    
    // Delete modal functionality
    const modal = document.getElementById('deleteModal');
    const confirmInput = document.getElementById('confirmInput');
    const deleteUserId = document.getElementById('deleteUserId');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    // Close modal when cancel is clicked
    cancelDelete.addEventListener('click', function() {
        modal.style.display = 'none';
        confirmInput.value = '';
    });
    
    // Handle confirm delete button
    confirmDelete.addEventListener('click', function() {
        if (confirmInput.value === 'Confirm') {
            window.location.href = '/user/delete/' + deleteUserId.value;
        } else {
            alert('Please type "Confirm" to proceed with deletion.');
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            confirmInput.value = '';
        }
    });
});

// Function to open delete modal
function openDeleteModal(userId) {
    const modal = document.getElementById('deleteModal');
    const deleteUserId = document.getElementById('deleteUserId');
    
    deleteUserId.value = userId;
    modal.style.display = 'block';
    document.getElementById('confirmInput').focus();
}