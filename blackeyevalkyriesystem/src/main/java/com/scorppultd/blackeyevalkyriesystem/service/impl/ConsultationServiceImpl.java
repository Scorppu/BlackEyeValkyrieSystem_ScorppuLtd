package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.repository.ConsultationRepository;
import com.scorppultd.blackeyevalkyriesystem.repository.PrescriptionRepository;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;

/**
 * Implementation of the ConsultationService interface.
 * This service manages medical consultations, including creating, retrieving, updating,
 * and deleting consultations. It also handles relationships between consultations,
 * appointments, prescriptions, and doctors.
 */
@Service
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;

    /**
     * Constructs a ConsultationServiceImpl with necessary dependencies.
     *
     * @param consultationRepository Repository for consultation data access
     * @param prescriptionRepository Repository for prescription data access
     * @param appointmentService Service for appointment operations
     * @param doctorService Service for doctor operations
     */
    @Autowired
    public ConsultationServiceImpl(ConsultationRepository consultationRepository, 
                                  PrescriptionRepository prescriptionRepository,
                                  AppointmentService appointmentService,
                                  DoctorService doctorService) {
        this.consultationRepository = consultationRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
    }

    /**
     * Creates a new consultation record.
     * Sets audit timestamps and defaults status to "Scheduled" if not provided.
     *
     * @param consultation The consultation object to create
     * @return The created consultation with generated ID
     */
    @Override
    public Consultation createConsultation(Consultation consultation) {
        // Set audit timestamps
        LocalDateTime now = LocalDateTime.now();
        consultation.setCreatedAt(now);
        consultation.setUpdatedAt(now);
        
        // Default status if not provided
        if (consultation.getStatus() == null) {
            consultation.setStatus("Scheduled");
        }
        
        return consultationRepository.save(consultation);
    }

    /**
     * Retrieves a consultation by its ID.
     *
     * @param id The ID of the consultation to retrieve
     * @return An Optional containing the consultation if found, or empty if not
     */
    @Override
    public Optional<Consultation> getConsultationById(String id) {
        return consultationRepository.findById(id);
    }

    /**
     * Retrieves all consultations in the system.
     *
     * @return A list of all consultations
     */
    @Override
    public List<Consultation> getAllConsultations() {
        return consultationRepository.findAll();
    }

    /**
     * Updates an existing consultation.
     * Updates the updatedAt timestamp and if status is "Completed",
     * also updates the associated appointment status.
     *
     * @param consultation The consultation with updated fields
     * @return The updated consultation
     */
    @Override
    public Consultation updateConsultation(Consultation consultation) {
        // Update the updatedAt timestamp
        consultation.setUpdatedAt(LocalDateTime.now());
        
        // If the consultation status is completed and it has an appointmentId, update the appointment status
        if ("Completed".equals(consultation.getStatus()) && consultation.getAppointmentId() != null) {
            updateAppointmentStatus(consultation.getAppointmentId(), "completed");
        }
        
        return consultationRepository.save(consultation);
    }

    /**
     * Helper method to update the status of an appointment.
     * 
     * @param appointmentId The ID of the appointment to update
     * @param status The new status to set
     */
    private void updateAppointmentStatus(String appointmentId, String status) {
        try {
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(appointmentId);
            if (appointmentOpt.isPresent()) {
                Appointment appointment = appointmentOpt.get();
                appointment.setStatus(status);
                appointment.setCompletionTime(LocalDateTime.now());
                appointmentService.updateAppointment(appointment);
            }
        } catch (Exception e) {
            // Log error but don't fail the consultation update
            System.err.println("Failed to update appointment status: " + e.getMessage());
        }
    }

    /**
     * Deletes a consultation by its ID.
     *
     * @param id The ID of the consultation to delete
     */
    @Override
    public void deleteConsultation(String id) {
        consultationRepository.deleteById(id);
    }

    /**
     * Retrieves all consultations for a specific doctor.
     *
     * @param doctorId The ID of the doctor
     * @return A list of consultations for the specified doctor
     */
    @Override
    public List<Consultation> getConsultationsByDoctor(String doctorId) {
        return consultationRepository.findByDoctorId(doctorId);
    }

    /**
     * Retrieves all consultations for a specific patient.
     *
     * @param patientId The ID of the patient
     * @return A list of consultations for the specified patient
     */
    @Override
    public List<Consultation> getConsultationsByPatient(String patientId) {
        return consultationRepository.findByPatientId(patientId);
    }

    /**
     * Retrieves all consultations between a specific doctor and patient.
     *
     * @param doctorId The ID of the doctor
     * @param patientId The ID of the patient
     * @return A list of consultations between the specified doctor and patient
     */
    @Override
    public List<Consultation> getConsultationsByDoctorAndPatient(String doctorId, String patientId) {
        return consultationRepository.findByDoctorIdAndPatientId(doctorId, patientId);
    }

    /**
     * Retrieves all consultations for a patient with a specific status.
     *
     * @param patientId The ID of the patient
     * @param status The status to filter by
     * @return A list of consultations matching the criteria
     */
    @Override
    public List<Consultation> getConsultationsByPatientIdAndStatus(String patientId, String status) {
        return consultationRepository.findByPatientIdAndStatus(patientId, status);
    }

    /**
     * Retrieves all consultations within a date range.
     *
     * @param start The start date and time
     * @param end The end date and time
     * @return A list of consultations within the specified date range
     */
    @Override
    public List<Consultation> getConsultationsInDateRange(LocalDateTime start, LocalDateTime end) {
        return consultationRepository.findByConsultationDateTimeBetween(start, end);
    }

    /**
     * Retrieves all consultations scheduled for follow-up on a specific date.
     *
     * @param followUpDate The follow-up date to filter by
     * @return A list of consultations with the specified follow-up date
     */
    @Override
    public List<Consultation> getConsultationsForFollowUp(LocalDate followUpDate) {
        return consultationRepository.findByFollowUpDate(followUpDate);
    }

    /**
     * Retrieves all consultations with a specific status.
     *
     * @param status The status to filter by
     * @return A list of consultations with the specified status
     */
    @Override
    public List<Consultation> getConsultationsByStatus(String status) {
        return consultationRepository.findByStatus(status);
    }

    /**
     * Updates the status of a consultation.
     *
     * @param id The ID of the consultation to update
     * @param status The new status to set
     * @return The updated consultation
     * @throws RuntimeException if the consultation is not found
     */
    @Override
    public Consultation updateConsultationStatus(String id, String status) {
        Optional<Consultation> consultationOpt = consultationRepository.findById(id);
        if (consultationOpt.isPresent()) {
            Consultation consultation = consultationOpt.get();
            consultation.setStatus(status);
            consultation.setUpdatedAt(LocalDateTime.now());
            return consultationRepository.save(consultation);
        }
        throw new RuntimeException("Consultation not found with id: " + id);
    }

    /**
     * Retrieves all consultations with a specific diagnosis.
     *
     * @param diagnosis The diagnosis to filter by
     * @return A list of consultations with the specified diagnosis
     */
    @Override
    public List<Consultation> getConsultationsByDiagnosis(String diagnosis) {
        return consultationRepository.findByDiagnosis(diagnosis);
    }

    /**
     * Adds a prescription to a consultation.
     *
     * @param consultationId The ID of the consultation
     * @param prescription The prescription to add
     * @return The updated consultation with the prescription added
     * @throws RuntimeException if the consultation is not found
     */
    @Override
    public Consultation addPrescriptionToConsultation(String consultationId, Prescription prescription) {
        Optional<Consultation> consultationOpt = consultationRepository.findById(consultationId);
        if (consultationOpt.isPresent()) {
            Consultation consultation = consultationOpt.get();
            
            // Save the prescription first
            Prescription savedPrescription = prescriptionRepository.save(prescription);
            
            // Update the consultation with the prescription reference
            consultation.setPrescription(savedPrescription);
            consultation.setUpdatedAt(LocalDateTime.now());
            
            return consultationRepository.save(consultation);
        }
        throw new RuntimeException("Consultation not found with id: " + consultationId);
    }

    /**
     * Retrieves all consultations that have associated prescriptions.
     *
     * @return A list of consultations with prescriptions
     */
    @Override
    public List<Consultation> getConsultationsWithPrescriptions() {
        return consultationRepository.findByPrescriptionIsNotNull();
    }

    /**
     * Retrieves the most recent consultations for a patient,
     * ordered by consultation date and time in descending order.
     *
     * @param patientId The ID of the patient
     * @return A list of the patient's consultations, most recent first
     */
    @Override
    public List<Consultation> getRecentConsultationsByPatient(String patientId) {
        return consultationRepository.findByPatientIdOrderByConsultationDateTimeDesc(patientId);
    }

    /**
     * Retrieves all consultations for a doctor within a specific time period,
     * ordered by consultation date and time.
     *
     * @param doctorId The ID of the doctor
     * @param start The start date and time
     * @param end The end date and time
     * @return A list of consultations matching the criteria
     */
    @Override
    public List<Consultation> getDoctorConsultationsForPeriod(String doctorId, LocalDateTime start, LocalDateTime end) {
        return consultationRepository.findByConsultationDateTimeBetweenAndDoctorIdOrderByConsultationDateTime(start, end, doctorId);
    }

    /**
     * Retrieves a consultation by its associated appointment ID.
     *
     * @param appointmentId The ID of the appointment
     * @return An Optional containing the consultation if found, or empty if not
     */
    @Override
    public Optional<Consultation> getConsultationByAppointmentId(String appointmentId) {
        return consultationRepository.findByAppointmentId(appointmentId);
    }
    
    /**
     * Creates a new consultation from an existing appointment.
     * If a consultation already exists for the appointment, it updates the
     * vital signs and doctor information if needed.
     *
     * @param appointmentId The ID of the appointment to create a consultation from
     * @return The created or updated consultation
     * @throws Exception if the appointment is not found or if there's an error during creation
     */
    @Override
    public Consultation createConsultationFromAppointment(String appointmentId) throws Exception {
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(appointmentId);
        
        if (appointmentOpt.isEmpty()) {
            throw new RuntimeException("Appointment not found with id: " + appointmentId);
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Check if a consultation already exists for this appointment
        Optional<Consultation> existingConsultation = getConsultationByAppointmentId(appointmentId);
        if (existingConsultation.isPresent()) {
            Consultation consultation = existingConsultation.get();
            // Check if we need to update the vitals from the appointment
            if (appointment.getVitalSigns() != null && 
                (consultation.getVitalSigns() == null || 
                 isUsingDefaultVitals(consultation.getVitalSigns()))) {
                System.out.println("Updating vitals on existing consultation for appointment ID: " + appointmentId);
                updateConsultationVitalsFromAppointment(consultation, appointment);
                consultation = updateConsultation(consultation);
            }
            
            // Check if doctor should be set or updated
            if (consultation.getDoctor() == null && appointment.getDoctorName() != null) {
                updateConsultationDoctorFromAppointment(consultation, appointment);
                consultation = updateConsultation(consultation);
            }
            
            return consultation;
        }
        
        // Create a new consultation
        Consultation consultation = new Consultation();
        consultation.setPatient(appointment.getPatient());
        consultation.setConsultationDateTime(LocalDateTime.now());
        consultation.setConsultationType(appointment.getAppointmentType() != null ? 
                appointment.getAppointmentType() : "General Consultation");
        consultation.setStatus("In-Progress");
        consultation.setAppointmentId(appointmentId);
        
        // Set doctor from appointment if available
        if (appointment.getDoctorName() != null) {
            updateConsultationDoctorFromAppointment(consultation, appointment);
        } else {
            System.out.println("No doctor name found for appointment ID: " + appointmentId);
        }
        
        // Create empty vital signs
        Consultation.VitalSigns vitalSigns = new Consultation.VitalSigns();
        consultation.setVitalSigns(vitalSigns);
        
        // Update vitals from appointment if available
        if (appointment.getVitalSigns() != null) {
            updateConsultationVitalsFromAppointment(consultation, appointment);
        } else {
            System.out.println("No vital signs found for appointment ID: " + appointmentId);
        }
        
        // Initialize empty diagnosis
        consultation.setDiagnosis("");
        
        // Save the new consultation
        return createConsultation(consultation);
    }
    
    /**
     * Checks if the vital signs are using default or null values.
     * 
     * @param vitalSigns The vital signs to check
     * @return true if any key vital sign is null, false otherwise
     */
    private boolean isUsingDefaultVitals(Consultation.VitalSigns vitalSigns) {
        // If any vital sign has null values, we need to update from appointment
        return vitalSigns.getTemperature() == null || 
               vitalSigns.getBloodPressure() == null || 
               vitalSigns.getHeight() == null || 
               vitalSigns.getWeight() == null;
    }
    
    /**
     * Updates a consultation's vital signs from an appointment's vital signs.
     * 
     * @param consultation The consultation to update
     * @param appointment The appointment with vital signs to transfer
     */
    private void updateConsultationVitalsFromAppointment(Consultation consultation, Appointment appointment) {
        if (appointment.getVitalSigns() == null) {
            return;
        }
        
        Appointment.VitalSigns appointmentVitals = appointment.getVitalSigns();
        Consultation.VitalSigns consultationVitals = consultation.getVitalSigns();
        if (consultationVitals == null) {
            consultationVitals = new Consultation.VitalSigns();
            consultation.setVitalSigns(consultationVitals);
        }
        
        // Add debug logging
        System.out.println("Appointment vital signs found for appointment ID: " + appointment.getId());
        System.out.println("Temperature: " + appointmentVitals.getTemperature());
        System.out.println("High BP: " + appointmentVitals.getHighBloodPressure());
        System.out.println("Low BP: " + appointmentVitals.getLowBloodPressure());
        System.out.println("Heart Rate: " + appointmentVitals.getHeartRate());
        System.out.println("Respiratory Rate: " + appointmentVitals.getRespiratoryRate());
        System.out.println("Weight: " + appointmentVitals.getWeight());
        System.out.println("Height: " + appointmentVitals.getHeight());
        
        // Transfer vital sign values from appointment to consultation
        if (appointmentVitals.getTemperature() != null) {
            consultationVitals.setTemperature(appointmentVitals.getTemperature());
            System.out.println("Setting consultation temperature to: " + appointmentVitals.getTemperature());
        }
        
        // Format blood pressure from appointment's high and low values
        if (appointmentVitals.getHighBloodPressure() != null && appointmentVitals.getLowBloodPressure() != null) {
            String bloodPressure = appointmentVitals.getHighBloodPressure() + "/" + appointmentVitals.getLowBloodPressure();
            consultationVitals.setBloodPressure(bloodPressure);
            System.out.println("Setting consultation blood pressure to: " + bloodPressure);
        }
        
        if (appointmentVitals.getHeartRate() != null) {
            consultationVitals.setHeartRate(appointmentVitals.getHeartRate());
            System.out.println("Setting consultation heart rate to: " + appointmentVitals.getHeartRate());
        }
        
        if (appointmentVitals.getRespiratoryRate() != null) {
            consultationVitals.setRespiratoryRate(appointmentVitals.getRespiratoryRate());
            System.out.println("Setting consultation respiratory rate to: " + appointmentVitals.getRespiratoryRate());
        }
        
        if (appointmentVitals.getWeight() != null) {
            consultationVitals.setWeight(appointmentVitals.getWeight());
            System.out.println("Setting consultation weight to: " + appointmentVitals.getWeight());
        }
        
        if (appointmentVitals.getHeight() != null) {
            consultationVitals.setHeight(appointmentVitals.getHeight());
            System.out.println("Setting consultation height to: " + appointmentVitals.getHeight());
        }
        
        if (appointmentVitals.getOxygenSaturation() != null) {
            consultationVitals.setOxygenSaturation(appointmentVitals.getOxygenSaturation());
            System.out.println("Setting consultation oxygen saturation to: " + appointmentVitals.getOxygenSaturation());
        }
        
        // Add debug logging to check vital signs in the consultation
        System.out.println("Consultation vital signs after transfer:");
        System.out.println("Temperature: " + consultation.getVitalSigns().getTemperature());
        System.out.println("Blood Pressure: " + consultation.getVitalSigns().getBloodPressure());
        System.out.println("Heart Rate: " + consultation.getVitalSigns().getHeartRate());
        System.out.println("Respiratory Rate: " + consultation.getVitalSigns().getRespiratoryRate());
        System.out.println("Weight: " + consultation.getVitalSigns().getWeight());
        System.out.println("Height: " + consultation.getVitalSigns().getHeight());
    }

    /**
     * Updates the vital signs of an existing consultation.
     *
     * @param consultationId The ID of the consultation to update
     * @param vitalSigns The new vital signs to set
     * @return The updated consultation
     * @throws RuntimeException if the consultation is not found
     */
    @Override
    public Consultation updateConsultationVitalSigns(String consultationId, Consultation.VitalSigns vitalSigns) {
        Optional<Consultation> consultationOpt = consultationRepository.findById(consultationId);
        if (consultationOpt.isEmpty()) {
            throw new RuntimeException("Consultation not found with id: " + consultationId);
        }
        
        Consultation consultation = consultationOpt.get();
        
        // Update the vital signs on the consultation only
        consultation.setVitalSigns(vitalSigns);
        
        // Update the timestamp
        consultation.setUpdatedAt(LocalDateTime.now());
        
        // Log the update for debugging purposes
        System.out.println("Updating vital signs for consultation ID: " + consultationId);
        System.out.println("Temperature: " + vitalSigns.getTemperature());
        System.out.println("Blood Pressure: " + vitalSigns.getBloodPressure());
        System.out.println("Heart Rate: " + vitalSigns.getHeartRate());
        System.out.println("Respiratory Rate: " + vitalSigns.getRespiratoryRate());
        System.out.println("Weight: " + vitalSigns.getWeight());
        System.out.println("Height: " + vitalSigns.getHeight());
        System.out.println("Oxygen Saturation: " + vitalSigns.getOxygenSaturation());
        
        // Save and return the updated consultation
        return consultationRepository.save(consultation);
    }

    /**
     * Updates the diagnosis for a consultation.
     *
     * @param consultationId The ID of the consultation to update
     * @param diagnosis The new diagnosis to set
     * @throws RuntimeException if the consultation is not found
     */
    @Override
    public void updateDiagnosis(String consultationId, String diagnosis) {
        Optional<Consultation> consultationOpt = consultationRepository.findById(consultationId);
        if (consultationOpt.isPresent()) {
            Consultation consultation = consultationOpt.get();
            consultation.setDiagnosis(diagnosis);
            consultation.setUpdatedAt(LocalDateTime.now());
            consultationRepository.save(consultation);
        } else {
            throw new RuntimeException("Consultation not found with id: " + consultationId);
        }
    }

    /**
     * Updates a consultation's doctor information from an appointment.
     * Attempts to find a matching doctor using various methods.
     * 
     * @param consultation The consultation to update
     * @param appointment The appointment with doctor information
     */
    private void updateConsultationDoctorFromAppointment(Consultation consultation, Appointment appointment) {
        if (appointment.getDoctorName() == null || appointment.getDoctorName().trim().isEmpty()) {
            System.out.println("Doctor name is null or empty for appointment ID: " + appointment.getId());
            return;
        }
        
        String doctorName = appointment.getDoctorName();
        System.out.println("Looking up doctor by name: " + doctorName);
        
        // First try to find by exact full name
        Optional<Doctor> doctorByName = doctorService.getDoctorByName(doctorName);
        
        if (doctorByName.isPresent()) {
            System.out.println("Found doctor by exact name match: " + doctorName);
            consultation.setDoctor(doctorByName.get());
            System.out.println("Successfully set doctor: " + doctorByName.get().getFullName() + " (ID: " + doctorByName.get().getId() + ")");
            return;
        } else {
            System.out.println("No exact match found for doctor name: " + doctorName);
        }
        
        // If exact match fails, try partial name match and take the first one
        List<Doctor> doctorsByPartialName = doctorService.getDoctorsByNameContaining(doctorName);
        
        if (!doctorsByPartialName.isEmpty()) {
            Doctor matchedDoctor = doctorsByPartialName.get(0);
            System.out.println("Found doctor by partial name match: " + matchedDoctor.getFullName());
            consultation.setDoctor(matchedDoctor);
            System.out.println("Successfully set doctor: " + matchedDoctor.getFullName() + " (ID: " + matchedDoctor.getId() + ")");
            return;
        } else {
            System.out.println("No partial matches found for doctor name: " + doctorName);
        }
        
        // Try to find by splitting the name into first and last
        try {
            String[] nameParts = doctorName.split("\\s+");
            if (nameParts.length >= 2) {
                String firstName = nameParts[0];
                String lastName = nameParts[nameParts.length - 1];
                
                System.out.println("Trying to find doctor with first name: " + firstName + " and last name: " + lastName);
                
                // Get all doctors and filter manually
                List<Doctor> allDoctors = doctorService.getAllDoctors();
                Optional<Doctor> matchedDoctor = allDoctors.stream()
                    .filter(doc -> doc.getFirstName() != null && doc.getLastName() != null)
                    .filter(doc -> doc.getFirstName().equalsIgnoreCase(firstName) && doc.getLastName().equalsIgnoreCase(lastName))
                    .findFirst();
                
                if (matchedDoctor.isPresent()) {
                    System.out.println("Found doctor by first and last name: " + matchedDoctor.get().getFullName());
                    consultation.setDoctor(matchedDoctor.get());
                    System.out.println("Successfully set doctor: " + matchedDoctor.get().getFullName() + " (ID: " + matchedDoctor.get().getId() + ")");
                    return;
                } else {
                    System.out.println("No doctor found with first name: " + firstName + " and last name: " + lastName);
                }
            }
        } catch (Exception e) {
            System.out.println("Error trying to match doctor by first/last name: " + e.getMessage());
        }
        
        // If all else fails, get the first doctor with a similar username or email
        try {
            List<Doctor> allDoctors = doctorService.getAllDoctors();
            Optional<Doctor> anyMatch = allDoctors.stream()
                .filter(doc -> doc.getUsername() != null && doc.getUsername().toLowerCase().contains(doctorName.toLowerCase())
                       || doc.getEmail() != null && doc.getEmail().toLowerCase().contains(doctorName.toLowerCase()))
                .findFirst();
                
            if (anyMatch.isPresent()) {
                System.out.println("Found doctor by username/email match: " + anyMatch.get().getFullName());
                consultation.setDoctor(anyMatch.get());
                System.out.println("Successfully set doctor: " + anyMatch.get().getFullName() + " (ID: " + anyMatch.get().getId() + ")");
                return;
            }
        } catch (Exception e) {
            System.out.println("Error trying to match doctor by username/email: " + e.getMessage());
        }
        
        System.out.println("WARNING: No doctor found with name: " + doctorName + ". Consultation will not have a doctor assigned.");
    }
} 