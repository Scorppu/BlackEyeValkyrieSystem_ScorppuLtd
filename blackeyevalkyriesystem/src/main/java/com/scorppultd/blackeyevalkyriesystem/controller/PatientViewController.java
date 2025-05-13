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
 * Controller for handling patient-related views and operations in the web interface.
 * This controller manages the UI for creating, viewing, editing, and deleting patients,
 * as well as displaying patient lists with sorting and pagination capabilities.
 * It interacts with PatientService, DrugService, and ConsultationService to retrieve
 * and manipulate the necessary data.
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
     * Displays the patient creation form.
     * Fetches all drugs for the allergies dropdown and creates a map
     * of drug IDs to drug names for displaying in the UI.
     * 
     * @param model The Spring MVC model to add attributes to
     * @return The view name for creating a patient
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
     * Displays the patient list with sorting and pagination options.
     * Calculates statistics about admitted and discharged patients.
     * 
     * @param sortBy The field to sort by (defaults to "lastName")
     * @param direction The sort direction, either "asc" or "desc" (defaults to "asc")
     * @param page The current page number (1-based, defaults to 1)
     * @param rowsPerPage The number of rows per page (defaults to 10)
     * @param model The Spring MVC model to add attributes to
     * @return The view name for patient list
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
     * Displays the patient edit form for an existing patient.
     * Fetches the patient by ID and prepares drug data for allergies.
     * 
     * @param id The unique identifier of the patient to edit
     * @param model The Spring MVC model to add attributes to
     * @return The view name for editing a patient or redirects to patient list if not found
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
     * Displays detailed patient information including past consultations.
     * Fetches the patient by ID, prepares drug data for allergies display,
     * and retrieves the 10 most recent completed consultations sorted by date.
     * 
     * @param id The unique identifier of the patient to view
     * @param model The Spring MVC model to add attributes to
     * @return The view name for patient profile or redirects to patient list if not found
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
     * Deletes a patient by ID.
     * 
     * @param id The unique identifier of the patient to delete
     * @return Redirects to the patient list view
     */
    @GetMapping("/delete/{id}")
    public String deletePatient(@PathVariable String id) {
        patientService.deletePatient(id);
        return "redirect:/patient/list";
    }
} 