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

/**
 * Controller responsible for handling vital signs input for appointments.
 * This controller manages the viewing and updating of vital signs for patients.
 * Only users with NURSE or ADMIN roles are authorized to access these endpoints.
 */
@Controller
@RequestMapping("/vital")
@PreAuthorize("hasAnyRole('ROLE_NURSE', 'ROLE_ADMIN')")
public class VitalInputController {
    
    private final AppointmentService appointmentService;
    
    /**
     * Constructs a VitalInputController with the required service.
     * 
     * @param appointmentService Service for managing appointment data
     */
    @Autowired
    public VitalInputController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }
    
    /**
     * Displays a list of appointments that require or have had vital signs checked.
     * Shows appointments with status 'pending', 'confirmed', or 'vitalChecked'.
     * 
     * @param request HTTP request for sidebar navigation
     * @param model Model to add attributes for the view
     * @return The view name for displaying the vital signs list
     */
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
    
    /**
     * Displays the form for inputting vital signs for a specific appointment.
     * Initializes empty vital signs if none exist for the appointment.
     * 
     * @param id The appointment ID
     * @param request HTTP request for sidebar navigation
     * @param model Model to add attributes for the view
     * @return The view name for the vital signs input form or a redirect if appointment not found
     */
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
    
    /**
     * Processes the submitted vital signs form data and updates the appointment.
     * Calculates BMI if height and weight are provided.
     * Updates appointment status to 'vitalChecked' if all vital signs are filled.
     * 
     * @param id The appointment ID
     * @param temperature Patient's body temperature
     * @param lowBloodPressure Patient's diastolic blood pressure
     * @param highBloodPressure Patient's systolic blood pressure
     * @param heartRate Patient's heart rate
     * @param respiratoryRate Patient's respiratory rate
     * @param oxygenSaturation Patient's oxygen saturation level
     * @param weight Patient's weight
     * @param height Patient's height
     * @param request HTTP request
     * @return Redirect to the vital signs list with success or error message
     */
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
     * Checks if all vital signs fields have been filled.
     * Used to determine if the appointment status should be updated.
     * 
     * @param vitalSigns The vital signs object to check
     * @return true if all vital sign fields are filled, false otherwise
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
     * REST API endpoint to get a list of appointments requiring vital signs.
     * Returns appointments with status 'pending', 'confirmed', or 'vitalChecked'.
     * 
     * @return ResponseEntity containing the list of appointments
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
     * REST API endpoint to update vital signs for a specific appointment.
     * Calculates BMI if height and weight are provided.
     * Updates appointment status to 'vitalChecked' if all vital signs are filled.
     * 
     * @param id The appointment ID
     * @param vitalSigns The vital signs data to update
     * @return ResponseEntity containing the updated appointment or an error message
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