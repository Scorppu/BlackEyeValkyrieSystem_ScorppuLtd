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

@Service
public class AppointmentServiceImpl implements AppointmentService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
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
    
    @Override
    public Optional<Appointment> getAppointmentById(String id) {
        return appointmentRepository.findById(id);
    }
    
    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
    
    @Override
    public List<Appointment> getAppointmentsByPatientId(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }
    
    @Override
    public List<Appointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status);
    }
    
    @Override
    public List<Appointment> getAppointmentsByDoctorName(String doctorName) {
        return appointmentRepository.findByDoctorName(doctorName);
    }
    
    @Override
    public List<Appointment> getAppointmentsByDoctorNameAndAfterTime(String doctorName, LocalDateTime startTime) {
        return appointmentRepository.findByDoctorNameAndScheduledTimeGreaterThanEqual(doctorName, startTime);
    }
    
    @Override
    public List<Appointment> getAppointmentsByDoctorNameAndDateRange(String doctorName, LocalDateTime startTime, LocalDateTime endTime) {
        return appointmentRepository.findByDoctorNameAndScheduledTimeBetween(doctorName, startTime, endTime);
    }
    
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
    
    @Override
    public Appointment updateAppointment(Appointment appointment) {
        System.out.println("Updating appointment: " + appointment);
        return appointmentRepository.save(appointment);
    }
    
    @Override
    public void deleteAppointment(String id) {
        appointmentRepository.deleteById(id);
    }
} 