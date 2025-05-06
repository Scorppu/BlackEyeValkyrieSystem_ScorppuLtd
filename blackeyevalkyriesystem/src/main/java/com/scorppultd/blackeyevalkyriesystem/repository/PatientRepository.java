package com.scorppultd.blackeyevalkyriesystem.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Patient;

@Repository
public interface PatientRepository extends MongoRepository<Patient, String> {
    // Custom queries can be added here
    @Override
    List<Patient> findAll();

    @Override
    Optional<Patient> findById(String id);

    List<Patient> findByFirstName(String firstName);

    List<Patient> findByLastName(String lastName);

    List<Patient> findByAge(int age);

    List<Patient> findBySex(Boolean sex);

    List<Patient> findByBloodType(String bloodType);

    List<Patient> findByMaritalStatus(String maritalStatus);

    List<Patient> findByRelativeName(String relativeName);
} 