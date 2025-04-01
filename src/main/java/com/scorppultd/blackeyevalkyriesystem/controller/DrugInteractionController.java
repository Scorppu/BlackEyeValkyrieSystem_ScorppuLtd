package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import com.scorppultd.blackeyevalkyriesystem.service.DrugInteractionService;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

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
    public String addInteraction(@RequestParam("drugA") String drugAId,
                                @RequestParam("drugB") String drugBId,
                                @RequestParam("severity") String severity,
                                @RequestParam("description") String description,
                                RedirectAttributes redirectAttributes) {
        try {
            Drug drugA = drugService.getDrugById(drugAId)
                .orElseThrow(() -> new RuntimeException("Drug A not found"));
            
            Drug drugB = drugService.getDrugById(drugBId)
                .orElseThrow(() -> new RuntimeException("Drug B not found"));
            
            // Use the new method that enforces canonical ordering
            drugInteractionService.saveInteraction(drugA, drugB, severity, description);
            
            redirectAttributes.addFlashAttribute("successMessage", "Drug interaction added successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error adding interaction: " + e.getMessage());
        }
        return "redirect:/drugs/interactions";
    }

    /**
     * Show form to edit an interaction
     */
    @GetMapping("/edit/{id}")
    public String showEditInteractionForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        drugInteractionService.getInteractionById(id)
            .ifPresentOrElse(
                interaction -> {
                    model.addAttribute("interaction", interaction);
                    model.addAttribute("drugs", drugService.getAllDrugs());
                    model.addAttribute("severityLevels", List.of("MILD", "MODERATE", "SEVERE"));
                },
                () -> {
                    redirectAttributes.addFlashAttribute("errorMessage", "Interaction not found");
                    model.addAttribute("redirect", "/drugs/interactions");
                }
            );
        return model.containsAttribute("redirect") ? "redirect:" + model.getAttribute("redirect") : "drug-interaction-edit";
    }

    /**
     * Handle form submission for updating an interaction
     */
    @PostMapping("/edit/{id}")
    public String updateInteraction(@PathVariable String id, 
                                   @RequestParam("drugA") String drugAId,
                                   @RequestParam("drugB") String drugBId,
                                   @RequestParam("severity") String severity,
                                   @RequestParam("description") String description,
                                   RedirectAttributes redirectAttributes) {
        try {
            Drug drugA = drugService.getDrugById(drugAId)
                .orElseThrow(() -> new RuntimeException("Drug A not found"));
            
            Drug drugB = drugService.getDrugById(drugBId)
                .orElseThrow(() -> new RuntimeException("Drug B not found"));
            
            // Get the existing interaction to maintain its ID
            DrugInteraction interaction = drugInteractionService.getInteractionById(id)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));
            
            // Update the fields
            interaction.setDrugA(drugA);
            interaction.setDrugB(drugB);
            interaction.setSeverity(severity);
            interaction.setDescription(description);
            
            // Save with canonical ordering enforced
            drugInteractionService.updateInteraction(interaction);
            
            redirectAttributes.addFlashAttribute("successMessage", "Drug interaction updated successfully");
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
} 