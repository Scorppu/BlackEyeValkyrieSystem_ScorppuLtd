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
    void addDiagnosisToConsultation(String consultationId, Consultation.Diagnosis diagnosis);
    List<Consultation> getConsultationsByDiagnosisName(String diagnosisName);
    List<Consultation> getConsultationsByDiagnosisCode(String diagnosisCode);
    
    // Prescription operations
    Consultation addPrescriptionToConsultation(String consultationId, Prescription prescription);
    List<Consultation> getConsultationsWithPrescriptions();
    
    // Reporting operations
    List<Consultation> getRecentConsultationsByPatient(String patientId);
    List<Consultation> getDoctorConsultationsForPeriod(String doctorId, LocalDateTime start, LocalDateTime end);
} 