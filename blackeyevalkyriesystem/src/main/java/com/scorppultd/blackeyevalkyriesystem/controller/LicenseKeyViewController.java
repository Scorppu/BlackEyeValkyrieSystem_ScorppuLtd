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
 * Controller for license key management views.
 *
 * This controller handles all administrator operations related to license key management including:
 * viewing, filtering, and sorting license keys; editing existing license keys (status, role, expiration);
 * generating new license keys with specified roles and expiration; and deleting license keys.
 *
 * Access to all endpoints is restricted to users with ADMIN role via Spring Security.
 */
@Controller
@RequestMapping("/licenses")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class LicenseKeyViewController {

    private final LicenseKeyService licenseKeyService;
    private final UserService userService;
    private final LicenseKeyRepository licenseKeyRepository;

    /**
     * Creates a new instance of the LicenseKeyViewController.
     * 
     * @param licenseKeyService Service for license key operations
     * @param userService Service for user operations
     * @param licenseKeyRepository Repository for direct license key database access
     */
    @Autowired
    public LicenseKeyViewController(LicenseKeyService licenseKeyService, UserService userService, LicenseKeyRepository licenseKeyRepository) {
        this.licenseKeyService = licenseKeyService;
        this.userService = userService;
        this.licenseKeyRepository = licenseKeyRepository;
    }

    /**
     * Displays the license keys management page with sorting, filtering, and pagination.
     *
     * This method first checks for and deactivates expired license keys, then retrieves
     * all license keys applying any filters and sorting as specified. It also handles pagination
     * and retrieves user information for assigned license keys.
     * 
     * @param model The Spring MVC model to add attributes to
     * @param sortOrder The sort order for the license keys (asc or desc) by expiration date
     * @param statusFilter Optional filter to show only license keys with a specific status
     * @param roleFilter Optional filter to show only license keys with a specific role
     * @param request The HTTP request for sidebar navigation
     * @param currentPage Current page number for pagination
     * @param rowsPerPage Number of license keys to display per page
     * @return The name of the template to render (license-keys.html)
     */
    @GetMapping
    public String viewLicenseKeys(
            Model model, 
            @RequestParam(required = false, defaultValue = "asc") String sortOrder,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) String roleFilter,
            HttpServletRequest request,
            @RequestParam(name = "page", defaultValue = "1") int currentPage,
            @RequestParam(name = "rowsPerPage", defaultValue = "10") int rowsPerPage) {
        
        try {
            // Check for expired license keys first - wrap in try-catch to prevent errors
            try {
                licenseKeyService.checkAndDeactivateExpiredLicenses();
            } catch (Exception e) {
                // Log the error but continue with the page load
                e.printStackTrace();
            }
            
            // Get license keys with better error handling
            List<LicenseKey> allLicenseKeys = new ArrayList<>();
            try {
                allLicenseKeys = licenseKeyService.getAllLicenseKeys();
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            // Apply status filter if provided
            if (statusFilter != null && !statusFilter.isEmpty()) {
                try {
                    allLicenseKeys = allLicenseKeys.stream()
                            .filter(key -> statusFilter.equals(key.getStatus()))
                            .collect(Collectors.toList());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            
            // Apply role filter if provided
            if (roleFilter != null && !roleFilter.isEmpty()) {
                String roleFilterLower = roleFilter.toLowerCase();
                allLicenseKeys = allLicenseKeys.stream()
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
                
                allLicenseKeys.sort(comparator);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            // Calculate total items
            int totalLicenseKeys = allLicenseKeys.size();
            
            // Calculate pagination
            int offset = (currentPage - 1) * rowsPerPage;
            int toIndex = Math.min(offset + rowsPerPage, allLicenseKeys.size());
            
            // Apply pagination
            List<LicenseKey> licenseKeys = offset < toIndex 
                ? allLicenseKeys.subList(offset, toIndex) 
                : new ArrayList<>();
            
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
            
            // Add pagination attributes
            model.addAttribute("currentPage", currentPage);
            model.addAttribute("rowsPerPage", rowsPerPage);
            model.addAttribute("totalLicenseKeys", totalLicenseKeys);
            
            model.addAttribute("allStatuses", allStatuses);
            model.addAttribute("allRoles", allRoles);
            
            // Add request to model for sidebar navigation
            model.addAttribute("request", request);
            
            return "license-keys";  // This will map to a license-keys.html template
        } catch (Exception e) {
            e.printStackTrace();
            model.addAttribute("errorMessage", "An error occurred while loading license keys. Please try again.");
            return "license-keys";
        }
    }

    /**
     * Displays the form for editing a specific license key.
     *
     * Retrieves the license key by ID and populates the edit form with its current values.
     * Also retrieves and displays the user information if the license key is assigned to a user.
     * Provides status and role options for the form.
     * 
     * @param id The license key ID to edit
     * @param model The Spring MVC model to add attributes to
     * @param redirectAttributes For passing flash messages on redirect
     * @return The edit-license-key template or redirect to licenses list if key not found
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
     * Processes the license key edit form submission.
     *
     * Updates the specified license key with new values for status, role, and expiration date.
     * Performs validation on the expiration date format if provided.
     * 
     * @param id The ID of the license key to update
     * @param status The new status value for the license key
     * @param role The new role value for the license key
     * @param expiresOn The new expiration date (optional, in ISO format YYYY-MM-DD)
     * @param redirectAttributes For passing flash messages on redirect
     * @return Redirect to the licenses list or back to edit form on error
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
                "License key <span class='monospace-font'>" + licenseKey.getKey() + "</span> has been updated");
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Error updating license key: " + e.getMessage());
        }
        
        return "redirect:/licenses";
    }

    /**
     * Displays the form for generating new license keys.
     *
     * Provides role options for the form.
     * 
     * @param model The Spring MVC model to add attributes to
     * @return The generate-license-key template
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
     * Processes the license key generation form submission.
     *
     * Creates a new license key with the specified role and expiration settings.
     * Validates the role and handles various expiration options including custom dates.
     * 
     * @param role The role for the new license key (admin, doctor, or nurse)
     * @param expiryOption The expiration option (7days, 30days, 90days, 180days, 365days, noexpiry, or custom)
     * @param customDate The custom expiration date if expiryOption is "custom" (in ISO format YYYY-MM-DD)
     * @param redirectAttributes For passing flash messages on redirect
     * @return Redirect to the licenses list or back to generation form on error
     */
    @PostMapping("/generate")
    public String generateLicenseKeySubmit(
            @RequestParam String role,
            @RequestParam String expiryOption,
            @RequestParam(required = false) String customDate,
            RedirectAttributes redirectAttributes) {
        
        // Normalize role to lowercase (for case-insensitive comparison)
        String normalizedRole = role.toLowerCase();
        
        // Validate role
        if (!normalizedRole.equals("admin") && !normalizedRole.equals("doctor") && !normalizedRole.equals("nurse")) {
            redirectAttributes.addFlashAttribute("errorMessage", 
                    "Invalid role. Must be admin, doctor, or nurse.");
            return "redirect:/licenses/generate";
        }
        
        // Determine expiry date
        LocalDate expiresOn = null;
        
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
                // No expiry date
                break;
            case "custom":
                try {
                    expiresOn = LocalDate.parse(customDate);
                    // Check if the date is in the past
                    if (expiresOn.isBefore(LocalDate.now())) {
                        redirectAttributes.addFlashAttribute("errorMessage", 
                                "Expiry date cannot be in the past.");
                        return "redirect:/licenses/generate";
                    }
                } catch (Exception e) {
                    redirectAttributes.addFlashAttribute("errorMessage", 
                            "Invalid custom date format. Please use YYYY-MM-DD format.");
                    return "redirect:/licenses/generate";
                }
                break;
            default:
                redirectAttributes.addFlashAttribute("errorMessage", 
                        "Invalid expiry option.");
                return "redirect:/licenses/generate";
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
                    "License key <span class='monospace-font'>" + savedKey.getKey() + "</span> has been generated");
            
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", 
                    "Error generating license key: " + e.getMessage());
        }
        
        return "redirect:/licenses";
    }

    /**
     * Processes a request to delete a license key.
     *
     * Finds the license key by ID and deletes it if found.
     * 
     * @param id The ID of the license key to delete
     * @param redirectAttributes For passing flash messages on redirect
     * @return Redirect to the licenses list
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
     * Utility method to safely format a date for display.
     *
     * Handles null dates and formatting exceptions.
     *
     * @param date The date to format
     * @return Formatted date string in YYYY-MM-DD format or empty string if date is null or formatting fails
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