package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.repository.PrescriptionRepository;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;

@Service
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    @Autowired
    public PrescriptionServiceImpl(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

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

    @Override
    public Optional<Prescription> getPrescriptionById(String id) {
        return prescriptionRepository.findById(id);
    }

    @Override
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    @Override
    public Prescription updatePrescription(Prescription prescription) {
        return prescriptionRepository.save(prescription);
    }

    @Override
    public void deletePrescription(String id) {
        prescriptionRepository.deleteById(id);
    }

    @Override
    public List<Prescription> getPrescriptionsByPatient(String patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    @Override
    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }

    @Override
    public List<Prescription> getPrescriptionsByDoctorName(String doctorName) {
        return prescriptionRepository.findByDoctorName(doctorName);
    }

    @Override
    public List<Prescription> getPrescriptionsByPrescriptionDate(LocalDate prescriptionDate) {
        return prescriptionRepository.findByPrescriptionDate(prescriptionDate);
    }

    @Override
    public List<Prescription> getPrescriptionsByDateRange(LocalDate startDate, LocalDate endDate) {
        return prescriptionRepository.findByPrescriptionDateBetween(startDate, endDate);
    }

    @Override
    public List<Prescription> getActivePrescriptions(LocalDate currentDate) {
        return prescriptionRepository.findByValidUntilAfter(currentDate);
    }

    @Override
    public List<Prescription> getExpiredPrescriptions(LocalDate currentDate) {
        return prescriptionRepository.findByValidUntilBefore(currentDate);
    }

    @Override
    public List<Prescription> getPrescriptionsByStatus(String status) {
        return prescriptionRepository.findByStatus(status);
    }

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

    @Override
    public List<Prescription> getPrescriptionsByDiagnosis(String diagnosis) {
        return prescriptionRepository.findByDiagnosis(diagnosis);
    }

    @Override
    public List<Prescription> getPrescriptionsByDrugId(String drugId) {
        return prescriptionRepository.findByPrescriptionItems_Drug_Id(drugId);
    }

    @Override
    public List<Prescription> getPrescriptionsByDrugName(String drugName) {
        return prescriptionRepository.findByPrescriptionItems_Drug_Name(drugName);
    }

    @Override
    public List<Prescription> getActivePatientPrescriptions(String patientId, LocalDate currentDate) {
        return prescriptionRepository.findByPatientIdAndValidUntilAfterAndStatus(patientId, currentDate, "active");
    }

    @Override
    public List<Prescription> getRefillablePrescriptions() {
        return prescriptionRepository.findByPrescriptionItems_RefillableAndPrescriptionItems_RefillsRemainingGreaterThan(true, 0);
    }

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