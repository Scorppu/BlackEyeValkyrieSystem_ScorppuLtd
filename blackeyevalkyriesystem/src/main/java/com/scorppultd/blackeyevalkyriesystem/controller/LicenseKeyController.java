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
            // Update the license to inactive
            licenseKeyService.deactivateLicenseKey(licenseKey);
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "License key has expired"
            ));
        }
        
        // Check if the license key is active
        if (!license.isActive()) {
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "message", "License key is inactive"
            ));
        }
        
        // License key is valid
        return ResponseEntity.ok(Map.of(
            "valid", true,
            "message", "License key is valid"
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
        
        // Parse request parameters if provided
        if (request != null) {
            // Parse expiration date
            if (request.containsKey("expiresInDays")) {
                int expiresInDays = (int) request.get("expiresInDays");
                expiresOn = LocalDate.now().plusDays(expiresInDays);
            }
        }
        
        // Generate the license key
        String key = licenseKeyService.generateLicenseKey();
        
        // Create and save the license key
        LicenseKey licenseKey = LicenseKey.builder()
                .key(key)
                .issuedOn(LocalDate.now())
                .expiresOn(expiresOn)
                .isActive(true)
                .build();
        
        LicenseKey savedLicenseKey = licenseKeyService.createLicenseKey(licenseKey);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "licenseKey", savedLicenseKey.getKey(),
            "expiresOn", savedLicenseKey.getExpiresOn()
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
} 