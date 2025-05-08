document.addEventListener('DOMContentLoaded', function() {
    const expiryOption = document.getElementById('expiryOption');
    const customDateContainer = document.getElementById('customDateContainer');
    const customDateInput = document.getElementById('customDate');
    
    // Show/hide custom date field based on selection
    expiryOption.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateContainer.style.display = 'block';
            customDateInput.setAttribute('required', 'required');
        } else {
            customDateContainer.style.display = 'none';
            customDateInput.removeAttribute('required');
        }
    });
    
    // Set min date for custom date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    customDateInput.setAttribute('min', formattedDate);
});