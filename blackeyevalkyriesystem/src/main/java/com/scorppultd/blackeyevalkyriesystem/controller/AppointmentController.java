package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;

/**
 * REST controller for managing appointments in the system.
 * Provides endpoints for creating, retrieving, updating, and deleting appointments.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    
    /**
     * Constructor for AppointmentController.
     * 
     * @param appointmentService The service that handles appointment business logic
     */
    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }
    
    /**
     * Retrieves all appointments.
     * 
     * @return ResponseEntity containing a list of all appointments
     */
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    /**
     * Retrieves an appointment by its ID.
     * 
     * @param id The ID of the appointment to retrieve
     * @return ResponseEntity containing the appointment if found, or NOT_FOUND status
     */
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable String id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        return appointment.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    /**
     * Retrieves all appointments for a specific doctor.
     * 
     * @param doctorName The name of the doctor
     * @return ResponseEntity containing a list of the doctor's appointments
     */
    @GetMapping("/doctor/{doctorName}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorName(@PathVariable String doctorName) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorName(doctorName);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    /**
     * Retrieves all appointments for a specific doctor after a specified time.
     * 
     * @param doctorName The name of the doctor
     * @param startTime The time after which to retrieve appointments
     * @return ResponseEntity containing a list of the doctor's appointments after the specified time
     */
    @GetMapping("/doctor/{doctorName}/after")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorNameAndAfterTime(
            @PathVariable String doctorName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorNameAndAfterTime(doctorName, startTime);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    /**
     * Retrieves all appointments for a specific doctor within a date range.
     * 
     * @param doctorName The name of the doctor
     * @param startTime The start time of the date range
     * @param endTime The end time of the date range
     * @return ResponseEntity containing a list of the doctor's appointments within the specified date range
     */
    @GetMapping("/doctor/{doctorName}/daterange")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorNameAndDateRange(
            @PathVariable String doctorName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorNameAndDateRange(doctorName, startTime, endTime);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    /**
     * Finds the next available time slot for a specific doctor.
     * 
     * @param doctorName The name of the doctor
     * @param requiredTime The required time slot duration in minutes
     * @return ResponseEntity containing the next available time slot as an ISO formatted string
     */
    @GetMapping("/doctor/{doctorName}/next-available")
    public ResponseEntity<Map<String, String>> getNextAvailableTimeSlot(
            @PathVariable String doctorName,
            @RequestParam Integer requiredTime) {
        LocalDateTime nextAvailable = appointmentService.findNextAvailableTimeSlot(doctorName, requiredTime);
        
        Map<String, String> response = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        response.put("nextAvailableTime", nextAvailable.format(formatter));
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    /**
     * Creates a new appointment.
     * 
     * @param appointment The appointment object to create
     * @return ResponseEntity containing the created appointment
     */
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }
    
    /**
     * Updates an existing appointment.
     * If status is set to "Completed" and completionTime is null, sets completionTime to current time.
     * 
     * @param id The ID of the appointment to update
     * @param appointment The updated appointment object
     * @return ResponseEntity containing the updated appointment, or NOT_FOUND status if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable String id, @RequestBody Appointment appointment) {
        Optional<Appointment> existingAppointment = appointmentService.getAppointmentById(id);
        if (!existingAppointment.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        appointment.setId(id);
        
        // If status is being set to "Completed", set the completion time
        if ("Completed".equals(appointment.getStatus()) && appointment.getCompletionTime() == null) {
            appointment.setCompletionTime(LocalDateTime.now());
        }
        
        Appointment updatedAppointment = appointmentService.updateAppointment(appointment);
        return new ResponseEntity<>(updatedAppointment, HttpStatus.OK);
    }
    
    /**
     * Deletes an appointment by its ID.
     * 
     * @param id The ID of the appointment to delete
     * @return ResponseEntity with NO_CONTENT status if successful, or INTERNAL_SERVER_ERROR if failed
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteAppointment(@PathVariable String id) {
        try {
            appointmentService.deleteAppointment(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 