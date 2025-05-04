package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing license keys
 */
public interface LicenseKeyService {
    
    /**
     * Validate a license key
     * 
     * @param licenseKey The license key string to validate
     * @return true if the license key is valid, false otherwise
     */
    boolean validateLicenseKey(String licenseKey);
    
    /**
     * Validate the license key format (AAAA-BBBB-CCCC-DDDD)
     * 
     * @param licenseKey The license key string to validate
     * @return true if the format is valid, false otherwise
     */
    boolean validateLicenseKeyFormat(String licenseKey);
    
    /**
     * Check if a license key has expired
     * 
     * @param licenseKey The license key to check
     * @return true if the license has expired, false otherwise
     */
    boolean isLicenseExpired(LicenseKey licenseKey);
    
    /**
     * Create a new license key
     * 
     * @param licenseKey The license key to create
     * @return The created license key
     */
    LicenseKey createLicenseKey(LicenseKey licenseKey);
    
    /**
     * Find a license key by its key string
     * 
     * @param key The license key string
     * @return Optional containing the license key if found
     */
    Optional<LicenseKey> findByKey(String key);
    
    /**
     * Find a license key by its ID
     * 
     * @param id The license key ID
     * @return Optional containing the license key if found
     */
    Optional<LicenseKey> findById(String id);
    
    /**
     * Get all license keys
     * 
     * @return List of all license keys
     */
    List<LicenseKey> getAllLicenseKeys();
    
    /**
     * Generate a new license key string in the format AAAA-BBBB-CCCC-DDDD
     * 
     * @return A new license key string
     */
    String generateLicenseKey();
    
    /**
     * Assign a license key to a user
     * 
     * @param licenseKey The license key string
     * @param userId The user ID
     * @return true if the assignment was successful, false otherwise
     */
    boolean assignLicenseKeyToUser(String licenseKey, String userId);
    
    /**
     * Deactivate a license key
     * 
     * @param licenseKey The license key string
     * @return true if the deactivation was successful, false otherwise
     */
    boolean deactivateLicenseKey(String licenseKey);
    
    /**
     * Delete a license key
     * 
     * @param licenseKey The license key to delete
     */
    void deleteLicenseKey(LicenseKey licenseKey);
} 