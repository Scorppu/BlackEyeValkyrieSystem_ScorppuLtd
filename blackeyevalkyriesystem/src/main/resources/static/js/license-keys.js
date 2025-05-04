document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all copy buttons
    document.querySelectorAll('.copy-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // Get the license key from the data attribute
            const licenseKey = this.getAttribute('data-key');
            
            // Create a temporary textarea to copy the text
            const textarea = document.createElement('textarea');
            textarea.value = licenseKey;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            
            // Select and copy the text
            textarea.select();
            document.execCommand('copy');
            
            // Remove the textarea
            document.body.removeChild(textarea);
            
            // Show tooltip feedback
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = 'Copied!';
            this.appendChild(tooltip);
            
            // Show the tooltip
            setTimeout(() => tooltip.classList.add('show'), 10);
            
            // Hide and remove the tooltip after 1.5 seconds
            setTimeout(() => {
                tooltip.classList.remove('show');
                setTimeout(() => this.removeChild(tooltip), 300);
            }, 1500);
        });
    });
});