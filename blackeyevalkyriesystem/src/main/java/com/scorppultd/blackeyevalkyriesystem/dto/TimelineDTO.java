package com.scorppultd.blackeyevalkyriesystem.dto;

import java.util.List;

public class TimelineDTO {
    private List<DoctorScheduleDTO> doctors;
    
    public TimelineDTO() {
    }
    
    public TimelineDTO(List<DoctorScheduleDTO> doctors) {
        this.doctors = doctors;
    }
    
    public List<DoctorScheduleDTO> getDoctors() {
        return doctors;
    }
    
    public void setDoctors(List<DoctorScheduleDTO> doctors) {
        this.doctors = doctors;
    }
    
    public static class DoctorScheduleDTO {
        private String id;
        private String name;
        private List<AppointmentDTO> appointments;
        
        public DoctorScheduleDTO() {
        }
        
        public DoctorScheduleDTO(String id, String name, List<AppointmentDTO> appointments) {
            this.id = id;
            this.name = name;
            this.appointments = appointments;
        }
        
        public String getId() {
            return id;
        }
        
        public void setId(String id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public List<AppointmentDTO> getAppointments() {
            return appointments;
        }
        
        public void setAppointments(List<AppointmentDTO> appointments) {
            this.appointments = appointments;
        }
    }
    
    public static class AppointmentDTO {
        private String id;
        private String patientName;
        private String startTime;
        private Integer duration;
        private String type;
        
        public AppointmentDTO() {
        }
        
        public AppointmentDTO(String id, String patientName, String startTime, Integer duration, String type) {
            this.id = id;
            this.patientName = patientName;
            this.startTime = startTime;
            this.duration = duration;
            this.type = type;
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
        
        public String getStartTime() {
            return startTime;
        }
        
        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }
        
        public Integer getDuration() {
            return duration;
        }
        
        public void setDuration(Integer duration) {
            this.duration = duration;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
    }
} 