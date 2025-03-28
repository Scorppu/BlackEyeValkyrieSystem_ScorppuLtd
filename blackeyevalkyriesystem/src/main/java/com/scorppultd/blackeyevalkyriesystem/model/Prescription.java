package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "prescriptions")
public class Prescription {
    
    @Id
    private String id;

    private String status;
    private String patientId;
    private String doctorId;
    private LocalDate prescriptionDate;
    private List<PrescriptionItem> prescriptionItems;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionItem {
        @DBRef
        private Drug drug;
        
        private String dosage;
        private String frequency; // e.g., "3 times daily", "every 8 hours"
        private String duration; // e.g., "7 days", "1 month"
        private String instructions; // e.g., "Take after meals", "Avoid alcohol"
        private Integer quantity;
        private Boolean refillable;
        private Integer refillsRemaining;
    }
}