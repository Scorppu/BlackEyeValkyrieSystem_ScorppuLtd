package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.model.Consultation;
import com.scorppultd.blackeyevalkyriesystem.model.Prescription;
import com.scorppultd.blackeyevalkyriesystem.service.ConsultationService;
import com.scorppultd.blackeyevalkyriesystem.service.PrescriptionService;

/**
 * REST controller for managing consultations in the system.
 * Provides endpoints for creating, retrieving, updating, and deleting consultations,
 * as well as more specialized operations like adding prescriptions and managing vital signs.
 */
@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    /**
     * Constructor for ConsultationController.
     * 
     * @param consultationService The service that handles consultation business logic
     * @param prescriptionService The service that handles prescription business logic
     */
    @Autowired
    public ConsultationController(ConsultationService consultationService, 
                                 PrescriptionService prescriptionService) {
        this.consultationService = consultationService;
    }

    /**
     * Creates a new consultation.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param consultation The consultation object to create
     * @return ResponseEntity containing the created consultation
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> createConsultation(@RequestBody Consultation consultation) {
        Consultation createdConsultation = consultationService.createConsultation(consultation);
        return new ResponseEntity<>(createdConsultation, HttpStatus.CREATED);
    }

    /**
     * Retrieves a consultation by its ID.
     * Access restricted to DOCTOR, NURSE, and ADMIN roles.
     * 
     * @param id The ID of the consultation to retrieve
     * @return ResponseEntity containing the consultation if found, or NOT_FOUND status
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<Consultation> getConsultationById(@PathVariable String id) {
        Optional<Consultation> consultation = consultationService.getConsultationById(id);
        return consultation.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Retrieves all consultations.
     * Access restricted to ADMIN role only.
     * 
     * @return ResponseEntity containing a list of all consultations
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Consultation>> getAllConsultations() {
        List<Consultation> consultations = consultationService.getAllConsultations();
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Updates an existing consultation.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param id The ID of the consultation to update
     * @param consultation The updated consultation object
     * @return ResponseEntity containing the updated consultation, or BAD_REQUEST if IDs don't match
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> updateConsultation(@PathVariable String id, 
                                                         @RequestBody Consultation consultation) {
        // Ensure the ID in the path matches the ID in the request body
        if (!id.equals(consultation.getId())) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        Consultation updatedConsultation = consultationService.updateConsultation(consultation);
        return new ResponseEntity<>(updatedConsultation, HttpStatus.OK);
    }

    /**
     * Deletes a consultation by its ID.
     * Access restricted to ADMIN role only.
     * 
     * @param id The ID of the consultation to delete
     * @return ResponseEntity with NO_CONTENT status if successful
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConsultation(@PathVariable String id) {
        consultationService.deleteConsultation(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /**
     * Retrieves all consultations for a specific doctor.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param doctorId The ID of the doctor
     * @return ResponseEntity containing a list of the doctor's consultations
     */
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByDoctor(@PathVariable String doctorId) {
        List<Consultation> consultations = consultationService.getConsultationsByDoctor(doctorId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves all consultations for a specific patient.
     * Access restricted to DOCTOR, NURSE, and ADMIN roles.
     * 
     * @param patientId The ID of the patient
     * @return ResponseEntity containing a list of the patient's consultations
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByPatient(@PathVariable String patientId) {
        List<Consultation> consultations = consultationService.getConsultationsByPatient(patientId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves all consultations within a specified date range.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param start The start date and time of the range
     * @param end The end date and time of the range
     * @return ResponseEntity containing a list of consultations within the date range
     */
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Consultation> consultations = consultationService.getConsultationsInDateRange(start, end);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves all consultations with a specific status.
     * Access restricted to DOCTOR, NURSE, and ADMIN roles.
     * 
     * @param status The status to filter consultations by
     * @return ResponseEntity containing a list of consultations with the specified status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByStatus(@PathVariable String status) {
        List<Consultation> consultations = consultationService.getConsultationsByStatus(status);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Updates the status of an existing consultation.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param id The ID of the consultation to update
     * @param status The new status to set
     * @return ResponseEntity containing the updated consultation
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> updateConsultationStatus(@PathVariable String id, 
                                                               @RequestParam String status) {
        Consultation updatedConsultation = consultationService.updateConsultationStatus(id, status);
        return new ResponseEntity<>(updatedConsultation, HttpStatus.OK);
    }

    /**
     * Adds or updates the diagnosis for a consultation.
     * Access restricted to DOCTOR role only.
     * 
     * @param id The ID of the consultation to update
     * @param diagnosis The diagnosis to add
     * @return ResponseEntity with CREATED status if successful
     */
    @PostMapping("/{id}/diagnosis")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> updateDiagnosis(@PathVariable String id, 
                                              @RequestBody String diagnosis) {
        consultationService.updateDiagnosis(id, diagnosis);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    /**
     * Retrieves all consultations with a specific diagnosis.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param diagnosis The diagnosis to filter consultations by
     * @return ResponseEntity containing a list of consultations with the specified diagnosis
     */
    @GetMapping("/diagnosis/{diagnosis}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByDiagnosis(@PathVariable String diagnosis) {
        List<Consultation> consultations = consultationService.getConsultationsByDiagnosis(diagnosis);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Adds a prescription to an existing consultation.
     * Access restricted to DOCTOR role only.
     * 
     * @param id The ID of the consultation to update
     * @param prescription The prescription to add
     * @return ResponseEntity containing the updated consultation
     */
    @PostMapping("/{id}/prescription")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Consultation> addPrescriptionToConsultation(@PathVariable String id, 
                                                                    @RequestBody Prescription prescription) {
        Consultation updatedConsultation = consultationService.addPrescriptionToConsultation(id, prescription);
        return new ResponseEntity<>(updatedConsultation, HttpStatus.CREATED);
    }

    /**
     * Retrieves all consultations that have prescriptions.
     * Access restricted to DOCTOR, PHARMACIST, and ADMIN roles.
     * 
     * @return ResponseEntity containing a list of consultations with prescriptions
     */
    @GetMapping("/with-prescriptions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsWithPrescriptions() {
        List<Consultation> consultations = consultationService.getConsultationsWithPrescriptions();
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves recent consultations for a specific patient.
     * Access restricted to DOCTOR, NURSE, and ADMIN roles.
     * 
     * @param patientId The ID of the patient
     * @return ResponseEntity containing a list of the patient's recent consultations
     */
    @GetMapping("/recent/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getRecentConsultationsByPatient(@PathVariable String patientId) {
        List<Consultation> consultations = consultationService.getRecentConsultationsByPatient(patientId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves consultations that need follow-up on a specific date.
     * Access restricted to DOCTOR and NURSE roles.
     * 
     * @param followUpDate The date to check for follow-ups
     * @return ResponseEntity containing a list of consultations needing follow-up
     */
    @GetMapping("/follow-up")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<Consultation>> getConsultationsForFollowUp(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate followUpDate) {
        List<Consultation> consultations = consultationService.getConsultationsForFollowUp(followUpDate);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves a doctor's consultations within a specified time period.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param doctorId The ID of the doctor
     * @param start The start date and time of the period
     * @param end The end date and time of the period
     * @return ResponseEntity containing a list of the doctor's consultations within the period
     */
    @GetMapping("/doctor/{doctorId}/period")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getDoctorConsultationsForPeriod(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Consultation> consultations = consultationService.getDoctorConsultationsForPeriod(doctorId, start, end);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    /**
     * Retrieves a consultation by its associated appointment ID.
     * Access restricted to DOCTOR, NURSE, and ADMIN roles.
     * 
     * @param appointmentId The ID of the associated appointment
     * @return ResponseEntity containing the consultation if found, or NOT_FOUND status
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<Consultation> getConsultationByAppointmentId(@PathVariable String appointmentId) {
        Optional<Consultation> consultation = consultationService.getConsultationByAppointmentId(appointmentId);
        return consultation.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Creates a new consultation from an existing appointment.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param appointmentId The ID of the appointment to create the consultation from
     * @return ResponseEntity containing the created consultation, or NOT_FOUND if appointment not found
     */
    @PostMapping("/from-appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> createConsultationFromAppointment(@PathVariable String appointmentId) {
        try {
            Consultation consultation = consultationService.createConsultationFromAppointment(appointmentId);
            return new ResponseEntity<>(consultation, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Updates the vital signs of a consultation.
     * Access restricted to DOCTOR and ADMIN roles.
     * 
     * @param id The ID of the consultation to update
     * @param vitalSigns The vital signs data to update
     * @return ResponseEntity containing the updated consultation, or NOT_FOUND if consultation not found
     */
    @PutMapping("/{id}/vital-signs")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> updateConsultationVitalSigns(
            @PathVariable String id, 
            @RequestBody Consultation.VitalSigns vitalSigns) {
        try {
            Consultation updatedConsultation = consultationService.updateConsultationVitalSigns(id, vitalSigns);
            return new ResponseEntity<>(updatedConsultation, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
} 