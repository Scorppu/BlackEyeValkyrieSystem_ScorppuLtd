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

/**
 * Controller responsible for managing prescription views and operations in the dispensary.
 * This controller handles displaying active prescriptions, viewing prescription details,
 * and updating prescription statuses.
 * 
 * Access is restricted to users with ADMIN, PHARMACIST, DOCTOR, or NURSE roles.
 */
@Controller
@RequestMapping("/dispensary")
@PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE')")
public class PrescriptionViewController {

    private final PrescriptionService prescriptionService;
    private static final Logger logger = LoggerFactory.getLogger(PrescriptionViewController.class);
    
    /**
     * Constructs a PrescriptionViewController with the required service dependency.
     * 
     * @param prescriptionService The service used to manage prescription data.
     */
    @Autowired
    public PrescriptionViewController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    /**
     * Displays the dispensary main page showing all active prescriptions.
     * 
     * @param model The Spring MVC model for passing data to the view.
     * @return The view name for the prescription dispensary page.
     */
    @GetMapping
    public String showDispensaryPage(Model model) {
        List<Prescription> activePrescriptions = prescriptionService.getPrescriptionsByStatus("active");
        model.addAttribute("prescriptions", activePrescriptions);
        return "prescription-dispensary";
    }
    
    /**
     * Updates the status of a prescription.
     * 
     * @param id The unique identifier of the prescription to update.
     * @param status The new status value to set for the prescription.
     * @param redirectAttributes Spring MVC redirect attributes for flash messages.
     * @return A redirect to the dispensary page.
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
     * Displays the details of a specific prescription.
     * 
     * @param id The unique identifier of the prescription to view.
     * @param model The Spring MVC model for passing data to the view.
     * @param redirectAttributes Spring MVC redirect attributes for flash messages.
     * @return The view name for the prescription details page, or a redirect to the dispensary page if not found.
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