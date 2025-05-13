/**
 * Vital input handler for patient vital signs form.
 * Initializes BMI calculation functionality when the DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vital input form loaded');
    calculateBMI();
});

/**
 * Calculates Body Mass Index (BMI) based on weight and height values.
 * Retrieves values from the form, performs the BMI calculation,
 * and updates the BMI field with the result formatted to one decimal place.
 * If either weight or height is invalid, clears the BMI field.
 */
function calculateBMI() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const bmiField = document.getElementById('bmi');
    
    if (weight && height && height > 0) {
        // BMI = weight (kg) / (height (m))^2
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        bmiField.value = bmi.toFixed(1);
    } else {
        bmiField.value = '';
    }
}