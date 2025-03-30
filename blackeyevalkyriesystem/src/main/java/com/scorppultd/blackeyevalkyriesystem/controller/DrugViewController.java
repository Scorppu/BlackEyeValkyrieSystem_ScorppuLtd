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
import com.scorppultd.blackeyevalkyriesystem.model.Drug.Interaction;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;
import java.util.HashMap;

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
        model.addAttribute("allDrugs", drugService.getAllDrugs());
        model.addAttribute("severityLevels", Arrays.asList(1, 2, 3, 4, 5));
        return "drug-add";
    }
    
    /**
     * Handle form submission for adding a new drug
     */
    @PostMapping("/add")
    public String addDrug(@ModelAttribute Drug drug, 
                        @RequestParam(value = "interactingDrugs", required = false) List<String> interactingDrugs,
                        @RequestParam(value = "severities", required = false) List<Integer> severities,
                        @RequestParam(value = "descriptions", required = false) List<String> descriptions,
                        RedirectAttributes redirectAttributes) {
        // First save the drug to get an ID
        Drug savedDrug = drugService.createDrug(drug);
        
        // Debug info
        System.out.println("Drug saved with ID: " + savedDrug.getId());
        System.out.println("Interacting drugs: " + (interactingDrugs != null ? interactingDrugs : "null"));
        System.out.println("Severities: " + (severities != null ? severities : "null"));
        System.out.println("Descriptions: " + (descriptions != null ? descriptions : "null"));
        
        // Now create interactions if any were specified
        if (interactingDrugs != null && !interactingDrugs.isEmpty() &&
            severities != null && descriptions != null) {
            
            int successCount = 0;
            StringBuilder errors = new StringBuilder();
            
            for (int i = 0; i < interactingDrugs.size(); i++) {
                String interactingDrugId = interactingDrugs.get(i);
                System.out.println("Processing interaction #" + i + " with drug ID: " + interactingDrugId);
                
                if (interactingDrugId == null || interactingDrugId.isEmpty()) {
                    System.out.println("Skipping empty drug ID");
                    continue;  // Skip empty selections
                }
                
                try {
                    // Get corresponding severity and description
                    Integer severity = (i < severities.size()) ? severities.get(i) : 1;
                    String description = (i < descriptions.size()) ? descriptions.get(i) : "";
                    
                    System.out.println("Severity: " + severity + ", Description: " + description);
                    
                    // Create the interaction object
                    Interaction interaction = new Interaction(interactingDrugId, severity, description);
                    
                    // Add the interaction to the drug
                    drugService.addInteractionToDrug(savedDrug.getId(), interaction);
                    System.out.println("Added interaction from " + savedDrug.getId() + " to " + interactingDrugId);
                    
                    // Create reciprocal interaction (B → A)
                    Interaction reciprocalInteraction = new Interaction(savedDrug.getId(), severity, description);
                    drugService.addInteractionToDrug(interactingDrugId, reciprocalInteraction);
                    System.out.println("Added interaction from " + interactingDrugId + " to " + savedDrug.getId());
                
                    successCount++;
                } catch (Exception e) {
                    System.out.println("Error processing interaction: " + e.getMessage());
                    e.printStackTrace();
                    errors.append("Error processing interaction: ").append(e.getMessage()).append(". ");
                }
            }
            
            if (errors.length() > 0) {
                redirectAttributes.addFlashAttribute("warning", 
                    "Drug saved, but some interactions could not be created: " + errors.toString());
            } else if (successCount > 0) {
                redirectAttributes.addFlashAttribute("success", 
                    "Drug added successfully with " + successCount + " interaction(s)");
            } else {
                redirectAttributes.addFlashAttribute("success", "Drug added successfully");
            }
        } else {
            redirectAttributes.addFlashAttribute("success", "Drug added successfully");
        }
        
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
                List<Interaction> existingInteractions = drugService.getAllInteractionsForDrug(id);
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
                            @RequestParam(value = "severities", required = false) List<Integer> severities,
                            @RequestParam(value = "descriptions", required = false) List<String> descriptions,
                            RedirectAttributes redirectAttributes) {
        drug.setId(id); // Ensure ID is set
        drugService.updateDrug(drug);
        
        // Handle interactions if any were specified
        if (interactingDrugs != null && !interactingDrugs.isEmpty() &&
            severities != null && descriptions != null) {
            
            int successCount = 0;
            StringBuilder errors = new StringBuilder();
            
            for (int i = 0; i < interactingDrugs.size(); i++) {
                String interactingDrugId = interactingDrugs.get(i);
                if (interactingDrugId == null || interactingDrugId.isEmpty()) {
                    continue;  // Skip empty selections
                }
                
                try {
                    // Get corresponding severity and description
                    Integer severity = (i < severities.size()) ? severities.get(i) : 1;
                    String description = (i < descriptions.size()) ? descriptions.get(i) : "";
                    
                    // Create the interaction object
                    Interaction interaction = new Interaction(interactingDrugId, severity, description);
                    
                    // Add the interaction to the drug
                    drugService.addInteractionToDrug(id, interaction);
                    
                    // Create reciprocal interaction (B → A)
                    Interaction reciprocalInteraction = new Interaction(id, severity, description);
                    drugService.addInteractionToDrug(interactingDrugId, reciprocalInteraction);
                    
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
        System.out.println("Found " + allDrugs.size() + " drugs for interactions page");
        model.addAttribute("drugs", allDrugs);
        
        // Create a list of maps containing both source and target drug information for display
        List<Map<String, Object>> enhancedInteractions = new ArrayList<>();
        
        for (Drug drug : allDrugs) {
            System.out.println("Processing drug: " + drug.getId() + " - " + drug.getName());
            System.out.println("Drug has interactions: " + (drug.getInteractions() != null ? drug.getInteractions().size() : "null"));
            
            if (drug.getInteractions() != null && !drug.getInteractions().isEmpty()) {
                for (Interaction interaction : drug.getInteractions()) {
                    System.out.println("  Interaction: " + drug.getId() + " -> " + interaction.getDrugId() + 
                                    " (Severity: " + interaction.getSeverity() + ")");
                    
                    Map<String, Object> interactionData = new HashMap<>();
                    interactionData.put("sourceDrugId", drug.getId());
                    interactionData.put("targetDrugId", interaction.getDrugId());
                    interactionData.put("severity", interaction.getSeverity());
                    interactionData.put("description", interaction.getDescription());
                    enhancedInteractions.add(interactionData);
                }
            }
        }
        
        System.out.println("Total enhanced interactions: " + enhancedInteractions.size());
        model.addAttribute("interactions", enhancedInteractions);
        return "drug-interaction-list";
    }
    
    /**
     * Show form to add a new interaction
     */
    @GetMapping("/interactions/add")
    public String showAddInteractionForm(Model model) {
        model.addAttribute("drugs", drugService.getAllDrugs());
        model.addAttribute("severityLevels", Arrays.asList(1, 2, 3, 4, 5));
        return "drug-interaction-add";
    }
    
    /**
     * Handle form submission for adding a new interaction
     */
    @PostMapping("/interactions/add")
    public String addInteraction(
            @RequestParam("drugA") String drugAId,
            @RequestParam("drugB") String drugBId,
            @RequestParam("severity") Integer severity,
            @RequestParam("description") String description,
            RedirectAttributes redirectAttributes) {
        
        try {
            // Create interactions for both drugs (bidirectional)
            // First, add interaction from drug A to drug B
            Interaction interactionAB = new Interaction(drugBId, severity, description);
            drugService.addInteractionToDrug(drugAId, interactionAB);
            
            // Then, add interaction from drug B to drug A
            Interaction interactionBA = new Interaction(drugAId, severity, description);
            drugService.addInteractionToDrug(drugBId, interactionBA);
            
            redirectAttributes.addFlashAttribute("success", "Drug interaction added successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error adding interaction: " + e.getMessage());
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
        
        System.out.println("Viewing interactions for drug: " + drugId);
        
        drugService.getDrugById(drugId).ifPresentOrElse(
            drug -> {
                model.addAttribute("drug", drug);
                System.out.println("Found drug: " + drug.getName());
                System.out.println("Drug has interactions: " + (drug.getInteractions() != null ? drug.getInteractions().size() : "null"));
                
                // Create enhanced interaction view objects
                List<Map<String, Object>> enhancedInteractions = new ArrayList<>();
                if (drug.getInteractions() != null) {
                    for (Interaction interaction : drug.getInteractions()) {
                        System.out.println("  Interaction: " + drug.getId() + " -> " + interaction.getDrugId() + 
                                        " (Severity: " + interaction.getSeverity() + ")");
                        
                        Map<String, Object> interactionData = new HashMap<>();
                        interactionData.put("sourceDrugId", drug.getId());
                        interactionData.put("targetDrugId", interaction.getDrugId());
                        interactionData.put("severity", interaction.getSeverity());
                        interactionData.put("description", interaction.getDescription());
                        enhancedInteractions.add(interactionData);
                    }
                }
                
                System.out.println("Total enhanced interactions: " + enhancedInteractions.size());
                model.addAttribute("interactions", enhancedInteractions);
            },
            () -> {
                System.out.println("Drug not found with ID: " + drugId);
                model.addAttribute("error", "Drug not found");
            }
        );
        
        return "drug-interactions-for-drug";
    }
} 