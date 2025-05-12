/**
 * User List functionality to handle checkbox selection and user deletion
 * interface with a confirmation modal.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('User List page loaded');
    
    const selectAllCheckbox = document.querySelector('thead .select-checkbox');
    const rowCheckboxes = document.querySelectorAll('tbody .select-checkbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
    
    const modal = document.getElementById('deleteModal');
    const confirmInput = document.getElementById('confirmInput');
    const deleteUserId = document.getElementById('deleteUserId');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    cancelDelete.addEventListener('click', function() {
        modal.style.display = 'none';
        confirmInput.value = '';
    });
    
    confirmDelete.addEventListener('click', function() {
        if (confirmInput.value === 'Confirm') {
            window.location.href = '/user/delete/' + deleteUserId.value;
        } else {
            alert('Please type "Confirm" to proceed with deletion.');
        }
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            confirmInput.value = '';
        }
    });
});

/**
 * Opens the delete confirmation modal for a specific user
 * @param {string|number} userId - The ID of the user to be deleted
 */
function openDeleteModal(userId) {
    const modal = document.getElementById('deleteModal');
    const deleteUserId = document.getElementById('deleteUserId');
    
    deleteUserId.value = userId;
    modal.style.display = 'block';
    document.getElementById('confirmInput').focus();
}