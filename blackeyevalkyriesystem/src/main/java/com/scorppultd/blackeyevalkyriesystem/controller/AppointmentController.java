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

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    
    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }
    
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable String id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        return appointment.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @GetMapping("/doctor/{doctorName}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorName(@PathVariable String doctorName) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorName(doctorName);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/doctor/{doctorName}/after")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorNameAndAfterTime(
            @PathVariable String doctorName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorNameAndAfterTime(doctorName, startTime);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/doctor/{doctorName}/daterange")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorNameAndDateRange(
            @PathVariable String doctorName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorNameAndDateRange(doctorName, startTime, endTime);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
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
    
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable String id, @RequestBody Appointment appointment) {
        Optional<Appointment> existingAppointment = appointmentService.getAppointmentById(id);
        if (!existingAppointment.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        appointment.setId(id);
        Appointment updatedAppointment = appointmentService.updateAppointment(appointment);
        return new ResponseEntity<>(updatedAppointment, HttpStatus.OK);
    }
    
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