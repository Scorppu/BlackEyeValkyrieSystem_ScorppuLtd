package com.scorppultd.blackeyevalkyriesystem.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;

@Repository
public interface ConsultationRepository extends MongoRepository<Consultation, String> {
    
    // Find by doctor and patient
    List<Consultation> findByDoctorId(String doctorId);
    List<Consultation> findByPatientId(String patientId);
    List<Consultation> findByDoctorIdAndPatientId(String doctorId, String patientId);
    
    // Find by date range
    List<Consultation> findByConsultationDateTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Consultation> findByFollowUpDate(LocalDate followUpDate);
    
    // Find by status
    List<Consultation> findByStatus(String status);
    List<Consultation> findByDoctorIdAndStatus(String doctorId, String status);
    List<Consultation> findByPatientIdAndStatus(String patientId, String status);
    
    // Find by consultation type
    List<Consultation> findByConsultationType(String consultationType);
    
    // Find consultations with a specific diagnosis
    @Query("{'diagnoses.diagnosisName': ?0}")
    List<Consultation> findByDiagnosisName(String diagnosisName);
    
    @Query("{'diagnoses.diagnosisCode': ?0}")
    List<Consultation> findByDiagnosisCode(String diagnosisCode);
    
    // Find consultations for follow-up
    List<Consultation> findByFollowUpDateAndStatus(LocalDate followUpDate, String status);
    
    // Find consultations with prescriptions
    List<Consultation> findByPrescriptionIsNotNull();
    
    // Find recent consultations for a patient
    List<Consultation> findByPatientIdOrderByConsultationDateTimeDesc(String patientId);
    
    // Find consultations for a time period grouped by doctor
    List<Consultation> findByConsultationDateTimeBetweenAndDoctorIdOrderByConsultationDateTime(
            LocalDateTime start, LocalDateTime end, String doctorId);
            
    // Find consultation by appointment ID
    Optional<Consultation> findByAppointmentId(String appointmentId);
} 