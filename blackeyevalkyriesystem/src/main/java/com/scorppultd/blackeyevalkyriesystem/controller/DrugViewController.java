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

import java.io.IOException;
import java.util.List;

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