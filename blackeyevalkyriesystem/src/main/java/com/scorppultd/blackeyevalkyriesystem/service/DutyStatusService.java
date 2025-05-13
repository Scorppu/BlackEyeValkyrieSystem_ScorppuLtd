package com.scorppultd.blackeyevalkyriesystem.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.DutyStatusRepository;

/**
 * Service for managing user duty status operations.
 * Provides functionality to toggle, retrieve, and track user duty statuses.
 * Handles status changes, duration calculations, and maintains duty status history.
 */
@Service
public class DutyStatusService {
    private static final Logger logger = LoggerFactory.getLogger(DutyStatusService.class);

    @Autowired
    private DutyStatusRepository dutyStatusRepository;

    /**
     * Toggles a user's duty status between on-duty and off-duty.
     * If switching from on-duty to off-duty, calculates and stores the duration if greater than 2 minutes.
     * 
     * @param user The user whose duty status is to be toggled
     * @return The updated DutyStatus object
     * @throws IllegalStateException if no duty status exists for the user
     */
    public DutyStatus toggleDutyStatus(User user) {
        Optional<DutyStatus> existingStatus = dutyStatusRepository.findFirstByUserOrderByTimestampDesc(user);
        
        if (existingStatus.isEmpty()) {
            // Instead of creating a new status, throw an exception
            throw new IllegalStateException("No duty status document exists for user: " + user.getUsername());
        }
        
        // Update existing status
        DutyStatus dutyStatus = existingStatus.get();
        LocalDateTime now = LocalDateTime.now();
        
        // If switching from on-duty to off-duty, calculate the duration
        if (dutyStatus.isOnDuty()) {
            LocalDateTime onDutyTimestamp = dutyStatus.getTimestamp();
            // Calculate the duration in minutes
            long minutes = ChronoUnit.MINUTES.between(onDutyTimestamp, now);
            logger.info("User {} was on duty for {} minutes", user.getUsername(), minutes);
            
            // Only record duration if it's longer than 2 minutes to avoid recording misoperations
            if (minutes > 2) {
                // Store as integer with floor value
                dutyStatus.setLastDutyDuration((int) minutes);
                logger.info("Stored last duty duration of {} minutes for user {}", minutes, user.getUsername());
            } else {
                logger.info("Not storing duration as it was likely a misoperation (≤ 2 minutes)");
            }
        }
        
        dutyStatus.setOnDuty(!dutyStatus.isOnDuty());
        dutyStatus.setTimestamp(now);
        
        return dutyStatusRepository.save(dutyStatus);
    }

    /**
     * Retrieves the most recent duty status for a user.
     * 
     * @param user The user whose duty status is to be retrieved
     * @return An Optional containing the latest DutyStatus if it exists
     */
    public Optional<DutyStatus> getLatestDutyStatus(User user) {
        return dutyStatusRepository.findFirstByUserOrderByTimestampDesc(user);
    }

    /**
     * Retrieves the complete duty status history for a user, ordered by timestamp (most recent first).
     * 
     * @param user The user whose duty status history is to be retrieved
     * @return A list of DutyStatus objects representing the user's duty history
     */
    public List<DutyStatus> getDutyStatusHistory(User user) {
        return dutyStatusRepository.findByUserOrderByTimestampDesc(user);
    }

    /**
     * Retrieves duty status history for a user within a specified time range.
     * 
     * @param user The user whose duty status history is to be retrieved
     * @param start The start datetime of the period
     * @param end The end datetime of the period
     * @return A list of DutyStatus objects within the specified time range
     */
    public List<DutyStatus> getDutyStatusHistory(User user, LocalDateTime start, LocalDateTime end) {
        return dutyStatusRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(user, start, end);
    }

    /**
     * Retrieves all users currently on duty.
     * 
     * @return A list of DutyStatus objects for all users currently on duty
     */
    public List<DutyStatus> getAllOnDutyUsers() {
        return dutyStatusRepository.findAllOnDuty();
    }

    /**
     * Creates initial duty status for a user if it doesn't exist.
     * This should be called during user creation or system initialization.
     * 
     * @param user The user for whom to create an initial duty status
     * @return The created or existing DutyStatus object
     */
    public DutyStatus createInitialDutyStatus(User user) {
        Optional<DutyStatus> existingStatus = dutyStatusRepository.findFirstByUserOrderByTimestampDesc(user);
        
        if (existingStatus.isPresent()) {
            return existingStatus.get();
        }
        
        // Create new duty status with default "off duty" status
        DutyStatus dutyStatus = new DutyStatus(user, false);
        return dutyStatusRepository.save(dutyStatus);
    }
} 