/** Selected drug elements storage */
let selectedDrugs = [];
/** Counter for interaction items */
let interactionIndex = 0;
/** Storage for the main drug ID */
let mainDrugId = '';
/** Storage for all drugs information */
let allDrugs = [];
/** To track the latest fetch request */
let currentRequestId = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Drug interaction cart UI script loaded");
    
    fetchAllDrugs();
    
    sortMainDrugDropdown();

    document.getElementById('mainDrug').addEventListener('change', function() {
        mainDrugId = this.value;
        console.log("Main drug changed to: " + (mainDrugId ? mainDrugId : "none"));
        updateDrugsList();
        clearInteractionCart();
    });

    const closeButtons = document.getElementsByClassName('close');
    for (let i = 0; i < closeButtons.length; i++) {
        closeButtons[i].onclick = closeModal;
    }

    window.onclick = function(event) {
        const modal = document.getElementById('interactionDetailsModal');
        if (event.target == modal) {
            closeModal();
        }
    };
});

/**
 * Sorts the main drug dropdown alphabetically by name
 * Preserves the default option as the first option
 */
function sortMainDrugDropdown() {
    const select = document.getElementById('mainDrug');
    const defaultOption = select.options[0];
    
    const options = Array.from(select.options).slice(1);
    
    options.sort((a, b) => a.text.localeCompare(b.text));
    
    select.innerHTML = '';
    
    select.appendChild(defaultOption);
    
    options.forEach(option => select.appendChild(option));
}

/**
 * Fetches all drugs from the page's select element
 * Populates the allDrugs global array for later use
 */
function fetchAllDrugs() {
    allDrugs = [];
    const drugSelect = document.getElementById('mainDrug');
    for (let i = 0; i < drugSelect.options.length; i++) {
        if (drugSelect.options[i].value) {
            allDrugs.push({
                id: drugSelect.options[i].value,
                name: drugSelect.options[i].text
            });
        }
    }
    console.log("Loaded " + allDrugs.length + " drugs");
}

/**
 * Updates the drugs list based on the selected main drug
 * Filters out drugs already in the interaction cart
 * Shows appropriate UI states during loading 
 */
function updateDrugsList() {
    const drugsListElement = document.getElementById('drugsList');
    drugsListElement.innerHTML = '';
    selectedDrugs = [];
    document.getElementById('drugSearchInput').value = '';
    
    const requestId = ++currentRequestId;

    if (!mainDrugId) {
        drugsListElement.innerHTML = `
            <div class="drug-item" style="font-style: italic; color: var(--secondary-text);">
                Please select a main drug first
            </div>`;
        document.getElementById('addSelectedBtn').disabled = true;
        return;
    }

    console.log("Selected main drug ID: " + mainDrugId);
    
    drugsListElement.innerHTML = `
        <div class="drug-item" style="font-style: italic; color: var(--secondary-text);">
            Loading available drugs...
        </div>`;
    
    fetch(`/api/drugs/${mainDrugId}/available-for-interaction`)
        .then(response => response.json())
        .then(availableDrugs => {
            if (requestId !== currentRequestId) {
                console.log("Ignoring stale request results for ID: " + requestId);
                return;
            }
            
            if (!mainDrugId) {
                drugsListElement.innerHTML = `
                    <div class="drug-item" style="font-style: italic; color: var(--secondary-text);">
                        Please select a main drug first
                    </div>`;
                document.getElementById('addSelectedBtn').disabled = true;
                return;
            }
            
            drugsListElement.innerHTML = '';
            
            const uniqueDrugIds = new Set();
            const filteredDrugs = availableDrugs
                .filter(drug => !isInInteractionCart(drug.id))
                .filter(drug => {
                    if (uniqueDrugIds.has(drug.id)) {
                        return false;
                    }
                    uniqueDrugIds.add(drug.id);
                    return true;
                });
            
            if (filteredDrugs.length === 0) {
                drugsListElement.innerHTML = `
                    <div class="drug-item" style="font-style: italic; color: var(--secondary-text);">
                        No other drugs available
                    </div>`;
                document.getElementById('addSelectedBtn').disabled = true;
                return;
            }

            filteredDrugs.sort((a, b) => a.name.localeCompare(b.name));

            filteredDrugs.forEach(drug => {
                const drugItem = document.createElement('div');
                drugItem.className = 'drug-item';
                drugItem.setAttribute('data-id', drug.id);
                drugItem.setAttribute('data-name', drug.name);
                drugItem.innerHTML = `<div class="drug-name">${drug.name}</div>`;
                
                drugItem.addEventListener('click', function() {
                    toggleDrugSelection(this);
                });
                
                drugsListElement.appendChild(drugItem);
            });

            console.log("Added " + filteredDrugs.length + " drugs to the list");
            document.getElementById('addSelectedBtn').disabled = true;
        })
        .catch(error => {
            if (requestId !== currentRequestId) {
                return;
            }
            
            console.error("Error fetching available drugs:", error);
            drugsListElement.innerHTML = `
                <div class="drug-item" style="font-style: italic; color: var(--secondary-text);">
                    Error loading drugs. Please try again.
                </div>`;
            document.getElementById('addSelectedBtn').disabled = true;
        });
}

/**
 * Checks if a drug is already in the interaction cart
 * @param {string} drugId - The ID of the drug to check
 * @returns {boolean} True if the drug is already in the cart, false otherwise
 */
function isInInteractionCart(drugId) {
    const cartItems = document.querySelectorAll('#drugCart [data-drug-id]');
    for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].getAttribute('data-drug-id') === drugId) {
            return true;
        }
    }
    return false;
}

/**
 * Toggles the selection state of a drug element
 * Updates the selectedDrugs array and the Add Selected button state
 * @param {HTMLElement} element - The drug element to toggle selection for
 */
function toggleDrugSelection(element) {
    element.classList.toggle('selected');
    
    if (element.classList.contains('selected')) {
        selectedDrugs.push(element);
    } else {
        selectedDrugs = selectedDrugs.filter(drug => drug !== element);
    }
    
    document.getElementById('addSelectedBtn').disabled = selectedDrugs.length === 0;
    console.log("Selected drugs: " + selectedDrugs.length);
}

/**
 * Adds selected drugs to the interaction cart
 * Opens the interaction details modal if drugs are selected
 */
function addSelectedDrugsToCart() {
    if (selectedDrugs.length === 0) {
        return;
    }
    
    showInteractionDetailsModal();
}

/**
 * Shows the modal with details of selected drugs
 * Creates a list of selected drugs in the modal
 */
function showInteractionDetailsModal() {
    const modal = document.getElementById('interactionDetailsModal');
    const modalDrugsList = document.getElementById('modalDrugsList');
    
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
    
    modal.style.display = 'block';
    console.log("Opened interaction details modal");
}

/**
 * Closes the interaction details modal
 */
function closeModal() {
    document.getElementById('interactionDetailsModal').style.display = 'none';
    console.log("Closed interaction details modal");
}

/**
 * Confirms the addition of selected drugs to the cart
 * Adds interactions to the cart and removes them from the drug list
 */
function confirmAddToCart() {
    const mainDrugName = document.getElementById('mainDrug').options[
        document.getElementById('mainDrug').selectedIndex
    ].text;
    
    selectedDrugs.forEach(drugElement => {
        const drugId = drugElement.getAttribute('data-id');
        const drugName = drugElement.getAttribute('data-name');
        
        addInteractionToCart(drugId, drugName);
        
        drugElement.remove();
    });
    
    selectedDrugs = [];
    
    document.getElementById('addSelectedBtn').disabled = true;
    
    document.getElementById('saveInteractionsBtn').disabled = false;
    
    closeModal();
    console.log("Added interactions to cart");
}

/**
 * Adds a drug interaction to the cart
 * Creates a cart item with remove button and adds hidden form input
 * @param {string} drugId - The ID of the drug to add
 * @param {string} drugName - The name of the drug to add
 */
function addInteractionToCart(drugId, drugName) {
    const cartElement = document.getElementById('drugCart');
    
    if (cartElement.querySelector('div[style*="font-style: italic"]')) {
        cartElement.innerHTML = '';
    }
    
    const itemIndex = interactionIndex++;
    
    const cartItem = document.createElement('div');
    cartItem.style.padding = '10px';
    cartItem.style.marginBottom = '10px';
    cartItem.style.borderBottom = '1px solid var(--border-color)';
    cartItem.setAttribute('data-drug-id', drugId);
    
    cartItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div>
                <strong>${drugName}</strong>
            </div>
            <div>
                <button type="button" onclick="removeFromCart(this, ${itemIndex})" 
                        style="background: none; border: none; color: #ff5c5c; cursor: pointer;">
                    Remove
                </button>
            </div>
        </div>
    `;
    
    cartElement.appendChild(cartItem);
    
    addHiddenInput(drugId);
    
    removeFromDrugsList(drugId);
}

/**
 * Adds a hidden input field to the form for a drug interaction
 * @param {string} drugId - The ID of the drug to add as a form input
 */
function addHiddenInput(drugId) {
    const container = document.getElementById('formInputsContainer');
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'interactingDrugs[]';
    input.value = drugId;
    input.setAttribute('data-drug-id', drugId);
    container.appendChild(input);
}

/**
 * Removes a drug interaction from the cart
 * @param {HTMLElement} buttonElement - The remove button element
 * @param {number} itemIndex - The index of the interaction item
 */
function removeFromCart(buttonElement, itemIndex) {
    const cartItem = buttonElement.closest('[data-drug-id]');
    if (cartItem) {
        const drugId = cartItem.getAttribute('data-drug-id');
        const drugName = cartItem.querySelector('strong').textContent;
        
        cartItem.remove();
        console.log("Removed interaction from cart, index: " + itemIndex);
        
        removeHiddenInput(drugId);
        
        addToDrugsList(drugId, drugName);
        
        const cartElement = document.getElementById('drugCart');
        if (cartElement.children.length === 0) {
            cartElement.innerHTML = `
                <div style="font-style: italic; color: var(--secondary-text); text-align: center; padding: 20px;">
                    No interactions added yet
                </div>`;
            
            document.getElementById('saveInteractionsBtn').disabled = true;
        }
    }
}

/**
 * Removes hidden inputs for a specific drug from the form
 * @param {string} drugId - The ID of the drug to remove inputs for
 */
function removeHiddenInput(drugId) {
    const inputs = document.querySelectorAll(`input[name="interactingDrugs[]"][data-drug-id="${drugId}"]`);
    inputs.forEach(input => input.remove());
}

/**
 * Clears all interactions from the cart
 * Returns the drugs to the available drugs list
 */
function clearInteractionCart() {
    const cartElement = document.getElementById('drugCart');
    
    const cartItems = document.querySelectorAll('#drugCart [data-drug-id]');
    const drugsToReturn = [];
    
    cartItems.forEach(item => {
        drugsToReturn.push({
            id: item.getAttribute('data-drug-id'),
            name: item.querySelector('strong').textContent
        });
    });
    
    cartElement.innerHTML = `
        <div style="font-style: italic; color: var(--secondary-text); text-align: center; padding: 20px;">
            No interactions added yet
        </div>`;
    
    interactionIndex = 0;
    
    document.getElementById('formInputsContainer').innerHTML = '';
    
    document.getElementById('saveInteractionsBtn').disabled = true;
    
    updateDrugsList();
    
    console.log("Cleared interaction cart");
}

/**
 * Submits the drug interactions form
 * Validates the form and sets the main drug ID
 */
function submitInteractions() {
    if (!mainDrugId) {
        alert('Please select a main drug');
        return;
    }
    
    const cartElement = document.getElementById('drugCart');
    if (cartElement.querySelector('div[style*="font-style: italic"]')) {
        alert('Please add some drug interactions first');
        return;
    }
    
    document.getElementById('mainDrug').value = mainDrugId;
    
    const interactingDrugs = document.querySelectorAll('input[name="interactingDrugs[]"]');
    console.log("Submitting interactions - Main drug: " + mainDrugId);
    console.log("Total interacting drugs: " + interactingDrugs.length);
    interactingDrugs.forEach((input, index) => {
        console.log("Interaction " + index + ": " + input.value);
    });
    
    document.getElementById('interactionForm').submit();
    console.log("Submitting interactions form");
}

function removeFromDrugsList(drugId) {
    const drugListItems = document.querySelectorAll('#drugsList .drug-item');
    drugListItems.forEach(item => {
        if (item.getAttribute('data-id') === drugId) {
            item.remove();
        }
    });
}

function addToDrugsList(drugId, drugName) {
    if (document.querySelector(`#drugsList .drug-item[data-id="${drugId}"]`)) {
        return;
    }
    
    const drugsListElement = document.getElementById('drugsList');
    
    const emptyMessage = drugsListElement.querySelector('div[style*="font-style: italic"]');
    if (emptyMessage) {
        drugsListElement.innerHTML = '';
    }
    
    const drugItem = document.createElement('div');
    drugItem.className = 'drug-item';
    drugItem.setAttribute('data-id', drugId);
    drugItem.setAttribute('data-name', drugName);
    drugItem.innerHTML = `<div class="drug-name">${drugName}</div>`;
    
    drugItem.addEventListener('click', function() {
        toggleDrugSelection(this);
    });
    
    drugsListElement.appendChild(drugItem);
    
    sortDrugsList();
}

function filterDrugsList() {
    const searchInput = document.getElementById('drugSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const drugItems = document.querySelectorAll('#drugsList .drug-item');
    
    drugItems.forEach(item => {
        if (item.style.fontStyle === 'italic') {
            return;
        }
        
        const drugName = item.getAttribute('data-name').toLowerCase();
        if (drugName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function sortDrugsList() {
    const drugsListElement = document.getElementById('drugsList');
    const drugItems = Array.from(drugsListElement.querySelectorAll('.drug-item'));
    const searchTerm = document.getElementById('drugSearchInput').value.toLowerCase();
    
    const messageItem = drugItems.find(item => item.style.fontStyle === 'italic');
    const drugItemsToSort = drugItems.filter(item => item.style.fontStyle !== 'italic');
    
    drugItemsToSort.sort((a, b) => {
        const nameA = a.getAttribute('data-name').toLowerCase();
        const nameB = b.getAttribute('data-name').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    drugsListElement.innerHTML = '';
    
    if (messageItem) {
        drugsListElement.appendChild(messageItem);
    }
    
    drugItemsToSort.forEach(item => {
        drugsListElement.appendChild(item);
        
        if (searchTerm) {
            const drugName = item.getAttribute('data-name').toLowerCase();
            if (!drugName.includes(searchTerm)) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        }
    });
}