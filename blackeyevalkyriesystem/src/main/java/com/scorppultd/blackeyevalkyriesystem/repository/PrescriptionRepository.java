package com.scorppultd.blackeyevalkyriesystem.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Prescription;

@Repository
public interface PrescriptionRepository extends MongoRepository<Prescription, String> {
    
    // Find by patient
    List<Prescription> findByPatientId(String patientId);
    
    // Find by doctor
    List<Prescription> findByDoctorId(String doctorId);
    List<Prescription> findByDoctorName(String doctorName);
    
    // Find by date
    List<Prescription> findByPrescriptionDate(LocalDate prescriptionDate);
    List<Prescription> findByPrescriptionDateBetween(LocalDate startDate, LocalDate endDate);
    List<Prescription> findByValidUntilAfter(LocalDate date);
    List<Prescription> findByValidUntilBefore(LocalDate date);
    
    // Find by status
    List<Prescription> findByStatus(String status);
    
    // Find by diagnosis
    List<Prescription> findByDiagnosis(String diagnosis);
    
    // Find prescriptions for a specific drug (using nested queries)
    List<Prescription> findByPrescriptionItems_Drug_Id(String drugId);
    List<Prescription> findByPrescriptionItems_Drug_Name(String drugName);
    
    // Find active prescriptions for a patient
    List<Prescription> findByPatientIdAndValidUntilAfterAndStatus(String patientId, LocalDate currentDate, String status);
    
    // Find prescriptions by refill status
    List<Prescription> findByPrescriptionItems_RefillableAndPrescriptionItems_RefillsRemainingGreaterThan(
            Boolean refillable, Integer refillsRemaining);
} 