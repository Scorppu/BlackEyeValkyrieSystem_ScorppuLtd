package com.scorppultd.blackeyevalkyriesystem.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.repository.PatientRepository;

@Service
public class PatientService {
    
    @Autowired
    private PatientRepository patientRepository;
    
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
    
    public List<Patient> getAllPatientsSorted(String sortBy, String direction) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        // Map the sortBy parameter to the actual field name in the document
        switch (sortBy.toLowerCase()) {
            case "name":
                return patientRepository.findAll(Sort.by(dir, "lastName", "firstName"));
            case "patientid":
                return patientRepository.findAll(Sort.by(dir, "id"));
            case "age":
                return patientRepository.findAll(Sort.by(dir, "age"));
            case "gender":
                return patientRepository.findAll(Sort.by(dir, "sex"));
            case "contact":
                return patientRepository.findAll(Sort.by(dir, "contactNumber"));
            case "status":
                return patientRepository.findAll(Sort.by(dir, "status"));
            default:
                return patientRepository.findAll(Sort.by(dir, "lastName"));
        }
    }
    
    public Optional<Patient> getPatientById(String id) {
        return patientRepository.findById(id);
    }
    
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }
    
    public void deletePatient(String id) {
        patientRepository.deleteById(id);
    }
} 