package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    
    // Find appointments by patient ID using Query annotation for @DBRef
    @Query("{'patient.$id': ?0}")
    List<Appointment> findByPatientId(String patientId);
    
    // Find appointments by status
    List<Appointment> findByStatus(String status);
    
    // Find appointments by appointment type
    List<Appointment> findByAppointmentType(String appointmentType);
    
    // Find appointments by priority
    List<Appointment> findByAppointmentPriority(String appointmentPriority);
    
    // Find appointments by doctor name
    List<Appointment> findByDoctorName(String doctorName);
    
    // Find appointments by doctor name and scheduled after a specific time
    List<Appointment> findByDoctorNameAndScheduledTimeGreaterThanEqual(String doctorName, LocalDateTime startTime);
    
    // Find appointments by doctor name for a specific date range
    List<Appointment> findByDoctorNameAndScheduledTimeBetween(String doctorName, LocalDateTime startTime, LocalDateTime endTime);
} 