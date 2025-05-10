let prescriptionItemIndex = 0;
let selectedTemplate = '';
let allDrugs = [];
let selectedDrugs = [];

/**
 * Shows a custom confirmation modal with specified title, message and action
 * @param {string} title - Modal title
 * @param {string} message - Message to display
 * @param {Function} onConfirm - Function to execute when confirmed
 * @param {string} type - Type of confirmation ('danger', 'allergen', 'interaction')
 */
function showConfirmationModal(title, message, onConfirm, type = 'danger') {
    console.log('Showing confirmation modal:', title, message, type);
    
    const existingModal = document.getElementById('customConfirmationModal');
    if (existingModal) {
        existingModal.parentElement.remove();
    }
    
    let headerBgColor, headerBorderColor, buttonBgColor, iconColor;
    
    if (type === 'allergen') {
        headerBgColor = 'rgba(255, 92, 92, 0.1)';
        headerBorderColor = '#ff5c5c';
        buttonBgColor = '#ff5c5c';
        iconColor = '#ff0000';
    } else if (type === 'interaction') {
        headerBgColor = 'rgba(255, 215, 0, 0.1)';
        headerBorderColor = '#ffa500';
        buttonBgColor = '#ffa500';
        iconColor = '#ffa500';
    } else {
        headerBgColor = 'rgba(255, 92, 92, 0.1)';
        headerBorderColor = '#ff5c5c';
        buttonBgColor = '#ff5c5c';
        iconColor = '#ff5c5c';
    }
    
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
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    const modal = document.getElementById('customConfirmationModal');
    
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
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeConfirmationModal();
        }
    });
}

/**
 * Closes the confirmation modal
 */
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

/**
 * Toggles drug selection and handles allergies and interaction warnings
 * @param {HTMLElement} element - The drug element to toggle
 */
function toggleDrugSelection(element) {
    const isAllergen = element.getAttribute('data-is-allergen') === 'true';
    
    const interactionIndicator = element.querySelector('.interaction-indicator');
    const interactsWithCart = interactionIndicator !== null;
    
    const isCurrentlySelected = element.classList.contains('selected');
    
    const proceedWithSelection = function(confirmed = false) {
        element.classList.toggle('selected');
        
        const drugNameDiv = element.querySelector('div:first-child');
        
        if (element.classList.contains('selected')) {
            selectedDrugs.push(element);
            
            let selectionIndicator = element.querySelector('.selection-indicator');
            if (!selectionIndicator) {
                selectionIndicator = document.createElement('span');
                selectionIndicator.className = 'selection-indicator';
                selectionIndicator.textContent = '✓';
                selectionIndicator.title = 'Selected';
                selectionIndicator.style.color = '#8a2be2';
                
                drugNameDiv.appendChild(selectionIndicator);
            }
            
            if (confirmed) {
                showToast(`${element.getAttribute('data-name')} selected`, 'success');
            }
        } else {
            selectedDrugs = selectedDrugs.filter(drug => drug !== element);
            
            const selectionIndicator = element.querySelector('.selection-indicator');
            if (selectionIndicator) {
                selectionIndicator.remove();
            }
        }
        
        document.getElementById('addSelectedBtn').disabled = selectedDrugs.length === 0;
    };
    
    if (isAllergen && !isCurrentlySelected) {
        const drugName = element.getAttribute('data-name');
        showConfirmationModal(
            "Allergy Warning", 
            `Patient is allergic to ${drugName}. Are you sure you want to select this medication?`,
            () => proceedWithSelection(true),
            'allergen'
        );
        return;
    }
    
    if (interactsWithCart && !isCurrentlySelected) {
        const drugName = element.getAttribute('data-name');
        showConfirmationModal(
            "Interaction Warning", 
            `${drugName} interacts with a drug in your cart. Are you sure you want to select this medication?`,
            () => proceedWithSelection(true),
            'interaction'
        );
        return;
    }
    
    proceedWithSelection(false);
}

/**
 * Adds selected drugs to the cart
 */
function addSelectedDrugsToCart() {
    if (selectedDrugs.length === 0) {
        return;
    }
    
    showDrugDetailsModal();
}

/**
 * Shows modal for entering drug details before adding to cart
 */
function showDrugDetailsModal() {
    const modal = document.getElementById('drugDetailsModal');
    const modalDrugsList = document.getElementById('modalDrugsList');
    const modalDosage = document.getElementById('modalDosage');
    
    modalDrugsList.innerHTML = '';
    
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
    
    if (selectedDrugs.length === 1) {
        modalDosage.value = selectedDrugs[0].getAttribute('data-dosage') || '';
    } else {
        modalDosage.value = '';
    }
    
    modal.style.display = 'block';
    
    const span = document.getElementsByClassName('close')[0];
    
    span.onclick = function() {
        closeModal();
    };
    
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    };
}

/**
 * Closes the drug details modal
 */
function closeModal() {
    document.getElementById('drugDetailsModal').style.display = 'none';
}

/**
 * Validates and adds selected drugs to the cart after checking for interactions
 */
function confirmAddToCart() {
    const dosage = document.getElementById('modalDosage').value;
    const days = document.getElementById('modalDays').value;
    const qty = document.getElementById('modalQuantity').value;
    
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
    
    const drugIdsToAdd = selectedDrugs.map(drug => drug.getAttribute('data-id'));
    const existingDrugIds = getExistingDrugIdsInCart();
    
    console.log('Drug IDs to add:', drugIdsToAdd);
    console.log('Existing drug IDs in cart:', existingDrugIds);
    
    checkDrugInteractions([...drugIdsToAdd, ...existingDrugIds])
        .then(interactions => {
            console.log('Interaction check complete, found:', interactions);
            
            if (interactions && interactions.length > 0) {
                console.log('Showing drug interaction warning for interactions:', interactions);
                showDrugInteractionWarning(interactions, () => {
                    console.log('User confirmed to proceed despite interactions');
                    addSelectedDrugsToCartImpl(dosage, days, qty);
                });
            } else {
                console.log('No interactions found, proceeding with adding drugs');
                addSelectedDrugsToCartImpl(dosage, days, qty);
            }
        })
        .catch(error => {
            console.error('Error checking drug interactions:', error);
            addSelectedDrugsToCartImpl(dosage, days, qty);
        });
}

/**
 * Implementation function to add drugs to cart after interaction check
 * @param {string} dosage - Dosage instructions
 * @param {number} days - Number of days for prescription
 * @param {number} qty - Quantity of medication
 */
function addSelectedDrugsToCartImpl(dosage, days, qty) {
    selectedDrugs.forEach(drugElement => {
        const drugId = drugElement.getAttribute('data-id');
        const drugName = drugElement.getAttribute('data-name');
        
        addDrugToCart(drugId, drugName, dosage, days, qty);
        
        drugElement.remove();
    });
    
    selectedDrugs = [];
    
    document.getElementById('addSelectedBtn').disabled = true;
    
    closeModal();
}

/**
 * Gets all drug IDs currently in the cart
 * @returns {string[]} Array of drug IDs
 */
function getExistingDrugIdsInCart() {
    const cartItems = document.querySelectorAll('#drugCart [data-drug-id]');
    return Array.from(cartItems).map(item => item.getAttribute('data-drug-id'));
}

/** 
 * Check for interactions between drugs 
 * @param {string[]} drugIds - Array of drug IDs to check for interactions
 * @returns {Promise<Array>} Promise resolving to array of interaction objects
 */
async function checkDrugInteractions(drugIds) {
    if (!drugIds || drugIds.length < 2) {
        return [];
    }
    
    console.log('Checking drug interactions for:', drugIds);
    
    const interactions = [];
    const processedPairs = new Set();
    
    for (let i = 0; i < drugIds.length; i++) {
        const drugId = drugIds[i];
        
        try {
            const response = await fetch(`/api/drugs/${drugId}/interactions`);
            if (!response.ok) {
                console.warn(`Failed to fetch interactions for drug ${drugId}`);
                continue;
            }
            
            const interactionIds = await response.json();
            console.log(`Drug ${drugId} has interactions with:`, interactionIds);
            
            for (let j = 0; j < drugIds.length; j++) {
                if (i !== j) {
                    const otherDrugId = drugIds[j];
                    
                    const pairKey = [drugId, otherDrugId].sort().join('-');
                    
                    if (!processedPairs.has(pairKey) && interactionIds.includes(otherDrugId)) {
                        interactions.push({
                            drug1Id: drugId,
                            drug2Id: otherDrugId
                        });
                        
                        processedPairs.add(pairKey);
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching interactions for drug ${drugId}:`, error);
        }
    }
    
    console.log('Found interactions:', interactions);
    
    const enrichedInteractions = await enrichInteractionsWithDrugNames(interactions);
    
    return enrichedInteractions;
}

/**
 * Add drug names to the interaction data
 * @param {Array} interactions - Array of interaction objects
 * @returns {Promise<Array>} Promise resolving to array of enriched interaction objects
 */
async function enrichInteractionsWithDrugNames(interactions) {
    const drugNames = new Map();
    
    document.querySelectorAll('#drugList .drug-item').forEach(element => {
        const id = element.getAttribute('data-id');
        const name = element.getAttribute('data-name');
        if (id && name) {
            drugNames.set(id, name);
        }
    });
    
    document.querySelectorAll('#drugCart [data-drug-id]').forEach(element => {
        const id = element.getAttribute('data-drug-id');
        const nameElement = element.querySelector('strong');
        if (id && nameElement) {
            drugNames.set(id, nameElement.textContent);
        }
    });
    
    console.log('Drug names map:', Object.fromEntries([...drugNames.entries()]));
    
    const missingIds = interactions.flatMap(interaction => 
        [interaction.drug1Id, interaction.drug2Id].filter(id => !drugNames.has(id))
    );
    
    if (missingIds.length > 0) {
        const uniqueMissingIds = [...new Set(missingIds)];
        console.log('Fetching missing drug names for IDs:', uniqueMissingIds);
        
        try {
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
    
    return interactions.map(interaction => ({
        ...interaction,
        drug1Name: drugNames.get(interaction.drug1Id) || `Unknown Drug (${interaction.drug1Id})`,
        drug2Name: drugNames.get(interaction.drug2Id) || `Unknown Drug (${interaction.drug2Id})`
    }));
}

/**
 * Show a warning modal for drug interactions
 * @param {Array} interactions - Array of interaction objects
 * @param {Function} onConfirm - Callback function when user confirms
 */
function showDrugInteractionWarning(interactions, onConfirm) {
    console.log('Creating drug interaction warning modal for interactions:', interactions);
    
    const existingModal = document.getElementById('interactionWarningModal');
    if (existingModal) {
        existingModal.parentElement.remove();
    }
    
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
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
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
    
    closeModal();
}

/**
 * Close the interaction warning modal
 */
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

/**
 * Select template to filter drugs by
 * @param {HTMLElement} selectElement - The dropdown element
 */
function selectTemplateFromDropdown(selectElement) {
    const template = selectElement.value;
    selectedTemplate = template;
    console.log(`Template selected: "${template}"`);
    
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
    
    filterDrugsByTemplate(template);
    
    selectedDrugs = [];
    document.getElementById('addSelectedBtn').disabled = true;
    
    console.log(`Selected template: "${selectedTemplate}"`);
    console.log(`Selected drugs count: ${selectedDrugs.length}`);
}

// ... rest of the file ...