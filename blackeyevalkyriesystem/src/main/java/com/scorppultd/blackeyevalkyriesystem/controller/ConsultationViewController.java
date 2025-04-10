package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
// import java.time.ZoneId;
// import java.time.ZoneOffset;
// import java.time.ZonedDateTime;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
        // Get the currently logged-in user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        // Check if the user is an admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        final Doctor currentDoctor;
        
        if (!isAdmin) {
            // If not an admin, find the doctor by username
            Optional<Doctor> currentDoctorOpt = doctorService.getDoctorByUsername(username);
            if (currentDoctorOpt.isEmpty()) {
                // If not a doctor, redirect to an error page or show a message
                model.addAttribute("error", "You must be logged in as a doctor to view this page");
                return "error";
            }
            currentDoctor = currentDoctorOpt.get();
            System.out.println("Current doctor: " + currentDoctor.getFirstName() + " " + currentDoctor.getLastName());
        } else {
            System.out.println("Current user is an admin, will show all appointments");
            currentDoctor = null;
        }
        
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
                                             appointment.getPatient().getLastName() : "null") +
                              ", Doctor: " + (appointment.getDoctorName() != null ? 
                                            appointment.getDoctorName() : "null"));
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
        
        // Filter appointments to only include those assigned to the current doctor if not an admin
        if (!isAdmin && currentDoctor != null) {
            scheduledAppointments = scheduledAppointments.stream()
                    .filter(a -> a.getDoctorName() != null && a.getDoctorName().equals(currentDoctor.getFirstName() + " " + currentDoctor.getLastName()))
                    .collect(Collectors.toList());
            
            System.out.println("After filtering for current doctor: " + scheduledAppointments.size());
        } else if (isAdmin) {
            System.out.println("Admin user - showing all appointments: " + scheduledAppointments.size());
        }
        
        for (Appointment appointment : scheduledAppointments) {
            System.out.println("Appointment ID: " + appointment.getId() + 
                              ", Scheduled Time: " + appointment.getScheduledTime() + 
                              ", Status: " + appointment.getStatus() +
                              ", Patient: " + (appointment.getPatient() != null ? 
                                             appointment.getPatient().getFirstName() + " " + 
                                             appointment.getPatient().getLastName() : "null") +
                              ", Doctor: " + (appointment.getDoctorName() != null ? 
                                            appointment.getDoctorName() : "null"));
        }
        
        // Get current time
        LocalDateTime now = LocalDateTime.now();
        
        // Split appointments into overdue and future
        List<Appointment> overdueAppointments = scheduledAppointments.stream()
                .filter(a -> {
                    if (a.getScheduledTime() == null) return false;
                    LocalDateTime scheduledTime = a.getScheduledTime();
                    
                    // Debug logging for time comparison
                    System.out.println("Comparing appointment time: " + scheduledTime + " with current time: " + now);
                    
                    // An appointment is overdue if its scheduled time is before the current time
                    boolean isOverdue = scheduledTime.isBefore(now);
                    System.out.println("Appointment is overdue: " + isOverdue);
                    return isOverdue;
                })
                .collect(Collectors.toList());
        
        List<Appointment> upcomingAppointments = scheduledAppointments.stream()
                .filter(a -> {
                    if (a.getScheduledTime() == null) return false;
                    LocalDateTime scheduledTime = a.getScheduledTime();
                    
                    // Debug logging for time comparison
                    System.out.println("Comparing upcoming appointment time: " + scheduledTime + " with current time: " + now);
                    
                    // An appointment is upcoming if its scheduled time is after or equal to the current time
                    boolean isUpcoming = !scheduledTime.isBefore(now);
                    System.out.println("Appointment is upcoming: " + isUpcoming);
                    return isUpcoming;
                })
                .collect(Collectors.toList());
        
        // Debug logging
        System.out.println("Overdue appointments: " + overdueAppointments.size());
        System.out.println("Upcoming appointments: " + upcomingAppointments.size());
        
        // Get patient info and visit dates for overdue appointments
        List<Patient> overduePatients = new ArrayList<>();
        List<LocalDate> overduePatientsLastVisits = new ArrayList<>();
        Map<String, LocalDateTime> overdueAppointmentTimes = new HashMap<>();
        
        for (Appointment appointment : overdueAppointments) {
            Patient patient = appointment.getPatient();
            if (patient != null) {
                overduePatients.add(patient);
                overduePatientsLastVisits.add(getLastVisitDate(patient));
                overdueAppointmentTimes.put(patient.getId(), appointment.getScheduledTime());
            }
        }
        
        // Get patient info and visit dates for upcoming appointments
        List<Patient> upcomingPatients = new ArrayList<>();
        List<LocalDate> upcomingPatientsLastVisits = new ArrayList<>();
        Map<String, LocalDateTime> upcomingAppointmentTimes = new HashMap<>();
        
        for (Appointment appointment : upcomingAppointments) {
            Patient patient = appointment.getPatient();
            if (patient != null) {
                upcomingPatients.add(patient);
                upcomingPatientsLastVisits.add(getLastVisitDate(patient));
                upcomingAppointmentTimes.put(patient.getId(), appointment.getScheduledTime());
            }
        }
        
        // Debug logging
        System.out.println("Overdue patients: " + overduePatients.size());
        System.out.println("Upcoming patients: " + upcomingPatients.size());
        
        // Add data to model
        model.addAttribute("nextPatient", !overduePatients.isEmpty() ? overduePatients.get(0) : null);
        model.addAttribute("nextPatientLastVisit", !overduePatientsLastVisits.isEmpty() ? overduePatientsLastVisits.get(0) : null);
        model.addAttribute("nextPatientAppointmentTime", !overduePatients.isEmpty() ? 
            overdueAppointmentTimes.get(overduePatients.get(0).getId()) : null);
        
        List<Patient> remainingOverduePatients = overduePatients.size() > 1 ? 
                overduePatients.subList(1, overduePatients.size()) : new ArrayList<>();
        List<LocalDate> remainingOverduePatientsLastVisits = overduePatientsLastVisits.size() > 1 ? 
                overduePatientsLastVisits.subList(1, overduePatientsLastVisits.size()) : new ArrayList<>();
        
        model.addAttribute("queuedPatients", remainingOverduePatients);
        model.addAttribute("queuedPatientsLastVisits", remainingOverduePatientsLastVisits);
        model.addAttribute("queuedPatientsAppointmentTimes", overdueAppointmentTimes);
        
        model.addAttribute("futurePatients", upcomingPatients);
        model.addAttribute("futurePatientsLastVisits", upcomingPatientsLastVisits);
        model.addAttribute("futurePatientsAppointmentTimes", upcomingAppointmentTimes);
        
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