document.addEventListener('DOMContentLoaded', function() {
    const drug1Select = document.getElementById('drug1');
    const drug2Select = document.getElementById('drug2');
    
    /**
     * Updates the options in the second dropdown based on the first selection
     * Disables the option in drug2 that matches the selected drug1
     */
    function updateDrug2Options() {
        const selectedDrug1 = drug1Select.value;
        
        Array.from(drug2Select.options).forEach(option => {
            option.disabled = false;
        });
        
        if (selectedDrug1) {
            const matchingOption = Array.from(drug2Select.options).find(option => option.value === selectedDrug1);
            if (matchingOption) {
                matchingOption.disabled = true;
            }
        }
        
        if (drug2Select.selectedOptions[0].disabled) {
            const firstAvailableOption = Array.from(drug2Select.options).find(option => !option.disabled);
            if (firstAvailableOption) {
                drug2Select.value = firstAvailableOption.value;
            }
        }
    }
    
    drug1Select.addEventListener('change', updateDrug2Options);
    
    updateDrug2Options();
}); 