package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.repository.PrescriptionRepository;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;

/**
 * Implementation of the PrescriptionService interface.
 * This service provides operations for managing prescriptions including creation,
 * retrieval, update, deletion, and various specialized query operations.
 */
@Service
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    /**
     * Constructs a new PrescriptionServiceImpl with the required repository.
     * 
     * @param prescriptionRepository The repository for prescription data access
     */
    @Autowired
    public PrescriptionServiceImpl(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Creates a new prescription record. If prescriptionDate or status are not provided,
     * default values are set (current date for prescriptionDate and "active" for status).
     * 
     * @param prescription The prescription object to be created
     * @return The created prescription with generated ID
     */
    @Override
    public Prescription createPrescription(Prescription prescription) {
        // Set default values if not provided
        if (prescription.getPrescriptionDate() == null) {
            prescription.setPrescriptionDate(LocalDate.now());
        }
        
        if (prescription.getStatus() == null) {
            prescription.setStatus("active");
        }
        
        return prescriptionRepository.save(prescription);
    }

    /**
     * Retrieves a prescription by its ID.
     * 
     * @param id The ID of the prescription to retrieve
     * @return An Optional containing the found prescription, or empty if not found
     */
    @Override
    public Optional<Prescription> getPrescriptionById(String id) {
        return prescriptionRepository.findById(id);
    }

    /**
     * Retrieves all prescriptions in the system.
     * 
     * @return A list of all prescriptions
     */
    @Override
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    /**
     * Updates an existing prescription.
     * 
     * @param prescription The prescription with updated values
     * @return The updated prescription
     */
    @Override
    public Prescription updatePrescription(Prescription prescription) {
        return prescriptionRepository.save(prescription);
    }

    /**
     * Deletes a prescription by its ID.
     * 
     * @param id The ID of the prescription to delete
     */
    @Override
    public void deletePrescription(String id) {
        prescriptionRepository.deleteById(id);
    }

    /**
     * Retrieves all prescriptions associated with a specific patient.
     * 
     * @param patientId The ID of the patient
     * @return A list of prescriptions for the patient
     */
    @Override
    public List<Prescription> getPrescriptionsByPatient(String patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    /**
     * Retrieves all prescriptions issued by a specific doctor.
     * 
     * @param doctorId The ID of the doctor
     * @return A list of prescriptions issued by the doctor
     */
    @Override
    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }

    /**
     * Retrieves all prescriptions issued by a doctor with the specified name.
     * 
     * @param doctorName The name of the doctor
     * @return A list of prescriptions issued by the doctor
     */
    @Override
    public List<Prescription> getPrescriptionsByDoctorName(String doctorName) {
        return prescriptionRepository.findByDoctorName(doctorName);
    }

    /**
     * Retrieves all prescriptions issued on a specific date.
     * 
     * @param prescriptionDate The date on which prescriptions were issued
     * @return A list of prescriptions issued on the specified date
     */
    @Override
    public List<Prescription> getPrescriptionsByPrescriptionDate(LocalDate prescriptionDate) {
        return prescriptionRepository.findByPrescriptionDate(prescriptionDate);
    }

    /**
     * Retrieves all prescriptions issued within a specified date range.
     * 
     * @param startDate The start date of the range (inclusive)
     * @param endDate The end date of the range (inclusive)
     * @return A list of prescriptions issued within the date range
     */
    @Override
    public List<Prescription> getPrescriptionsByDateRange(LocalDate startDate, LocalDate endDate) {
        return prescriptionRepository.findByPrescriptionDateBetween(startDate, endDate);
    }

    /**
     * Retrieves all prescriptions that are still valid as of the specified date.
     * 
     * @param currentDate The date to check validity against
     * @return A list of active prescriptions
     */
    @Override
    public List<Prescription> getActivePrescriptions(LocalDate currentDate) {
        return prescriptionRepository.findByValidUntilAfter(currentDate);
    }

    /**
     * Retrieves all prescriptions that have expired as of the specified date.
     * 
     * @param currentDate The date to check expiry against
     * @return A list of expired prescriptions
     */
    @Override
    public List<Prescription> getExpiredPrescriptions(LocalDate currentDate) {
        return prescriptionRepository.findByValidUntilBefore(currentDate);
    }

    /**
     * Retrieves all prescriptions with the specified status.
     * 
     * @param status The status to filter by (e.g., "active", "completed")
     * @return A list of prescriptions with the specified status
     */
    @Override
    public List<Prescription> getPrescriptionsByStatus(String status) {
        return prescriptionRepository.findByStatus(status);
    }

    /**
     * Updates the status of a prescription.
     * 
     * @param id The ID of the prescription to update
     * @param status The new status value
     * @return The updated prescription
     * @throws RuntimeException if the prescription is not found
     */
    @Override
    public Prescription updatePrescriptionStatus(String id, String status) {
        Optional<Prescription> prescriptionOpt = prescriptionRepository.findById(id);
        if (prescriptionOpt.isPresent()) {
            Prescription prescription = prescriptionOpt.get();
            prescription.setStatus(status);
            return prescriptionRepository.save(prescription);
        }
        throw new RuntimeException("Prescription not found with id: " + id);
    }

    /**
     * Retrieves all prescriptions with the specified diagnosis.
     * 
     * @param diagnosis The diagnosis to filter by
     * @return A list of prescriptions with the specified diagnosis
     */
    @Override
    public List<Prescription> getPrescriptionsByDiagnosis(String diagnosis) {
        return prescriptionRepository.findByDiagnosis(diagnosis);
    }

    /**
     * Retrieves all prescriptions containing a medication with the specified drug ID.
     * 
     * @param drugId The ID of the drug
     * @return A list of prescriptions containing the specified drug
     */
    @Override
    public List<Prescription> getPrescriptionsByDrugId(String drugId) {
        return prescriptionRepository.findByPrescriptionItems_Drug_Id(drugId);
    }

    /**
     * Retrieves all prescriptions containing a medication with the specified drug name.
     * 
     * @param drugName The name of the drug
     * @return A list of prescriptions containing the specified drug
     */
    @Override
    public List<Prescription> getPrescriptionsByDrugName(String drugName) {
        return prescriptionRepository.findByPrescriptionItems_Drug_Name(drugName);
    }

    /**
     * Retrieves all active prescriptions for a specific patient as of the specified date.
     * 
     * @param patientId The ID of the patient
     * @param currentDate The date to check validity against
     * @return A list of active prescriptions for the patient
     */
    @Override
    public List<Prescription> getActivePatientPrescriptions(String patientId, LocalDate currentDate) {
        return prescriptionRepository.findByPatientIdAndValidUntilAfterAndStatus(patientId, currentDate, "active");
    }

    /**
     * Retrieves all prescriptions that have items marked as refillable with remaining refills.
     * 
     * @return A list of refillable prescriptions
     */
    @Override
    public List<Prescription> getRefillablePrescriptions() {
        return prescriptionRepository.findByPrescriptionItems_RefillableAndPrescriptionItems_RefillsRemainingGreaterThan(true, 0);
    }

    /**
     * Updates the refill count for a specific item in a prescription.
     * If the new refill count is 0 or less, the item is marked as not refillable.
     * 
     * @param prescriptionId The ID of the prescription
     * @param prescriptionItemIndex The index of the prescription item to update
     * @param newRefillCount The new refill count
     * @return The updated prescription
     * @throws RuntimeException if the prescription is not found
     * @throws IllegalArgumentException if the prescription item index is invalid
     */
    @Override
    public Prescription updatePrescriptionRefillCount(String prescriptionId, String prescriptionItemIndex, Integer newRefillCount) {
        Optional<Prescription> prescriptionOpt = prescriptionRepository.findById(prescriptionId);
        if (prescriptionOpt.isPresent()) {
            Prescription prescription = prescriptionOpt.get();
            int index = Integer.parseInt(prescriptionItemIndex);
            
            if (index >= 0 && index < prescription.getPrescriptionItems().size()) {
                Prescription.PrescriptionItem item = prescription.getPrescriptionItems().get(index);
                item.setRefillsRemaining(newRefillCount);
                
                // If no more refills, update item status
                if (newRefillCount <= 0) {
                    item.setRefillable(false);
                }
                
                return prescriptionRepository.save(prescription);
            }
            throw new IllegalArgumentException("Invalid prescription item index: " + prescriptionItemIndex);
        }
        throw new RuntimeException("Prescription not found with id: " + prescriptionId);
    }
} 