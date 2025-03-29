package com.scorppultd.blackeyevalkyriesystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

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
    public String addDrug(@ModelAttribute Drug drug, RedirectAttributes redirectAttributes) {
        drugService.createDrug(drug);
        redirectAttributes.addFlashAttribute("success", "Drug added successfully");
        return "redirect:/drugs/list";
    }
    
    /**
     * Edit drug page
     */
    @GetMapping("/edit/{id}")
    public String showEditDrugForm(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        drugService.getDrugById(id)
            .ifPresentOrElse(
                drug -> model.addAttribute("drug", drug),
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
    public String updateDrug(@PathVariable String id, @ModelAttribute Drug drug, RedirectAttributes redirectAttributes) {
        drug.setId(id); // Ensure ID is set
        drugService.updateDrug(drug);
        redirectAttributes.addFlashAttribute("success", "Drug updated successfully");
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
} 