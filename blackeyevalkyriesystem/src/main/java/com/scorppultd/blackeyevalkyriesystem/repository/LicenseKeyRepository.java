package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing LicenseKey entities
 */
@Repository
public interface LicenseKeyRepository extends MongoRepository<LicenseKey, String> {
    
    /**
     * Find a license key by its key string
     * 
     * @param key The license key string
     * @return Optional containing the license key if found
     */
    Optional<LicenseKey> findByKey(String key);
    
    /**
     * Check if a license key exists by key string
     * 
     * @param key The license key string
     * @return true if the key exists, false otherwise
     */
    boolean existsByKey(String key);
    
    /**
     * Check if a key is valid (exists, is active, and not expired)
     * 
     * @param key The license key string
     * @param isActive Whether the license key should be active
     * @return true if a valid license key exists with the given key
     */
    boolean existsByKeyAndIsActive(String key, boolean isActive);
} 