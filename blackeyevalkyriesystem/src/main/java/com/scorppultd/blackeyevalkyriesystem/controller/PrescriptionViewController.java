package com.scorppultd.blackeyevalkyriesystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;

import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequestMapping("/dispensary")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE')")
public class PrescriptionViewController {

    private final PrescriptionService prescriptionService;
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionViewController.class);
    
    @Autowired
    public PrescriptionViewController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    /**
     * Dispensary main page - shows active prescriptions that haven't been completed
     */
    @GetMapping
    public String showDispensaryPage(Model model) {
        List<Prescription> activePrescriptions = prescriptionService.getPrescriptionsByStatus("active");
        model.addAttribute("prescriptions", activePrescriptions);
        return "prescription-dispensary";
    }
    
    /**
     * Update prescription status
     */
    @PostMapping("/update-status/{id}")
    public String updatePrescriptionStatus(
            @PathVariable String id, 
            @RequestParam String status,
            RedirectAttributes redirectAttributes) {
        
        try {
            Optional<Prescription> optionalPrescription = prescriptionService.getPrescriptionById(id);
            
            if (optionalPrescription.isPresent()) {
                Prescription updatedPrescription = prescriptionService.updatePrescriptionStatus(id, status);
                redirectAttributes.addFlashAttribute("success", 
                        "Prescription status updated to " + status);
            } else {
                redirectAttributes.addFlashAttribute("error", "Prescription not found");
            }
        } catch (Exception e) {
            logger.error("Error updating prescription status: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", 
                    "Error updating prescription status: " + e.getMessage());
        }
        
        return "redirect:/dispensary";
    }
    
    /**
     * View prescription details
     */
    @GetMapping("/view/{id}")
    public String viewPrescription(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        try {
            Optional<Prescription> optionalPrescription = prescriptionService.getPrescriptionById(id);
            
            if (optionalPrescription.isPresent()) {
                model.addAttribute("prescription", optionalPrescription.get());
                return "prescription-details";
            } else {
                redirectAttributes.addFlashAttribute("error", "Prescription not found");
                return "redirect:/dispensary";
            }
        } catch (Exception e) {
            logger.error("Error viewing prescription: {}", e.getMessage());
            redirectAttributes.addFlashAttribute("error", 
                    "Error viewing prescription: " + e.getMessage());
            return "redirect:/dispensary";
        }
    }
} 