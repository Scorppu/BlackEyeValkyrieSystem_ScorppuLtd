package com.scorppultd.blackeyevalkyriesystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

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
} 