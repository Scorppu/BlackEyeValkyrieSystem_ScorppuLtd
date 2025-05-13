package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.repository.DoctorRepository;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;

/**
 * Implementation of the DoctorService interface that provides business logic
 * for managing Doctor entities in the system. This service handles CRUD operations
 * for doctors and provides various methods to search for doctors based on different criteria.
 */
@Service
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    /**
     * Constructs a new DoctorServiceImpl with the required repositories.
     *
     * @param doctorRepository Repository for Doctor entity operations
     * @param userRepository Repository for User entity operations
     */
    @Autowired
    public DoctorServiceImpl(DoctorRepository doctorRepository, UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new doctor in the system.
     *
     * @param doctor The doctor entity to be created
     * @return The created doctor with generated ID
     */
    @Override
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    /**
     * Retrieves a doctor by their ID.
     *
     * @param id The ID of the doctor to retrieve
     * @return An Optional containing the found doctor or empty if not found
     */
    @Override
    public Optional<Doctor> getDoctorById(String id) {
        return doctorRepository.findById(id);
    }

    /**
     * Retrieves all doctors in the system.
     *
     * @return A list of all doctors with DOCTOR role
     */
    @Override
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findByRole(User.UserRole.DOCTOR);
    }

    /**
     * Updates an existing doctor's information.
     *
     * @param doctor The doctor entity with updated information
     * @return The updated doctor entity
     */
    @Override
    public Doctor updateDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    /**
     * Deletes a doctor from the system.
     *
     * @param id The ID of the doctor to delete
     */
    @Override
    public void deleteDoctor(String id) {
        doctorRepository.deleteById(id);
    }

    /**
     * Retrieves a doctor by their unique doctor ID.
     *
     * @param doctorId The unique doctor ID
     * @return An Optional containing the found doctor or empty if not found
     */
    @Override
    public Optional<Doctor> getDoctorByDoctorId(String doctorId) {
        return doctorRepository.findByDoctorId(doctorId);
    }

    /**
     * Retrieves a doctor by their license number.
     *
     * @param licenseNumber The doctor's license number
     * @return An Optional containing the found doctor or empty if not found
     */
    @Override
    public Optional<Doctor> getDoctorByLicenseNumber(String licenseNumber) {
        return doctorRepository.findByLicenseNumber(licenseNumber);
    }

    /**
     * Retrieves all doctors with a specific specialization.
     *
     * @param specialization The specialization to search for
     * @return A list of doctors with the specified specialization
     */
    @Override
    public List<Doctor> getDoctorsBySpecialization(String specialization) {
        return doctorRepository.findBySpecialization(specialization);
    }

    /**
     * Retrieves all doctors in a specific department.
     *
     * @param department The department to search for
     * @return A list of doctors in the specified department
     */
    @Override
    public List<Doctor> getDoctorsByDepartment(String department) {
        return doctorRepository.findByDepartment(department);
    }

    /**
     * Retrieves all doctors with years of experience greater than the specified value.
     *
     * @param years The minimum years of experience
     * @return A list of doctors with more experience than the specified years
     */
    @Override
    public List<Doctor> getDoctorsByExperienceGreaterThan(Integer years) {
        return doctorRepository.findByYearsOfExperienceGreaterThan(years);
    }

    /**
     * Retrieves all doctors available on a specific day of the week.
     *
     * @param dayOfWeek The day of week to check availability
     * @return A list of doctors available on the specified day
     */
    @Override
    public List<Doctor> getDoctorsByAvailableDay(String dayOfWeek) {
        return doctorRepository.findByAvailableDay(dayOfWeek);
    }

    /**
     * Retrieves a doctor by their email address.
     *
     * @param email The email address to search for
     * @return An Optional containing the found doctor or empty if not found
     */
    @Override
    public Optional<Doctor> getDoctorByEmail(String email) {
        return doctorRepository.findByEmail(email);
    }

    /**
     * Retrieves a doctor by their full name.
     * This method splits the full name into first name and last name and searches accordingly.
     *
     * @param fullName The full name of the doctor (format: "firstName lastName")
     * @return An Optional containing the found doctor or empty if not found or if the name format is invalid
     */
    @Override
    public Optional<Doctor> getDoctorByName(String fullName) {
        // Split the full name into first name and last name
        String[] nameParts = fullName.split(" ", 2);
        if (nameParts.length == 2) {
            String firstName = nameParts[0];
            String lastName = nameParts[1];
            return doctorRepository.findByFirstNameAndLastName(firstName, lastName);
        }
        // If the name doesn't have two parts, return empty
        return Optional.empty();
    }

    /**
     * Retrieves all doctors whose names contain the specified string.
     *
     * @param name The string to search for in doctor names
     * @return A list of doctors whose names contain the specified string
     */
    @Override
    public List<Doctor> getDoctorsByNameContaining(String name) {
        return doctorRepository.findByNameContaining(name);
    }

    /**
     * Retrieves a doctor by their username.
     * This method first finds the user by username, then finds the doctor by the user's email.
     *
     * @param username The username to search for
     * @return An Optional containing the found doctor or empty if not found
     */
    @Override
    public Optional<Doctor> getDoctorByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(user -> doctorRepository.findByEmail(user.getEmail()))
            .orElse(Optional.empty());
    }
} 