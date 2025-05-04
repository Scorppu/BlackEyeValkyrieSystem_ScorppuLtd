package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for license key management
 */
@RestController
@RequestMapping("/api/licenses")
public class LicenseKeyController {

    private final LicenseKeyService licenseKeyService;

    @Autowired
    public LicenseKeyController(LicenseKeyService licenseKeyService) {
        this.licenseKeyService = licenseKeyService;
    }

    /**
     * Validate a license key
     * 
     * @param licenseKeyRequest The license key to validate
     * @return Response entity with validation result
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateLicenseKey(@RequestBody Map<String, String> licenseKeyRequest) {
        String licenseKey = licenseKeyRequest.get("licenseKey");
        
        if (licenseKey == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "valid", false,
                "message", "No license key provided"
            ));
        }
        
        // First check if the license key format is valid
        if (!licenseKeyService.validateLicenseKeyFormat(licenseKey)) {
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "Invalid license key format. Must be in the format AAAA-BBBB-CCCC-DDDD"
            ));
        }
        
        // Get the license key from the database
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findByKey(licenseKey);
        if (licenseKeyOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "License key does not exist"
            ));
        }
        
        LicenseKey license = licenseKeyOpt.get();
        
        // Check if the license key is expired
        if (licenseKeyService.isLicenseExpired(license)) {
            // Update the license to Expired
            license.setStatus(LicenseKey.Status.EXPIRED);
            licenseKeyService.createLicenseKey(license);
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "License key has expired"
            ));
        }
        
        // Check if the license key is active
        if (!LicenseKey.Status.ACTIVE.equals(license.getStatus())) {
            String statusMessage = "License key is " + license.getStatus().toLowerCase();
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", statusMessage
            ));
        }
        
        // License key is valid
        return ResponseEntity.ok(Map.of(
            "valid", true,
            "message", "License key is valid",
            "role", license.getRole() != null ? license.getRole() : ""
        ));
    }

    /**
     * Get all license keys (admin only)
     * 
     * @return List of all license keys
     */
    @GetMapping
    public ResponseEntity<List<LicenseKey>> getAllLicenseKeys() {
        return ResponseEntity.ok(licenseKeyService.getAllLicenseKeys());
    }

    /**
     * Create a new license key
     * 
     * @param licenseKey The license key to create
     * @return The created license key
     */
    @PostMapping
    public ResponseEntity<LicenseKey> createLicenseKey(@RequestBody LicenseKey licenseKey) {
        try {
            LicenseKey createdLicenseKey = licenseKeyService.createLicenseKey(licenseKey);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdLicenseKey);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Generate a new license key
     * 
     * @return The generated license key
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateLicenseKey(@RequestBody(required = false) Map<String, Object> request) {
        // Default values
        LocalDate expiresOn = null;
        String role = null;
        
        // Parse request parameters if provided
        if (request != null) {
            // Parse expiration date option
            if (request.containsKey("expiryOption")) {
                String expiryOption = (String) request.get("expiryOption");
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
                        if (request.containsKey("customDate")) {
                            expiresOn = LocalDate.parse((String) request.get("customDate"));
                        }
                        break;
                }
            } else if (request.containsKey("expiresInDays")) {
                // For backward compatibility
                int expiresInDays = (int) request.get("expiresInDays");
                expiresOn = LocalDate.now().plusDays(expiresInDays);
            }
            
            // Get role
            if (request.containsKey("role")) {
                role = (String) request.get("role");
            }
        }
        
        // Generate the license key
        String key = licenseKeyService.generateLicenseKey();
        
        // Create and save the license key
        LicenseKey licenseKey = LicenseKey.builder()
                .key(key)
                .issuedOn(LocalDate.now())
                .expiresOn(expiresOn)
                .status(LicenseKey.Status.ACTIVE)
                .role(role)
                .build();
        
        LicenseKey savedLicenseKey = licenseKeyService.createLicenseKey(licenseKey);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "licenseKey", savedLicenseKey.getKey(),
            "expiresOn", savedLicenseKey.getExpiresOn(),
            "role", savedLicenseKey.getRole() != null ? savedLicenseKey.getRole() : "",
            "status", savedLicenseKey.getStatus()
        ));
    }

    /**
     * Deactivate a license key
     * 
     * @param licenseKey The license key to deactivate
     * @return Response entity with deactivation result
     */
    @PostMapping("/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateLicenseKey(@RequestBody Map<String, String> licenseKeyRequest) {
        String licenseKey = licenseKeyRequest.get("licenseKey");
        
        if (licenseKey == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "No license key provided"
            ));
        }
        
        boolean success = licenseKeyService.deactivateLicenseKey(licenseKey);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "License key deactivated successfully"
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "License key not found or already deactivated"
            ));
        }
    }

    /**
     * Get license key information
     * 
     * @param key The license key
     * @return The license key
     */
    @GetMapping("/{key}")
    public ResponseEntity<LicenseKey> getLicenseKey(@PathVariable String key) {
        Optional<LicenseKey> licenseKey = licenseKeyService.findByKey(key);
        return licenseKey.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * Update license key status
     * 
     * @param key The license key
     * @param request The update request containing new status and user ID
     * @return The updated license key
     */
    @PostMapping("/{key}/update-status")
    public ResponseEntity<?> updateLicenseKeyStatusByKey(
            @PathVariable String key, 
            @RequestBody Map<String, String> request) {
        
        String newStatus = request.get("status");
        String userId = request.get("user");
        
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "No status provided"
            ));
        }
        
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findByKey(key);
        if (licenseKeyOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        LicenseKey licenseKey = licenseKeyOpt.get();
        licenseKey.setStatus(newStatus);
        
        // Set the user if provided
        if (userId != null && !userId.isEmpty()) {
            licenseKey.setUser(userId);
        }
        
        try {
            LicenseKey updatedKey = licenseKeyService.createLicenseKey(licenseKey);
            return ResponseEntity.ok(updatedKey);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
} 