package com.scorppultd.blackeyevalkyriesystem.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Nurse;

@Repository
public interface NurseRepository extends MongoRepository<Nurse, String> {
    // Find by professional information
    Optional<Nurse> findByNurseId(String nurseId);
    Optional<Nurse> findByLicenseNumber(String licenseNumber);
    List<Nurse> findByNursingDegree(String nursingDegree);
    List<Nurse> findByCertification(String certification);
    List<Nurse> findByYearsOfExperienceGreaterThan(Integer years);
    
    // Find by work information
    List<Nurse> findByDepartment(String department);
    List<Nurse> findByPosition(String position);
    List<Nurse> findBySupervisingDoctor(String supervisingDoctor);
    
    // Find by specialization (using array contains)
    @Query("{'specializations': ?0}")
    List<Nurse> findBySpecialization(String specialization);
    
    // Find nurses working on a specific shift type
    @Query("{'shifts.shiftType': ?0}")
    List<Nurse> findByShiftType(String shiftType);
    
    // Find nurses available on a specific day
    @Query("{'shifts.dayOfWeek': ?0}")
    List<Nurse> findByAvailableDay(String dayOfWeek);
    
    // Find nurses working specific hours
    @Query("{'shifts.startTime': {$lte: ?0}, 'shifts.endTime': {$gte: ?1}}")
    List<Nurse> findByWorkingHours(String startTime, String endTime);
} 