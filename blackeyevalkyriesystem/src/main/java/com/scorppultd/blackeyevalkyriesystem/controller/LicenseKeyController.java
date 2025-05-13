package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for license key management operations.
 * Provides REST endpoints for creating, validating, generating, retrieving, 
 * deactivating, and managing license keys. The controller handles HTTP requests
 * related to license key operations and delegates business logic to the LicenseKeyService.
 */
@RestController
@RequestMapping("/api/licenses")
public class LicenseKeyController {

    private final LicenseKeyService licenseKeyService;

    /**
     * Constructs a new LicenseKeyController with the provided LicenseKeyService.
     * 
     * @param licenseKeyService Service for license key operations
     */
    @Autowired
    public LicenseKeyController(LicenseKeyService licenseKeyService) {
        this.licenseKeyService = licenseKeyService;
    }

    /**
     * Validates a license key by checking its format, existence, expiration, and active status.
     * 
     * @param licenseKeyRequest JSON object containing the license key to validate
     * @return Response entity with validation result including valid status, message, and role if valid
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
     * Retrieves all license keys from the system.
     * This endpoint is intended for administrative use.
     * 
     * @return Response entity containing a list of all license keys
     */
    @GetMapping
    public ResponseEntity<List<LicenseKey>> getAllLicenseKeys() {
        return ResponseEntity.ok(licenseKeyService.getAllLicenseKeys());
    }

    /**
     * Creates a new license key with the provided details.
     * 
     * @param licenseKey The license key object containing key information to create
     * @return Response entity with the created license key or bad request if creation fails
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
     * Generates a new license key with optional expiry date and role.
     * Supports various expiry options including 7 days, 30 days, 90 days,
     * 180 days, 365 days, no expiry, or a custom date.
     * 
     * @param request Optional JSON object containing expiry option, custom date, and role
     * @return Response entity with the generated license key details
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
                            String dateStr = (String) request.get("customDate");
                            try {
                                expiresOn = LocalDate.parse(dateStr);
                            } catch (Exception e) {
                                // If parsing fails, set to null
                                expiresOn = null;
                            }
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
                // Convert role to lowercase
                if (role != null) {
                    role = role.toLowerCase();
                }
            }
        }
        
        // Generate the license key
        String key = licenseKeyService.generateLicenseKey();
        
        // Create and save the license key
        LicenseKey licenseKeyObj = LicenseKey.builder()
                .key(key)
                .issuedOn(LocalDate.now())
                .expiresOn(expiresOn)
                .status(LicenseKey.Status.ACTIVE)
                .role(role)
                .build();
        
        LicenseKey savedLicenseKey = licenseKeyService.createLicenseKey(licenseKeyObj);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "licenseKey", savedLicenseKey.getKey(),
            "expiresOn", savedLicenseKey.getExpiresOn(),
            "role", savedLicenseKey.getRole() != null ? savedLicenseKey.getRole() : "",
            "status", savedLicenseKey.getStatus()
        ));
    }

    /**
     * Deactivates a license key in the system.
     * 
     * @param licenseKeyRequest JSON object containing the license key to deactivate
     * @return Response entity with deactivation result including success status and message
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
     * Retrieves license key information for a specific key.
     * 
     * @param key The license key string to retrieve
     * @return Response entity with the license key details if found, or 404 not found if not exists
     */
    @GetMapping("/{key}")
    public ResponseEntity<LicenseKey> getLicenseKey(@PathVariable String key) {
        Optional<LicenseKey> licenseKey = licenseKeyService.findByKey(key);
        return licenseKey.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * Updates the status of a license key and optionally assigns it to a user.
     * 
     * @param key The license key to update
     * @param request JSON object containing the new status and optional user ID
     * @return Response entity with the updated license key or appropriate error response
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
        
        try {
            LicenseKey licenseKey = licenseKeyOpt.get();
            licenseKey.setStatus(newStatus);
            
            // Set the user if provided
            if (userId != null && !userId.isEmpty()) {
                licenseKey.setUser(userId);
            }
            
            // Save the updated license key
            LicenseKey updatedKey = licenseKeyService.createLicenseKey(licenseKey);
            return ResponseEntity.ok(updatedKey);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Assigns a license key to a specific user.
     * Performs various validations including format check, existence check,
     * and verifies the license key is not already assigned and is active.
     * 
     * @param request JSON object containing the license key and user ID
     * @return Response entity with assignment result including success status and message
     */
    @PostMapping("/assign-to-user")
    public ResponseEntity<Map<String, Object>> assignLicenseKeyToUser(@RequestBody Map<String, String> request) {
        String licenseKey = request.get("licenseKey");
        String userId = request.get("userId");
        
        if (licenseKey == null || userId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "License key and user ID are required"
            ));
        }
        
        // Validate the license key format
        if (!licenseKeyService.validateLicenseKeyFormat(licenseKey)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid license key format"
            ));
        }
        
        // First check if the license key exists
        Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findByKey(licenseKey);
        if (licenseKeyOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "License key not found"
            ));
        }
        
        LicenseKey license = licenseKeyOpt.get();
        
        // Check if the license key is already in use
        if (license.getUser() != null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "License key is already assigned to a user"
            ));
        }
        
        // Check if the license key is not active
        if (!LicenseKey.Status.ACTIVE.equals(license.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "License key is not active"
            ));
        }
        
        // Assign the license key to the user
        boolean success = licenseKeyService.assignLicenseKeyToUser(licenseKey, userId);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "License key assigned successfully"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to assign license key to user"
            ));
        }
    }
} 