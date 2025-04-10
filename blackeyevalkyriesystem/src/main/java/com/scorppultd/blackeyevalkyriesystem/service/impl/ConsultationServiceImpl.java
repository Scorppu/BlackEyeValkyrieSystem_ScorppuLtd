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
            return existingConsultation.get();
        }
        
        // Create a new consultation
        Consultation consultation = new Consultation();
        consultation.setPatient(appointment.getPatient());
        consultation.setConsultationDateTime(LocalDateTime.now());
        consultation.setConsultationType(appointment.getAppointmentType() != null ? 
                appointment.getAppointmentType() : "General Consultation");
        consultation.setStatus("In-Progress");
        consultation.setAppointmentId(appointmentId);
        
        // Set default vital signs
        Consultation.VitalSigns vitalSigns = new Consultation.VitalSigns();
        vitalSigns.setTemperature(37.0);
        vitalSigns.setBloodPressure("120/80");
        vitalSigns.setHeartRate(70);
        vitalSigns.setRespiratoryRate(16);
        vitalSigns.setWeight(70.0);
        vitalSigns.setHeight(170.0);
        consultation.setVitalSigns(vitalSigns);
        
        // Initialize empty diagnosis
        consultation.setDiagnoses(List.of(new Consultation.Diagnosis()));
        
        // Save the new consultation
        return createConsultation(consultation);
    }
} 