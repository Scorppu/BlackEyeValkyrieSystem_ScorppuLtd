package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
     * When this license key expires (date only)
     */
    private LocalDate expiresOn;
    
    /**
     * Status of the license key: Active, Used, Expired, Deactivated
     */
    private String status;
    
    /**
     * Role for the user that will be created with this license key: admin, doctor, nurse
     * All role values are stored in lowercase for consistent comparison
     */
    private String role;
    
    /**
     * The user ID of the user who used this license key
     */
    private String user;
    
    /**
     * Enum for license key status values
     */
    public static class Status {
        public static final String ACTIVE = "Active";
        public static final String USED = "Used";
        public static final String EXPIRED = "Expired";
        public static final String DEACTIVATED = "Deactivated";
    }
    
    /**
     * Enum for license key role values
     */
    public static class Role {
        public static final String ADMIN = "admin";
        public static final String DOCTOR = "doctor";
        public static final String NURSE = "nurse";
    }
} 