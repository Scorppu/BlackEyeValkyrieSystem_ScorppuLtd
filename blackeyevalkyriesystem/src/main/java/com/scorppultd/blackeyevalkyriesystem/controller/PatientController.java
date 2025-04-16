package com.scorppultd.blackeyevalkyriesystem.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    
    @Autowired
    private PatientService patientService;
    
    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients(
            @RequestParam(required = false, defaultValue = "lastName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String direction) {
        
        List<Patient> patients;
        try {
            patients = patientService.getAllPatientsSorted(sortBy, direction);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        return new ResponseEntity<>(patients, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable String id) {
        Optional<Patient> patient = patientService.getPatientById(id);
        return patient.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        try {
            // Debugging: Log the patient object we received
            System.out.println("Received patient data: " + patient);
            
            // Validate required fields
            if (patient.getFirstName() == null || patient.getLastName() == null) {
                System.err.println("Missing required fields: firstName or lastName");
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            // Handle dateOfBirth properly if it's null
            if (patient.getDateOfBirth() == null) {
                System.err.println("Missing required field: dateOfBirth");
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            // Save patient
            Patient savedPatient = patientService.savePatient(patient);
            System.out.println("Successfully saved patient: " + savedPatient.getId());
            return new ResponseEntity<>(savedPatient, HttpStatus.CREATED);
        } catch (Exception e) {
            // Check for MongoDB validation error
            if (e.getMessage() != null && e.getMessage().contains("Document failed validation")) {
                System.err.println("MongoDB validation error: " + e.getMessage());
                System.err.println("This may be caused by a mismatch between the Patient model fields and the MongoDB schema validation in mongo-init.js");
                System.err.println("Check that the field names match between your Patient class and the MongoDB schema validator.");
                return new ResponseEntity<>(HttpStatus.UNPROCESSABLE_ENTITY);
            }
            
            // Log the error with more detail
            System.err.println("Error creating patient: " + e.getMessage());
            System.err.println("Patient data: " + patient);
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(@PathVariable String id, @RequestBody Patient patientDetails) {
        Optional<Patient> patient = patientService.getPatientById(id);
        if (patient.isPresent()) {
            Patient existingPatient = patient.get();
            existingPatient.setFirstName(patientDetails.getFirstName());
            existingPatient.setLastName(patientDetails.getLastName());
            existingPatient.setSex(patientDetails.getSex());
            existingPatient.setRelativeName(patientDetails.getRelativeName());
            existingPatient.setDateOfBirth(patientDetails.getDateOfBirth());
            existingPatient.setAge(patientDetails.getAge());
            existingPatient.setMaritalStatus(patientDetails.getMaritalStatus());
            existingPatient.setBloodType(patientDetails.getBloodType());
            existingPatient.setContactNumber(patientDetails.getContactNumber());
            existingPatient.setEmail(patientDetails.getEmail());
            existingPatient.setAddress(patientDetails.getAddress());
            existingPatient.setDrugAllergies(patientDetails.getDrugAllergies());
            
            return new ResponseEntity<>(patientService.savePatient(existingPatient), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deletePatient(@PathVariable String id) {
        try {
            patientService.deletePatient(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 