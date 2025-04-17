let prescriptionItemIndex = 0;
    let selectedTemplate = ''; // No default template selected - show all drugs by default
    let allDrugs = []; // Will store all drugs
    let selectedDrugs = []; // Will store selected drug elements
    
    function toggleDrugSelection(element) {
        // Check if this is an allergen
        const isAllergen = element.getAttribute('data-is-allergen') === 'true';
        
        // If it's an allergen, show a confirmation dialog
        if (isAllergen && !element.classList.contains('selected')) {
            const drugName = element.getAttribute('data-name');
            if (!confirm(`WARNING: Patient is allergic to ${drugName}. Are you sure you want to select this medication?`)) {
                return; // User cancelled the selection
            }
        }
        
        // Toggle selected class
        element.classList.toggle('selected');
        
        // Update selectedDrugs array
        if (element.classList.contains('selected')) {
            // Add to selected drugs
            selectedDrugs.push(element);
        } else {
            // Remove from selected drugs
            selectedDrugs = selectedDrugs.filter(drug => drug !== element);
        }
        
        // Update Add Selected button state
        document.getElementById('addSelectedBtn').disabled = selectedDrugs.length === 0;
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
        
        // Check for drug interactions
        checkDrugInteractions([...drugIdsToAdd, ...existingDrugIds])
            .then(interactions => {
                if (interactions.length > 0) {
                    // Show warning if interactions found
                    showDrugInteractionWarning(interactions, () => {
                        // User confirmed despite interactions, proceed with adding drugs
                        addSelectedDrugsToCartImpl(dosage, days, qty);
                    });
                } else {
                    // No interactions found, proceed with adding drugs
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
        
        // Create a map to store all interactions
        const interactions = [];
        
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
                    if (i !== j && interactionIds.includes(drugIds[j])) {
                        // Found an interaction between drugIds[i] and drugIds[j]
                        interactions.push({
                            drug1Id: drugId,
                            drug2Id: drugIds[j]
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching interactions for drug ${drugId}:`, error);
            }
        }
        
        // Enrich the interactions with drug names
        const enrichedInteractions = await enrichInteractionsWithDrugNames(interactions);
        
        return enrichedInteractions;
    }
    
    // Add drug names to the interaction data
    async function enrichInteractionsWithDrugNames(interactions) {
        const drugNames = new Map();
        
        // Get drug elements from both the list and cart to extract names
        const drugElements = [
            ...document.querySelectorAll('#drugList .drug-item'),
            ...document.querySelectorAll('#drugCart [data-drug-id]')
        ];
        
        // Create a map of drug IDs to names
        drugElements.forEach(element => {
            const id = element.getAttribute('data-drug-id') || element.getAttribute('data-id');
            const name = element.getAttribute('data-name') || 
                            element.querySelector('strong')?.textContent || 
                            'Unknown Drug';
            if (id) {
                drugNames.set(id, name);
            }
        });
        
        // Enrich interactions with drug names
        return interactions.map(interaction => ({
            ...interaction,
            drug1Name: drugNames.get(interaction.drug1Id) || 'Unknown Drug',
            drug2Name: drugNames.get(interaction.drug2Id) || 'Unknown Drug'
        }));
    }
    
    // Show a warning modal for drug interactions
    function showDrugInteractionWarning(interactions, onConfirm) {
        // Create a modal for the warning
        const modalHtml = `
            <div id="interactionWarningModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header" style="background-color: rgba(255, 92, 92, 0.1); border-bottom: 2px solid #ff5c5c;">
                        <h3 style="color: #ff5c5c;">⚠️ Drug Interaction Warning</h3>
                        <span class="close" onclick="closeInteractionWarningModal()">&times;</span>
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
                        <button type="button" class="btn-secondary" onclick="closeInteractionWarningModal()">
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
        
        // Add event listener to the confirm button
        document.getElementById('confirmDespiteInteractions').addEventListener('click', function() {
            closeInteractionWarningModal();
            if (onConfirm) onConfirm();
        });
        
        // Close drug details modal if it's open
        closeModal();
    }
    
    // Close the interaction warning modal
    function closeInteractionWarningModal() {
        const modal = document.getElementById('interactionWarningModal');
        if (modal) {
            modal.parentElement.remove();
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
        }
    }
    
    // Load initial template on page load
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM content loaded, initializing drug list');
        
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
            checkoutButton.disabled = true;
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
        
        // Sort data for the table (newest first)
        const tableData = [...filteredData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Populate table with newest records first
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
}