package com.scorppultd.blackeyevalkyriesystem.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.scorppultd.blackeyevalkyriesystem.model.Prescription;

public interface PrescriptionService {
    
    // Basic CRUD operations
    Prescription createPrescription(Prescription prescription);
    Optional<Prescription> getPrescriptionById(String id);
    List<Prescription> getAllPrescriptions();
    Prescription updatePrescription(Prescription prescription);
    void deletePrescription(String id);
    
    // Patient and doctor specific operations
    List<Prescription> getPrescriptionsByPatient(String patientId);
    List<Prescription> getPrescriptionsByDoctor(String doctorId);
    List<Prescription> getPrescriptionsByDoctorName(String doctorName);
    
    // Date related operations
    List<Prescription> getPrescriptionsByPrescriptionDate(LocalDate prescriptionDate);
    List<Prescription> getPrescriptionsByDateRange(LocalDate startDate, LocalDate endDate);
    List<Prescription> getActivePrescriptions(LocalDate currentDate);
    List<Prescription> getExpiredPrescriptions(LocalDate currentDate);
    
    // Status operations
    List<Prescription> getPrescriptionsByStatus(String status);
    Prescription updatePrescriptionStatus(String id, String status);
    
    // Diagnosis operations
    List<Prescription> getPrescriptionsByDiagnosis(String diagnosis);
    
    // Drug-related operations
    List<Prescription> getPrescriptionsByDrugId(String drugId);
    List<Prescription> getPrescriptionsByDrugName(String drugName);
    
    // Active prescriptions for a patient
    List<Prescription> getActivePatientPrescriptions(String patientId, LocalDate currentDate);
    
    // Refill operations
    List<Prescription> getRefillablePrescriptions();
    Prescription updatePrescriptionRefillCount(String prescriptionId, String prescriptionItemIndex, Integer newRefillCount);
} 