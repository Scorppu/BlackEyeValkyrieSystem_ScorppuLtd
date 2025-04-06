package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.repository.DoctorRepository;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.model.User;

@Service
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    @Autowired
    public DoctorServiceImpl(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    @Override
    public Optional<Doctor> getDoctorById(String id) {
        return doctorRepository.findById(id);
    }

    @Override
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findByRole(User.UserRole.DOCTOR);
    }

    @Override
    public Doctor updateDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    @Override
    public void deleteDoctor(String id) {
        doctorRepository.deleteById(id);
    }

    @Override
    public Optional<Doctor> getDoctorByDoctorId(String doctorId) {
        return doctorRepository.findByDoctorId(doctorId);
    }

    @Override
    public Optional<Doctor> getDoctorByLicenseNumber(String licenseNumber) {
        return doctorRepository.findByLicenseNumber(licenseNumber);
    }

    @Override
    public List<Doctor> getDoctorsBySpecialization(String specialization) {
        return doctorRepository.findBySpecialization(specialization);
    }

    @Override
    public List<Doctor> getDoctorsByDepartment(String department) {
        return doctorRepository.findByDepartment(department);
    }

    @Override
    public List<Doctor> getDoctorsByExperienceGreaterThan(Integer years) {
        return doctorRepository.findByYearsOfExperienceGreaterThan(years);
    }

    @Override
    public List<Doctor> getDoctorsByAvailableDay(String dayOfWeek) {
        return doctorRepository.findByAvailableDay(dayOfWeek);
    }

    @Override
    public Optional<Doctor> getDoctorByEmail(String email) {
        return doctorRepository.findByEmail(email);
    }

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

    @Override
    public List<Doctor> getDoctorsByNameContaining(String name) {
        return doctorRepository.findByNameContaining(name);
    }
} 