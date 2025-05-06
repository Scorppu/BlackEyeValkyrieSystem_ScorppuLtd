package com.scorppultd.blackeyevalkyriesystem.service;

import java.util.List;
import java.util.Optional;

import com.scorppultd.blackeyevalkyriesystem.model.Doctor;

public interface DoctorService {
    
    // Basic CRUD operations
    Doctor createDoctor(Doctor doctor);
    Optional<Doctor> getDoctorById(String id);
    List<Doctor> getAllDoctors();
    Doctor updateDoctor(Doctor doctor);
    void deleteDoctor(String id);
    
    // Specialized operations
    Optional<Doctor> getDoctorByDoctorId(String doctorId);
    Optional<Doctor> getDoctorByLicenseNumber(String licenseNumber);
    List<Doctor> getDoctorsBySpecialization(String specialization);
    List<Doctor> getDoctorsByDepartment(String department);
    List<Doctor> getDoctorsByExperienceGreaterThan(Integer years);
    List<Doctor> getDoctorsByAvailableDay(String dayOfWeek);
    
    // Get doctor by email
    Optional<Doctor> getDoctorByEmail(String email);
    
    // Get doctor by name (full name match)
    Optional<Doctor> getDoctorByName(String fullName);
    
    // Get doctors by name (partial match)
    List<Doctor> getDoctorsByNameContaining(String name);
    
    // Get doctor by username
    Optional<Doctor> getDoctorByUsername(String username);
} 