// Patient Profile JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabItems = document.querySelectorAll('.tab-item');
    
    // Switch between info sections based on tab
    function switchInfoSection(tabId) {
        // Hide all info sections
        document.querySelectorAll('.info-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the correct info section
        if (tabId === 'personal-info-tab') {
            document.getElementById('personal-info-section').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'personal-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        } else if (tabId === 'contact-info-tab') {
            document.getElementById('contact-info-section').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'contact-info-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        } else if (tabId === 'consultations-tab') {
            document.getElementById('consultations-section').classList.add('active');
            document.querySelectorAll('.tab-item').forEach(tab => {
                if (tab.dataset.target === 'consultations-tab') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    }
    
    // Tab click event handling
    tabItems.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const targetId = this.dataset.target;
            switchInfoSection(targetId);
        });
    });
}); 