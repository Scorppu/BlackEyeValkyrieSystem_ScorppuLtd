package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    private String firstName;
    private String lastName;
    private String email;
    private String username;
    private String password;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String sex;
    private String licenseKey;
    
    // Role identifier
    private UserRole role;
    
    // Account status
    private boolean active;
    private LocalDate createdDate;
    private LocalDate lastLoginDate;
    
    // Address information
    private Address address;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String country;
        private String postalCode;
    }
    
    // Enum for user roles
    public enum UserRole {
        ADMIN,
        DOCTOR,
        NURSE
    }
} 