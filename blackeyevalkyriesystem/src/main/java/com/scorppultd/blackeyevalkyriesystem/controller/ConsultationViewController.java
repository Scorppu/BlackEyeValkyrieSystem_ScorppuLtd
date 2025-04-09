package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

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
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;

@Controller
@RequestMapping("/consultation")
public class ConsultationViewController {

    private final ConsultationService consultationService;
    private final PatientService patientService;
    private final DoctorService doctorService;
    private final PrescriptionService prescriptionService;
    private final DrugService drugService;
    private final AppointmentService appointmentService;

    @Autowired
    public ConsultationViewController(
            ConsultationService consultationService,
            PatientService patientService, 
            DoctorService doctorService,
            PrescriptionService prescriptionService,
            DrugService drugService,
            AppointmentService appointmentService) {
        this.consultationService = consultationService;
        this.patientService = patientService;
        this.doctorService = doctorService;
        this.prescriptionService = prescriptionService;
        this.drugService = drugService;
        this.appointmentService = appointmentService;
    }

    /**
     * Helper method to get the last visit date from a patient's visits list
     */
    private LocalDate getLastVisitDate(Patient patient) {
        if (patient.getVisits() != null && !patient.getVisits().isEmpty()) {
            // Assuming visits are already sorted by date in descending order
            return patient.getVisits().get(0).getVisitDate();
        }
        return null;
    }

    /**
     * Display the consultation queue page
     */
    @GetMapping
    public String showConsultationQueue(Model model) {
        // Try different status values since there might be a case sensitivity issue
        List<Appointment> allAppointments = appointmentService.getAllAppointments();
        System.out.println("Total appointments in the database: " + allAppointments.size());
        
        // Log all appointment statuses to see what's actually in the database
        System.out.println("All appointment statuses in the database:");
        for (Appointment appointment : allAppointments) {
            System.out.println("Appointment ID: " + appointment.getId() + 
                              ", Status: '" + appointment.getStatus() + "'" +
                              ", Patient: " + (appointment.getPatient() != null ? 
                                             appointment.getPatient().getFirstName() + " " + 
                                             appointment.getPatient().getLastName() : "null"));
        }
        
        // Try to find appointments with various possible status values
        Set<String> processedAppointmentIds = new HashSet<>();
        List<Appointment> scheduledAppointments = new ArrayList<>();
        
        // Try with "confirmed" (another possible status)
        List<Appointment> confirmedAppointments = appointmentService.getAppointmentsByStatus("confirmed");
        System.out.println("Appointments with status 'confirmed': " + confirmedAppointments.size());
        for (Appointment appointment : confirmedAppointments) {
            if (!processedAppointmentIds.contains(appointment.getId())) {
                scheduledAppointments.add(appointment);
                processedAppointmentIds.add(appointment.getId());
            }
        }
        
        // Try with "pending" (default status from Appointment constructor)
        List<Appointment> pendingAppointments = appointmentService.getAppointmentsByStatus("pending");
        System.out.println("Appointments with status 'pending': " + pendingAppointments.size());
        for (Appointment appointment : pendingAppointments) {
            if (!processedAppointmentIds.contains(appointment.getId())) {
                scheduledAppointments.add(appointment);
                processedAppointmentIds.add(appointment.getId());
            }
        }
        
        // Add non-completed, non-cancelled appointments from the full list as a fallback
        for (Appointment appointment : allAppointments) {
            String status = appointment.getStatus();
            if (status != null && 
                !status.equalsIgnoreCase("completed") && 
                !status.equalsIgnoreCase("cancelled") &&
                !processedAppointmentIds.contains(appointment.getId())) {
                scheduledAppointments.add(appointment);
                processedAppointmentIds.add(appointment.getId());
                System.out.println("Added appointment with status '" + status + "' to scheduled appointments");
            }
        }
        
        // Debug logging
        System.out.println("Total scheduled appointments found (combined): " + scheduledAppointments.size());
        
        // Filter out completed appointments entirely
        scheduledAppointments = scheduledAppointments.stream()
                .filter(a -> !"completed".equalsIgnoreCase(a.getStatus()) && 
                             !"cancelled".equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());
        
        System.out.println("After removing completed/cancelled appointments: " + scheduledAppointments.size());
        
        for (Appointment appointment : scheduledAppointments) {
            System.out.println("Appointment ID: " + appointment.getId() + 
                              ", Scheduled Time: " + appointment.getScheduledTime() + 
                              ", Status: " + appointment.getStatus() +
                              ", Patient: " + (appointment.getPatient() != null ? 
                                             appointment.getPatient().getFirstName() + " " + 
                                             appointment.getPatient().getLastName() : "null"));
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // Split appointments into overdue and future
        List<Appointment> overdueAppointments = scheduledAppointments.stream()
                .filter(a -> a.getScheduledTime() != null && a.getScheduledTime().isBefore(now))
                .collect(Collectors.toList());
        
        List<Appointment> upcomingAppointments = scheduledAppointments.stream()
                .filter(a -> a.getScheduledTime() != null && (a.getScheduledTime().isEqual(now) || a.getScheduledTime().isAfter(now)))
                .collect(Collectors.toList());
        
        // Debug logging
        System.out.println("Overdue appointments: " + overdueAppointments.size());
        System.out.println("Upcoming appointments: " + upcomingAppointments.size());
        
        // Get patient info and visit dates for overdue appointments
        List<Patient> overduePatients = new ArrayList<>();
        List<LocalDate> overduePatientsLastVisits = new ArrayList<>();
        
        for (Appointment appointment : overdueAppointments) {
            Patient patient = appointment.getPatient();
            if (patient != null) {
                overduePatients.add(patient);
                overduePatientsLastVisits.add(getLastVisitDate(patient));
            }
        }
        
        // Get patient info and visit dates for upcoming appointments
        List<Patient> upcomingPatients = new ArrayList<>();
        List<LocalDate> upcomingPatientsLastVisits = new ArrayList<>();
        
        for (Appointment appointment : upcomingAppointments) {
            Patient patient = appointment.getPatient();
            if (patient != null) {
                upcomingPatients.add(patient);
                upcomingPatientsLastVisits.add(getLastVisitDate(patient));
            }
        }
        
        // Debug logging
        System.out.println("Overdue patients: " + overduePatients.size());
        System.out.println("Upcoming patients: " + upcomingPatients.size());
        
        // Add data to model
        model.addAttribute("nextPatient", !overduePatients.isEmpty() ? overduePatients.get(0) : null);
        model.addAttribute("nextPatientLastVisit", !overduePatientsLastVisits.isEmpty() ? overduePatientsLastVisits.get(0) : null);
        
        List<Patient> remainingOverduePatients = overduePatients.size() > 1 ? 
                overduePatients.subList(1, overduePatients.size()) : new ArrayList<>();
        List<LocalDate> remainingOverduePatientsLastVisits = overduePatientsLastVisits.size() > 1 ? 
                overduePatientsLastVisits.subList(1, overduePatientsLastVisits.size()) : new ArrayList<>();
        
        model.addAttribute("queuedPatients", remainingOverduePatients);
        model.addAttribute("queuedPatientsLastVisits", remainingOverduePatientsLastVisits);
        
        model.addAttribute("futurePatients", upcomingPatients);
        model.addAttribute("futurePatientsLastVisits", upcomingPatientsLastVisits);
        
        // Store appointment IDs for consultation creation
        Map<String, String> patientAppointmentMap = new HashMap<>();
        
        for (Appointment appointment : overdueAppointments) {
            if (appointment.getPatient() != null) {
                patientAppointmentMap.put(appointment.getPatient().getId(), appointment.getId());
            }
        }
        
        model.addAttribute("patientAppointmentMap", patientAppointmentMap);
        
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
        
        // Add all drugs from database instead of just In-House Dispensary
        List<Drug> defaultDrugs = drugService.getAllDrugs();
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