package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@Document(collection = "users")
public class Doctor extends User {
    
    // Medical qualifications
    private String doctorId;
    private String specialization;
    private String licenseNumber;
    private List<String> qualifications;
    private Integer yearsOfExperience;
    
    // Work information
    private String department;
    private String position;
    private String officeNumber;
    private String consultationFee;
    
    // Schedule information
    private List<Schedule> schedules;
    
    @Data
    @NoArgsConstructor
    public static class Schedule {
        private String dayOfWeek;
        private String startTime;
        private String endTime;
        private Integer maxAppointments;
        
        public Schedule(String dayOfWeek, String startTime, String endTime, Integer maxAppointments) {
            this.dayOfWeek = dayOfWeek;
            this.startTime = startTime;
            this.endTime = endTime;
            this.maxAppointments = maxAppointments;
        }
    }
    
    // Constructor to set the role automatically
    public Doctor() {
        super();
        this.setRole(UserRole.DOCTOR);
    }
} 