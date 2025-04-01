package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentService {
    
    // Create an appointment
    Appointment createAppointment(Appointment appointment);
    
    // Get appointment by ID
    Optional<Appointment> getAppointmentById(String id);
    
    // Get all appointments
    List<Appointment> getAllAppointments();
    
    // Get appointments by patient ID
    List<Appointment> getAppointmentsByPatientId(String patientId);
    
    // Get appointments by status
    List<Appointment> getAppointmentsByStatus(String status);
    
    // Get appointments by doctor name
    List<Appointment> getAppointmentsByDoctorName(String doctorName);
    
    // Get appointments by doctor name after a specific time
    List<Appointment> getAppointmentsByDoctorNameAndAfterTime(String doctorName, LocalDateTime startTime);
    
    // Get appointments by doctor name in a date range
    List<Appointment> getAppointmentsByDoctorNameAndDateRange(String doctorName, LocalDateTime startTime, LocalDateTime endTime);
    
    // Find next available time slot for a doctor
    LocalDateTime findNextAvailableTimeSlot(String doctorName, Integer requiredTime);
    
    // Update an appointment
    Appointment updateAppointment(Appointment appointment);
    
    // Delete an appointment
    void deleteAppointment(String id);
} 