package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for license key management views (admin only)
 */
@Controller
@RequestMapping("/admin/licenses")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class LicenseKeyViewController {

    private final LicenseKeyService licenseKeyService;
    private final UserService userService;

    @Autowired
    public LicenseKeyViewController(LicenseKeyService licenseKeyService, UserService userService) {
        this.licenseKeyService = licenseKeyService;
        this.userService = userService;
    }

    /**
     * View all license keys
     * 
     * @param model The model
     * @return The license keys view
     */
    @GetMapping
    public String viewLicenseKeys(Model model) {
        List<LicenseKey> licenseKeys = licenseKeyService.getAllLicenseKeys();
        
        // Create a map to store user names for display
        Map<String, String> userNames = new HashMap<>();
        
        // Get user names for all license keys that have a user
        for (LicenseKey licenseKey : licenseKeys) {
            if (licenseKey.getUser() != null) {
                Optional<User> userOpt = userService.findUserById(licenseKey.getUser());
                userOpt.ifPresent(user -> userNames.put(licenseKey.getUser(), user.getFullName()));
            }
        }
        
        model.addAttribute("licenseKeys", licenseKeys);
        model.addAttribute("userNames", userNames);
        return "license-keys";  // This will map to a license-keys.html template
    }

    /**
     * View for editing a license key
     * 
     * @param id The license key ID
     * @param model The model
     * @return The edit license key view
     */
    @GetMapping("/edit/{id}")
    public String editLicenseKey(@PathVariable String id, Model model, RedirectAttributes redirectAttributes) {
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findById(id);
        
        if (licenseKeyOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "License key not found");
            return "redirect:/admin/licenses";
        }
        
        LicenseKey licenseKey = licenseKeyOpt.get();
        model.addAttribute("licenseKey", licenseKey);
        
        // Add user name if this license key is assigned to a user
        if (licenseKey.getUser() != null) {
            Optional<User> userOpt = userService.findUserById(licenseKey.getUser());
            userOpt.ifPresent(user -> model.addAttribute("userName", user.getFullName()));
        }
        
        // Add status options
        model.addAttribute("statusOptions", List.of(
            LicenseKey.Status.ACTIVE,
            LicenseKey.Status.USED,
            LicenseKey.Status.EXPIRED,
            LicenseKey.Status.DEACTIVATED
        ));
        
        // Add role options
        model.addAttribute("roleOptions", List.of(
            LicenseKey.Role.ADMIN,
            LicenseKey.Role.DOCTOR,
            LicenseKey.Role.NURSE
        ));
        
        return "edit-license-key";  // This will map to an edit-license-key.html template
    }

    /**
     * View for generating new license keys
     * 
     * @param model The model
     * @return The generate license key view
     */
    @GetMapping("/generate")
    public String generateLicenseKeyView(Model model) {
        // Add role options
        model.addAttribute("roleOptions", List.of(
            LicenseKey.Role.ADMIN,
            LicenseKey.Role.DOCTOR,
            LicenseKey.Role.NURSE
        ));
        
        return "generate-license-key";  // This will map to a generate-license-key.html template
    }
    
    /**
     * Create new license key
     * 
     * @param role The role for the license key
     * @param expiryOption The expiry option
     * @param customDate The custom expiry date (if applicable)
     * @param redirectAttributes Redirect attributes
     * @return Redirect to license key list
     */
    @PostMapping("/generate")
    public String generateLicenseKey(
            String role, 
            String expiryOption, 
            String customDate, 
            RedirectAttributes redirectAttributes) {
        
        LocalDate expiresOn = null;
        
        // Set expiry date based on option
        switch (expiryOption) {
            case "7days":
                expiresOn = LocalDate.now().plusDays(7);
                break;
            case "30days":
                expiresOn = LocalDate.now().plusDays(30);
                break;
            case "90days":
                expiresOn = LocalDate.now().plusDays(90);
                break;
            case "180days":
                expiresOn = LocalDate.now().plusDays(180);
                break;
            case "365days":
                expiresOn = LocalDate.now().plusDays(365);
                break;
            case "noexpiry":
                expiresOn = LocalDate.of(2099, 12, 31);
                break;
            case "custom":
                if (customDate != null && !customDate.isEmpty()) {
                    try {
                        expiresOn = LocalDate.parse(customDate);
                    } catch (Exception e) {
                        redirectAttributes.addFlashAttribute("errorMessage", "Invalid date format");
                        return "redirect:/admin/licenses/generate";
                    }
                }
                break;
        }
        
        try {
            // Generate the key
            String key = licenseKeyService.generateLicenseKey();
            
            // Create the license key
            LicenseKey licenseKey = LicenseKey.builder()
                    .key(key)
                    .issuedOn(LocalDate.now())
                    .expiresOn(expiresOn)
                    .status(LicenseKey.Status.ACTIVE)
                    .role(role)
                    .build();
            
            LicenseKey savedKey = licenseKeyService.createLicenseKey(licenseKey);
            
            redirectAttributes.addFlashAttribute("successMessage", 
                    "License key generated successfully: " + savedKey.getKey());
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", 
                    "Error generating license key: " + e.getMessage());
        }
        
        return "redirect:/admin/licenses";
    }

    /**
     * Delete a license key
     * 
     * @param id The license key ID
     * @param redirectAttributes For flash messages
     * @return Redirect to the license keys list
     */
    @PostMapping("/delete/{id}")
    public String deleteLicenseKey(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findById(id);
            if (licenseKeyOpt.isPresent()) {
                LicenseKey licenseKey = licenseKeyOpt.get();
                licenseKeyService.deleteLicenseKey(licenseKey);
                redirectAttributes.addFlashAttribute("successMessage", "License key deleted successfully");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "License key not found");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting license key: " + e.getMessage());
        }
        
        return "redirect:/admin/licenses";
    }
} 