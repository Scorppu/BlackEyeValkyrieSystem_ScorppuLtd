package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;

/**
 * Entity representing a license key for the system.
 * License keys follow the format AAAA-BBBB-CCCC-DDDD.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "licenseKeys")
public class LicenseKey {
    
    @Id
    private String id;
    
    /**
     * The license key string in the format AAAA-BBBB-CCCC-DDDD
     */
    private String key;
    
    /**
     * The user ID this license key is issued to (optional)
     */
    private String issuedTo;
    
    /**
     * When this license key was issued
     */
    private LocalDate issuedOn;
    
    /**
     * When this license key expires
     */
    private LocalDate expiresOn;
    
    /**
     * Whether this license key is active
     */
    private boolean isActive;
} 