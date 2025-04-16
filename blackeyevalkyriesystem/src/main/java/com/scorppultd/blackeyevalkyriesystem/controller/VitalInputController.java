package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment.VitalSigns;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/vital")
@PreAuthorize("hasAnyRole('ROLE_NURSE', 'ROLE_ADMIN')")
public class VitalInputController {
    
    private final AppointmentService appointmentService;
    
    @Autowired
    public VitalInputController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }
    
    @GetMapping("/list")
    public String vitalList(HttpServletRequest request, Model model) {
        // Add request to model for sidebar navigation
        model.addAttribute("request", request);
        
        // Get appointments with status 'pending', 'confirmed' or 'vitalChecked'
        List<Appointment> pendingAppointments = appointmentService.getAppointmentsByStatus("pending");
        List<Appointment> confirmedAppointments = appointmentService.getAppointmentsByStatus("confirmed");
        List<Appointment> vitalCheckedAppointments = appointmentService.getAppointmentsByStatus("vitalChecked");
        
        // Combine the lists
        List<Appointment> appointments = Stream.concat(
                Stream.concat(pendingAppointments.stream(), confirmedAppointments.stream()),
                vitalCheckedAppointments.stream())
            .collect(Collectors.toList());
        
        model.addAttribute("appointments", appointments);
        
        return "vital-list";
    }
    
    @GetMapping("/input/{id}")
    public String vitalInputForm(@PathVariable String id, HttpServletRequest request, Model model) {
        // Add request to model for sidebar navigation
        model.addAttribute("request", request);
        
        // Get the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isEmpty()) {
            return "redirect:/vital/list?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Create empty vital signs if not exists
        if (appointment.getVitalSigns() == null) {
            appointment.setVitalSigns(new VitalSigns());
        }
        
        model.addAttribute("appointment", appointment);
        
        return "vital-input";
    }
    
    @PostMapping("/input/{id}")
    public String saveVitals(
            @PathVariable String id,
            @RequestParam(required = false) Double temperature,
            @RequestParam(required = false) Integer lowBloodPressure,
            @RequestParam(required = false) Integer highBloodPressure,
            @RequestParam(required = false) Integer heartRate,
            @RequestParam(required = false) Integer respiratoryRate,
            @RequestParam(required = false) Double oxygenSaturation,
            @RequestParam(required = false) Double weight,
            @RequestParam(required = false) Double height,
            HttpServletRequest request) {
        
        // Get the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isEmpty()) {
            return "redirect:/vital/list?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Create vital signs if not exists
        VitalSigns vitalSigns = appointment.getVitalSigns();
        if (vitalSigns == null) {
            vitalSigns = new VitalSigns();
            appointment.setVitalSigns(vitalSigns);
        }
        
        // Set vital signs
        vitalSigns.setTemperature(temperature);
        vitalSigns.setLowBloodPressure(lowBloodPressure);
        vitalSigns.setHighBloodPressure(highBloodPressure);
        vitalSigns.setHeartRate(heartRate);
        vitalSigns.setRespiratoryRate(respiratoryRate);
        vitalSigns.setOxygenSaturation(oxygenSaturation);
        vitalSigns.setWeight(weight);
        vitalSigns.setHeight(height);
        
        // Calculate BMI if height and weight are provided
        if (height != null && weight != null) {
            vitalSigns.calculateBmi();
        }
        
        // Update appointment status to vitalChecked if all vital signs are filled
        if (isAllVitalSigned(vitalSigns)) {
            appointment.setStatus("vitalChecked");
        }
        
        // Save the appointment
        appointmentService.updateAppointment(appointment);
        
        return "redirect:/vital/list?success=vitalSaved";
    }
    
    /**
     * Check if all vital signs are filled
     */
    private boolean isAllVitalSigned(VitalSigns vitalSigns) {
        return vitalSigns.getTemperature() != null &&
               vitalSigns.getLowBloodPressure() != null &&
               vitalSigns.getHighBloodPressure() != null &&
               vitalSigns.getHeartRate() != null &&
               vitalSigns.getRespiratoryRate() != null &&
               vitalSigns.getOxygenSaturation() != null &&
               vitalSigns.getWeight() != null &&
               vitalSigns.getHeight() != null;
    }
    
    /**
     * REST API to get appointment list
     */
    @GetMapping("/api/appointments/pending")
    @ResponseBody
    public ResponseEntity<List<Appointment>> getPendingAppointments() {
        // Get appointments with status 'pending', 'confirmed' or 'vitalChecked'
        List<Appointment> pendingAppointments = appointmentService.getAppointmentsByStatus("pending");
        List<Appointment> confirmedAppointments = appointmentService.getAppointmentsByStatus("confirmed");
        List<Appointment> vitalCheckedAppointments = appointmentService.getAppointmentsByStatus("vitalChecked");
        
        // Combine the lists
        List<Appointment> appointments = Stream.concat(
                Stream.concat(pendingAppointments.stream(), confirmedAppointments.stream()),
                vitalCheckedAppointments.stream())
            .collect(Collectors.toList());
        
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    /**
     * REST API to update vital signs
     */
    @PostMapping("/api/appointments/{id}/vitals")
    @ResponseBody
    public ResponseEntity<?> updateVitalSigns(
            @PathVariable String id,
            @RequestBody VitalSigns vitalSigns) {
        
        // Get the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isEmpty()) {
            return new ResponseEntity<>("Appointment not found", HttpStatus.NOT_FOUND);
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Set vital signs
        appointment.setVitalSigns(vitalSigns);
        
        // Calculate BMI if height and weight are provided
        if (vitalSigns.getHeight() != null && vitalSigns.getWeight() != null) {
            vitalSigns.calculateBmi();
        }
        
        // Update appointment status to vitalChecked if all vital signs are filled
        if (isAllVitalSigned(vitalSigns)) {
            appointment.setStatus("vitalChecked");
        }
        
        // Save the appointment
        appointmentService.updateAppointment(appointment);
        
        return new ResponseEntity<>(appointment, HttpStatus.OK);
    }
} 