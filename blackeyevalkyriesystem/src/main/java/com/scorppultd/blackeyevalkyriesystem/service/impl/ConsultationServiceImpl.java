package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.repository.ConsultationRepository;
import com.scorppultd.blackeyevalkyriesystem.repository.PrescriptionRepository;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;

@Service
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentService appointmentService;

    @Autowired
    public ConsultationServiceImpl(ConsultationRepository consultationRepository, 
                                  PrescriptionRepository prescriptionRepository,
                                  AppointmentService appointmentService) {
        this.consultationRepository = consultationRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentService = appointmentService;
    }

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

    @Override
    public Optional<Consultation> getConsultationById(String id) {
        return consultationRepository.findById(id);
    }

    @Override
    public List<Consultation> getAllConsultations() {
        return consultationRepository.findAll();
    }

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
     * Helper method to update the status of an appointment
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

    @Override
    public void deleteConsultation(String id) {
        consultationRepository.deleteById(id);
    }

    @Override
    public List<Consultation> getConsultationsByDoctor(String doctorId) {
        return consultationRepository.findByDoctorId(doctorId);
    }

    @Override
    public List<Consultation> getConsultationsByPatient(String patientId) {
        return consultationRepository.findByPatientId(patientId);
    }

    @Override
    public List<Consultation> getConsultationsByDoctorAndPatient(String doctorId, String patientId) {
        return consultationRepository.findByDoctorIdAndPatientId(doctorId, patientId);
    }

    @Override
    public List<Consultation> getConsultationsByPatientIdAndStatus(String patientId, String status) {
        return consultationRepository.findByPatientIdAndStatus(patientId, status);
    }

    @Override
    public List<Consultation> getConsultationsInDateRange(LocalDateTime start, LocalDateTime end) {
        return consultationRepository.findByConsultationDateTimeBetween(start, end);
    }

    @Override
    public List<Consultation> getConsultationsForFollowUp(LocalDate followUpDate) {
        return consultationRepository.findByFollowUpDate(followUpDate);
    }

    @Override
    public List<Consultation> getConsultationsByStatus(String status) {
        return consultationRepository.findByStatus(status);
    }

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

    @Override
    public void addDiagnosisToConsultation(String consultationId, Consultation.Diagnosis diagnosis) {
        Optional<Consultation> consultationOpt = consultationRepository.findById(consultationId);
        if (consultationOpt.isPresent()) {
            Consultation consultation = consultationOpt.get();
            consultation.addDiagnosis(diagnosis);
            consultation.setUpdatedAt(LocalDateTime.now());
            consultationRepository.save(consultation);
        } else {
            throw new RuntimeException("Consultation not found with id: " + consultationId);
        }
    }

    @Override
    public List<Consultation> getConsultationsByDiagnosisName(String diagnosisName) {
        return consultationRepository.findByDiagnosisName(diagnosisName);
    }

    @Override
    public List<Consultation> getConsultationsByDiagnosisCode(String diagnosisCode) {
        return consultationRepository.findByDiagnosisCode(diagnosisCode);
    }

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

    @Override
    public List<Consultation> getConsultationsWithPrescriptions() {
        return consultationRepository.findByPrescriptionIsNotNull();
    }

    @Override
    public List<Consultation> getRecentConsultationsByPatient(String patientId) {
        return consultationRepository.findByPatientIdOrderByConsultationDateTimeDesc(patientId);
    }

    @Override
    public List<Consultation> getDoctorConsultationsForPeriod(String doctorId, LocalDateTime start, LocalDateTime end) {
        return consultationRepository.findByConsultationDateTimeBetweenAndDoctorIdOrderByConsultationDateTime(start, end, doctorId);
    }

    @Override
    public Optional<Consultation> getConsultationByAppointmentId(String appointmentId) {
        return consultationRepository.findByAppointmentId(appointmentId);
    }
    
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
        consultation.setDiagnoses(List.of(new Consultation.Diagnosis()));
        
        // Save the new consultation
        return createConsultation(consultation);
    }
    
    /**
     * Check if the vital signs are using default values
     */
    private boolean isUsingDefaultVitals(Consultation.VitalSigns vitalSigns) {
        // If any vital sign has null values, we need to update from appointment
        return vitalSigns.getTemperature() == null || 
               vitalSigns.getBloodPressure() == null || 
               vitalSigns.getHeight() == null || 
               vitalSigns.getWeight() == null;
    }
    
    /**
     * Helper method to update a consultation's vital signs from an appointment
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
} 