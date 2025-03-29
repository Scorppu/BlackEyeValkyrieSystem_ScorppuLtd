package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import com.scorppultd.blackeyevalkyriesystem.service.DrugInteractionService;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/drugs/interactions")
@PreAuthorize("hasRole('ADMIN')")
public class DrugInteractionController {

    private final DrugInteractionService drugInteractionService;
    private final DrugService drugService;

    @Autowired
    public DrugInteractionController(DrugInteractionService drugInteractionService, DrugService drugService) {
        this.drugInteractionService = drugInteractionService;
        this.drugService = drugService;
    }

    /**
     * List all drug interactions
     */
    @GetMapping
    public String listInteractions(Model model) {
        model.addAttribute("interactions", drugInteractionService.getAllInteractions());
        return "drug-interaction-list";
    }

    /**
     * Show form to add a new interaction
     */
    @GetMapping("/add")
    public String showAddInteractionForm(Model model) {
        model.addAttribute("interaction", new DrugInteraction());
        model.addAttribute("drugs", drugService.getAllDrugs());
        model.addAttribute("severityLevels", List.of("MILD", "MODERATE", "SEVERE"));
        return "drug-interaction-add";
    }

    /**
     * Handle form submission for adding a new interaction
     */
    @PostMapping("/add")
    public String addInteraction(@ModelAttribute DrugInteraction interaction,
                                 @RequestParam(value = "interactingDrugs", required = false) List<String> interactingDrugs,
                                 @RequestParam(value = "severities", required = false) List<String> severities,
                                 @RequestParam(value = "descriptions", required = false) List<String> descriptions,
                                 RedirectAttributes redirectAttributes) {
        // If we have multiple interacting drugs
        if (interactingDrugs != null && !interactingDrugs.isEmpty() && 
            severities != null && descriptions != null) {
            
            int successCount = 0;
            StringBuilder errors = new StringBuilder();
            
            // Get the first drug from the model
            Drug firstDrug = interaction.getDrugA();
            
            // Create an interaction for each interacting drug
            for (int i = 0; i < interactingDrugs.size(); i++) {
                String interactingDrugId = interactingDrugs.get(i);
                if (interactingDrugId == null || interactingDrugId.isEmpty()) {
                    continue;  // Skip empty selections
                }
                
                try {
                    // Get the corresponding severity and description
                    String severity = (i < severities.size()) ? severities.get(i) : "MILD";
                    String description = (i < descriptions.size()) ? descriptions.get(i) : "";
                    
                    // Find the interacting drug
                    Optional<Drug> interactingDrugOpt = drugService.getDrugById(interactingDrugId);
                    if (interactingDrugOpt.isPresent()) {
                        // Create a new interaction
                        DrugInteraction newInteraction = new DrugInteraction();
                        newInteraction.setDrugA(firstDrug);
                        newInteraction.setDrugB(interactingDrugOpt.get());
                        newInteraction.setSeverity(severity);
                        newInteraction.setDescription(description);
                        
                        // Save the interaction
                        drugInteractionService.createInteraction(newInteraction);
                        successCount++;
                    } else {
                        errors.append("Interacting drug with ID ").append(interactingDrugId).append(" not found. ");
                    }
                } catch (Exception e) {
                    errors.append("Error processing interaction: ").append(e.getMessage()).append(". ");
                }
            }
            
            // Set feedback messages
            if (successCount > 0) {
                redirectAttributes.addFlashAttribute("successMessage", 
                    successCount + " drug interaction(s) added successfully");
            }
            
            if (errors.length() > 0) {
                redirectAttributes.addFlashAttribute("errorMessage", errors.toString());
            }
        } else {
            // For backward compatibility, handle single interaction
            try {
                // Basic validation
                if (interaction.getDrugA() == null || interaction.getDrugB() == null) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Both drugs must be selected");
                    return "redirect:/drugs/interactions/add";
                }
                
                // Check if the drugs are the same
                if (interaction.getDrugA().getId().equals(interaction.getDrugB().getId())) {
                    redirectAttributes.addFlashAttribute("errorMessage", "The same drug cannot interact with itself");
                    return "redirect:/drugs/interactions/add";
                }
                
                // Save the new interaction
                drugInteractionService.createInteraction(interaction);
                redirectAttributes.addFlashAttribute("successMessage", "Drug interaction added successfully");
            } catch (Exception e) {
                redirectAttributes.addFlashAttribute("errorMessage", "Error adding interaction: " + e.getMessage());
            }
        }
        
        return "redirect:/drugs/interactions";
    }

    /**
     * Show the form to edit an interaction
     */
    @GetMapping("/edit/{id}")
    public String showEditInteractionForm(@PathVariable String id, Model model) {
        Optional<DrugInteraction> interactionOpt = drugInteractionService.getInteractionById(id);
        if (interactionOpt.isPresent()) {
            DrugInteraction interaction = interactionOpt.get();
            model.addAttribute("interaction", interaction);
            model.addAttribute("drugs", drugService.getAllDrugs());
            model.addAttribute("severityLevels", List.of("MILD", "MODERATE", "SEVERE"));
            return "drug-interaction-edit";
        } else {
            // Handle the case where the interaction doesn't exist
            return "redirect:/drugs/interactions";
        }
    }

    /**
     * Handle form submission for updating an interaction
     */
    @PostMapping("/edit/{id}")
    public String updateInteraction(@PathVariable String id, 
                                   @ModelAttribute DrugInteraction interaction,
                                   RedirectAttributes redirectAttributes) {
        try {
            // Get the existing interaction
            Optional<DrugInteraction> existingInteractionOpt = drugInteractionService.getInteractionById(id);
            
            if (existingInteractionOpt.isPresent()) {
                DrugInteraction existingInteraction = existingInteractionOpt.get();
                
                // Update fields
                existingInteraction.setDrugA(interaction.getDrugA());
                existingInteraction.setDrugB(interaction.getDrugB());
                existingInteraction.setSeverity(interaction.getSeverity());
                existingInteraction.setDescription(interaction.getDescription());
                
                // Save the updated interaction
                drugInteractionService.updateInteraction(existingInteraction);
                
                redirectAttributes.addFlashAttribute("successMessage", "Drug interaction updated successfully");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Interaction not found with ID: " + id);
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating interaction: " + e.getMessage());
        }
        
        return "redirect:/drugs/interactions";
    }

    /**
     * Delete an interaction
     */
    @GetMapping("/delete/{id}")
    public String deleteInteraction(@PathVariable String id, RedirectAttributes redirectAttributes) {
        drugInteractionService.deleteInteraction(id);
        redirectAttributes.addFlashAttribute("successMessage", "Drug interaction deleted successfully");
        return "redirect:/drugs/interactions";
    }

    /**
     * View interactions for a specific drug
     */
    @GetMapping("/drug/{drugId}")
    public String viewDrugInteractions(@PathVariable String drugId, Model model) {
        List<DrugInteraction> interactions = drugInteractionService.getInteractionsForDrug(drugId);
        model.addAttribute("interactions", interactions);
        drugService.getDrugById(drugId).ifPresent(drug -> model.addAttribute("drug", drug));
        return "drug-interactions-for-drug";
    }
    
    /**
     * Import interactions from CSV page
     */
    @GetMapping("/import")
    public String showImportForm(Model model) {
        return "drug-interaction-import";
    }
    
    /**
     * Handle CSV file upload and import
     */
    @PostMapping("/import")
    public String importInteractionsFromCsv(@RequestParam("file") MultipartFile[] files, 
                                          RedirectAttributes redirectAttributes) {
        if (files.length == 0 || files[0].isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Please select at least one CSV file to upload");
            return "redirect:/drugs/interactions/import";
        }

        int totalImported = 0;
        StringBuilder errors = new StringBuilder();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    List<DrugInteraction> importedInteractions = drugInteractionService.importInteractionsFromCsv(file.getInputStream());
                    totalImported += importedInteractions.size();
                } catch (IOException e) {
                    errors.append("Failed to process file '")
                          .append(file.getOriginalFilename())
                          .append("': ")
                          .append(e.getMessage())
                          .append(". ");
                } catch (RuntimeException e) {
                    // Handle the exception for skipped rows that have errors
                    String message = e.getMessage();
                    if (message.contains("Skipped")) {
                        // Add as a warning instead of an error
                        redirectAttributes.addFlashAttribute("warningMessage", message);
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
            redirectAttributes.addFlashAttribute("errorMessage", errors.toString());
        }
        
        if (totalImported > 0) {
            redirectAttributes.addFlashAttribute("successMessage", 
                totalImported + " interactions successfully imported");
        }
        
        return "redirect:/drugs/interactions";
    }
    
    /**
     * Download CSV template
     */
    @GetMapping("/template/download")
    public ResponseEntity<byte[]> downloadCsvTemplate() {
        byte[] csvContent = drugInteractionService.generateCsvTemplate();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=drug_interactions_template.csv")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .body(csvContent);
    }
} 