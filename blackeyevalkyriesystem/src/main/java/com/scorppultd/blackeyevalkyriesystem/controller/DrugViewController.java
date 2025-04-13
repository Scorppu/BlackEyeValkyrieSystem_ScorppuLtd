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

@Controller
@RequestMapping("/drugs")
@PreAuthorize("hasRole('ADMIN')")
public class DrugViewController {

    private final DrugService drugService;
    
    @Autowired
    public DrugViewController(DrugService drugService) {
        this.drugService = drugService;
    }
    
    /**
     * Main drugs management page
     */
    @GetMapping
    public String showDrugsPage() {
        return "redirect:/drugs/list";
    }
    
    /**
     * Drug list page
     */
    @GetMapping("/list")
    public String showDrugList(Model model) {
        model.addAttribute("drugs", drugService.getAllDrugs());
        return "drug-list";
    }
    
    /**
     * Add drug page
     */
    @GetMapping("/add")
    public String showAddDrugForm(Model model) {
        model.addAttribute("drug", new Drug());
        return "drug-add";
    }
    
    /**
     * Handle form submission for adding a new drug
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
     * Import drugs from CSV page
     */
    @GetMapping("/import")
    public String showImportForm() {
        return "drug-import";
    }
    
    /**
     * Handle CSV file upload and import
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
     * Download CSV template
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
     * Edit drug page
     */
    @GetMapping("/edit/{id}")
    public String showEditDrugForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        drugService.getDrugById(id).ifPresentOrElse(
            drug -> {
                model.addAttribute("drug", drug);
                
                // Get all other drugs for potential interactions
                List<Drug> allDrugs = drugService.getAllDrugs();
                allDrugs.removeIf(d -> d.getId().equals(id)); // Remove current drug
                model.addAttribute("allDrugs", allDrugs);
                
                // Get existing interactions for this drug
                List<String> existingInteractions = drugService.getAllInteractionsForDrug(id);
                model.addAttribute("existingInteractions", existingInteractions);
                
                model.addAttribute("severityLevels", Arrays.asList(1, 2, 3, 4, 5));
            },
            () -> {
                redirectAttributes.addFlashAttribute("error", "Drug not found");
                model.addAttribute("redirect", "/drugs/list");
            }
        );
        return model.containsAttribute("redirect") ? "redirect:" + model.getAttribute("redirect") : "drug-edit";
    }
    
    /**
     * Handle form submission for updating a drug
     */
    @PostMapping("/edit/{id}")
    public String updateDrug(@PathVariable String id, 
                            @ModelAttribute Drug drug, 
                            @RequestParam(value = "interactingDrugs", required = false) List<String> interactingDrugs,
                            RedirectAttributes redirectAttributes) {
        drug.setId(id); // Ensure ID is set
        drugService.updateDrug(drug);
        
        // Handle interactions if any were specified
        if (interactingDrugs != null && !interactingDrugs.isEmpty()) {
            
            int successCount = 0;
            StringBuilder errors = new StringBuilder();
            
            for (int i = 0; i < interactingDrugs.size(); i++) {
                String interactingDrugId = interactingDrugs.get(i);
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
        
        return "redirect:/drugs/list";
    }
    
    /**
     * Delete a drug
     */
    @GetMapping("/delete/{id}")
    public String deleteDrug(@PathVariable String id, RedirectAttributes redirectAttributes) {
        drugService.deleteDrug(id);
        redirectAttributes.addFlashAttribute("success", "Drug deleted successfully");
        return "redirect:/drugs/list";
    }
    
    /**
     * List all drug interactions
     */
    @GetMapping("/interactions")
    public String listInteractions(Model model) {
        List<Drug> allDrugs = drugService.getAllDrugs();
        model.addAttribute("drugs", allDrugs);
        
        // Create a map to group interactions by primary drug
        Map<String, List<String>> drugInteractionsMap = new HashMap<>();
        
        for (Drug drug : allDrugs) {
            if (drug.getInteractingDrugIds() != null && !drug.getInteractingDrugIds().isEmpty()) {
                // For each drug with interactions, add its ID and the list of interacting drugs
                drugInteractionsMap.put(drug.getId(), new ArrayList<>(drug.getInteractingDrugIds()));
            }
        }
        
        model.addAttribute("drugInteractionsMap", drugInteractionsMap);
        return "drug-interaction-list";
    }
    
    /**
     * Show form to add a new interaction
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
     * Handle form submission for adding a new interaction
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
     * Handle form submission for batch adding interactions
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
     * Delete an interaction
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
     * View interactions for a specific drug
     */
    @GetMapping("/interactions/drug/{drugId}")
    public String viewDrugInteractions(@PathVariable String drugId, Model model) {
        List<Drug> allDrugs = drugService.getAllDrugs();
        model.addAttribute("allDrugs", allDrugs);
        
        
        drugService.getDrugById(drugId).ifPresentOrElse(
            drug -> {
                model.addAttribute("drug", drug);

                // Create enhanced interaction view objects
                List<Map<String, Object>> enhancedInteractions = new ArrayList<>();
                if (drug.getInteractingDrugIds() != null) {
                    // Process each interaction
                    for (String interactingDrugId : drug.getInteractingDrugIds()) {
                        
                        Map<String, Object> interactionData = new HashMap<>();
                        interactionData.put("sourceDrugId", drug.getId());
                        interactionData.put("targetDrugId", interactingDrugId);
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
     * Show form to import drug interactions from CSV
     */
    @GetMapping("/interactions/import")
    public String showImportInteractionsForm(Model model) {
        List<Drug> drugs = drugService.getAllDrugs();
        model.addAttribute("drugs", drugs);
        return "drug-interaction-import";
    }
    
    /**
     * Handle CSV file upload and import drug interactions
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
     * Download CSV template for drug interactions
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
} 