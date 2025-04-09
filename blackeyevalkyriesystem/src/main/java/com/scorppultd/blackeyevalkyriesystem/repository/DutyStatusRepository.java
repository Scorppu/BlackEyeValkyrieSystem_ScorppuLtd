package com.scorppultd.blackeyevalkyriesystem.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;

@Repository
public interface DutyStatusRepository extends MongoRepository<DutyStatus, String> {
    
    // Find the latest duty status for a user
    Optional<DutyStatus> findFirstByUserOrderByTimestampDesc(User user);
    
    // Find all duty status changes for a user
    List<DutyStatus> findByUserOrderByTimestampDesc(User user);
    
    // Find duty status changes within a time range
    List<DutyStatus> findByUserAndTimestampBetweenOrderByTimestampDesc(
        User user, LocalDateTime start, LocalDateTime end);
    
    // Find all users currently on duty
    @Query("{'isOnDuty': true}")
    List<DutyStatus> findAllOnDuty();
} 