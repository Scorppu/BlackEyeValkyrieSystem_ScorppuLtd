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

/**
 * Service class for handling Patient-related operations.
 * Provides methods for retrieving, storing, and managing patient records.
 */
@Service
public class PatientService {
    
    @Autowired
    private PatientRepository patientRepository;
    
    /**
     * Retrieves all patients from the database.
     * Sorts each patient's visits by date in descending order.
     * 
     * @return List of all patients with their visits sorted by date
     */
    public List<Patient> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        sortVisitsByDate(patients);
        return patients;
    }
    
    /**
     * Retrieves all patients from the database sorted by the specified field.
     * Sorts each patient's visits by date in descending order.
     * 
     * @param sortBy The field to sort by (name, patientid, age, gender, contact, status)
     * @param direction The sort direction ("asc" for ascending, "desc" for descending)
     * @return List of patients sorted by the specified field
     */
    public List<Patient> getAllPatientsSorted(String sortBy, String direction) {
        Sort.Direction dir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        // Map the sortBy parameter to the actual field name in the document
        List<Patient> patients;
        try {
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
        } catch (Exception e) {
            // Log the error
            System.err.println("Error in getAllPatientsSorted: " + e.getMessage());
            e.printStackTrace();
            
            // Return empty list instead of throwing exception
            return patientRepository.findAll();
        }
    }
    
    /**
     * Retrieves a patient by their ID.
     * If found, sorts the patient's visits by date in descending order.
     * 
     * @param id The ID of the patient to retrieve
     * @return Optional containing the patient if found, or empty if not found
     */
    public Optional<Patient> getPatientById(String id) {
        Optional<Patient> patientOpt = patientRepository.findById(id);
        patientOpt.ifPresent(patient -> {
            if (patient.getVisits() != null && !patient.getVisits().isEmpty()) {
                patient.getVisits().sort(Comparator.comparing(Visit::getVisitDate).reversed());
            }
        });
        return patientOpt;
    }
    
    /**
     * Saves a patient to the database.
     * 
     * @param patient The patient object to save
     * @return The saved patient object with any database-generated fields populated
     */
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }
    
    /**
     * Deletes a patient from the database by ID.
     * 
     * @param id The ID of the patient to delete
     */
    public void deletePatient(String id) {
        patientRepository.deleteById(id);
    }
    
    /**
     * Sorts visits by date (descending) for all patients in the list.
     * This is a helper method used by other service methods to ensure
     * consistent sorting of visits.
     * 
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