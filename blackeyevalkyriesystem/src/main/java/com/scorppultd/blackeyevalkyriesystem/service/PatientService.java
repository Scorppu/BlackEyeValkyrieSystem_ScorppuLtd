package com.scorppultd.blackeyevalkyriesystem.service;

import java.util.List;
import java.util.Optional;
import java.util.Comparator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.model.Visit;
import com.scorppultd.blackeyevalkyriesystem.repository.PatientRepository;

@Service
public class PatientService {
    
    @Autowired
    private PatientRepository patientRepository;
    
    public List<Patient> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        sortVisitsByDate(patients);
        return patients;
    }
    
    public List<Patient> getAllPatientsSorted(String sortBy, String direction) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        // Map the sortBy parameter to the actual field name in the document
        List<Patient> patients;
        switch (sortBy.toLowerCase()) {
            case "name":
                patients = patientRepository.findAll(Sort.by(dir, "lastName", "firstName"));
                break;
            case "patientid":
                patients = patientRepository.findAll(Sort.by(dir, "id"));
                break;
            case "age":
                patients = patientRepository.findAll(Sort.by(dir, "age"));
                break;
            case "gender":
                patients = patientRepository.findAll(Sort.by(dir, "sex"));
                break;
            case "contact":
                patients = patientRepository.findAll(Sort.by(dir, "contactNumber"));
                break;
            case "status":
                patients = patientRepository.findAll(Sort.by(dir, "status"));
                break;
            default:
                patients = patientRepository.findAll(Sort.by(dir, "lastName"));
                break;
        }
        
        sortVisitsByDate(patients);
        return patients;
    }
    
    public Optional<Patient> getPatientById(String id) {
        Optional<Patient> patientOpt = patientRepository.findById(id);
        patientOpt.ifPresent(patient -> {
            if (patient.getVisits() != null && !patient.getVisits().isEmpty()) {
                patient.getVisits().sort(Comparator.comparing(Visit::getVisitDate).reversed());
            }
        });
        return patientOpt;
    }
    
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }
    
    public void deletePatient(String id) {
        patientRepository.deleteById(id);
    }
    
    /**
     * Sort visits by date (descending) for all patients in the list
     * @param patients List of patients whose visits need to be sorted
     */
    private void sortVisitsByDate(List<Patient> patients) {
        for (Patient patient : patients) {
            if (patient.getVisits() != null && !patient.getVisits().isEmpty()) {
                patient.getVisits().sort(Comparator.comparing(Visit::getVisitDate).reversed());
            }
        }
    }
} 