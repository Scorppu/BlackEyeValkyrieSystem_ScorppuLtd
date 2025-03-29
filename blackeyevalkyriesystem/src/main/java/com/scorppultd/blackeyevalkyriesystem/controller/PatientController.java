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
            // Validate required fields
            if (patient.getFirstName() == null || patient.getLastName() == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            // Handle dateOfBirth properly if it's null
            if (patient.getDateOfBirth() == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            // Save patient
            Patient savedPatient = patientService.savePatient(patient);
            return new ResponseEntity<>(savedPatient, HttpStatus.CREATED);
        } catch (Exception e) {
            // Log the error
            System.err.println("Error creating patient: " + e.getMessage());
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