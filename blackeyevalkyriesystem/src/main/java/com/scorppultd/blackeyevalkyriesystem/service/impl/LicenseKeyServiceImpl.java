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
 * Implementation of the LicenseKeyService interface
 */
@Service
public class LicenseKeyServiceImpl implements LicenseKeyService {

    private final LicenseKeyRepository licenseKeyRepository;
    private static final Pattern LICENSE_KEY_PATTERN = Pattern.compile("^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$");
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final Random random = new Random();

    @Autowired
    public LicenseKeyServiceImpl(LicenseKeyRepository licenseKeyRepository) {
        this.licenseKeyRepository = licenseKeyRepository;
    }

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
        
        // Check if the expiration date is in the past
        return licenseKey.getExpiresOn().isBefore(LocalDateTime.now());
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

    @Override
    public Optional<LicenseKey> findByKey(String key) {
        return licenseKeyRepository.findByKey(key);
    }

    @Override
    public Optional<LicenseKey> findById(String id) {
        return licenseKeyRepository.findById(id);
    }

    @Override
    public List<LicenseKey> getAllLicenseKeys() {
        return licenseKeyRepository.findAll();
    }

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
    
    @Override
    public void deleteLicenseKey(LicenseKey licenseKey) {
        licenseKeyRepository.delete(licenseKey);
    }
    
    /**
     * Scheduled task to check for and deactivate expired license keys
     * Runs daily at midnight
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void checkAndDeactivateExpiredLicenses() {
        LocalDateTime now = LocalDateTime.now();
        List<LicenseKey> allLicenses = licenseKeyRepository.findAll();
        
        for (LicenseKey license : allLicenses) {
            // Skip already inactive or expired licenses
            if (!LicenseKey.Status.ACTIVE.equals(license.getStatus())) {
                continue;
            }
            
            // Check if this license has expired
            if (license.getExpiresOn() != null && license.getExpiresOn().isBefore(now)) {
                license.setStatus(LicenseKey.Status.EXPIRED);
                licenseKeyRepository.save(license);
                System.out.println("Expired license key: " + license.getKey());
            }
        }
    }
} 