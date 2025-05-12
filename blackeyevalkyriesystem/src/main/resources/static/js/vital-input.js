/**
 * Vital Input JavaScript Module
 * 
 * This script handles the vital input form functionality.
 * It automatically calculates the BMI based on weight and height inputs.
 * The script executes when the DOM content is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vital input form loaded');
    calculateBMI();
});

/**
 * Calculates BMI based on weight and height values.
 * Updates the BMI field with the calculated value or clears it if inputs are invalid.
 * Formula: BMI = weight (kg) / (height (m))^2
 */
function calculateBMI() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const bmiField = document.getElementById('bmi');
    
    if (weight && height && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        bmiField.value = bmi.toFixed(1);
    } else {
        bmiField.value = '';
    }
}