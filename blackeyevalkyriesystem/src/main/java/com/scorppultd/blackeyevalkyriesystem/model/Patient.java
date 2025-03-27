package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "patients")
public class Patient {
    
    @Id
    private String id;
    
    private String firstName;
    private String lastName;
    private Boolean sex;
    private LocalDate dateOfBirth;
    private Integer age;
    private String relativeName;
    private String maritalStatus;
    private String bloodType;
    private List<Drug> drugAllergies;
    private List<Visit> visits;

    // Date fields
    private LocalDate createDate;
    private LocalDate updateDate;

    // Status field to track admitted/discharged status
    private String status;
    
    // Additional fields that might be needed later
    private String contactNumber;
    private String email;
    
    // Address information as a nested document
    private Address address;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String addressLine1;
        private String addressLine2;
        private String addressLine3;
        private String country;
        private String state;
        private String town;
        private String pinCode;
    }
} 