package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.model.Consultation.Diagnosis;
import com.scorppultd.blackeyevalkyriesystem.model.Consultation.VitalSigns;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;

@Controller
@RequestMapping("/consultation")
public class ConsultationViewController {

    private final ConsultationService consultationService;
    private final PatientService patientService;
    private final DoctorService doctorService;
    private final PrescriptionService prescriptionService;
    private final DrugService drugService;

    @Autowired
    public ConsultationViewController(
            ConsultationService consultationService,
            PatientService patientService, 
            DoctorService doctorService,
            PrescriptionService prescriptionService,
            DrugService drugService) {
        this.consultationService = consultationService;
        this.patientService = patientService;
        this.doctorService = doctorService;
        this.prescriptionService = prescriptionService;
        this.drugService = drugService;
    }

    /**
     * Display the consultation queue page
     */
    @GetMapping
    public String showConsultationQueue(Model model) {
        // Get all scheduled consultations
        List<Consultation> scheduledConsultations = consultationService.getConsultationsByStatus("Scheduled");
        
        // If there are scheduled consultations, get the first one as next patient
        if (!scheduledConsultations.isEmpty()) {
            Consultation nextConsultation = scheduledConsultations.get(0);
            Patient nextPatient = nextConsultation.getPatient();
            model.addAttribute("nextPatient", nextPatient);
            
            // Remove the next patient from the list to get the remaining patients
            List<Patient> queuedPatients = scheduledConsultations.stream()
                    .skip(1)  // Skip the first one (next patient)
                    .map(Consultation::getPatient)
                    .collect(Collectors.toList());
            
            model.addAttribute("queuedPatients", queuedPatients);
        } else {
            model.addAttribute("queuedPatients", List.of());
        }
        
        return "consultation-queue";
    }

    /**
     * Display the consultation create page for a specific patient
     */
    @GetMapping("/create/{patientId}")
    public String showConsultationCreate(@PathVariable String patientId, Model model) {
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        
        if (patientOpt.isEmpty()) {
            // Redirect to queue page if patient not found
            return "redirect:/consultation?error=patient-not-found";
        }
        
        Patient patient = patientOpt.get();
        
        // Check if there's an existing in-progress consultation for this patient
        List<Consultation> inProgressConsultations = consultationService.getConsultationsByPatientIdAndStatus(
                patientId, "In-Progress");
        
        Consultation consultation;
        
        if (!inProgressConsultations.isEmpty()) {
            // Use the existing consultation
            consultation = inProgressConsultations.get(0);
        } else {
            // Create a new consultation object
            consultation = new Consultation();
            consultation.setPatient(patient);
            consultation.setConsultationDateTime(LocalDateTime.now());
            consultation.setConsultationType("General Consultation");
            consultation.setStatus("In-Progress");
            
            // Set default vital signs
            VitalSigns vitalSigns = new VitalSigns();
            vitalSigns.setTemperature(37.0);
            vitalSigns.setBloodPressure("120/80");
            vitalSigns.setHeartRate(70);
            vitalSigns.setRespiratoryRate(16);
            vitalSigns.setWeight(70.0);
            vitalSigns.setHeight(170.0);
            consultation.setVitalSigns(vitalSigns);
            
            // Initialize empty diagnosis
            consultation.setDiagnoses(List.of(new Diagnosis()));
            
            // Get the doctor (for now just get the first available doctor)
            List<Doctor> doctors = doctorService.getAllDoctors();
            if (!doctors.isEmpty()) {
                consultation.setDoctor(doctors.get(0));
            }
            
            // Save the new consultation
            consultation = consultationService.createConsultation(consultation);
        }
        
        model.addAttribute("consultation", consultation);
        
        // Add drug templates
        List<String> drugTemplates = List.of(
            "In-House Dispensary", 
            "Pain Meds - non narcotic", 
            "Antibiotics", 
            "Cardiovascular", 
            "Respiratory", 
            "Gastrointestinal", 
            "Antidiabetic", 
            "CNS Agents"
        );
        model.addAttribute("drugTemplates", drugTemplates);
        
        // Add default drugs for In-House Dispensary
        List<Drug> defaultDrugs = drugService.getDrugsByTemplateCategory("In-House Dispensary");
        model.addAttribute("defaultDrugs", defaultDrugs);
        
        // Add count of drugs in each template for diagnostics
        // This helps verify if data is being retrieved from the database
        java.util.Map<String, Integer> drugCounts = new java.util.HashMap<>();
        for (String template : drugTemplates) {
            List<Drug> drugs = drugService.getDrugsByTemplateCategory(template);
            drugCounts.put(template, drugs.size());
        }
        model.addAttribute("drugCounts", drugCounts);
        
        // Add total count of all drugs for diagnostics
        model.addAttribute("totalDrugCount", drugService.getAllDrugs().size());
        
        return "consultation-create";
    }

    /**
     * Handle saving the consultation with diagnosis and prescriptions
     */
    @PostMapping("/save")
    public String saveConsultation(@ModelAttribute Consultation consultation) {
        // Get the existing consultation from the database
        Optional<Consultation> existingConsultationOpt = consultationService.getConsultationById(consultation.getId());
        
        if (existingConsultationOpt.isEmpty()) {
            return "redirect:/consultation?error=consultation-not-found";
        }
        
        Consultation existingConsultation = existingConsultationOpt.get();
        
        // Update the fields that can be edited by the doctor
        existingConsultation.setClinicalNotes(consultation.getClinicalNotes());
        
        // Update diagnoses
        if (consultation.getDiagnoses() != null && !consultation.getDiagnoses().isEmpty()) {
            existingConsultation.setDiagnoses(consultation.getDiagnoses());
        }
        
        // If prescription data was submitted, create a new prescription
        if (consultation.getPrescription() != null && 
            consultation.getPrescription().getPrescriptionItems() != null && 
            !consultation.getPrescription().getPrescriptionItems().isEmpty()) {
            
            // Create a new prescription
            Prescription prescription = new Prescription();
            // Set patient using existing consultation's patient
            prescription.setPatient(existingConsultation.getPatient());
            
            // Set doctor information
            String doctorFullName = existingConsultation.getDoctor().getFirstName() + 
                                   " " + existingConsultation.getDoctor().getLastName();
            prescription.setDoctorName(doctorFullName);
            prescription.setDoctorId(existingConsultation.getDoctor().getId());
            
            // Set dates
            prescription.setPrescriptionDate(LocalDate.now());
            // Set validity to 30 days from now
            prescription.setValidUntil(LocalDate.now().plusDays(30));
            
            // Set status and items
            prescription.setStatus("active");
            prescription.setPrescriptionItems(consultation.getPrescription().getPrescriptionItems());
            
            // Save prescription and link to consultation
            Prescription savedPrescription = prescriptionService.createPrescription(prescription);
            existingConsultation.setPrescription(savedPrescription);
        }
        
        // Mark consultation as completed
        existingConsultation.setStatus("Completed");
        consultationService.updateConsultation(existingConsultation);
        
        return "redirect:/consultation?success=consultation-completed";
    }
} 