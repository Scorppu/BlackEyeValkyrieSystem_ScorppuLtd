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

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    @Autowired
    public ConsultationController(ConsultationService consultationService, 
                                 PrescriptionService prescriptionService) {
        this.consultationService = consultationService;
    }

    // Create a new consultation
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> createConsultation(@RequestBody Consultation consultation) {
        Consultation createdConsultation = consultationService.createConsultation(consultation);
        return new ResponseEntity<>(createdConsultation, HttpStatus.CREATED);
    }

    // Get consultation by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<Consultation> getConsultationById(@PathVariable String id) {
        Optional<Consultation> consultation = consultationService.getConsultationById(id);
        return consultation.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Get all consultations
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Consultation>> getAllConsultations() {
        List<Consultation> consultations = consultationService.getAllConsultations();
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Update a consultation
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

    // Delete a consultation
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConsultation(@PathVariable String id) {
        consultationService.deleteConsultation(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // Get consultations by doctor ID
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByDoctor(@PathVariable String doctorId) {
        List<Consultation> consultations = consultationService.getConsultationsByDoctor(doctorId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultations by patient ID
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByPatient(@PathVariable String patientId) {
        List<Consultation> consultations = consultationService.getConsultationsByPatient(patientId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultations by date range
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Consultation> consultations = consultationService.getConsultationsInDateRange(start, end);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultations by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByStatus(@PathVariable String status) {
        List<Consultation> consultations = consultationService.getConsultationsByStatus(status);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Update consultation status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Consultation> updateConsultationStatus(@PathVariable String id, 
                                                               @RequestParam String status) {
        Consultation updatedConsultation = consultationService.updateConsultationStatus(id, status);
        return new ResponseEntity<>(updatedConsultation, HttpStatus.OK);
    }

    // Add diagnosis to consultation
    @PostMapping("/{id}/diagnoses")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> addDiagnosisToConsultation(@PathVariable String id, 
                                                          @RequestBody Consultation.Diagnosis diagnosis) {
        consultationService.addDiagnosisToConsultation(id, diagnosis);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    // Get consultations by diagnosis name
    @GetMapping("/diagnosis/name/{diagnosisName}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByDiagnosisName(@PathVariable String diagnosisName) {
        List<Consultation> consultations = consultationService.getConsultationsByDiagnosisName(diagnosisName);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultations by diagnosis code
    @GetMapping("/diagnosis/code/{diagnosisCode}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsByDiagnosisCode(@PathVariable String diagnosisCode) {
        List<Consultation> consultations = consultationService.getConsultationsByDiagnosisCode(diagnosisCode);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Add prescription to consultation
    @PostMapping("/{id}/prescription")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Consultation> addPrescriptionToConsultation(@PathVariable String id, 
                                                                    @RequestBody Prescription prescription) {
        Consultation updatedConsultation = consultationService.addPrescriptionToConsultation(id, prescription);
        return new ResponseEntity<>(updatedConsultation, HttpStatus.CREATED);
    }

    // Get consultations with prescriptions
    @GetMapping("/with-prescriptions")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getConsultationsWithPrescriptions() {
        List<Consultation> consultations = consultationService.getConsultationsWithPrescriptions();
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get recent consultations by patient
    @GetMapping("/recent/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getRecentConsultationsByPatient(@PathVariable String patientId) {
        List<Consultation> consultations = consultationService.getRecentConsultationsByPatient(patientId);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultations for follow-up
    @GetMapping("/follow-up")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public ResponseEntity<List<Consultation>> getConsultationsForFollowUp(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate followUpDate) {
        List<Consultation> consultations = consultationService.getConsultationsForFollowUp(followUpDate);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get doctor consultations for period
    @GetMapping("/doctor/{doctorId}/period")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Consultation>> getDoctorConsultationsForPeriod(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Consultation> consultations = consultationService.getDoctorConsultationsForPeriod(doctorId, start, end);
        return new ResponseEntity<>(consultations, HttpStatus.OK);
    }

    // Get consultation by appointment ID
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'ADMIN')")
    public ResponseEntity<Consultation> getConsultationByAppointmentId(@PathVariable String appointmentId) {
        Optional<Consultation> consultation = consultationService.getConsultationByAppointmentId(appointmentId);
        return consultation.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Create consultation from appointment
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
} 