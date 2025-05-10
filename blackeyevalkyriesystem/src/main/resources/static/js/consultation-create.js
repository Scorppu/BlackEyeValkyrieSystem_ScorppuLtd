let prescriptionItemIndex = 0;
let selectedTemplate = ''; // No default template selected - show all drugs by default
let allDrugs = []; // Will store all drugs
let selectedDrugs = []; // Will store selected drug elements

// Function to show a custom confirmation modal
function showConfirmationModal(title, message, onConfirm, type = 'danger') {
    console.log('Showing confirmation modal:', title, message, type);
    
    // Remove any existing confirmation modal
    const existingModal = document.getElementById('customConfirmationModal');
    if (existingModal) {
        existingModal.parentElement.remove();
    }
    
    // Set colors based on type
    let headerBgColor, headerBorderColor, buttonBgColor, iconColor;
    
    if (type === 'allergen') {
        // Red theme for allergens
        headerBgColor = 'rgba(255, 92, 92, 0.1)';
        headerBorderColor = '#ff5c5c';
        buttonBgColor = '#ff5c5c';
        iconColor = '#ff0000';
    } else if (type === 'interaction') {
        // Yellow/orange theme for interactions
        headerBgColor = 'rgba(255, 215, 0, 0.1)';
        headerBorderColor = '#ffa500';
        buttonBgColor = '#ffa500';
        iconColor = '#ffa500';
    } else {
        // Default red theme
        headerBgColor = 'rgba(255, 92, 92, 0.1)';
        headerBorderColor = '#ff5c5c';
        buttonBgColor = '#ff5c5c';
        iconColor = '#ff5c5c';
    }
    
    // Create the modal HTML
    const modalHtml = `
        <div id="customConfirmationModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background-color: ${headerBgColor}; border-bottom: 2px solid ${headerBorderColor};">
                    <h3 style="color: ${headerBorderColor};">⚠️ ${title}</h3>
                    <span class="close" id="confirmationModalClose">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="padding: 10px; background-color: ${headerBgColor}; border-radius: 4px; margin-bottom: 15px;">
                        <p style="margin: 0; font-weight: 500;">${message}</p>
                    </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid ${headerBgColor};">
                    <button type="button" class="btn-secondary" id="confirmationModalCancel">
                        Cancel
                    </button>
                    <button type="button" class="btn-primary" style="background-color: ${buttonBgColor};" id="confirmationModalProceed">
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Get the modal element
    const modal = document.getElementById('customConfirmationModal');
    
    // Add event listeners to the modal buttons
    document.getElementById('confirmationModalClose').addEventListener('click', function() {
        closeConfirmationModal();
    });
    
    document.getElementById('confirmationModalCancel').addEventListener('click', function() {
        closeConfirmationModal();
    });
    
    document.getElementById('confirmationModalProceed').addEventListener('click', function() {
        closeConfirmationModal();
        if (onConfirm && typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeConfirmationModal();
        }
    });
}

// Function to close the confirmation modal
function closeConfirmationModal() {
    const modal = document.getElementById('customConfirmationModal');
    if (modal) {
        const container = modal.closest('div');
        if (container) {
            container.remove();
        } else {
            modal.remove();
        }
    }
}

function toggleDrugSelection(element) {
    // Check if this is an allergen
    const isAllergen = element.getAttribute('data-is-allergen') === 'true';
    
    // Check if this drug interacts with drugs in the cart
    const interactionIndicator = element.querySelector('.interaction-indicator');
    const interactsWithCart = interactionIndicator !== null;
    
    // Store the current selection state
    const isCurrentlySelected = element.classList.contains('selected');
    
    // Function to proceed with selection
    const proceedWithSelection = function(confirmed = false) {
        // Toggle selected class
        element.classList.toggle('selected');
        
        // Get the drug name div (first child div)
        const drugNameDiv = element.querySelector('div:first-child');
        
        // Update selectedDrugs array and manage selection indicator
        if (element.classList.contains('selected')) {
            // Add to selected drugs
            selectedDrugs.push(element);
            
            // Add permanent selection indicator
            let selectionIndicator = element.querySelector('.selection-indicator');
            if (!selectionIndicator) {
                selectionIndicator = document.createElement('span');
                selectionIndicator.className = 'selection-indicator';
                selectionIndicator.textContent = '✓';
                selectionIndicator.title = 'Selected';
                selectionIndicator.style.color = '#8a2be2'; // Purple color
                
                // Add the indicator after any existing indicators
                drugNameDiv.appendChild(selectionIndicator);
            }
            
            // If this was confirmed via modal, show toast notification
            if (confirmed) {
                // Show toast notification
                showToast(`${element.getAttribute('data-name')} selected`, 'success');
            }
        } else {
            // Remove from selected drugs
            selectedDrugs = selectedDrugs.filter(drug => drug !== element);
            
            // Remove selection indicator
            const selectionIndicator = element.querySelector('.selection-indicator');
            if (selectionIndicator) {
                selectionIndicator.remove();
            }
        }
        
        // Update Add Selected button state
        document.getElementById('addSelectedBtn').disabled = selectedDrugs.length === 0;
    };
    
    // If it's an allergen and not currently selected, show a warning
    if (isAllergen && !isCurrentlySelected) {
        const drugName = element.getAttribute('data-name');
        showConfirmationModal(
            "Allergy Warning", 
            `Patient is allergic to ${drugName}. Are you sure you want to select this medication?`,
            () => proceedWithSelection(true),
            'allergen'
        );
        return; // Exit early, waiting for user confirmation
    }
    
    // If it interacts with a drug in the cart and not currently selected, show a warning
    if (interactsWithCart && !isCurrentlySelected) {
        const drugName = element.getAttribute('data-name');
        showConfirmationModal(
            "Interaction Warning", 
            `${drugName} interacts with a drug in your cart. Are you sure you want to select this medication?`,
            () => proceedWithSelection(true),
            'interaction'
        );
        return; // Exit early, waiting for user confirmation
    }
    
    // If we get here, no warnings needed, proceed directly
    proceedWithSelection(false);
}

function addSelectedDrugsToCart() {
    if (selectedDrugs.length === 0) {
        return;
    }
    
    // Show the drug details modal
    showDrugDetailsModal();
}

function showDrugDetailsModal() {
    // Get the modal
    const modal = document.getElementById('drugDetailsModal');
    const modalDrugsList = document.getElementById('modalDrugsList');
    const modalDosage = document.getElementById('modalDosage');
    
    // Clear previous list
    modalDrugsList.innerHTML = '';
    
    // Create list of selected drugs
    const listHeader = document.createElement('h4');
    listHeader.textContent = 'Selected Drugs:';
    listHeader.style.marginTop = '0';
    listHeader.style.marginBottom = '10px';
    modalDrugsList.appendChild(listHeader);
    
    const drugList = document.createElement('ul');
    drugList.style.marginBottom = '15px';
    drugList.style.paddingLeft = '20px';
    
    selectedDrugs.forEach(drug => {
        const li = document.createElement('li');
        li.textContent = drug.getAttribute('data-name');
        drugList.appendChild(li);
    });
    
    modalDrugsList.appendChild(drugList);
    
    // If only one drug is selected, pre-fill the dosage
    if (selectedDrugs.length === 1) {
        modalDosage.value = selectedDrugs[0].getAttribute('data-dosage') || '';
    } else {
        modalDosage.value = '';
    }
    
    // Show the modal
    modal.style.display = 'block';
    
    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName('close')[0];
    
    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        closeModal();
    };
    
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    };
}

function closeModal() {
    document.getElementById('drugDetailsModal').style.display = 'none';
}

function confirmAddToCart() {
    // Get values from modal
    const dosage = document.getElementById('modalDosage').value;
    const days = document.getElementById('modalDays').value;
    const qty = document.getElementById('modalQuantity').value;
    
    // Validate inputs
    if (!dosage) {
        alert('Please enter dosage instructions');
        return;
    }
    
    if (!days || days < 1) {
        alert('Please enter a valid duration');
        return;
    }
    
    if (!qty || qty < 1) {
        alert('Please enter a valid quantity');
        return;
    }
    
    // Get drug IDs for interaction check
    const drugIdsToAdd = selectedDrugs.map(drug => drug.getAttribute('data-id'));
    const existingDrugIds = getExistingDrugIdsInCart();
    
    console.log('Drug IDs to add:', drugIdsToAdd);
    console.log('Existing drug IDs in cart:', existingDrugIds);
    
    // Check for drug interactions
    checkDrugInteractions([...drugIdsToAdd, ...existingDrugIds])
        .then(interactions => {
            console.log('Interaction check complete, found:', interactions);
            
            if (interactions && interactions.length > 0) {
                // Show warning if interactions found
                console.log('Showing drug interaction warning for interactions:', interactions);
                showDrugInteractionWarning(interactions, () => {
                    // User confirmed despite interactions, proceed with adding drugs
                    console.log('User confirmed to proceed despite interactions');
                    addSelectedDrugsToCartImpl(dosage, days, qty);
                });
            } else {
                // No interactions found, proceed with adding drugs
                console.log('No interactions found, proceeding with adding drugs');
                addSelectedDrugsToCartImpl(dosage, days, qty);
            }
        })
        .catch(error => {
            console.error('Error checking drug interactions:', error);
            // If there's an error, still proceed with adding drugs but log the error
            addSelectedDrugsToCartImpl(dosage, days, qty);
        });
}

// Implementation function to add drugs after interaction check
function addSelectedDrugsToCartImpl(dosage, days, qty) {
    // Process each selected drug
    selectedDrugs.forEach(drugElement => {
        const drugId = drugElement.getAttribute('data-id');
        const drugName = drugElement.getAttribute('data-name');
        
        // Add to cart
        addDrugToCart(drugId, drugName, dosage, days, qty);
        
        // Remove from the drug list
        drugElement.remove();
    });
    
    // Clear selected drugs array
    selectedDrugs = [];
    
    // Disable the Add Selected button
    document.getElementById('addSelectedBtn').disabled = true;
    
    // Close the modal
    closeModal();
}

// Get all drug IDs currently in the cart
function getExistingDrugIdsInCart() {
    const cartItems = document.querySelectorAll('#drugCart [data-drug-id]');
    return Array.from(cartItems).map(item => item.getAttribute('data-drug-id'));
}

// Check for interactions between selected drugs
async function checkDrugInteractions(drugIds) {
    if (!drugIds || drugIds.length < 2) {
        return []; // No interactions possible with less than 2 drugs
    }
    
    console.log('Checking drug interactions for:', drugIds);
    
    // Create an array to store all interactions
    const interactions = [];
    const processedPairs = new Set(); // To avoid duplicate interactions
    
    // For each drug, check interactions with other drugs
    for (let i = 0; i < drugIds.length; i++) {
        const drugId = drugIds[i];
        
        try {
            // Fetch interactions for this drug
            const response = await fetch(`/api/drugs/${drugId}/interactions`);
            if (!response.ok) {
                console.warn(`Failed to fetch interactions for drug ${drugId}`);
                continue;
            }
            
            const interactionIds = await response.json();
            console.log(`Drug ${drugId} has interactions with:`, interactionIds);
            
            // Check if any of the other selected drugs interact with this one
            for (let j = 0; j < drugIds.length; j++) {
                if (i !== j) {
                    const otherDrugId = drugIds[j];
                    
                    // Create a unique key for this drug pair to avoid duplicates
                    const pairKey = [drugId, otherDrugId].sort().join('-');
                    
                    // Only process if we haven't seen this pair before
                    if (!processedPairs.has(pairKey) && interactionIds.includes(otherDrugId)) {
                        // Found an interaction between drugIds[i] and drugIds[j]
                        interactions.push({
                            drug1Id: drugId,
                            drug2Id: otherDrugId
                        });
                        
                        // Mark this pair as processed
                        processedPairs.add(pairKey);
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching interactions for drug ${drugId}:`, error);
        }
    }
    
    console.log('Found interactions:', interactions);
    
    // Enrich the interactions with drug names
    const enrichedInteractions = await enrichInteractionsWithDrugNames(interactions);
    
    return enrichedInteractions;
}

// Add drug names to the interaction data
async function enrichInteractionsWithDrugNames(interactions) {
    const drugNames = new Map();
    
    // Get drug elements from the drug list
    document.querySelectorAll('#drugList .drug-item').forEach(element => {
        const id = element.getAttribute('data-id');
        const name = element.getAttribute('data-name');
        if (id && name) {
            drugNames.set(id, name);
        }
    });
    
    // Get drug elements from the cart
    document.querySelectorAll('#drugCart [data-drug-id]').forEach(element => {
        const id = element.getAttribute('data-drug-id');
        const nameElement = element.querySelector('strong');
        if (id && nameElement) {
            drugNames.set(id, nameElement.textContent);
        }
    });
    
    console.log('Drug names map:', Object.fromEntries([...drugNames.entries()]));
    
    // If we don't have enough drug names, try fetching them from the server
    const missingIds = interactions.flatMap(interaction => 
        [interaction.drug1Id, interaction.drug2Id].filter(id => !drugNames.has(id))
    );
    
    if (missingIds.length > 0) {
        const uniqueMissingIds = [...new Set(missingIds)];
        console.log('Fetching missing drug names for IDs:', uniqueMissingIds);
        
        try {
            // Fetch missing drug names from the server
            for (const id of uniqueMissingIds) {
                const response = await fetch(`/api/drugs/${id}`);
                if (response.ok) {
                    const drug = await response.json();
                    drugNames.set(id, drug.name);
                }
            }
        } catch (error) {
            console.error('Error fetching missing drug names:', error);
        }
    }
    
    // Enrich interactions with drug names
    return interactions.map(interaction => ({
        ...interaction,
        drug1Name: drugNames.get(interaction.drug1Id) || `Unknown Drug (${interaction.drug1Id})`,
        drug2Name: drugNames.get(interaction.drug2Id) || `Unknown Drug (${interaction.drug2Id})`
    }));
}

// Show a warning modal for drug interactions
function showDrugInteractionWarning(interactions, onConfirm) {
    console.log('Creating drug interaction warning modal for interactions:', interactions);
    
    // Remove any existing modal first
    const existingModal = document.getElementById('interactionWarningModal');
    if (existingModal) {
        existingModal.parentElement.remove();
    }
    
    // Create a modal for the warning
    const modalHtml = `
        <div id="interactionWarningModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header" style="background-color: rgba(255, 92, 92, 0.1); border-bottom: 2px solid #ff5c5c;">
                    <h3 style="color: #ff5c5c;">⚠️ Drug Interaction Warning</h3>
                    <span class="close" id="interactionWarningClose">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="padding: 10px; background-color: rgba(255, 92, 92, 0.05); border-radius: 4px; margin-bottom: 15px;">
                        <p style="margin-top: 0; font-weight: 500;">
                            Potential drug interactions were detected between the selected medications.
                        </p>
                        <p style="margin-bottom: 0;">
                            Please review these interactions carefully before proceeding. Consider consulting with a pharmacist if you're unsure.
                        </p>
                    </div>
                    
                    <h4 style="margin-top: 0;">Detected Interactions:</h4>
                    <ul style="margin-bottom: 15px; padding-left: 10px; list-style-type: none;">
                        ${interactions.map(interaction => `
                            <li style="margin-bottom: 12px; padding: 8px 10px; border-left: 3px solid #ff5c5c; background-color: rgba(255, 92, 92, 0.05);">
                                <strong style="color: #ff5c5c;">${interaction.drug1Name}</strong> 
                                <span style="margin: 0 5px;">⟷</span> 
                                <strong style="color: #ff5c5c;">${interaction.drug2Name}</strong>
                                <div style="margin-top: 5px; font-size: 0.9em; color: var(--secondary-text);">
                                    These drugs may interact. Consider alternative medications or adjusting dosages.
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="modal-footer" style="border-top: 1px solid rgba(255, 92, 92, 0.3);">
                    <button type="button" class="btn-secondary" id="interactionWarningCancel">
                        Cancel
                    </button>
                    <button type="button" class="btn-primary" style="background-color: #ff5c5c;" id="confirmDespiteInteractions">
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Add event listeners to the modal buttons
    document.getElementById('interactionWarningClose').addEventListener('click', function() {
        closeInteractionWarningModal();
    });
    
    document.getElementById('interactionWarningCancel').addEventListener('click', function() {
        closeInteractionWarningModal();
    });
    
    document.getElementById('confirmDespiteInteractions').addEventListener('click', function() {
        closeInteractionWarningModal();
        if (onConfirm && typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // Close drug details modal if it's open
    closeModal();
}

// Close the interaction warning modal
function closeInteractionWarningModal() {
    console.log('Closing interaction warning modal');
    const modal = document.getElementById('interactionWarningModal');
    if (modal) {
        const container = modal.closest('div');
        if (container) {
            container.remove();
        } else {
            modal.remove();
        }
    }
}

function selectTemplateFromDropdown(selectElement) {
    const template = selectElement.value;
    selectedTemplate = template;
    console.log(`Template selected: "${template}"`);
    
    // Update the templateSelect element to reflect the current selection
    if (selectElement.id !== 'templateSelect') {
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            for (let i = 0; i < templateSelect.options.length; i++) {
                if (templateSelect.options[i].value === template) {
                    templateSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    // Filter drugs by the selected template
    filterDrugsByTemplate(template);
    
    // Clear selected drugs when changing template
    selectedDrugs = [];
    document.getElementById('addSelectedBtn').disabled = true;
    
    // Log the current state
    console.log(`Selected template: "${selectedTemplate}"`);
    console.log(`Selected drugs count: ${selectedDrugs.length}`);
}

function filterDrugsByTemplate(template) {
    const drugList = document.getElementById('drugList');
    const items = drugList.querySelectorAll('li.drug-item');
    
    console.log(`Filtering drugs by template: "${template}"`);
    console.log(`Total drugs found: ${items.length}`);
    
    if (!template || template === '') {
        // Show all drugs if no template is selected
        console.log('No template selected, showing all drugs');
        items.forEach(item => {
            item.style.display = 'flex';
        });
        document.getElementById('emptyDrugList').style.display = 'none';
        return;
    }
    
    let visibleCount = 0;
    
    // Hide/show drugs based on template
    items.forEach(item => {
        const drugTemplate = item.getAttribute('data-template');
        const drugName = item.getAttribute('data-name');
        console.log(`Drug: ${drugName}`);
        console.log(`  Expected template: "${template}"`);
        console.log(`  Actual template: "${drugTemplate}"`);
        console.log(`  Template comparison: "${drugTemplate?.trim().toLowerCase()}" === "${template.trim().toLowerCase()}"`);
        
        // Make comparison case-insensitive and trim whitespace
        if (drugTemplate && drugTemplate.trim().toLowerCase() === template.trim().toLowerCase()) {
            console.log(`  ✓ Match found for drug: ${drugName}`);
            item.style.display = 'flex';
            visibleCount++;
        } else {
            console.log(`  ✗ No match for drug: ${drugName}`);
            item.style.display = 'none';
        }
    });
    
    console.log(`Visible drugs count: ${visibleCount}`);
    
    // Show empty message if no drugs visible
    if (visibleCount === 0) {
        const emptyMessage = document.getElementById('emptyDrugList');
        emptyMessage.textContent = `No drugs available for "${template}" category`;
        emptyMessage.style.display = 'block';
    } else {
        document.getElementById('emptyDrugList').style.display = 'none';
    }
    
    // Only update drug select options if the element exists
    const drugSelect = document.getElementById('drugSelect');
    if (drugSelect) {
        updateDrugSelectOptions(template);
    }
}

function updateDrugSelectOptions(template) {
    const drugSelect = document.getElementById('drugSelect');
    
    // Check if the element exists
    if (!drugSelect) {
        console.warn('Drug select element not found, skipping option update');
        return;
    }
    
    console.log(`Updating drug select options for template: "${template}"`);
    
    drugSelect.innerHTML = '<option value="">Select drug</option>';
    
    const drugList = document.getElementById('drugList');
    const visibleItems = Array.from(drugList.querySelectorAll('li.drug-item'))
        .filter(item => item.style.display !== 'none');
    
    console.log(`Found ${visibleItems.length} visible drug items`);
    
    visibleItems.forEach(item => {
        const id = item.getAttribute('data-id');
        const name = item.getAttribute('data-name');
        const dosage = item.getAttribute('data-dosage');
        const route = item.getAttribute('data-route');
        
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        option.dataset.dosageInstructions = dosage || '';
        option.dataset.routeOfAdministration = route || '';
        
        drugSelect.appendChild(option);
    });
}

function selectDrugFromList(element) {
    // Get data from the clicked drug
    const drugId = element.getAttribute('data-id');
    const drugName = element.getAttribute('data-name');
    const dosage = element.getAttribute('data-dosage');
    
    // Set the drug in dropdown
    const drugSelect = document.getElementById('drugSelect');
    for (let i = 0; i < drugSelect.options.length; i++) {
        if (drugSelect.options[i].value === drugId) {
            drugSelect.selectedIndex = i;
            break;
        }
    }
    
    // Set dosage
    if (dosage) {
        document.getElementById('doseInput').value = dosage;
    }
    
    // Scroll to the prescription table
    document.querySelector('.prescription-table').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Handle drug selection to pre-fill dose
document.addEventListener('DOMContentLoaded', function() {
    const drugSelect = document.getElementById('drugSelect');
    if (drugSelect) {
        drugSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.dataset.dosageInstructions) {
                document.getElementById('doseInput').value = selectedOption.dataset.dosageInstructions;
            }
        });
    }
});

function removeFromCart(buttonElement, itemIndex) {
    // Find the parent cart item and remove it
    const cartItem = buttonElement.closest('[data-drug-id]');
    if (cartItem) {
        cartItem.remove();
        console.log(`Removed drug from cart at index: ${itemIndex}`);
        
        // Check if cart is empty
        const cartItems = document.querySelectorAll('#drugCart [data-drug-id]');
        if (cartItems.length === 0) {
            // If cart is empty, show a message
            const emptyMessage = document.createElement('div');
            emptyMessage.id = 'emptyCartMessage';
            emptyMessage.style.padding = '10px';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.color = 'var(--secondary-text)';
            emptyMessage.textContent = 'No drugs added to cart yet';
            document.getElementById('drugCart').appendChild(emptyMessage);
        }
        
        // Mark drugs that interact with drugs in the cart
        markInteractingDrugs();
    }
}

// Load initial template on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing drug list');
    
    // Create a style element for interacting drugs and selection highlight
    const style = document.createElement('style');
    style.textContent = `
        .interacting-drug {
            background-color: rgba(255, 215, 0, 0.05);
            border-left: 3px solid #ffa500;
            padding-left: 7px;
        }
        
        .selection-indicator {
            display: inline-block;
            margin-left: 5px;
            color: #8a2be2;
            font-weight: bold;
        }
        
        .drug-item.selected {
            border-right: 3px solid #8a2be2;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the drug dropdown with all drugs
    const drugSelect = document.getElementById('drugSelect');
    const drugList = document.getElementById('drugList');
    
    // Add event listener for the template select dropdown
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        console.log('Adding event listener to template select');
        // Add a direct event listener as a fallback
        templateSelect.addEventListener('change', function() {
            const template = this.value;
            console.log(`Template change detected via event listener: "${template}"`);
            selectTemplateFromDropdown(this);
        });
        
        // Force immediate filtering based on any initial selection
        const currentTemplate = templateSelect.value;
        if (currentTemplate) {
            console.log(`Initial template selection detected: "${currentTemplate}"`);
            filterDrugsByTemplate(currentTemplate);
        } else {
            console.log('No initial template selection, showing all drugs');
        }
        
        console.log('Template select element found and initialized');
    } else {
        console.warn('Template select element not found');
    }
    
    // Store all drug items 
    if (drugList) {
        const drugItems = drugList.querySelectorAll('.drug-item');
        console.log(`Found ${drugItems.length} drug items in the list`);
        
        // Log the template categories for debugging
        drugItems.forEach(item => {
            const name = item.getAttribute('data-name');
            const template = item.getAttribute('data-template');
            console.log(`Drug: ${name}, Template: "${template}"`);
        });
        
        // Add keyboard support for multi-selection
        document.addEventListener('keydown', function(e) {
            // Ctrl key (or Cmd key on Mac) for multi-selection
            if (e.key === 'Control' || e.key === 'Meta') {
                document.body.classList.add('multi-select-mode');
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Control' || e.key === 'Meta') {
                document.body.classList.remove('multi-select-mode');
            }
        });
        
        // Add helpful tooltip to drug list header
        const drugListHeader = document.querySelector('.drug-list').previousElementSibling;
        if (drugListHeader) {
            const infoSpan = document.createElement('span');
            infoSpan.style.fontSize = '0.8em';
            infoSpan.style.fontWeight = 'normal';
            infoSpan.style.opacity = '0.7';
            infoSpan.innerHTML = ' (Use Ctrl/Cmd for multi-selection)';
            drugListHeader.querySelector('span:first-child').appendChild(infoSpan);
        }
    } else {
        console.warn('Drug list element not found');
    }
    
    // Apply styles to allergens for better visibility
    document.querySelectorAll('.drug-item[data-is-allergen="true"]').forEach(item => {
        // Add a subtle background color to make allergenic drugs stand out more
        item.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
        
        // Add a border on the left side
        item.style.borderLeft = '3px solid #ff0000';
        
        // Add some padding to account for the border
        item.style.paddingLeft = '7px';
    });
    
    // Initialize checkout button state
    updateCheckoutState();
    
    // Initialize drug cart 
    initializeDrugCart();
    
    // Mark drugs that interact with drugs in the cart
    markInteractingDrugs();
});

// Add event listener for the update vitals button
document.addEventListener('DOMContentLoaded', function() {
    const confirmVitalsBtn = document.getElementById('confirmVitals');
    if (confirmVitalsBtn) {
        // Initialize the data-locked attribute
        confirmVitalsBtn.setAttribute('data-locked', 'false');
        confirmVitalsBtn.addEventListener('click', confirmVitalSigns);
    }
    
    // Initialize the confirm diagnosis button with toggle functionality
    const confirmDiagnosisBtn = document.getElementById('confirmDiagnosis');
    if (confirmDiagnosisBtn) {
        // Initialize the data-locked attribute
        confirmDiagnosisBtn.setAttribute('data-locked', 'false');
        confirmDiagnosisBtn.addEventListener('click', confirmDiagnosis);
    }
    
    // Initialize Blood Pressure fields from the combined value
    initializeBloodPressureFields();
    
    // Set up form submission event to combine BP values
    const consultationForm = document.querySelector('form[action*="/consultation/save"]');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(e) {
            combineBPValues();
        });
    }
    
    // Initialize checkout button state
    updateCheckoutState();
});

// Function to initialize blood pressure fields by splitting the combined value
function initializeBloodPressureFields() {
    const combinedBPField = document.getElementById('combinedBP');
    const systolicField = document.getElementById('systolicBP');
    const diastolicField = document.getElementById('diastolicBP');
    
    if (combinedBPField && systolicField && diastolicField) {
        const combinedValue = combinedBPField.value;
        if (combinedValue && combinedValue.includes('/')) {
            const [systolic, diastolic] = combinedValue.split('/');
            systolicField.value = systolic.trim();
            diastolicField.value = diastolic.trim();
        }
    }
}

// Function to combine Systolic and Diastolic values into a single BP value
function combineBPValues() {
    const systolicField = document.getElementById('systolicBP');
    const diastolicField = document.getElementById('diastolicBP');
    const combinedBPField = document.getElementById('combinedBP');
    
    if (systolicField && diastolicField && combinedBPField) {
        const systolic = systolicField.value.trim();
        const diastolic = diastolicField.value.trim();
        
        if (systolic && diastolic) {
            combinedBPField.value = systolic + '/' + diastolic;
        } else if (systolic) {
            combinedBPField.value = systolic;
        } else if (diastolic) {
            combinedBPField.value = '0/' + diastolic;
        } else {
            combinedBPField.value = '';
        }
    }
}

// Function to check if checkout should be enabled
function updateCheckoutState() {
    const vitalsConfirmed = document.getElementById('confirmVitals').getAttribute('data-locked') === 'true';
    const diagnosisConfirmed = document.getElementById('confirmDiagnosis').getAttribute('data-locked') === 'true';
    const checkoutButton = document.getElementById('checkoutButton');
    const checkoutMessage = document.getElementById('checkoutMessage');
    
    if (vitalsConfirmed && diagnosisConfirmed) {
        // Both are confirmed, enable checkout
        checkoutButton.disabled = false;
        checkoutMessage.style.display = 'none';
    } else {
        // One or both are not confirmed, disable checkout
        checkoutButton.disabled = false; // Allow button to be clicked but we'll show validation on click
        checkoutMessage.style.display = 'block';
        
        // Update message with specific details
        let message = 'Please confirm ';
        if (!vitalsConfirmed && !diagnosisConfirmed) {
            message += 'both Vitals and Diagnosis';
        } else if (!vitalsConfirmed) {
            message += 'Vitals';
        } else {
            message += 'Diagnosis';
        }
        message += ' before checkout';
        checkoutMessage.textContent = message;
    }
}

// Function to validate checkout
function validateCheckout(event) {
    const vitalsConfirmed = document.getElementById('confirmVitals').getAttribute('data-locked') === 'true';
    const diagnosisConfirmed = document.getElementById('confirmDiagnosis').getAttribute('data-locked') === 'true';
    const diagnosis = document.querySelector('input[name="diagnosis"]').value.trim();
    const vitalsFields = document.querySelectorAll('.editable-vital');
    
    // Check if vitals and diagnosis are filled
    let missingFields = [];
    let vitalsComplete = true;
    
    // Check if diagnosis is filled
    if (!diagnosis) {
        missingFields.push('Diagnosis field is empty');
    }
    
    // Check vital fields
    let emptyVitalsFields = [];
    vitalsFields.forEach(field => {
        if (!field.value.trim()) {
            vitalsComplete = false;
            emptyVitalsFields.push(field.id);
        }
    });
    
    if (!vitalsComplete) {
        missingFields.push('One or more vital signs are not recorded');
    }
    
    // If fields are missing, show validation modal
    if (missingFields.length > 0) {
        showValidationModal(missingFields);
        event.preventDefault(); // Prevent form submission
        return false;
    }
    
    // If fields are complete but not confirmed, show a different validation message
    if (!vitalsConfirmed || !diagnosisConfirmed) {
        let unconfirmedFields = [];
        if (!vitalsConfirmed) unconfirmedFields.push('Vitals need to be confirmed');
        if (!diagnosisConfirmed) unconfirmedFields.push('Diagnosis needs to be confirmed');
        
        showValidationModal(unconfirmedFields, 'Confirmation Required');
        event.preventDefault();
        return false;
    }
    
    return true; // All good, allow submission
}

// Function to show validation modal
function showValidationModal(missingFields, title = 'Required Fields') {
    const modal = document.getElementById('validationModal');
    const modalTitle = modal.querySelector('.modal-header h3');
    const validationDetails = document.getElementById('validationDetails');
    
    // Set modal title
    modalTitle.textContent = title;
    
    // Create list of missing fields
    validationDetails.innerHTML = `
        <ul>
            ${missingFields.map(field => `<li>${field}</li>`).join('')}
        </ul>
    `;
    
    // Show modal
    modal.style.display = 'block';
}

// Function to close validation modal
function closeValidationModal() {
    const modal = document.getElementById('validationModal');
    modal.style.display = 'none';
}

// Function to confirm vital signs (locks the input fields)
function confirmVitalSigns() {
    // Get all vital sign input fields
    const vitalFields = document.querySelectorAll('.editable-vital');
    const confirmBtn = document.getElementById('confirmVitals');
    
    // Check if fields are currently locked (toggling behavior)
    const isCurrentlyLocked = confirmBtn.getAttribute('data-locked') === 'true';
    
    if (isCurrentlyLocked) {
        // Unlock fields - make them editable again
        vitalFields.forEach(field => {
            field.removeAttribute('readonly');
            // Reset styling
            field.style.backgroundColor = '';
            field.style.color = '';
            field.style.borderColor = '';
        });
        
        // Update button
        confirmBtn.textContent = 'Confirm Vitals';
        confirmBtn.style.backgroundColor = 'var(--accent-color)';
        confirmBtn.setAttribute('data-locked', 'false');

    } else {
        // Lock fields - make them readonly
        vitalFields.forEach(field => {
            field.setAttribute('readonly', 'readonly');
            // Add a visual indicator that the fields are locked
            field.style.color = 'var(--secondary-text)';
        });
        
        // Update button
        confirmBtn.textContent = 'Edit Vitals';
        confirmBtn.style.backgroundColor = '#4CAF50';
        confirmBtn.setAttribute('data-locked', 'true');
        
    }
    
    // Update checkout button state
    updateCheckoutState();
}

// Function to confirm diagnosis (locks the diagnosis input and transcript fields)
function confirmDiagnosis() {
    // Get the diagnosis input and consultation transcript fields
    const diagnosisInput = document.querySelector('input[name="diagnosis"]');
    const transcriptField = document.querySelector('textarea[name="clinicalNotes"]');
    const confirmBtn = document.getElementById('confirmDiagnosis');
    
    // Check if diagnosis is empty
    if (diagnosisInput.value.trim() === '') {
        alert('Please enter a diagnosis');
        return;
    }
    
    // Check if fields are currently locked (toggling behavior)
    const isCurrentlyLocked = confirmBtn.getAttribute('data-locked') === 'true';
    
    if (isCurrentlyLocked) {
        // Unlock fields - make them editable again
        diagnosisInput.removeAttribute('readonly');
        transcriptField.removeAttribute('readonly');
        
        // Reset styling
        diagnosisInput.style.backgroundColor = '';
        diagnosisInput.style.color = '';
        transcriptField.style.backgroundColor = '';
        transcriptField.style.color = '';
        
        // Update button
        confirmBtn.textContent = 'Confirm Diagnosis';
        confirmBtn.style.backgroundColor = 'var(--accent-color)';
        confirmBtn.setAttribute('data-locked', 'false');
    } else {
        // Lock fields - make them readonly
        diagnosisInput.setAttribute('readonly', 'readonly');
        transcriptField.setAttribute('readonly', 'readonly');
        
        // Add a visual indicator that the fields are locked
        diagnosisInput.style.color = 'var(--secondary-text)';
        transcriptField.style.color = 'var(--secondary-text)';
        
        // Update button
        confirmBtn.textContent = 'Edit Diagnosis';
        confirmBtn.style.backgroundColor = '#4CAF50';
        confirmBtn.setAttribute('data-locked', 'true');
    }
    
    // Update checkout button state
    updateCheckoutState();
}

// Functions for past consultations notes modal
function showFullNotes(element) {
    const fullNotes = element.getAttribute('data-full-notes');
    document.getElementById('fullConsultationNotes').textContent = fullNotes || 'No notes available';
    document.getElementById('pastConsultationNotesModal').style.display = 'block';
}

function closeNotesModal() {
    document.getElementById('pastConsultationNotesModal').style.display = 'none';
}

// Function to show consultation details in the modal
function showConsultationDetails(element) {
    const data = element.dataset;
    
    // Populate general information
    document.getElementById('modal-id').textContent = data.id || 'Not available';
    document.getElementById('modal-date').textContent = data.date || 'Not recorded';
    document.getElementById('modal-type').textContent = data.consultationType || 'Not recorded';
    document.getElementById('modal-doctor').textContent = data.doctor || 'Unknown';
    document.getElementById('modal-status').textContent = data.status || 'Not recorded';
    
    // Populate diagnosis and notes
    document.getElementById('modal-diagnosis').textContent = data.diagnosis || 'No diagnosis recorded';
    document.getElementById('modal-notes').textContent = data.notes || 'No notes recorded';
    
    // Populate vital signs
    document.getElementById('modal-bp').textContent = data.bp ? data.bp : 'Not recorded';
    document.getElementById('modal-temp').textContent = data.temp ? data.temp + ' °C' : 'Not recorded';
    document.getElementById('modal-hr').textContent = data.hr ? data.hr + ' bpm' : 'Not recorded';
    document.getElementById('modal-rr').textContent = data.rr ? data.rr + ' breaths/min' : 'Not recorded';
    document.getElementById('modal-o2').textContent = data.o2 ? data.o2 + '%' : 'Not recorded';
    document.getElementById('modal-weight').textContent = data.weight ? data.weight + ' kg' : 'Not recorded';
    document.getElementById('modal-height').textContent = data.height ? data.height + ' cm' : 'Not recorded';
    document.getElementById('modal-bmi').textContent = data.bmi ? data.bmi : 'Not recorded';
    
    // Display the modal
    document.getElementById('fullVitalsModal').style.display = 'block';
}

function closeVitalsModal() {
    document.getElementById('fullVitalsModal').style.display = 'none';
}

// Function to toggle past consultations section
function togglePastConsultations() {
    const content = document.getElementById('pastConsultationsContent');
    const icon = document.getElementById('toggleIcon');
    
    if (content.style.display === 'none') {
        // Expand
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Collapse
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Close the modals when clicking outside of them
window.onclick = function(event) {
    const notesModal = document.getElementById('pastConsultationNotesModal');
    const vitalsModal = document.getElementById('fullVitalsModal');
    const drugModal = document.getElementById('drugDetailsModal');
    const vitalsHistoryModal = document.getElementById('vitalsHistoryModal');
    
    if (event.target == notesModal) {
        notesModal.style.display = 'none';
    }
    if (event.target == vitalsModal) {
        vitalsModal.style.display = 'none';
    }
    if (event.target == drugModal) {
        drugModal.style.display = 'none';
    }
    if (event.target == vitalsHistoryModal) {
        vitalsHistoryModal.style.display = 'none';
    }
}

// Get the patient ID from the hidden input
function getPatientId() {
    const patientIdField = document.getElementById('patientId');
    return patientIdField ? patientIdField.value : '';
}

// Functions for vitals history modal
function showVitalsHistory(vitalType) {
    // Only show history if fields are not locked for editing
    const confirmBtn = document.getElementById('confirmVitals');
    const isCurrentlyLocked = confirmBtn && confirmBtn.getAttribute('data-locked') === 'true';
    if (isCurrentlyLocked) {
        return; // Don't show history if fields are locked
    }
    
    const modal = document.getElementById('vitalsHistoryModal');
    const title = document.getElementById('vitalsHistoryTitle');
    
    // Set the title based on the vital type
    title.textContent = vitalType === 'height' ? 'Height History' : 'Weight History';
    
    // Show the modal
    modal.style.display = 'block';
    
    // Fetch the patient's history
    fetchPatientVitalsHistory(getPatientId(), vitalType);
}

function closeVitalsHistoryModal() {
    document.getElementById('vitalsHistoryModal').style.display = 'none';
}

function fetchPatientVitalsHistory(patientId, vitalType) {
    if (!patientId) {
        showNoDataMessage(vitalType);
        return;
    }
    
    // Show loading state
    const tableBody = document.getElementById('vitalsHistoryTableBody');
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Loading...</td></tr>';
    
    // Fetch data from server
    fetch(`/api/patient/${patientId}/vitals-history?type=${vitalType}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayVitalsHistory(data, vitalType);
        })
        .catch(error => {
            console.error('Error fetching vitals history:', error);
            
            // Fall back to past consultations data from the page
            const pastConsultations = collectPastConsultationsData();
            displayVitalsHistory(pastConsultations, vitalType);
        });
}

function collectPastConsultationsData() {
    // Collect data from the past consultations table that's already on the page
    const consultations = [];
    
    // Try selecting the table rows directly
    const rows = document.querySelectorAll('.past-consultations-container tbody tr');
    console.log(`Found ${rows.length} consultation rows`);
    
    rows.forEach(row => {
        // Get the button in this row
        const button = row.querySelector('button.btn-secondary');
        if (!button) return;
        
        const data = button.dataset;
        
        // Log the data we're collecting
        console.log('Collecting data from consultation row:');
        console.log(`- Date: ${data.date}`);
        console.log(`- Height: ${data.height}`);
        console.log(`- Weight: ${data.weight}`);
        console.log(`- Doctor: ${data.doctor}`);
        
        // Only add if we have relevant data
        if (data.date && (data.height || data.weight)) {
            consultations.push({
                date: data.date,
                height: data.height,
                weight: data.weight,
                doctor: data.doctor
            });
        }
    });
    
    console.log(`Collected ${consultations.length} consultations with data`);
    return consultations;
}

function displayVitalsHistory(data, vitalType) {
    const tableBody = document.getElementById('vitalsHistoryTableBody');
    const chartDiv = document.getElementById('vitalsHistoryChart');
    
    // Clear previous data
    tableBody.innerHTML = '';
    chartDiv.innerHTML = '';
    
    console.log(`Displaying ${vitalType} history`, data);
    
    if (!data || data.length === 0) {
        showNoDataMessage(vitalType);
        return;
    }
    
    // Filter to only include items with the requested vital type data
    const filteredData = data.filter(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        return value !== undefined && value !== null && value !== '';
    });
    
    console.log(`After filtering, have ${filteredData.length} records with ${vitalType} data`);
    
    if (filteredData.length === 0) {
        showNoDataMessage(vitalType);
        return;
    }
    
    // Sort data by date (oldest first) for the chart
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Prepare data for chart
    const chartData = {
        labels: [],
        values: []
    };
    
    // Collect data for the chart (chronological order)
    filteredData.forEach(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        chartData.labels.push(item.date);
        chartData.values.push(parseFloat(value));
    });
    
    // Create chart if we have data
    if (chartData.values.length > 0) {
        createVitalsChart(chartDiv, chartData, vitalType);
    } else {
        chartDiv.innerHTML = `<p style="text-align: center; padding: 20px;">No ${vitalType} history data available</p>`;
    }
    
    // Sort data for the table (oldest first)
    const tableData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Populate table with oldest records first
    tableData.forEach(item => {
        const value = vitalType === 'height' ? item.height : item.weight;
        
        // Add to table
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        
        const dateCell = document.createElement('td');
        dateCell.style.padding = '10px';
        dateCell.textContent = item.date;
        
        const valueCell = document.createElement('td');
        valueCell.style.padding = '10px';
        valueCell.textContent = `${value} ${vitalType === 'height' ? 'cm' : 'kg'}`;
        
        const doctorCell = document.createElement('td');
        doctorCell.style.padding = '10px';
        doctorCell.textContent = item.doctor || 'Unknown';
        
        row.appendChild(dateCell);
        row.appendChild(valueCell);
        row.appendChild(doctorCell);
        tableBody.appendChild(row);
    });
}

function showNoDataMessage(vitalType) {
    const tableBody = document.getElementById('vitalsHistoryTableBody');
    const chartDiv = document.getElementById('vitalsHistoryChart');
    
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No ${vitalType} history available</td></tr>`;
    chartDiv.innerHTML = `<p style="text-align: center; padding: 20px;">No ${vitalType} history data available</p>`;
}

function createVitalsChart(container, data, vitalType) {
    // Clear previous chart
    container.innerHTML = '';
    
    // Create canvas for the chart
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Create a line chart using Chart.js
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: vitalType === 'height' ? 'Height (cm)' : 'Weight (kg)',
                data: data.values,
                borderColor: 'rgb(138, 43, 226)',
                backgroundColor: 'rgba(138, 43, 226, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: vitalType === 'height' ? 'Height (cm)' : 'Weight (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: vitalType === 'height' ? 'Height History' : 'Weight History'
                }
            }
        }
    });
}

function addDrugToCart(drugId, drugName, dosage, days, qty) {
    // Get the current index for this prescription item
    const itemIndex = prescriptionItemIndex++;
    
    // Remove any existing "empty cart" message
    const emptyMessage = document.getElementById('emptyCartMessage');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Create cart item element
    const cartItem = document.createElement('div');
    cartItem.style.padding = '10px';
    cartItem.style.marginBottom = '5px';
    cartItem.style.borderBottom = '1px solid var(--border-color)';
    cartItem.setAttribute('data-drug-id', drugId);
    
    cartItem.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <div>
                <strong>${drugName}</strong> - ${dosage}
            </div>
            <div>
                ${days} days - Qty: ${qty}
            </div>
            <div>
                <button type="button" onclick="removeFromCart(this, ${itemIndex})" 
                        style="background: none; border: none; color: #ff5c5c; cursor: pointer;">
                    Remove
                </button>
            </div>
        </div>
        <!-- Use a simplified field naming for better binding -->
        <input type="hidden" name="drugIds[]" value="${drugId}">
        <input type="hidden" name="drugDosages[]" value="${dosage}">
        <input type="hidden" name="drugDurations[]" value="${days} days">
        <input type="hidden" name="drugQuantities[]" value="${qty}">
    `;
    
    // Add to cart
    document.getElementById('drugCart').appendChild(cartItem);
    
    // Debug info - log cart item count
    console.log(`Added drug to cart: ${drugName}`);
    console.log(`Current prescription items count: ${prescriptionItemIndex}`);
    
    // Mark drugs that interact with drugs in the cart
    markInteractingDrugs();
}

// Initialize checkout button state
updateCheckoutState();

// Function to initialize the drug cart
function initializeDrugCart() {
    const cartElement = document.getElementById('drugCart');
    if (!cartElement) return;
    
    const cartItems = cartElement.querySelectorAll('[data-drug-id]');
    
    // Remove any existing empty message
    const existingMessage = document.getElementById('emptyCartMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Only show empty message if cart is empty
    if (cartItems.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.id = 'emptyCartMessage';
        emptyMessage.style.padding = '10px';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.style.color = 'var(--secondary-text)';
        emptyMessage.textContent = 'No drugs added to cart yet';
        cartElement.appendChild(emptyMessage);
    }
    
    // Mark drugs that interact with drugs in the cart
    markInteractingDrugs();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add validation to form submission
    const form = document.querySelector('form[action*="/consultation/save"]');
    if (form) {
        form.addEventListener('submit', validateCheckout);
    }
    
    // Add click event to checkout button
    const checkoutButton = document.getElementById('checkoutButton');
    if (checkoutButton) {
        checkoutButton.removeAttribute('type'); // Remove type="submit" to prevent automatic submission
        checkoutButton.setAttribute('type', 'button'); // Change to button
        checkoutButton.addEventListener('click', function(e) {
            if (validateCheckout(e)) {
                // If validation passes, submit the form
                form.submit();
            }
        });
    }
    
    // Initialize BP fields
    initializeBloodPressureFields();
    
    // Initialize drug cart
    initializeDrugCart();
    
    // Initialize checkout button state
    updateCheckoutState();
    
    // Mark drugs that interact with drugs in the cart
    markInteractingDrugs();
});

// Function to mark drugs that interact with drugs in the cart
async function markInteractingDrugs() {
    console.log('Marking drugs that interact with drugs in the cart');
    
    // Get all drug IDs from the cart
    const cartDrugIds = getExistingDrugIdsInCart();
    if (cartDrugIds.length === 0) {
        // If cart is empty, remove all interaction markers
        document.querySelectorAll('.drug-item').forEach(item => {
            // Only remove interaction styling if it's not an allergen
            if (item.getAttribute('data-is-allergen') !== 'true') {
                item.style.backgroundColor = '';
                item.style.borderLeft = '';
                item.style.paddingLeft = '';
            }
            
            // Always remove the interaction indicator
            const interactionIndicator = item.querySelector('.interaction-indicator');
            if (interactionIndicator) {
                interactionIndicator.remove();
            }
        });
        return;
    }
    
    // Get all drug elements in the list
    const drugItems = document.querySelectorAll('#drugList .drug-item');
    
    // Reset all interaction markers first
    drugItems.forEach(item => {
        // Only remove interaction styling if it's not an allergen
        if (item.getAttribute('data-is-allergen') !== 'true') {
            item.style.backgroundColor = '';
            item.style.borderLeft = '';
            item.style.paddingLeft = '';
        }
        
        // Always remove the interaction indicator, but preserve selection indicator
        const interactionIndicator = item.querySelector('.interaction-indicator');
        if (interactionIndicator) {
            interactionIndicator.remove();
        }
    });
    
    // Create a map to store all interactions
    const allInteractions = new Set();
    
    // Fetch interactions for each drug in the cart
    for (const drugId of cartDrugIds) {
        try {
            const response = await fetch(`/api/drugs/${drugId}/interactions`);
            if (!response.ok) {
                console.warn(`Failed to fetch interactions for drug ${drugId}`);
                continue;
            }
            
            const interactionIds = await response.json();
            // Add all interactions to the set
            interactionIds.forEach(id => allInteractions.add(id));
        } catch (error) {
            console.error(`Error fetching interactions for drug ${drugId}:`, error);
        }
    }
    
    console.log('Found interactions with cart drugs:', [...allInteractions]);
    
    // Mark drugs in the list that interact with any drug in the cart
    drugItems.forEach(item => {
        const drugId = item.getAttribute('data-id');
        const isAllergen = item.getAttribute('data-is-allergen') === 'true';
        
        if (allInteractions.has(drugId)) {
            // Add interaction indicator icon if it doesn't exist
            if (!item.querySelector('.interaction-indicator')) {
                const drugNameDiv = item.querySelector('div:first-child');
                const interactionIndicator = document.createElement('span');
                interactionIndicator.className = 'interaction-indicator';
                interactionIndicator.title = 'This drug interacts with a drug in your cart';
                interactionIndicator.textContent = '⚠️';
                interactionIndicator.style.color = '#ffa500'; // Yellow/orange color
                interactionIndicator.style.marginLeft = '5px';
                
                // Insert before the selection indicator if it exists
                const selectionIndicator = drugNameDiv.querySelector('.selection-indicator');
                if (selectionIndicator) {
                    drugNameDiv.insertBefore(interactionIndicator, selectionIndicator);
                } else {
                    drugNameDiv.appendChild(interactionIndicator);
                }
            }
            
            // Only apply yellow styling if it's not an allergen
            if (!isAllergen) {
                // Add yellow styling
                item.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
                item.style.borderLeft = '3px solid #ffa500';
                item.style.paddingLeft = '7px';
            }
        }
    });
}

// Function to show a toast notification
function showToast(message, type = 'info') {
    // Remove any existing toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Set color based on type
    let backgroundColor, textColor;
    switch (type) {
        case 'success':
            backgroundColor = '#8a2be2'; // Purple instead of green
            textColor = 'white';
            break;
        case 'warning':
            backgroundColor = '#ff9800';
            textColor = 'white';
            break;
        case 'error':
            backgroundColor = '#f44336';
            textColor = 'white';
            break;
        default:
            backgroundColor = '#2196F3';
            textColor = 'white';
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = backgroundColor;
    toast.style.color = textColor;
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.zIndex = '1000';
    toast.style.minWidth = '250px';
    toast.style.textAlign = 'center';
    toast.style.animation = 'fadeInOut 3s ease-in-out';
    toast.textContent = message;
    
    // Add animation keyframes if they don't exist
    if (!document.getElementById('toast-animation')) {
        const style = document.createElement('style');
        style.id = 'toast-animation';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to document
    document.body.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}