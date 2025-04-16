function filterInteractions() {
    const searchInput = document.getElementById('interactionSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const drugHeaders = document.querySelectorAll('.drug-header');
    
    drugHeaders.forEach(header => {
        const drugName = header.textContent.trim().toLowerCase();
        const interactionContainer = header.nextElementSibling;
        
        if (drugName.includes(searchTerm)) {
            header.style.display = '';
            interactionContainer.style.display = '';
        } else {
            header.style.display = 'none';
            interactionContainer.style.display = 'none';
        }
    });
} 