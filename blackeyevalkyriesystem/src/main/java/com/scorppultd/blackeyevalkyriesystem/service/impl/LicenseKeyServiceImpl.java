package com.scorppultd.blackeyevalkyriesystem.service.impl;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.repository.LicenseKeyRepository;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.regex.Pattern;

/**
 * Implementation of the LicenseKeyService interface.
 * This service manages license key operations including creation, validation,
 * expiration checks, assignment to users, and management functionalities.
 * License keys follow a specific format (AAAA-BBBB-CCCC-DDDD) with alphanumeric characters.
 */
@Service
public class LicenseKeyServiceImpl implements LicenseKeyService {

    private final LicenseKeyRepository licenseKeyRepository;
    private static final Pattern LICENSE_KEY_PATTERN = Pattern.compile("^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$");
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final Random random = new Random();
    
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LicenseKeyServiceImpl.class);

    /**
     * Constructs a new LicenseKeyServiceImpl with the required repository.
     *
     * @param licenseKeyRepository The repository for license key operations
     */
    @Autowired
    public LicenseKeyServiceImpl(LicenseKeyRepository licenseKeyRepository) {
        this.licenseKeyRepository = licenseKeyRepository;
    }

    /**
     * Validates a license key by checking its format, existence in the database,
     * and whether it's expired or active.
     *
     * @param licenseKey The license key string to validate
     * @return true if the license key is valid and active, false otherwise
     */
    @Override
    public boolean validateLicenseKey(String licenseKey) {
        // First validate the format
        if (!validateLicenseKeyFormat(licenseKey)) {
            return false;
        }
        
        // Then check if the key exists
        Optional<LicenseKey> licenseKeyOpt = licenseKeyRepository.findByKey(licenseKey);
        if (licenseKeyOpt.isEmpty()) {
            return false;
        }
        
        LicenseKey license = licenseKeyOpt.get();
        
        // Check if the license is expired and update its status if necessary
        if (isLicenseExpired(license)) {
            // If the license is expired, update status to Expired
            license.setStatus(LicenseKey.Status.EXPIRED);
            licenseKeyRepository.save(license);
            return false;
        }
        
        // Finally check if the license is active
        return LicenseKey.Status.ACTIVE.equals(license.getStatus());
    }
    
    /**
     * Check if a license key has expired
     * 
     * @param licenseKey The license key to check
     * @return true if the license has expired, false otherwise
     */
    @Override
    public boolean isLicenseExpired(LicenseKey licenseKey) {
        // If there is no expiration date, the license does not expire
        if (licenseKey.getExpiresOn() == null) {
            return false;
        }
        
        // Get current date in UTC
        LocalDate todayUtc = LocalDate.now();
        
        // Check if the expiration date is today or in the past
        return licenseKey.getExpiresOn().equals(todayUtc) || licenseKey.getExpiresOn().isBefore(todayUtc);
    }
    
    /**
     * Validate the license key format (AAAA-BBBB-CCCC-DDDD)
     * 
     * @param licenseKey The license key string to validate
     * @return true if the format is valid, false otherwise
     */
    @Override
    public boolean validateLicenseKeyFormat(String licenseKey) {
        return licenseKey != null && LICENSE_KEY_PATTERN.matcher(licenseKey).matches();
    }

    /**
     * Creates a new license key in the system after validating its format
     * and ensuring it doesn't already exist.
     *
     * @param licenseKey The license key object to create
     * @return The created license key
     * @throws IllegalArgumentException if the key format is invalid or the key already exists
     */
    @Override
    public LicenseKey createLicenseKey(LicenseKey licenseKey) {
        // Ensure the license key has the correct format
        if (!validateLicenseKeyFormat(licenseKey.getKey())) {
            throw new IllegalArgumentException("Invalid license key format. Must be AAAA-BBBB-CCCC-DDDD");
        }
        
        // Ensure the license key doesn't already exist
        if (licenseKeyRepository.existsByKey(licenseKey.getKey())) {
            throw new IllegalArgumentException("License key already exists");
        }
        
        // Set issuedOn to now if not set
        if (licenseKey.getIssuedOn() == null) {
            licenseKey.setIssuedOn(LocalDate.now());
        }
        
        // Set status to Active if not set
        if (licenseKey.getStatus() == null) {
            licenseKey.setStatus(LicenseKey.Status.ACTIVE);
        }
        
        // Save and return the license key
        return licenseKeyRepository.save(licenseKey);
    }

    /**
     * Finds a license key by its key value and updates its status
     * if it's expired.
     *
     * @param key The license key string to find
     * @return An Optional containing the license key if found, or empty if not found
     */
    @Override
    public Optional<LicenseKey> findByKey(String key) {
        Optional<LicenseKey> licenseKeyOpt = licenseKeyRepository.findByKey(key);
        
        // If license is found, check if it's expired and update if needed
        licenseKeyOpt.ifPresent(this::checkAndUpdateLicenseKeyExpiration);
        
        return licenseKeyOpt;
    }

    /**
     * Finds a license key by its ID and updates its status
     * if it's expired.
     *
     * @param id The ID of the license key to find
     * @return An Optional containing the license key if found, or empty if not found
     */
    @Override
    public Optional<LicenseKey> findById(String id) {
        Optional<LicenseKey> licenseKeyOpt = licenseKeyRepository.findById(id);
        
        // If license is found, check if it's expired and update if needed
        licenseKeyOpt.ifPresent(this::checkAndUpdateLicenseKeyExpiration);
        
        return licenseKeyOpt;
    }

    /**
     * Retrieves all license keys from the repository.
     *
     * @return A list of all license keys
     */
    @Override
    public List<LicenseKey> getAllLicenseKeys() {
        return licenseKeyRepository.findAll();
    }

    /**
     * Generates a new random license key in the format AAAA-BBBB-CCCC-DDDD
     * using alphanumeric characters. Ensures the generated key doesn't already
     * exist in the repository.
     *
     * @return A new unique license key string
     */
    @Override
    public String generateLicenseKey() {
        StringBuilder licenseKeyBuilder = new StringBuilder();
        
        // Generate 4 groups of 4 characters
        for (int group = 0; group < 4; group++) {
            for (int i = 0; i < 4; i++) {
                licenseKeyBuilder.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            
            // Add separator except after last group
            if (group < 3) {
                licenseKeyBuilder.append('-');
            }
        }
        
        String licenseKey = licenseKeyBuilder.toString();
        
        // Ensure the generated key doesn't already exist
        if (licenseKeyRepository.existsByKey(licenseKey)) {
            // Recursive call to generate a new key
            return generateLicenseKey();
        }
        
        return licenseKey;
    }

    /**
     * Assigns a license key to a specific user by updating the license key's
     * issuedTo and user fields, and setting its status to USED.
     *
     * @param licenseKey The license key string to assign
     * @param userId The ID of the user to assign the license key to
     * @return true if assignment was successful, false if the key doesn't exist or is expired
     */
    @Override
    public boolean assignLicenseKeyToUser(String licenseKey, String userId) {
        Optional<LicenseKey> licenseKeyOpt = licenseKeyRepository.findByKey(licenseKey);
        if (licenseKeyOpt.isEmpty()) {
            return false;
        }
        
        LicenseKey license = licenseKeyOpt.get();
        
        // Check if the license is expired
        if (isLicenseExpired(license)) {
            return false;
        }
        
        license.setIssuedTo(userId);
        license.setUser(userId);
        license.setStatus(LicenseKey.Status.USED);
        licenseKeyRepository.save(license);
        
        return true;
    }

    /**
     * Deactivates a license key by setting its status to DEACTIVATED.
     *
     * @param licenseKey The license key string to deactivate
     * @return true if deactivation was successful, false if the key doesn't exist
     */
    @Override
    public boolean deactivateLicenseKey(String licenseKey) {
        Optional<LicenseKey> licenseKeyOpt = licenseKeyRepository.findByKey(licenseKey);
        if (licenseKeyOpt.isEmpty()) {
            return false;
        }
        
        LicenseKey license = licenseKeyOpt.get();
        license.setStatus(LicenseKey.Status.DEACTIVATED);
        licenseKeyRepository.save(license);
        
        return true;
    }
    
    /**
     * Deletes a license key from the repository.
     *
     * @param licenseKey The license key object to delete
     */
    @Override
    public void deleteLicenseKey(LicenseKey licenseKey) {
        licenseKeyRepository.delete(licenseKey);
    }
    
    /**
     * Scheduled task to check for and deactivate expired license keys
     * Runs daily at 00:00 HKT (16:00 UTC)
     */
    @Scheduled(cron = "0 0 16 * * ?", zone = "UTC")
    public void checkAndDeactivateExpiredLicenses() {
        // Get current date in UTC
        LocalDate todayUtc = LocalDate.now();
        
        logger.info("Starting scheduled task to check for expired license keys");
        
        // Only fetch active license keys from the database
        List<LicenseKey> activeLicenses = licenseKeyRepository.findByStatus(LicenseKey.Status.ACTIVE);
        logger.info("Found {} active license keys to check", activeLicenses.size());
        
        int expiredCount = 0;
        for (LicenseKey license : activeLicenses) {
            if (checkAndUpdateExpiredLicense(license, todayUtc)) {
                expiredCount++;
            }
        }
        
        logger.info("Completed expired license key check. Found and updated {} expired licenses", expiredCount);
    }

    /**
     * Helper method to check and update an individual license key
     * 
     * @param license The license key to check
     * @param todayUtc The current date in UTC
     * @return true if the license was expired and updated, false otherwise
     */
    private boolean checkAndUpdateExpiredLicense(LicenseKey license, LocalDate todayUtc) {
        // Check if this license has expired
        if (license.getExpiresOn() != null && 
            (license.getExpiresOn().equals(todayUtc) || license.getExpiresOn().isBefore(todayUtc))) {
            license.setStatus(LicenseKey.Status.EXPIRED);
            licenseKeyRepository.save(license);
            logger.info("Marked license key as expired: {} (Key: {})", license.getId(), license.getKey());
            return true;
        }
        return false;
    }

    /**
     * Check all license keys (regardless of status) for expiration and update the database
     * @return The number of license keys that were updated
     */
    @Override
    public int checkAllLicenseKeysForExpiration() {
        // Get current date in UTC
        LocalDate todayUtc = LocalDate.now();
        logger.info("Starting manual check for all expired license keys");
        
        // Get all ACTIVE license keys only - exclude USED, EXPIRED, and DEACTIVATED
        List<LicenseKey> licenses = licenseKeyRepository.findAll().stream()
            .filter(license -> LicenseKey.Status.ACTIVE.equals(license.getStatus()))
            .toList();
        
        logger.info("Found {} active license keys to check", licenses.size());
        
        int expiredCount = 0;
        for (LicenseKey license : licenses) {
            if (checkAndUpdateExpiredLicense(license, todayUtc)) {
                expiredCount++;
            }
        }
        
        logger.info("Completed checking all license keys. Found and updated {} expired licenses", expiredCount);
        return expiredCount;
    }

    /**
     * Check a specific license key for expiration and update its status if needed
     * @param licenseKey The license key to check
     * @return true if the license key was expired and updated, false otherwise
     */
    @Override
    public boolean checkAndUpdateLicenseKeyExpiration(LicenseKey licenseKey) {
        // Only check ACTIVE licenses
        if (!LicenseKey.Status.ACTIVE.equals(licenseKey.getStatus())) {
            return false;
        }
        
        // Get current date in UTC
        LocalDate todayUtc = LocalDate.now();
        return checkAndUpdateExpiredLicense(licenseKey, todayUtc);
    }
} 