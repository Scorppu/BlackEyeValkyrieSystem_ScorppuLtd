package com.scorppultd.blackeyevalkyriesystem.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Comparator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;

/**
 * Controller for handling patient-related views and operations
 */
@Controller
@RequestMapping("/patient")
public class PatientViewController {

    private final PatientService patientService;
    private final DrugService drugService;
    private final ConsultationService consultationService;

    @Autowired
    public PatientViewController(PatientService patientService, DrugService drugService, ConsultationService consultationService) {
        this.patientService = patientService;
        this.drugService = drugService;
        this.consultationService = consultationService;
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
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer rowsPerPage,
            Model model) {
        
        List<Patient> allPatients = patientService.getAllPatientsSorted(sortBy, direction);
        
        // Calculate total count before pagination
        int totalPatients = allPatients.size();
        
        // Apply pagination
        int startIdx = (page - 1) * rowsPerPage;
        int endIdx = Math.min(startIdx + rowsPerPage, allPatients.size());
        
        // Guard against invalid indices
        if (startIdx > allPatients.size()) {
            startIdx = 0;
            page = 1;
        }
        
        List<Patient> paginatedPatients = allPatients;
        if (startIdx < endIdx) {
            paginatedPatients = allPatients.subList(startIdx, endIdx);
        }
        
        model.addAttribute("patients", paginatedPatients);
        
        // Add pagination parameters to the model for the view
        model.addAttribute("currentPage", page);
        model.addAttribute("rowsPerPage", rowsPerPage);
        model.addAttribute("totalPatients", totalPatients);
        
        // Add current sort parameters to the model for the view
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentDirection", direction);
        
        long admittedPatients = allPatients.stream()
                .filter(p -> "Admitted".equals(p.getStatus()))
                .count();
        long dischargedPatients = allPatients.stream()
                .filter(p -> "Discharged".equals(p.getStatus()))
                .count();
        
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
                
                // Get patient's past consultations
                List<Consultation> pastConsultations = consultationService.getConsultationsByPatient(id);
                
                // Sort consultations by date, most recent first
                pastConsultations.sort(Comparator.comparing(Consultation::getConsultationDateTime).reversed());
                
                // Filter completed consultations only
                pastConsultations = pastConsultations.stream()
                    .filter(c -> "Completed".equals(c.getStatus()))
                    .collect(Collectors.toList());
                
                // Limit to most recent 10 consultations
                if (pastConsultations.size() > 10) {
                    pastConsultations = pastConsultations.subList(0, 10);
                }
                
                model.addAttribute("patient", patient);
                model.addAttribute("allDrugs", allDrugs);
                model.addAttribute("drugNamesMap", drugNamesMap);
                model.addAttribute("pastConsultations", pastConsultations);
                return "patient-profile";
            }
        } catch (Exception e) {
            // Failed to find patient
            System.err.println("Error retrieving patient: " + e.getMessage());
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