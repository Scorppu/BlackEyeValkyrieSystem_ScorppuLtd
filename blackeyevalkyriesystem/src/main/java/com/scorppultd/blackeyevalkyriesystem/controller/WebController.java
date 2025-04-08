package com.scorppultd.blackeyevalkyriesystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Visit;

@Controller
public class WebController {
    
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    
    @Autowired
    public WebController(PatientService patientService, 
                        AppointmentService appointmentService,
                        DoctorService doctorService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
    }
    
    @GetMapping("/")
    public String index(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "index";
    }
    
    @GetMapping("/login")
    public String login(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "login";
    }
    
    @GetMapping("/patient/create")
    public String createPatient(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "create-patient";
    }
    
    @GetMapping("/patient/list")
    public String listPatients(
            @RequestParam(required = false, defaultValue = "lastName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String direction,
            HttpServletRequest request, 
            Model model) {
        
        model.addAttribute("request", request);
        
        List<Patient> patients = patientService.getAllPatientsSorted(sortBy, direction);
        model.addAttribute("patients", patients);
        
        // Add current sort parameters to the model for the view
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentDirection", direction);
        
        long totalPatients = patients.size();
        long admittedPatients = patients.stream()
                .filter(p -> "Admitted".equals(p.getStatus()))
                .count();
        long dischargedPatients = patients.stream()
                .filter(p -> "Discharged".equals(p.getStatus()))
                .count();
        
        model.addAttribute("totalPatients", totalPatients);
        model.addAttribute("admittedPatients", admittedPatients);
        model.addAttribute("dischargedPatients", dischargedPatients);
        
        return "patient-list";
    }
    
    @GetMapping("/patient/edit/{id}")
    public String editPatient(@PathVariable String id, HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        Optional<Patient> patient = patientService.getPatientById(id);
        if (patient.isPresent()) {
            model.addAttribute("patient", patient.get());
            return "edit-patient"; // This would be a new template similar to create-patient
        } else {
            return "redirect:/patient/list";
        }
    }
    
    @GetMapping("/patient/delete/{id}")
    public String deletePatient(@PathVariable String id) {
        patientService.deletePatient(id);
        return "redirect:/patient/list";
    }
    
    @GetMapping("/appointments")
    public String appointments(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "appointments";
    }
    
    @GetMapping("/settings")
    public String settings(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "settings";
    }
    
    @GetMapping("/error")
    public String error(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "error";
    }
    
    @GetMapping("/access-denied")
    public String accessDenied(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "access-denied";
    }
    
    @GetMapping("/appointment/timeline")
    public String appointmentTimeline(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        model.addAttribute("doctorsOnDuty", 100);
        model.addAttribute("admittedPatients", 50);
        
        return "appointment-timeline";
    }
    
    @GetMapping("/appointment/create")
    public String createAppointment(
            @RequestParam(required = false, defaultValue = "lastName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String direction,
            @RequestParam(required = false, defaultValue = "10") Integer rowsPerPage,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            HttpServletRequest request, 
            Model model) {
        
        model.addAttribute("request", request);
        
        // Get sorted patients for patient selection
        List<Patient> patients = patientService.getAllPatientsSorted(sortBy, direction);
        
        // Add patients to the model
        model.addAttribute("patients", patients);
        
        // Pagination information (simplified for now)
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPatients", patients.size());
        model.addAttribute("rowsPerPage", rowsPerPage);
        
        // Sort parameters
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentDirection", direction);
        
        return "appointment-create";
    }
    
    @PostMapping("/appointment/create")
    public String processPatientSelection(
            @RequestParam(value = "selectedPatients", required = false) List<String> selectedPatientIds,
            HttpServletRequest request,
            Model model) {
        
        if (selectedPatientIds == null || selectedPatientIds.isEmpty()) {
            // If no patients selected, redirect back with an error message
            return "redirect:/appointment/create?error=noPatientSelected";
        }
        
        // For simplicity, we'll assume only one patient is selected (first one)
        String patientId = selectedPatientIds.get(0);
        
        // Find the patient by ID
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        // Redirect to visit information page with the patient ID
        return "redirect:/appointment/create/visit-info?patientId=" + patientId;
    }
    
    @GetMapping("/appointment/create/visit-info")
    public String createAppointmentVisitInfo(
            @RequestParam("patientId") String patientId,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        // Find the patient by ID
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        model.addAttribute("patient", patient);
        
        // Add appointment type options
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        // Add appointment priority options
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        // Fetch all doctors for the dropdown
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        return "appointment-create-visit-info";
    }
    
    @PostMapping("/appointment/create/visit-info")
    public String processAppointmentCreation(
            @RequestParam("patientId") String patientId,
            @RequestParam("appointmentType") String appointmentType,
            @RequestParam("requiredTime") String requiredTime,
            @RequestParam("appointmentPriority") String appointmentPriority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTime,
            HttpServletRequest request,
            Model model) {
        
        // Find the patient
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        
        // Create a new appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setAppointmentType(appointmentType);
        
        // Parse required time (remove 'minutes' suffix if it exists)
        try {
            Integer time = Integer.parseInt(requiredTime.trim().split(" ")[0]);
            appointment.setRequiredTime(time);
        } catch (NumberFormatException e) {
            // Default to 30 minutes if parsing fails
            appointment.setRequiredTime(30);
        }
        
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setCreationTime(LocalDateTime.now());
        appointment.setStatus("pending"); // Ensure status is set
        
        // Set optional fields if provided
        if (notes != null && !notes.trim().isEmpty()) {
            appointment.setNotes(notes);
        }
        
        if (doctorName != null && !doctorName.trim().isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        // Parse and set scheduled time if provided
        if (scheduledTime != null && !scheduledTime.trim().isEmpty()) {
            try {
                // Use DateTimeFormatter for more robust parsing
                DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                LocalDateTime dateTime = LocalDateTime.parse(scheduledTime, formatter);
                appointment.setScheduledTime(dateTime);
            } catch (Exception e) {
                // If parsing fails, log the error and continue
                System.err.println("Failed to parse scheduled time: " + e.getMessage());
                System.err.println("Input was: " + scheduledTime);
            }
        }
        
        try {
            // Save the appointment and log the ID
            appointment = appointmentService.createAppointment(appointment);
            System.out.println("Created appointment with ID: " + appointment.getId());
            
            // Create a new Visit record and add it to the patient's visits list
            if (appointment.getScheduledTime() != null) {
                // Create a new Visit
                Visit visit = new Visit();
                visit.setPatientId(patient.getId());
                
                // Set doctor ID if available
                if (doctorName != null && !doctorName.trim().isEmpty()) {
                    // Find the doctor by name
                    List<Doctor> doctors = doctorService.getAllDoctors();
                    Optional<Doctor> doctorOpt = doctors.stream()
                            .filter(d -> (d.getFirstName() + " " + d.getLastName()).equals(doctorName))
                            .findFirst();
                    
                    if (doctorOpt.isPresent()) {
                        visit.setDoctorId(doctorOpt.get().getId());
                    }
                }
                
                // Set visit date from appointment's scheduled time
                visit.setVisitDate(appointment.getScheduledTime().toLocalDate());
                
                // Initialize patient's visits list if null
                if (patient.getVisits() == null) {
                    patient.setVisits(new ArrayList<>());
                }
                
                // Add the visit to the patient's visits list
                patient.getVisits().add(visit);
                
                // Save the updated patient
                patientService.savePatient(patient);
                System.out.println("Added visit record to patient: " + patient.getId());
            }
        } catch (Exception e) {
            // Log any exceptions during save
            System.err.println("Error saving appointment: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/appointment/create?error=saveFailed";
        }
        
        return "redirect:/appointment/timeline?success=created&appointmentId=" + appointment.getId();
    }
    
    @GetMapping("/appointment/edit/{id}")
    public String editAppointment(
            @PathVariable String id,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        // Find the appointment by ID
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        model.addAttribute("appointment", appointment);
        
        // Find the patient from the appointment
        Patient patient = appointment.getPatient();
        if (patient != null) {
            model.addAttribute("patient", patient);
        }
        
        // Add appointment type options
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        // Add appointment priority options
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        // Fetch all doctors for the dropdown
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        // Format the scheduled time for the form
        if (appointment.getScheduledTime() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            String formattedDateTime = appointment.getScheduledTime().format(formatter);
            model.addAttribute("formattedScheduledTime", formattedDateTime);
        }
        
        return "appointment-edit";
    }
    
    @PostMapping("/appointment/edit/{id}")
    public String processAppointmentEdit(
            @PathVariable String id,
            @RequestParam("patientId") String patientId,
            @RequestParam("appointmentType") String appointmentType,
            @RequestParam("requiredTime") String requiredTime,
            @RequestParam("appointmentPriority") String appointmentPriority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTime,
            HttpServletRequest request,
            Model model) {
        
        // Find the appointment by ID
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Update the appointment with new values
        appointment.setAppointmentType(appointmentType);
        appointment.setRequiredTime(Integer.parseInt(requiredTime));
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setNotes(notes);
        
        // Update doctor if changed
        if (doctorName != null && !doctorName.isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        // Update scheduled time if changed
        if (scheduledTime != null && !scheduledTime.isEmpty()) {
            LocalDateTime dateTime = LocalDateTime.parse(scheduledTime);
            appointment.setScheduledTime(dateTime);
        }
        
        // Save the updated appointment
        appointmentService.updateAppointment(appointment);
        
        // Redirect to appointment timeline with success message
        return "redirect:/appointment/timeline?success=appointmentUpdated";
    }

    @GetMapping("/appointment/cancel/{id}")
    public String cancelAppointment(@PathVariable String id) {
        // Find the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            // Delete the appointment
            appointmentService.deleteAppointment(id);
        }
        return "redirect:/appointment/timeline";
    }
    
    @GetMapping("/appointment/complete/{id}")
    public String completeAppointment(@PathVariable String id) {
        // Find the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();
            // Mark as completed
            appointment.setStatus("Completed");
            appointmentService.updateAppointment(appointment);
        }
        return "redirect:/appointment/timeline";
    }
} 