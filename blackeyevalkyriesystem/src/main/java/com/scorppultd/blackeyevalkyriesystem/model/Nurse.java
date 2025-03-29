package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@Document(collection = "users")
public class Nurse extends User {
    
    // Professional information
    private String nurseId;
    private String licenseNumber;
    private String nursingDegree;
    private String certification;
    private Integer yearsOfExperience;
    
    // Work information
    private String department;
    private String position;
    private List<String> specializations;
    private String supervisingDoctor;
    
    // Shift information
    private List<Shift> shifts;
    
    @Data
    public static class Shift {
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private String shiftType; // morning, evening, night
        
        public Shift() {
        }
        
        public Shift(String dayOfWeek, String startTime, String endTime, String shiftType) {
            this.dayOfWeek = dayOfWeek;
            this.startTime = startTime;
            this.endTime = endTime;
            this.shiftType = shiftType;
        }
    }
    
    // Constructor to set the role automatically
    public Nurse() {
        super();
        this.setRole(UserRole.NURSE);
    }
} 