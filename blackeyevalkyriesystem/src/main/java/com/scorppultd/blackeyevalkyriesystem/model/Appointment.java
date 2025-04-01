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
    
    private String status; // pending, confirmed, completed, cancelled
    
    private String notes;
    
    private String doctorName;
    
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
} 