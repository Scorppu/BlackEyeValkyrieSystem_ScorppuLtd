package com.scorppultd.blackeyevalkyriesystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;
import java.util.Optional;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;

@Controller
public class WebController {
    
    @Autowired
    private PatientService patientService;
    
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
        
        // Generate a visit ID (for demo purposes)
        model.addAttribute("visitId", "OP" + String.format("%04d", (int)(Math.random() * 10000)));
        
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
        
        return "appointment-create-visit-info";
    }
    
    @PostMapping("/appointment/create/visit-info")
    public String processAppointmentCreation(
            @RequestParam("patientId") String patientId,
            @RequestParam("visitId") String visitId,
            @RequestParam("appointmentType") String appointmentType,
            @RequestParam("requiredTime") String requiredTime,
            @RequestParam("appointmentPriority") String appointmentPriority,
            HttpServletRequest request,
            Model model) {
        
        // Here you would save the appointment/visit to the database
        // For now, we'll just redirect to the timeline
        
        return "redirect:/appointment/timeline?success=created";
    }
} 