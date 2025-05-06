document.addEventListener('DOMContentLoaded', function() {
    const drug1Select = document.getElementById('drug1');
    const drug2Select = document.getElementById('drug2');
    
    // Function to update the options in the second dropdown
    function updateDrug2Options() {
        const selectedDrug1 = drug1Select.value;
        
        // Enable all options in drug2
        Array.from(drug2Select.options).forEach(option => {
            option.disabled = false;
        });
        
        // Disable the option in drug2 that matches the selected drug1
        if (selectedDrug1) {
            const matchingOption = Array.from(drug2Select.options).find(option => option.value === selectedDrug1);
            if (matchingOption) {
                matchingOption.disabled = true;
            }
        }
        
        // If the currently selected drug2 is now disabled, select the first available option
        if (drug2Select.selectedOptions[0].disabled) {
            const firstAvailableOption = Array.from(drug2Select.options).find(option => !option.disabled);
            if (firstAvailableOption) {
                drug2Select.value = firstAvailableOption.value;
            }
        }
    }
    
    // Update drug2 options when drug1 selection changes
    drug1Select.addEventListener('change', updateDrug2Options);
    
    // Initialize drug2 options based on the initial drug1 selection
    updateDrug2Options();
}); 