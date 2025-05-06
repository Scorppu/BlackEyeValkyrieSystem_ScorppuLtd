package com.scorppultd.blackeyevalkyriesystem.dto;

public class PendingAppointmentDTO {
    private String id;
    private String patientName;
    private String doctor;
    private String appointmentType;
    private String scheduledTime;
    private Integer duration;
    private String priority;
    private String status;
    
    public PendingAppointmentDTO() {
    }
    
    public PendingAppointmentDTO(String id, String patientName, String doctor, String appointmentType, 
                                String scheduledTime, Integer duration, String priority, String status) {
        this.id = id;
        this.patientName = patientName;
        this.doctor = doctor;
        this.appointmentType = appointmentType;
        this.scheduledTime = scheduledTime;
        this.duration = duration;
        this.priority = priority;
        this.status = status;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getPatientName() {
        return patientName;
    }
    
    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }
    
    public String getDoctor() {
        return doctor;
    }
    
    public void setDoctor(String doctor) {
        this.doctor = doctor;
    }
    
    public String getAppointmentType() {
        return appointmentType;
    }
    
    public void setAppointmentType(String appointmentType) {
        this.appointmentType = appointmentType;
    }
    
    public String getScheduledTime() {
        return scheduledTime;
    }
    
    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
    
    public Integer getDuration() {
        return duration;
    }
    
    public void setDuration(Integer duration) {
        this.duration = duration;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
} 