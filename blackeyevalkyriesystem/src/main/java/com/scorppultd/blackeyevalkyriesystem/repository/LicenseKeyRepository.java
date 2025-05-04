package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
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
     * Check if a key is valid with a specific status
     * 
     * @param key The license key string
     * @param status The status of the license key
     * @return true if a valid license key exists with the given key and status
     */
    boolean existsByKeyAndStatus(String key, String status);
    
    /**
     * Find license keys by status
     * 
     * @param status The status to search for
     * @return List of license keys with the given status
     */
    List<LicenseKey> findByStatus(String status);
    
    /**
     * Find license keys by role
     * 
     * @param role The role to search for
     * @return List of license keys with the given role
     */
    List<LicenseKey> findByRole(String role);
    
    /**
     * Find license keys by user
     * 
     * @param user The user ID to search for
     * @return List of license keys assigned to the given user
     */
    List<LicenseKey> findByUser(String user);
} 