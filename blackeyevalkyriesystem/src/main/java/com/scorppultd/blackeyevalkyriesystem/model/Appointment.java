package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import java.time.LocalDateTime;

@Document(collection = "appointments")
public class Appointment {
    
    @Id
    private String id;
    
    @DBRef
    private Patient patient;
    
    private Integer requiredTime; // in minutes
    
    private String appointmentType;
    
    private String appointmentPriority;
    
    private LocalDateTime creationTime;
    
    private LocalDateTime scheduledTime;
    
    private String status; // pending, confirmed, vitalChecked, completed, cancelled
    
    private LocalDateTime completionTime;
    
    private String notes;
    
    private String doctorName;
    
    // Add vital signs to the appointment
    private VitalSigns vitalSigns;
    
    // Default constructor
    public Appointment() {
        this.creationTime = LocalDateTime.now();
        this.status = "pending";
    }
    
    // Constructor with essential fields
    public Appointment(Patient patient, Integer requiredTime, String appointmentType, 
                      String appointmentPriority) {
        this();
        this.patient = patient;
        this.requiredTime = requiredTime;
        this.appointmentType = appointmentType;
        this.appointmentPriority = appointmentPriority;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public Patient getPatient() {
        return patient;
    }
    
    public void setPatient(Patient patient) {
        this.patient = patient;
    }
    
    public Integer getRequiredTime() {
        return requiredTime;
    }
    
    public void setRequiredTime(Integer requiredTime) {
        this.requiredTime = requiredTime;
    }
    
    public String getAppointmentType() {
        return appointmentType;
    }
    
    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }
    
    public String getAppointmentPriority() {
        return appointmentPriority;
    }
    
    public void setAppointmentPriority(String appointmentPriority) {
        this.appointmentPriority = appointmentPriority;
    }
    
    public LocalDateTime getCreationTime() {
        return creationTime;
    }
    
    public void setCreationTime(LocalDateTime creationTime) {
        this.creationTime = creationTime;
    }
    
    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }
    
    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
    
    public LocalDateTime getCompletionTime() {
        return completionTime;
    }
    
    public void setCompletionTime(LocalDateTime completionTime) {
        this.completionTime = completionTime;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getDoctorName() {
        return doctorName;
    }
    
    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }
    
    public VitalSigns getVitalSigns() {
        return vitalSigns;
    }
    
    public void setVitalSigns(VitalSigns vitalSigns) {
        this.vitalSigns = vitalSigns;
    }

    public static class VitalSigns {
        private Double temperature;
        private Integer lowBloodPressure;
        private Integer highBloodPressure;
        private Integer heartRate;
        private Integer respiratoryRate;
        private Double oxygenSaturation;
        private Double weight;
        private Double height;
        private Double bmi;

        public VitalSigns() {
            // Default constructor
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public Integer getLowBloodPressure() {
            return lowBloodPressure;
        }

        public void setLowBloodPressure(Integer lowBloodPressure) {
            this.lowBloodPressure = lowBloodPressure;
        }

        public Integer getHighBloodPressure() {
            return highBloodPressure;
        }

        public void setHighBloodPressure(Integer highBloodPressure) {
            this.highBloodPressure = highBloodPressure;
        }

        public Integer getHeartRate() {
            return heartRate;
        }

        public void setHeartRate(Integer heartRate) {
            this.heartRate = heartRate;
        }

        public Integer getRespiratoryRate() {
            return respiratoryRate;
        }

        public void setRespiratoryRate(Integer respiratoryRate) {
            this.respiratoryRate = respiratoryRate;
        }

        public Double getOxygenSaturation() {
            return oxygenSaturation;
        }

        public void setOxygenSaturation(Double oxygenSaturation) {
            this.oxygenSaturation = oxygenSaturation;
        }

        public Double getWeight() {
            return weight;
        }

        public void setWeight(Double weight) {
            this.weight = weight;
        }

        public Double getHeight() {
            return height;
        }

        public void setHeight(Double height) {
            this.height = height;
        }

        public Double getBmi() {
            return bmi;
        }

        public void setBmi(Double bmi) {
            this.bmi = bmi;
        }

        // Calculate BMI from height and weight
        public void calculateBmi() {
            if (this.height != null && this.weight != null && this.height > 0) {
                // BMI = weight (kg) / (height (m))^2
                double heightInMeters = this.height / 100.0; // Convert cm to m
                this.bmi = this.weight / (heightInMeters * heightInMeters);
                // Round to 1 decimal place
                this.bmi = Math.round(this.bmi * 10) / 10.0;
            }
        }
    }
} 