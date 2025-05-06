package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import com.scorppultd.blackeyevalkyriesystem.repository.LicenseKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Controller for license key management views (admin only)
 */
@Controller
@RequestMapping("/licenses")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class LicenseKeyViewController {

    private final LicenseKeyService licenseKeyService;
    private final UserService userService;
    private final LicenseKeyRepository licenseKeyRepository;

    @Autowired
    public LicenseKeyViewController(LicenseKeyService licenseKeyService, UserService userService, LicenseKeyRepository licenseKeyRepository) {
        this.licenseKeyService = licenseKeyService;
        this.userService = userService;
        this.licenseKeyRepository = licenseKeyRepository;
    }

    /**
     * View all license keys with optional sorting and filtering
     * 
     * @param model The model
     * @param sortOrder The sort order (asc or desc)
     * @param statusFilter Filter by status
     * @param roleFilter Filter by role
     * @param request The HTTP request
     * @return The license keys view
     */
    @GetMapping
    public String viewLicenseKeys(
            Model model, 
            @RequestParam(required = false, defaultValue = "asc") String sortOrder,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) String roleFilter,
            HttpServletRequest request) {
        
        try {
            // Check for expired license keys first - wrap in try-catch to prevent errors
            try {
                licenseKeyService.checkAndDeactivateExpiredLicenses();
            } catch (Exception e) {
                // Log the error but continue with the page load
                e.printStackTrace();
            }
            
            // Get license keys with better error handling
            List<LicenseKey> licenseKeys = new ArrayList<>();
            try {
                licenseKeys = licenseKeyService.getAllLicenseKeys();
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            // Apply status filter if provided
            if (statusFilter != null && !statusFilter.isEmpty()) {
                try {
                    licenseKeys = licenseKeys.stream()
                            .filter(key -> statusFilter.equals(key.getStatus()))
                            .collect(Collectors.toList());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            
            // Apply role filter if provided
            if (roleFilter != null && !roleFilter.isEmpty()) {
                String roleFilterLower = roleFilter.toLowerCase();
                licenseKeys = licenseKeys.stream()
                    .filter(key -> roleFilterLower.equalsIgnoreCase(key.getRole()))
                    .collect(Collectors.toList());
            }
            
            // Sort by expiration date with better error handling
            try {
                Comparator<LicenseKey> comparator = Comparator.comparing(
                        key -> key.getExpiresOn() != null ? key.getExpiresOn() : LocalDate.MAX,
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
                
                // Apply sort order
                if ("desc".equalsIgnoreCase(sortOrder)) {
                    comparator = comparator.reversed();
                }
                
                licenseKeys.sort(comparator);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            // Create a map to store user names for display with better error handling
            Map<String, String> userNames = new HashMap<>();
            
            // Get user names for all license keys that have a user
            for (LicenseKey licenseKey : licenseKeys) {
                if (licenseKey.getUser() != null) {
                    try {
                        Optional<User> userOpt = userService.findUserById(licenseKey.getUser());
                        userOpt.ifPresent(user -> userNames.put(licenseKey.getUser(), user.getFullName()));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
            
            // Add all available statuses and roles for filtering
            List<String> allStatuses = new ArrayList<>();
            allStatuses.add(LicenseKey.Status.ACTIVE);
            allStatuses.add(LicenseKey.Status.USED);
            allStatuses.add(LicenseKey.Status.EXPIRED);
            allStatuses.add(LicenseKey.Status.DEACTIVATED);
            
            List<String> allRoles = new ArrayList<>();
            allRoles.add(LicenseKey.Role.ADMIN);
            allRoles.add(LicenseKey.Role.DOCTOR);
            allRoles.add(LicenseKey.Role.NURSE);
            
            // Add the license keys to the model
            model.addAttribute("licenseKeys", licenseKeys);
            model.addAttribute("userNames", userNames);
            
            // Keep track of current filter and sort for UI
            model.addAttribute("currentStatusFilter", statusFilter);
            model.addAttribute("currentRoleFilter", roleFilter);
            model.addAttribute("currentSortOrder", sortOrder);
            
            model.addAttribute("allStatuses", allStatuses);
            model.addAttribute("allRoles", allRoles);
            
            return "license-keys";  // This will map to a license-keys.html template
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "An error occurred while loading license keys. Please try again.");
            return "license-keys";
        }
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
            return "redirect:/licenses";
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
     * Process license key edit form
     * 
     * @param id The license key ID
     * @param status The new status
     * @param role The new role
     * @param expiresOn The new expiry date 
     * @param redirectAttributes For flash messages
     * @return Redirect to the license keys list
     */
    @PostMapping("/edit/{id}")
    public String updateLicenseKey(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam String role,
            @RequestParam(required = false) String expiresOn,
            RedirectAttributes redirectAttributes) {
        
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findById(id);
        
        if (licenseKeyOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "License key not found");
            return "redirect:/licenses";
        }
        
        try {
            LicenseKey licenseKey = licenseKeyOpt.get();
            
            // Update properties
            licenseKey.setStatus(status);
            licenseKey.setRole(role.toLowerCase());
            
            // Update expiresOn if provided
            if (expiresOn != null && !expiresOn.isEmpty()) {
                try {
                    // Parse date format (yyyy-MM-dd)
                    LocalDate date = LocalDate.parse(expiresOn, DateTimeFormatter.ISO_LOCAL_DATE);
                    licenseKey.setExpiresOn(date);
                } catch (DateTimeParseException e) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Invalid date format: " + e.getMessage());
                    return "redirect:/licenses/edit/" + id;
                }
            } else {
                licenseKey.setExpiresOn(null);
            }
            
            // Save the updated license key directly using repository
            licenseKeyRepository.save(licenseKey);
            
            // Add success message
            redirectAttributes.addFlashAttribute("successMessage", 
                "License key " + licenseKey.getKey() + " updated successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating license key: " + e.getMessage());
        }
        
        return "redirect:/licenses";
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
        
        // Convert role to lowercase
        String normalizedRole = role != null ? role.toLowerCase() : role;
        
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
                        expiresOn = LocalDate.parse(customDate, DateTimeFormatter.ISO_LOCAL_DATE);
                    } catch (Exception e) {
                        redirectAttributes.addFlashAttribute("errorMessage", "Invalid date format");
                        return "redirect:/licenses/generate";
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
                    .role(normalizedRole)
                    .build();
            
            LicenseKey savedKey = licenseKeyService.createLicenseKey(licenseKey);
            
            redirectAttributes.addFlashAttribute("successMessage", 
                    "License key generated successfully: " + savedKey.getKey());
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", 
                    "Error generating license key: " + e.getMessage());
        }
        
        return "redirect:/licenses";
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
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findById(id);
        
        if (licenseKeyOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "License key not found");
            return "redirect:/licenses";
        }
        
        try {
            // Delete the license key
            licenseKeyService.deleteLicenseKey(licenseKeyOpt.get());
            
            redirectAttributes.addFlashAttribute("successMessage", "License key deleted successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting license key: " + e.getMessage());
        }
        
        return "redirect:/licenses";
    }

    /**
     * Safely formats a date for display
     * @param date The date to format
     * @return Formatted date string or empty string if date is null
     */
    private String safeFormatDate(LocalDate date) {
        if (date == null) {
            return "";
        }
        try {
            return date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } catch (Exception e) {
            return "";
        }
    }
} 