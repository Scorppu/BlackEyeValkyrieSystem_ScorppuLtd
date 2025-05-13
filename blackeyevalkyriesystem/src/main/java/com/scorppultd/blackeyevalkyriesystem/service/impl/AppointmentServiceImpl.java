package com.scorppultd.blackeyevalkyriesystem.service.impl;

import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.repository.AppointmentRepository;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Implementation of the Appointment Service.
 * This service handles all appointment-related operations including creating,
 * retrieving, updating, and deleting appointments, as well as finding available time slots.
 */
@Service
public class AppointmentServiceImpl implements AppointmentService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    /**
     * Creates a new appointment in the system.
     * 
     * @param appointment The appointment object to be created
     * @return The saved appointment with generated ID
     * @throws Exception If there's an error while saving the appointment
     */
    @Override
    public Appointment createAppointment(Appointment appointment) {
        System.out.println("Saving appointment: " + appointment);
        try {
            Appointment savedAppointment = appointmentRepository.save(appointment);
            System.out.println("Successfully saved appointment with ID: " + savedAppointment.getId());
            return savedAppointment;
        } catch (Exception e) {
            System.err.println("Error in service layer while saving appointment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Retrieves an appointment by its ID.
     * 
     * @param id The ID of the appointment to retrieve
     * @return An Optional containing the appointment if found, empty otherwise
     */
    @Override
    public Optional<Appointment> getAppointmentById(String id) {
        return appointmentRepository.findById(id);
    }
    
    /**
     * Retrieves all appointments from the database.
     * 
     * @return A list of all appointments
     */
    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
    
    /**
     * Retrieves all appointments for a specific patient.
     * 
     * @param patientId The ID of the patient
     * @return A list of appointments for the patient
     */
    @Override
    public List<Appointment> getAppointmentsByPatientId(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }
    
    /**
     * Retrieves all appointments with a specific status.
     * 
     * @param status The status to filter by
     * @return A list of appointments with the specified status
     */
    @Override
    public List<Appointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status);
    }
    
    /**
     * Retrieves all appointments for a specific doctor.
     * 
     * @param doctorName The name of the doctor
     * @return A list of appointments for the doctor
     */
    @Override
    public List<Appointment> getAppointmentsByDoctorName(String doctorName) {
        return appointmentRepository.findByDoctorName(doctorName);
    }
    
    /**
     * Retrieves all appointments for a doctor scheduled after a specific time.
     * 
     * @param doctorName The name of the doctor
     * @param startTime The start time after which to find appointments
     * @return A list of appointments for the doctor after the specified time
     */
    @Override
    public List<Appointment> getAppointmentsByDoctorNameAndAfterTime(String doctorName, LocalDateTime startTime) {
        return appointmentRepository.findByDoctorNameAndScheduledTimeGreaterThanEqual(doctorName, startTime);
    }
    
    /**
     * Retrieves all appointments for a doctor within a specific date range.
     * 
     * @param doctorName The name of the doctor
     * @param startTime The start of the date range
     * @param endTime The end of the date range
     * @return A list of appointments for the doctor within the date range
     */
    @Override
    public List<Appointment> getAppointmentsByDoctorNameAndDateRange(String doctorName, LocalDateTime startTime, LocalDateTime endTime) {
        return appointmentRepository.findByDoctorNameAndScheduledTimeBetween(doctorName, startTime, endTime);
    }
    
    /**
     * Finds the next available time slot for a doctor based on existing appointments.
     * Works within office hours (9 AM to 5 PM) and searches up to 7 days in advance.
     * 
     * @param doctorName The name of the doctor
     * @param requiredTime The duration needed for the appointment in minutes
     * @return The next available time slot as a LocalDateTime
     */
    @Override
    public LocalDateTime findNextAvailableTimeSlot(String doctorName, Integer requiredTime) {
        // Get current time as starting point
        LocalDateTime now = LocalDateTime.now();
        // For simplicity, round up to the nearest half hour
        LocalDateTime startTime = now;
        if (now.getMinute() < 30) {
            startTime = now.withMinute(30).withSecond(0).withNano(0);
        } else {
            startTime = now.plusHours(1).withMinute(0).withSecond(0).withNano(0);
        }
        
        // Working hours: 9 AM to 5 PM
        LocalTime workStartTime = LocalTime.of(9, 0);
        LocalTime workEndTime = LocalTime.of(17, 0);
        
        // If current time is outside of working hours, adjust to next working day
        if (startTime.toLocalTime().isBefore(workStartTime)) {
            startTime = startTime.withHour(workStartTime.getHour()).withMinute(workStartTime.getMinute());
        } else if (startTime.toLocalTime().isAfter(workEndTime)) {
            startTime = startTime.plusDays(1).withHour(workStartTime.getHour()).withMinute(workStartTime.getMinute());
        }
        
        // Get all future appointments for this doctor
        List<Appointment> doctorAppointments = getAppointmentsByDoctorNameAndAfterTime(doctorName, startTime);
        
        // Sort appointments by scheduled time
        doctorAppointments.sort(Comparator.comparing(Appointment::getScheduledTime));
        
        // Try to find a slot within the next 7 days
        LocalDateTime endTimeWindow = startTime.plusDays(7);
        
        // Starting from startTime, check each potential slot
        LocalDateTime potentialSlot = startTime;
        while (potentialSlot.isBefore(endTimeWindow)) {
            // Skip non-working hours
            if (potentialSlot.toLocalTime().isBefore(workStartTime)) {
                potentialSlot = potentialSlot.withHour(workStartTime.getHour()).withMinute(workStartTime.getMinute());
                continue;
            }
            if (potentialSlot.toLocalTime().isAfter(workEndTime) || 
                (potentialSlot.toLocalTime().plusMinutes(requiredTime).isAfter(workEndTime))) {
                potentialSlot = potentialSlot.plusDays(1).withHour(workStartTime.getHour()).withMinute(workStartTime.getMinute());
                continue;
            }
            
            // Check if this slot conflicts with any existing appointment
            boolean hasConflict = false;
            LocalDateTime potentialEndTime = potentialSlot.plusMinutes(requiredTime);
            
            for (Appointment appointment : doctorAppointments) {
                LocalDateTime existingStartTime = appointment.getScheduledTime();
                LocalDateTime existingEndTime = existingStartTime.plusMinutes(appointment.getRequiredTime());
                
                // Check for overlap
                if (!(potentialEndTime.isBefore(existingStartTime) || potentialSlot.isAfter(existingEndTime))) {
                    hasConflict = true;
                    // Move potential slot to after this appointment
                    potentialSlot = existingEndTime;
                    break;
                }
            }
            
            // If no conflict found, we've found an available slot
            if (!hasConflict) {
                return potentialSlot;
            }
        }
        
        // If no slot found within 7 days, return the next working day start
        return endTimeWindow.plusDays(1).withHour(workStartTime.getHour()).withMinute(workStartTime.getMinute());
    }
    
    /**
     * Updates an existing appointment in the system.
     * 
     * @param appointment The appointment object with updated fields
     * @return The updated appointment
     */
    @Override
    public Appointment updateAppointment(Appointment appointment) {
        System.out.println("Updating appointment: " + appointment);
        return appointmentRepository.save(appointment);
    }
    
    /**
     * Deletes an appointment from the system by its ID.
     * 
     * @param id The ID of the appointment to delete
     */
    @Override
    public void deleteAppointment(String id) {
        appointmentRepository.deleteById(id);
    }
} 