package com.scorppultd.blackeyevalkyriesystem.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;

/**
 * Controller for handling patient-related views and operations
 */
@Controller
@RequestMapping("/patient")
public class PatientViewController {

    private final PatientService patientService;
    private final DrugService drugService;

    @Autowired
    public PatientViewController(PatientService patientService, DrugService drugService) {
        this.patientService = patientService;
        this.drugService = drugService;
    }

    /**
     * Display patient creation form
     */
    @GetMapping("/create")
    public String createPatient(Model model) {
        // Fetch all drugs for allergies dropdown
        List<Drug> allDrugs = drugService.getAllDrugs();
        
        // Create a map of drug IDs to drug names for displaying allergies
        Map<String, String> drugNamesMap = allDrugs.stream()
            .collect(Collectors.toMap(
                Drug::getId,
                Drug::getName,
                (existing, replacement) -> existing
            ));
        
        model.addAttribute("allDrugs", allDrugs);
        model.addAttribute("drugNamesMap", drugNamesMap);
        model.addAttribute("patient", new Patient()); // Add empty patient for form binding
        
        return "create-patient";
    }

    /**
     * Display patient list with sorting options
     */
    @GetMapping("/list")
    public String listPatients(
            @RequestParam(required = false, defaultValue = "lastName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String direction,
            Model model) {
        
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

    /**
     * Display patient edit form
     */
    @GetMapping("/edit/{id}")
    public String editPatient(@PathVariable String id, Model model) {
        try {
            Optional<Patient> patientOpt = patientService.getPatientById(id);
            if (patientOpt.isPresent()) {
                Patient patient = patientOpt.get();
                List<Drug> allDrugs = drugService.getAllDrugs();
                
                // Create a map of drug IDs to drug names for displaying allergies
                Map<String, String> drugNamesMap = allDrugs.stream()
                    .collect(Collectors.toMap(
                        Drug::getId,
                        Drug::getName,
                        (existing, replacement) -> existing
                    ));
                
                model.addAttribute("patient", patient);
                model.addAttribute("allDrugs", allDrugs);
                model.addAttribute("drugNamesMap", drugNamesMap);
                return "patient-profile-edit";
            }
        } catch (Exception e) {
            // Failed to find patient
        }
        return "redirect:/patient/list";
    }

    /**
     * Display patient details
     */
    @GetMapping("/view/{id}")
    public String viewPatient(@PathVariable("id") String id, Model model) {
        try {
            Optional<Patient> patientOpt = patientService.getPatientById(id);
            if (patientOpt.isPresent()) {
                Patient patient = patientOpt.get();
                List<Drug> allDrugs = drugService.getAllDrugs();
                
                // Create a map of drug IDs to drug names for displaying allergies
                Map<String, String> drugNamesMap = allDrugs.stream()
                    .collect(Collectors.toMap(
                        Drug::getId,
                        Drug::getName,
                        (existing, replacement) -> existing
                    ));
                
                model.addAttribute("patient", patient);
                model.addAttribute("allDrugs", allDrugs);
                model.addAttribute("drugNamesMap", drugNamesMap);
                return "patient-profile";
            }
        } catch (Exception e) {
            // Failed to find patient
        }
        return "redirect:/patient/list";
    }

    /**
     * Delete a patient
     */
    @GetMapping("/delete/{id}")
    public String deletePatient(@PathVariable String id) {
        patientService.deletePatient(id);
        return "redirect:/patient/list";
    }
} 