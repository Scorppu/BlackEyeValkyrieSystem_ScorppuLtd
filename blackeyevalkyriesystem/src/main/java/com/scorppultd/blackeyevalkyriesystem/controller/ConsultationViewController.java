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
import java.util.Comparator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.model.Consultation.VitalSigns;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;

/**
 * Controller for managing consultation views in the system.
 * Provides web pages for viewing consultation queue, creating consultations, 
 * and saving consultation data with prescriptions.
 * Access is restricted to users with DOCTOR or ADMIN roles.
 */
@Controller
@RequestMapping("/consultation")
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
public class ConsultationViewController {

    private final ConsultationService consultationService;
    private final PatientService patientService;
    private final DoctorService doctorService;
    private final PrescriptionService prescriptionService;
    private final DrugService drugService;
    private final AppointmentService appointmentService;

    /**
     * Constructor for ConsultationViewController.
     * 
     * @param consultationService The service that handles consultation business logic
     * @param patientService The service that handles patient business logic
     * @param doctorService The service that handles doctor business logic
     * @param prescriptionService The service that handles prescription business logic
     * @param drugService The service that handles drug business logic
     * @param appointmentService The service that handles appointment business logic
     */
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
     * Helper method to get the last visit date from a patient's visits list.
     * 
     * @param patient The patient whose last visit date is being retrieved
     * @return The date of the patient's most recent visit, or null if no visits exist
     */
    public LocalDate getLastVisitDate(Patient patient) {
        if (patient.getVisits() != null && !patient.getVisits().isEmpty()) {
            // Assuming visits are already sorted by date in descending order
            return patient.getVisits().get(0).getVisitDate();
        }
        return null;
    }

    /**
     * Displays the consultation queue page showing overdue and upcoming appointments.
     * For doctors, only shows their own appointments. For admins, shows all appointments.
     * 
     * @param model The Spring MVC model for passing data to the view
     * @return The name of the view template to render
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
        
        // Sort appointments by their scheduled time
        overdueAppointments.sort(Comparator.comparing(
            appointment -> appointment.getScheduledTime() != null ? appointment.getScheduledTime() : LocalDateTime.MAX
        ));
        
        upcomingAppointments.sort(Comparator.comparing(
            appointment -> appointment.getScheduledTime() != null ? appointment.getScheduledTime() : LocalDateTime.MAX
        ));
        
        // Pass appointment lists directly to the model without grouping by patient
        model.addAttribute("overdueAppointments", overdueAppointments);
        model.addAttribute("upcomingAppointments", upcomingAppointments);

        // For backward compatibility, keep some of the existing variables
        // but they may not be used in the updated view
        Patient nextPatient = null;
        LocalDate nextPatientLastVisit = null;
        LocalDateTime nextPatientAppointmentTime = null;

        if (!overdueAppointments.isEmpty() && overdueAppointments.get(0).getPatient() != null) {
            nextPatient = overdueAppointments.get(0).getPatient();
            nextPatientLastVisit = getLastVisitDate(nextPatient);
            nextPatientAppointmentTime = overdueAppointments.get(0).getScheduledTime();
        }

        model.addAttribute("nextPatient", nextPatient);
        model.addAttribute("nextPatientLastVisit", nextPatientLastVisit);
        model.addAttribute("nextPatientAppointmentTime", nextPatientAppointmentTime);
        
        return "consultation-queue";
    }

    /**
     * Displays the consultation creation page for a specific patient.
     * If appointmentId is provided, tries to find an existing consultation for that appointment.
     * If not found, creates a new consultation based on the appointment or from scratch.
     * 
     * @param patientId The ID of the patient for whom to create a consultation
     * @param appointmentId Optional ID of an appointment to associate with the consultation
     * @param model The Spring MVC model for passing data to the view
     * @return The name of the view template to render, or a redirect URL if patient not found
     */
    @GetMapping("/create/{patientId}")
    public String showConsultationCreate(@PathVariable String patientId, 
                                        @RequestParam(required = false) String appointmentId,
                                        Model model) {
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (patientOpt.isEmpty()) {
            return "redirect:/patients?error=patient-not-found";
        }
        
        Patient patient = patientOpt.get();
        
        // Variables to store consultation
        Consultation consultationToUse = null;
        
        // Check if we have an appointmentId and if a consultation already exists for it
        if (appointmentId != null && !appointmentId.isEmpty()) {
            Optional<Consultation> existingConsultationForAppointment = 
                consultationService.getConsultationByAppointmentId(appointmentId);
            
            if (existingConsultationForAppointment.isPresent()) {
                // Use the existing consultation associated with this appointment
                consultationToUse = existingConsultationForAppointment.get();
                System.out.println("Using existing consultation for appointment ID: " + appointmentId);
            }
        }
            
        // If no existing consultation for appointment, check for in-progress consultations
        if (consultationToUse == null) {
            List<Consultation> inProgressConsultations = consultationService.getConsultationsByPatientIdAndStatus(
                    patientId, "In-Progress");
            
            if (!inProgressConsultations.isEmpty()) {
                // Use the existing in-progress consultation
                consultationToUse = inProgressConsultations.get(0);
                System.out.println("Using existing in-progress consultation");
                
                // If appointmentId is provided and the consultation doesn't have it, update it
                if (appointmentId != null && !appointmentId.isEmpty() && 
                    (consultationToUse.getAppointmentId() == null || consultationToUse.getAppointmentId().isEmpty())) {
                    consultationToUse.setAppointmentId(appointmentId);
                    consultationToUse = consultationService.updateConsultation(consultationToUse);
                    System.out.println("Updated existing consultation with appointment ID: " + appointmentId);
                }
            } else if (appointmentId != null && !appointmentId.isEmpty()) {
                // Create new consultation from appointment
                try {
                    consultationToUse = consultationService.createConsultationFromAppointment(appointmentId);
                    System.out.println("Created new consultation from appointment ID: " + appointmentId);
                } catch (Exception e) {
                    // If failed to create from appointment, create a new generic consultation
                    consultationToUse = createNewConsultation(patient);
                    consultationToUse.setAppointmentId(appointmentId);
                    consultationToUse = consultationService.updateConsultation(consultationToUse);
                    System.out.println("Created generic consultation with appointment ID: " + appointmentId);
                }
            } else {
                // Create a new generic consultation without appointment association
                consultationToUse = createNewConsultation(patient);
                System.out.println("Created new generic consultation without appointment");
            }
        }
        
        // Get patient's past consultations and add to model
        List<Consultation> pastConsultations = consultationService.getConsultationsByPatient(patientId);
        
        // Sort them by date, most recent first
        pastConsultations.sort(Comparator.comparing(Consultation::getConsultationDateTime).reversed());
        
        // Filter out the current consultation and any in-progress ones
        final Consultation finalConsultation = consultationToUse;
        pastConsultations = pastConsultations.stream()
            .filter(c -> !c.getId().equals(finalConsultation.getId()) && "Completed".equals(c.getStatus()))
            .collect(Collectors.toList());
        
        // Limit to most recent 5 consultations to keep the UI clean
        if (pastConsultations.size() > 5) {
            pastConsultations = pastConsultations.subList(0, 5);
        }
        
        model.addAttribute("pastConsultations", pastConsultations);
        model.addAttribute("consultation", consultationToUse);
        addDrugInfoToModel(model);
        return "consultation-create";
    }
    
    /**
     * Helper method to add drug-related information to the model for the consultation view.
     * Adds drug templates, all drugs from the database, and diagnostic information 
     * about drug counts.
     * 
     * @param model The Spring MVC model to which the drug information will be added
     */
    private void addDrugInfoToModel(Model model) {
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
        
        // Add all drugs from database
        List<Drug> defaultDrugs = drugService.getAllDrugs();
        model.addAttribute("defaultDrugs", defaultDrugs);
        
        // Add count of drugs in each template for diagnostics
        java.util.Map<String, Integer> drugCounts = new java.util.HashMap<>();
        for (String template : drugTemplates) {
            List<Drug> drugs = drugService.getDrugsByTemplateCategory(template);
            drugCounts.put(template, drugs.size());
        }
        model.addAttribute("drugCounts", drugCounts);
        
        // Add total count of all drugs for diagnostics
        model.addAttribute("totalDrugCount", drugService.getAllDrugs().size());
    }

    /**
     * Helper method to create a new consultation with default values.
     * Sets basic consultation properties including default vital signs.
     * 
     * @param patient The patient for whom to create the consultation
     * @return A newly created and persisted Consultation object
     */
    private Consultation createNewConsultation(Patient patient) {
        Consultation consultation = new Consultation();
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
        consultation.setDiagnosis("");
        
        // Get the doctor (for now just get the first available doctor)
        List<Doctor> doctors = doctorService.getAllDoctors();
        if (!doctors.isEmpty()) {
            consultation.setDoctor(doctors.get(0));
        }
        
        // Save the new consultation
        return consultationService.createConsultation(consultation);
    }

    /**
     * Handles the submission of a consultation form, saving the consultation and any associated prescriptions.
     * Updates the consultation's clinical notes, diagnosis, and vital signs.
     * If prescription data is provided, creates a new prescription and links it to the consultation.
     * 
     * @param consultation The consultation object from the form submission
     * @param drugIds Array of drug IDs for the prescription
     * @param drugDosages Array of dosages for each drug
     * @param drugDurations Array of durations for each drug
     * @param drugQuantities Array of quantities for each drug
     * @return A redirect URL to the consultation queue page with success or error parameters
     */
    @PostMapping("/save")
    public String saveConsultation(
            @ModelAttribute Consultation consultation,
            @RequestParam(value = "drugIds", required = false) String[] drugIds,
            @RequestParam(value = "drugDosages", required = false) String[] drugDosages,
            @RequestParam(value = "drugDurations", required = false) String[] drugDurations,
            @RequestParam(value = "drugQuantities", required = false) String[] drugQuantities) {
        
        try {
            // Debug logging
            System.out.println("Saving consultation: " + consultation.getId());
            System.out.println("Drug IDs: " + (drugIds != null ? drugIds.length : "null"));
            
            // Find the existing consultation
            Optional<Consultation> existingConsultationOpt = consultationService.getConsultationById(consultation.getId());
            
            if (existingConsultationOpt.isEmpty()) {
                System.out.println("Error: Consultation not found with ID: " + consultation.getId());
                return "redirect:/consultation?error=consultation-not-found";
            }
            
            Consultation existingConsultation = existingConsultationOpt.get();
            
            // Update the consultation with the form values
            existingConsultation.setClinicalNotes(consultation.getClinicalNotes());
            
            // Update diagnosis with the new simplified field
            if (consultation.getDiagnosis() != null) {
                existingConsultation.setDiagnosis(consultation.getDiagnosis());
                System.out.println("Updated diagnosis: " + consultation.getDiagnosis());
            }
            
            // Update vital signs from the form
            if (consultation.getVitalSigns() != null) {
                System.out.println("Updating vital signs from form submission");
                System.out.println("Form vital signs - Height: " + consultation.getVitalSigns().getHeight());
                System.out.println("Form vital signs - Weight: " + consultation.getVitalSigns().getWeight());
                System.out.println("Form vital signs - Temperature: " + consultation.getVitalSigns().getTemperature());
                System.out.println("Form vital signs - Blood Pressure: " + consultation.getVitalSigns().getBloodPressure());
                
                // Get the existing vital signs or create new ones if not present
                Consultation.VitalSigns existingVitals = existingConsultation.getVitalSigns();
                if (existingVitals == null) {
                    existingVitals = new Consultation.VitalSigns();
                    existingConsultation.setVitalSigns(existingVitals);
                }
                
                // Copy values from form
                existingVitals.setHeight(consultation.getVitalSigns().getHeight());
                existingVitals.setWeight(consultation.getVitalSigns().getWeight());
                existingVitals.setTemperature(consultation.getVitalSigns().getTemperature());
                existingVitals.setBloodPressure(consultation.getVitalSigns().getBloodPressure());
                existingVitals.setHeartRate(consultation.getVitalSigns().getHeartRate());
                existingVitals.setRespiratoryRate(consultation.getVitalSigns().getRespiratoryRate());
                existingVitals.setOxygenSaturation(consultation.getVitalSigns().getOxygenSaturation());
                
                // Calculate BMI if height and weight are available
                if (existingVitals.getHeight() != null && existingVitals.getWeight() != null && 
                    existingVitals.getHeight() > 0) {
                    double heightInMeters = existingVitals.getHeight() / 100.0; // Convert cm to meters
                    double bmi = existingVitals.getWeight() / (heightInMeters * heightInMeters);
                    // Round to 1 decimal place
                    bmi = Math.round(bmi * 10.0) / 10.0;
                    existingVitals.setBmi(bmi);
                    System.out.println("Calculated BMI: " + bmi);
                }
            } else {
                System.out.println("Warning: No vital signs data in form submission");
            }
            
            // Ensure we preserve the appointmentId if it exists
            if (consultation.getAppointmentId() != null) {
                existingConsultation.setAppointmentId(consultation.getAppointmentId());
            }
            
            // Handle drugs if any were added to the cart
            if (drugIds != null && drugIds.length > 0) {
                System.out.println("Processing " + drugIds.length + " drug items");
                
                // Create a new prescription
                Prescription prescription = new Prescription();
                
                // Set patient using existing consultation's patient
                if (existingConsultation.getPatient() != null) {
                    prescription.setPatient(existingConsultation.getPatient());
                } else {
                    System.out.println("Warning: Patient is null in the consultation");
                }
                
                // Set doctor information safely
                if (existingConsultation.getDoctor() != null) {
                    String doctorFullName = existingConsultation.getDoctor().getFirstName() + 
                                           " " + existingConsultation.getDoctor().getLastName();
                    prescription.setDoctorName(doctorFullName);
                    prescription.setDoctorId(existingConsultation.getDoctor().getId());
                } else {
                    System.out.println("Warning: Doctor is null in the consultation, fetching current doctor");
                    // Get the currently logged-in doctor
                    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                    String username = authentication.getName();
                    
                    Optional<Doctor> currentDoctorOpt = doctorService.getDoctorByUsername(username);
                    if (currentDoctorOpt.isPresent()) {
                        Doctor currentDoctor = currentDoctorOpt.get();
                        String doctorFullName = currentDoctor.getFirstName() + " " + currentDoctor.getLastName();
                        prescription.setDoctorName(doctorFullName);
                        prescription.setDoctorId(currentDoctor.getId());
                        
                        // Also update the consultation with this doctor
                        existingConsultation.setDoctor(currentDoctor);
                        System.out.println("Updated consultation with current doctor: " + doctorFullName);
                    } else {
                        System.out.println("Warning: Could not find current doctor, using default");
                        prescription.setDoctorName("Unknown Doctor");
                    }
                }
                
                // Set dates
                prescription.setPrescriptionDate(LocalDate.now());
                // Set validity to 30 days from now
                prescription.setValidUntil(LocalDate.now().plusDays(30));
                
                // Set status
                prescription.setStatus("active");
                
                // Create prescription items from form data
                List<Prescription.PrescriptionItem> prescriptionItems = new ArrayList<>();
                
                for (int i = 0; i < drugIds.length; i++) {
                    try {
                        // Only process if we have all the data for this item
                        if (drugDosages != null && drugDurations != null && drugQuantities != null &&
                            i < drugDosages.length && i < drugDurations.length && i < drugQuantities.length) {
                            
                            String drugId = drugIds[i];
                            System.out.println("Processing drug item: " + drugId);
                            
                            // Find the drug by ID
                            Optional<Drug> drugOpt = drugService.getDrugById(drugId);
                            if (drugOpt.isPresent()) {
                                Prescription.PrescriptionItem item = new Prescription.PrescriptionItem();
                                item.setDrug(drugOpt.get());
                                item.setDosage(drugDosages[i]);
                                item.setDuration(drugDurations[i]);
                                try {
                                    item.setQuantity(Integer.parseInt(drugQuantities[i]));
                                } catch (NumberFormatException e) {
                                    System.out.println("Warning: Invalid quantity format: " + drugQuantities[i]);
                                    item.setQuantity(1); // Default to 1 if parsing fails
                                }
                                
                                // Add default values for other fields
                                item.setFrequency("As directed");
                                item.setRefillable(false);
                                item.setRefillsRemaining(0);
                                
                                prescriptionItems.add(item);
                            } else {
                                System.out.println("Warning: Drug not found with ID: " + drugId);
                            }
                        }
                    } catch (Exception e) {
                        System.out.println("Error processing prescription item " + i + ": " + e.getMessage());
                    }
                }
                
                // Only save prescription if we have items
                if (!prescriptionItems.isEmpty()) {
                    prescription.setPrescriptionItems(prescriptionItems);
                    
                    try {
                        // Save prescription and link to consultation
                        Prescription savedPrescription = prescriptionService.createPrescription(prescription);
                        existingConsultation.setPrescription(savedPrescription);
                        System.out.println("Created prescription with " + prescriptionItems.size() + " items");
                    } catch (Exception e) {
                        System.out.println("Error saving prescription: " + e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    System.out.println("No valid prescription items to save");
                }
            } else {
                System.out.println("No drug items submitted");
            }
            
            // Mark consultation as completed
            existingConsultation.setStatus("Completed");
            consultationService.updateConsultation(existingConsultation);
            
            return "redirect:/consultation?success=consultation-completed";
            
        } catch (Exception e) {
            System.out.println("Error saving consultation: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/consultation?error=save-failed&message=" + e.getClass().getSimpleName();
        }
    }
} 