package com.scorppultd.blackeyevalkyriesystem.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;

public interface ConsultationService {
    
    // Basic CRUD operations
    Consultation createConsultation(Consultation consultation);
    Optional<Consultation> getConsultationById(String id);
    List<Consultation> getAllConsultations();
    Consultation updateConsultation(Consultation consultation);
    void deleteConsultation(String id);
    
    // Doctor and patient specific operations
    List<Consultation> getConsultationsByDoctor(String doctorId);
    List<Consultation> getConsultationsByPatient(String patientId);
    List<Consultation> getConsultationsByDoctorAndPatient(String doctorId, String patientId);
    List<Consultation> getConsultationsByPatientIdAndStatus(String patientId, String status);
    
    // Date range queries
    List<Consultation> getConsultationsInDateRange(LocalDateTime start, LocalDateTime end);
    List<Consultation> getConsultationsForFollowUp(LocalDate followUpDate);
    
    // Status operations
    List<Consultation> getConsultationsByStatus(String status);
    Consultation updateConsultationStatus(String id, String status);
    
    // Diagnosis operations
    void updateDiagnosis(String consultationId, String diagnosis);
    List<Consultation> getConsultationsByDiagnosis(String diagnosis);
    
    // Prescription operations
    Consultation addPrescriptionToConsultation(String consultationId, Prescription prescription);
    List<Consultation> getConsultationsWithPrescriptions();
    
    // Reporting operations
    List<Consultation> getRecentConsultationsByPatient(String patientId);
    List<Consultation> getDoctorConsultationsForPeriod(String doctorId, LocalDateTime start, LocalDateTime end);
    
    // Appointment related operations
    Optional<Consultation> getConsultationByAppointmentId(String appointmentId);
    Consultation createConsultationFromAppointment(String appointmentId) throws Exception;
    
    /**
     * Updates only the vital signs of a consultation without affecting the appointment data
     * @param consultationId ID of the consultation to update
     * @param vitalSigns New vital signs to set
     * @return The updated consultation
     */
    Consultation updateConsultationVitalSigns(String consultationId, Consultation.VitalSigns vitalSigns);
} 