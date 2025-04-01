package com.scorppultd.blackeyevalkyriesystem.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.User.UserRole;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {
    // Find by professional information
    Optional<Doctor> findByDoctorId(String doctorId);
    Optional<Doctor> findByLicenseNumber(String licenseNumber);
    List<Doctor> findBySpecialization(String specialization);
    List<Doctor> findByYearsOfExperienceGreaterThan(Integer years);
    
    // Find by role
    List<Doctor> findByRole(UserRole role);
    
    // Find by department and position
    List<Doctor> findByDepartment(String department);
    List<Doctor> findByPosition(String position);
    List<Doctor> findByDepartmentAndSpecialization(String department, String specialization);
    
    // Find by consultation fee
    List<Doctor> findByConsultationFeeLessThanEqual(String fee);
    List<Doctor> findByConsultationFeeGreaterThanEqual(String fee);
    
    // Find doctors available on a specific day
    @Query("{'schedules.dayOfWeek': ?0}")
    List<Doctor> findByAvailableDay(String dayOfWeek);
    
    // Find doctors with a specific qualification (using array contains)
    @Query("{'qualifications': ?0}")
    List<Doctor> findByQualification(String qualification);
    
    // Find doctors by office number
    List<Doctor> findByOfficeNumber(String officeNumber);
} 