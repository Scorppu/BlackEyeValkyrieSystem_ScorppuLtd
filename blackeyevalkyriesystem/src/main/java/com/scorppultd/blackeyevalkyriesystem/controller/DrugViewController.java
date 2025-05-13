package com.scorppultd.blackeyevalkyriesystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import org.springframework.http.HttpStatus;

/**
 * Controller class for drug management web interface.
 * Provides endpoints for viewing, adding, editing, and deleting drugs,
 * as well as managing drug interactions. Restricted to users with ADMIN role.
 */
@Controller
@RequestMapping("/drugs")
@PreAuthorize("hasRole('ADMIN')")
public class DrugViewController {

    private final DrugService drugService;
    private static final Logger logger = LoggerFactory.getLogger(DrugViewController.class);
    
    /**
     * Constructs a DrugViewController with the required service dependency.
     * 
     * @param drugService The service that handles drug-related business logic
     */
    @Autowired
    public DrugViewController(DrugService drugService) {
        this.drugService = drugService;
    }
    
    /**
     * Redirects to the drug list page.
     * 
     * @return Redirect to the drug list view
     */
    @GetMapping
    public String showDrugsPage() {
        return "redirect:/drugs/list";
    }
    
    /**
     * Displays a paginated list of drugs with sorting options.
     * 
     * @param model Model object for passing data to the view
     * @param page Current page number (defaults to 1)
     * @param rowsPerPage Number of drugs to display per page (defaults to 10)
     * @param sortBy Field to sort by (defaults to "name")
     * @param direction Sort direction, "asc" or "desc" (defaults to "asc")
     * @return The drug-list view
     */
    @GetMapping("/list")
    public String showDrugList(Model model,
                             @RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "10") int rowsPerPage,
                             @RequestParam(defaultValue = "name") String sortBy,
                             @RequestParam(defaultValue = "asc") String direction) {
        
        int totalDrugs = drugService.getTotalDrugsCount();
        int offset = (page - 1) * rowsPerPage;
        
        List<Drug> drugs = drugService.getAllDrugsPaginated(offset, rowsPerPage, sortBy, direction);
        
        model.addAttribute("drugs", drugs);
        model.addAttribute("totalDrugs", totalDrugs);
        model.addAttribute("currentPage", page);
        model.addAttribute("rowsPerPage", rowsPerPage);
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentDirection", direction);
        
        return "drug-list";
    }
    
    /**
     * Displays the form for adding a new drug.
     * 
     * @param model Model object for passing data to the view
     * @return The drug-add view
     */
    @GetMapping("/add")
    public String showAddDrugForm(Model model) {
        model.addAttribute("drug", new Drug());
        return "drug-add";
    }
    
    /**
     * Processes the form submission for adding a new drug.
     * 
     * @param drug The drug object populated from form data
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the drug list view
     */
    @PostMapping("/add")
    public String addDrug(@ModelAttribute Drug drug, 
                        RedirectAttributes redirectAttributes) {
        // First save the drug to get an ID
        drug.setInteractingDrugIds(null); // Explicitly set interactions to null
        Drug savedDrug = drugService.createDrug(drug);
        
        redirectAttributes.addFlashAttribute("success", "Drug added successfully");
        
        return "redirect:/drugs/list";
    }
    
    /**
     * Displays the form for importing drugs from CSV files.
     * 
     * @return The drug-import view
     */
    @GetMapping("/import")
    public String showImportForm() {
        return "drug-import";
    }
    
    /**
     * Processes CSV file uploads to import drugs.
     * Handles multiple files and reports success/failures.
     * 
     * @param files Array of uploaded MultipartFile objects
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the drug list view
     */
    @PostMapping("/import")
    public String importDrugsFromCsv(@RequestParam("file") MultipartFile[] files, 
                                     RedirectAttributes redirectAttributes) {
        if (files.length == 0 || files[0].isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Please select at least one CSV file to upload");
            return "redirect:/drugs/import";
        }

        int totalImported = 0;
        StringBuilder errors = new StringBuilder();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    List<Drug> importedDrugs = drugService.importDrugsFromCsv(file.getInputStream());
                    totalImported += importedDrugs.size();
                } catch (IOException e) {
                    errors.append("Failed to process file '")
                          .append(file.getOriginalFilename())
                          .append("': ")
                          .append(e.getMessage())
                          .append(". ");
                } catch (RuntimeException e) {
                    // Handle the exception for skipped drugs that already exist
                    String message = e.getMessage();
                    if (message.contains("Skipped")) {
                        // Add as a warning instead of an error
                        redirectAttributes.addFlashAttribute("warning", message);
                    } else {
                        errors.append("Error processing file '")
                              .append(file.getOriginalFilename())
                              .append("': ")
                              .append(e.getMessage())
                              .append(". ");
                    }
                }
            }
        }

        if (errors.length() > 0) {
            redirectAttributes.addFlashAttribute("error", errors.toString());
        }
        
        if (totalImported > 0) {
            redirectAttributes.addFlashAttribute("success", 
                totalImported + " drugs successfully imported");
        }
        
        return "redirect:/drugs/list";
    }
    
    /**
     * Generates and provides a CSV template for drug imports.
     * 
     * @return ResponseEntity containing the CSV file as a byte array
     */
    @GetMapping("/template/download")
    public ResponseEntity<byte[]> downloadCsvTemplate() {
        byte[] csvContent = drugService.generateCsvTemplate();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=drugs_template.csv")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(csvContent);
    }
    
    /**
     * Displays the form for editing an existing drug.
     * Loads the drug information and potential interactions.
     * 
     * @param id The ID of the drug to edit
     * @param model Model object for passing data to the view
     * @param redirectAttributes Used for flash attributes in redirect
     * @return The drug-edit view or redirect to list if drug not found
     */
    @GetMapping("/edit/{id}")
    public String showEditDrugForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        try {
            drugService.getDrugById(id).ifPresentOrElse(
                drug -> {
                    model.addAttribute("drug", drug);
                    
                    // Get all other drugs for potential interactions
                    List<Drug> allDrugs = drugService.getAllDrugs();
                    allDrugs.removeIf(d -> d.getId().equals(id)); // Remove current drug
                    model.addAttribute("allDrugs", allDrugs);
                    
                    // Don't load interactions here - will be loaded via AJAX
                    // Just add the count for UI display
                    int interactionCount = drug.getInteractingDrugIds() != null ? drug.getInteractingDrugIds().size() : 0;
                    model.addAttribute("interactionCount", interactionCount);
                    
                    model.addAttribute("severityLevels", Arrays.asList(1, 2, 3, 4, 5));
                },
                () -> {
                    redirectAttributes.addFlashAttribute("error", "Drug not found");
                    model.addAttribute("redirect", "/drugs/list");
                }
            );
            return model.containsAttribute("redirect") ? "redirect:" + model.getAttribute("redirect") : "drug-edit";
        } catch (Exception e) {
            logger.error("Error loading drug edit form for ID {}: {}", id, e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Error loading drug: " + e.getMessage());
            return "redirect:/drugs/list";
        }
    }
    
    /**
     * API endpoint to get interactions for a drug.
     * Used for AJAX loading in the UI.
     * 
     * @param id The ID of the drug to get interactions for
     * @return ResponseEntity with interaction IDs or error message
     */
    @GetMapping("/api/drugs/{id}/interactions")
    @ResponseBody
    public ResponseEntity<?> getDrugInteractions(@PathVariable String id) {
        try {
            List<String> interactionIds = drugService.getAllInteractionsForDrug(id);
            logger.info("Returning {} interactions for drug ID {}", interactionIds.size(), id);
            return ResponseEntity.ok(interactionIds);
        } catch (Exception e) {
            logger.error("Error fetching drug interactions for ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to load interactions: " + e.getMessage()));
        }
    }
    
    /**
     * Processes the form submission for updating an existing drug.
     * Also handles adding new interactions for the drug in batches.
     * 
     * @param id The ID of the drug to update
     * @param drug The drug object populated from form data
     * @param interactingDrugs List of IDs of drugs to add as interactions
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the drug list view
     */
    @PostMapping("/edit/{id}")
    public String updateDrug(@PathVariable String id, 
                            @ModelAttribute Drug drug, 
                            @RequestParam(value = "interactingDrugs", required = false) List<String> interactingDrugs,
                            RedirectAttributes redirectAttributes) {
        try {
            drug.setId(id); // Ensure ID is set
            drugService.updateDrug(drug);
            
            // Handle interactions if any were specified
            if (interactingDrugs != null && !interactingDrugs.isEmpty()) {
                
                // Limit the number of interactions processed at once
                final int BATCH_SIZE = 10;
                int totalInteractions = interactingDrugs.size();
                int successCount = 0;
                StringBuilder errors = new StringBuilder();
                
                // Process interactions in batches to prevent response timeouts
                for (int batchStart = 0; batchStart < totalInteractions; batchStart += BATCH_SIZE) {
                    int batchEnd = Math.min(batchStart + BATCH_SIZE, totalInteractions);
                    List<String> batch = interactingDrugs.subList(batchStart, batchEnd);
                    
                    for (String interactingDrugId : batch) {
                        if (interactingDrugId == null || interactingDrugId.isEmpty()) {
                            continue;  // Skip empty selections
                        }
                        
                        try {
                            // Add the interaction to the drug
                            drugService.addInteractionToDrug(id, interactingDrugId);
                            
                            // Create reciprocal interaction (B → A)
                            drugService.addInteractionToDrug(interactingDrugId, id);
                            
                            successCount++;
                        } catch (Exception e) {
                            errors.append("Error processing interaction: ").append(e.getMessage()).append(". ");
                            // Log the error for debugging
                            logger.error("Error adding interaction between {} and {}: {}", id, interactingDrugId, e.getMessage());
                        }
                    }
                }
                
                if (errors.length() > 0) {
                    redirectAttributes.addFlashAttribute("warning", 
                        "Drug updated, but some interactions could not be created: " + errors.toString());
                } else if (successCount > 0) {
                    redirectAttributes.addFlashAttribute("success", 
                        "Drug updated successfully with " + successCount + " interaction(s) added/updated");
                } else {
                    redirectAttributes.addFlashAttribute("success", "Drug updated successfully");
                }
            } else {
                redirectAttributes.addFlashAttribute("success", "Drug updated successfully");
            }
        } catch (Exception e) {
            // Log the error
            logger.error("Error updating drug {}: {}", id, e.getMessage());
            redirectAttributes.addFlashAttribute("error", "Error updating drug: " + e.getMessage());
        }
        
        return "redirect:/drugs/list";
    }
    
    /**
     * Handles the deletion of a drug.
     * 
     * @param id The ID of the drug to delete
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the drug list view
     */
    @GetMapping("/delete/{id}")
    public String deleteDrug(@PathVariable String id, RedirectAttributes redirectAttributes) {
        drugService.deleteDrug(id);
        redirectAttributes.addFlashAttribute("success", "Drug deleted successfully");
        return "redirect:/drugs/list";
    }
    
    /**
     * Displays a list of all drug interactions in the system.
     * Can filter to show interactions for a specific drug if drugId is provided.
     * 
     * @param model Model object for passing data to the view
     * @param drugId Optional ID to filter interactions for a specific drug
     * @return The drug interaction list view
     */
    @GetMapping("/interactions")
    public String listInteractions(Model model, @RequestParam(required = false) String drugId) {
        List<Drug> allDrugs = drugService.getAllDrugs();
        model.addAttribute("drugs", allDrugs);
        
        // Create a map to group interactions by primary drug
        Map<String, List<String>> drugInteractionsMap = new HashMap<>();
        
        // If a specific drug ID is provided, only show interactions for that drug
        if (drugId != null && !drugId.isEmpty()) {
            model.addAttribute("selectedDrugId", drugId);
            
            // Try to get the drug to display its name
            drugService.getDrugById(drugId).ifPresent(drug -> {
                model.addAttribute("selectedDrug", drug);
            });
            
            // Add only the interactions for the selected drug
            drugService.getDrugById(drugId).ifPresent(drug -> {
                if (drug.getInteractingDrugIds() != null && !drug.getInteractingDrugIds().isEmpty()) {
                    drugInteractionsMap.put(drug.getId(), new ArrayList<>(drug.getInteractingDrugIds()));
                }
            });
        } else {
            // Add all interactions if no drug ID was provided
            for (Drug drug : allDrugs) {
                if (drug.getInteractingDrugIds() != null && !drug.getInteractingDrugIds().isEmpty()) {
                    // For each drug with interactions, add its ID and the list of interacting drugs
                    drugInteractionsMap.put(drug.getId(), new ArrayList<>(drug.getInteractingDrugIds()));
                }
            }
        }
        
        model.addAttribute("drugInteractionsMap", drugInteractionsMap);
        return "drug-interaction-list";
    }
    
    /**
     * Displays the form for adding a new drug interaction.
     * 
     * @param model Model object for passing data to the view
     * @return The drug interaction form view
     */
    @GetMapping("/interactions/add")
    public String showAddInteractionForm(Model model) {   
        // Add required data to the model
        List<Drug> drugs = drugService.getAllDrugs();
        model.addAttribute("drugs", drugs);
        
        // Return the updated template
        return "drug-interaction-new";
    }
    
    /**
     * Processes the form submission for adding a new interaction between two drugs.
     * Creates bidirectional interactions (A interacts with B and B interacts with A).
     * 
     * @param drugAId The ID of the first drug
     * @param drugBId The ID of the second drug
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the interactions list view
     */
    @PostMapping("/interactions/add")
    public String addInteraction(
            @RequestParam("drugA") String drugAId,
            @RequestParam("drugB") String drugBId,
            RedirectAttributes redirectAttributes) {
        
        try {
            // Create interactions for both drugs (bidirectional)
            // First, add interaction from drug A to drug B
            drugService.addInteractionToDrug(drugAId, drugBId);
            
            // Then, add interaction from drug B to drug A
            drugService.addInteractionToDrug(drugBId, drugAId);
            
            redirectAttributes.addFlashAttribute("success", "Drug interaction added successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error adding interaction: " + e.getMessage());
        }
        
        return "redirect:/drugs/interactions";
    }
    
    /**
     * Processes the form submission for adding multiple interactions in a batch.
     * Creates bidirectional interactions between the main drug and each interacting drug.
     * 
     * @param mainDrugId The ID of the main drug
     * @param interactingDrugs List of IDs of drugs to add as interactions
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the interactions list view
     */
    @PostMapping("/interactions/batch-add")
    public String batchAddInteractions(
            @RequestParam("mainDrug") String mainDrugId,
            @RequestParam(value = "interactingDrugs[]", required = false) List<String> interactingDrugs,
            RedirectAttributes redirectAttributes) {
        
        if (interactingDrugs == null || interactingDrugs.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "No interactions were specified");
            return "redirect:/drugs/interactions";
        }
        
        int successCount = 0;
        StringBuilder errors = new StringBuilder();
        
        for (int i = 0; i < interactingDrugs.size(); i++) {
            String interactingDrugId = interactingDrugs.get(i);

            if (interactingDrugId == null || interactingDrugId.isEmpty()) {
                continue;  // Skip empty selections
            }
            
            try {
                // Create the interaction from main drug to interacting drug
                drugService.addInteractionToDrug(mainDrugId, interactingDrugId);
                
                // Create reciprocal interaction (interacting drug to main drug)
                drugService.addInteractionToDrug(interactingDrugId, mainDrugId);
                
                successCount++;
            } catch (Exception e) {
                errors.append("Error processing interaction with drug ID ").append(interactingDrugId)
                      .append(": ").append(e.getMessage()).append(". ");
            }
        }
        
        if (errors.length() > 0) {
            redirectAttributes.addFlashAttribute("warning", 
                "Added " + successCount + " interactions successfully, but some interactions could not be created: " + errors.toString());
        } else if (successCount > 0) {
            redirectAttributes.addFlashAttribute("success", 
                "Added " + successCount + " interactions successfully");
        } else {
            redirectAttributes.addFlashAttribute("error", "No interactions were created");
        }
        
        return "redirect:/drugs/interactions";
    }
    
    /**
     * Deletes an interaction between two drugs.
     * Removes the bidirectional relationship (A no longer interacts with B and B no longer interacts with A).
     * 
     * @param drugId The ID of the first drug
     * @param interactingDrugId The ID of the second drug
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the interactions list view
     */
    @GetMapping("/interactions/delete")
    public String deleteInteraction(
            @RequestParam("drugId") String drugId,
            @RequestParam("interactingDrugId") String interactingDrugId,
            RedirectAttributes redirectAttributes) {
        
        try {
            // Remove interaction from both drugs (bidirectional)
            drugService.removeInteractionFromDrug(drugId, interactingDrugId);
            drugService.removeInteractionFromDrug(interactingDrugId, drugId);
            
            redirectAttributes.addFlashAttribute("success", "Drug interaction deleted successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error deleting interaction: " + e.getMessage());
        }
        
        return "redirect:/drugs/interactions";
    }
    
    /**
     * Displays a detailed view of interactions for a specific drug.
     * 
     * @param drugId The ID of the drug to view interactions for
     * @param model Model object for passing data to the view
     * @return The drug-specific interactions view
     */
    @GetMapping("/interactions/drug/{drugId}")
    public String viewDrugInteractions(@PathVariable String drugId, Model model) {
        List<Drug> allDrugs = drugService.getAllDrugs();
        model.addAttribute("allDrugs", allDrugs);
        
        // Create a map of drug IDs to drugs for easier lookup
        Map<String, Drug> drugMap = new HashMap<>();
        for (Drug drug : allDrugs) {
            drugMap.put(drug.getId(), drug);
        }
        
        drugService.getDrugById(drugId).ifPresentOrElse(
            drug -> {
                model.addAttribute("drug", drug);

                // Create enhanced interaction view objects
                List<Map<String, Object>> enhancedInteractions = new ArrayList<>();
                if (drug.getInteractingDrugIds() != null) {
                    // Process each interaction
                    for (String interactingDrugId : drug.getInteractingDrugIds()) {
                        Drug interactingDrug = drugMap.get(interactingDrugId);
                        
                        Map<String, Object> interactionData = new HashMap<>();
                        interactionData.put("sourceDrugId", drug.getId());
                        interactionData.put("targetDrugId", interactingDrugId);
                        interactionData.put("targetDrugName", 
                            interactingDrug != null ? interactingDrug.getName() : "Unknown Drug (" + interactingDrugId + ")");
                        enhancedInteractions.add(interactionData);
                    }
                }
                
                model.addAttribute("interactions", enhancedInteractions);
            },
            () -> {
                model.addAttribute("error", "Drug not found");
            }
        );
        
        return "drug-interactions-for-drug";
    }
    
    /**
     * Displays the form for importing drug interactions from CSV.
     * 
     * @param model Model object for passing data to the view
     * @return The drug interaction import view
     */
    @GetMapping("/interactions/import")
    public String showImportInteractionsForm(Model model) {
        List<Drug> drugs = drugService.getAllDrugs();
        model.addAttribute("drugs", drugs);
        return "drug-interaction-import";
    }
    
    /**
     * Displays an interactive visualization map of drug interactions.
     * 
     * @param model Model object for passing data to the view
     * @return The drug interaction map view
     */
    @GetMapping("/interactions/map") 
    public String showInteractionMap(Model model) {
        List<Drug> drugs = drugService.getAllDrugs();
        model.addAttribute("drugs", drugs);
        return "drug-interaction-map";
    }
    
    /**
     * Processes CSV file uploads to import drug interactions.
     * Creates bidirectional interactions between drugs specified in the CSV.
     * Handles drug lookup by name using a mapping for efficiency.
     * 
     * @param files Array of uploaded MultipartFile objects
     * @param redirectAttributes Used for flash attributes in redirect
     * @return Redirect to the interactions list view
     */
    @PostMapping("/interactions/import")
    public String importInteractionsFromCsv(@RequestParam("file") MultipartFile[] files, 
                                          RedirectAttributes redirectAttributes) {
        if (files.length == 0 || files[0].isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Please select at least one CSV file to upload");
            return "redirect:/drugs/interactions/import";
        }

        int totalImported = 0;
        StringBuilder errors = new StringBuilder();
        
        // Get all drugs to find IDs by name
        List<Drug> allDrugs = drugService.getAllDrugs();
        Map<String, String> drugNameToIdMap = new HashMap<>();
        
        // Build a map of drug names to IDs for efficient lookup
        for (Drug drug : allDrugs) {
            drugNameToIdMap.put(drug.getName().toLowerCase(), drug.getId());
        }

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    // Process the CSV file to import interactions
                    int successCount = 0;
                    int skippedCount = 0;
                    
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                        // Skip header row
                        String line = reader.readLine();
                        
                        // Process data rows
                        while ((line = reader.readLine()) != null) {
                            String[] row = line.split(",");
                            
                            // Each row should have at least 2 columns (primary drug and at least one interacting drug)
                            if (row.length >= 2) {
                                String primaryDrugName = row[0].trim().toLowerCase();
                                String primaryDrugId = drugNameToIdMap.get(primaryDrugName);
                                
                                if (primaryDrugId == null) {
                                    skippedCount++;
                                    continue; // Skip this row if primary drug not found
                                }
                                
                                // Process each interacting drug in the row (all columns after the first)
                                for (int i = 1; i < row.length; i++) {
                                    String interactingDrugName = row[i].trim().toLowerCase();
                                    String interactingDrugId = drugNameToIdMap.get(interactingDrugName);
                                    
                                    if (interactingDrugId != null) {
                                        try {
                                            // Add interactions both ways
                                            drugService.addInteractionToDrug(primaryDrugId, interactingDrugId);
                                            drugService.addInteractionToDrug(interactingDrugId, primaryDrugId);
                                            successCount++;
                                        } catch (Exception e) {
                                            // Skip if interaction already exists or other error
                                            skippedCount++;
                                        }
                                    } else {
                                        skippedCount++;
                                    }
                                }
                            }
                        }
                    }
                    
                    totalImported += successCount;
                    
                    if (skippedCount > 0) {
                        errors.append("Skipped ").append(skippedCount)
                              .append(" interactions in file '")
                              .append(file.getOriginalFilename())
                              .append("' due to errors or duplicate entries. ");
                    }
                    
                } catch (IOException e) {
                    errors.append("Failed to process file '")
                          .append(file.getOriginalFilename())
                          .append("': ")
                          .append(e.getMessage())
                          .append(". ");
                } catch (RuntimeException e) {
                    errors.append("Error processing file '")
                          .append(file.getOriginalFilename())
                          .append("': ")
                          .append(e.getMessage())
                          .append(". ");
                }
            }
        }

        if (errors.length() > 0) {
            redirectAttributes.addFlashAttribute("warning", errors.toString());
        }
        
        if (totalImported > 0) {
            redirectAttributes.addFlashAttribute("success", 
                totalImported + " interactions successfully imported");
        } else {
            redirectAttributes.addFlashAttribute("error", 
                "No interactions were imported. Please check your CSV file format.");
        }
        
        return "redirect:/drugs/interactions";
    }
    
    /**
     * Provides a CSV template for importing drug interactions.
     * 
     * @return ResponseEntity containing the CSV file as a byte array
     */
    @GetMapping("/interactions/template/download")
    public ResponseEntity<byte[]> downloadInteractionsCsvTemplate() {
        StringBuilder csvBuilder = new StringBuilder();
        
        // Add a few example rows
        csvBuilder.append("Acetaminophen,Ibuprofen,Azithromycin,Hydrochlorothiazide\n");
        csvBuilder.append("Lisinopril,Albuterol,Ibuprofen\n");
        csvBuilder.append("Azithromycin,Amoxicillin,Ibuprofen,Lisinopril,Albuterol\n");
        
        byte[] csvContent = csvBuilder.toString().getBytes();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=interaction_template.csv")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(csvContent);
    }
    
    /**
     * API endpoint to retrieve a single drug by ID.
     * 
     * @param id The ID of the drug to retrieve
     * @return ResponseEntity with drug data or appropriate error status
     */
    @GetMapping("/api/drugs/{id}")
    @ResponseBody
    public ResponseEntity<?> getDrugById(@PathVariable String id) {
        try {
            return drugService.getDrugById(id)
                .map(drug -> ResponseEntity.ok(drug))
                .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching drug with ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Failed to load drug: " + e.getMessage()));
        }
    }
} 