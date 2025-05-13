package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "consultations")
public class Consultation {
    
    @Id
    private String id;
    
    @DBRef
    private Doctor doctor;
    @DBRef
    private Patient patient;
    
    private LocalDateTime consultationDateTime;
    private LocalDate followUpDate;
    private String consultationType; // Regular, Emergency, Follow-up
    private Integer durationMinutes;
    private String status; // Scheduled, In-Progress, Completed, Cancelled
    
    // Vitals
    private VitalSigns vitalSigns;
    
    // Clinical information
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private List<String> symptoms;
    private String physicalExamination;
    
    // Diagnosis and treatment - simplified to a single string
    private String diagnosis;
    private String treatmentPlan;
    private String clinicalNotes;
    
    // Prescription reference
    @DBRef
    private Prescription prescription;
    
    // Reference to the original appointment
    private String appointmentId;
    
    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VitalSigns {
        private Double temperature;
        private String bloodPressure;
        private Integer heartRate;
        private Integer respiratoryRate;
        private Double oxygenSaturation;
        private Double weight;
        private Double height;
        private Double bmi;
    }
} 