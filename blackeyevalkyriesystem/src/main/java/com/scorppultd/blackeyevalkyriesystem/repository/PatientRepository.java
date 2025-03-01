package com.scorppultd.blackeyevalkyriesystem.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Patient;

@Repository
public interface PatientRepository extends MongoRepository<Patient, String> {
    // Custom queries can be added here
} 