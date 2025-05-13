package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.PathVariable;

import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.DutyStatusService;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;

/**
 * Controller for managing user duty status.
 * Provides endpoints for toggling duty status, retrieving current status,
 * and listing all users who are currently on duty.
 */
@Controller
@RequestMapping("/api/duty")
public class DutyStatusController {
    private static final Logger logger = LoggerFactory.getLogger(DutyStatusController.class);

    @Autowired
    private DutyStatusService dutyStatusService;

    @Autowired
    private UserService userService;

    /**
     * Toggles the duty status of the currently authenticated user.
     * 
     * @return ResponseEntity containing the updated duty status information,
     *         including isOnDuty status, lastDutyDuration, and timestamp
     */
    @PostMapping("/toggle")
    @ResponseBody
    public ResponseEntity<?> toggleDutyStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findUserByUsername(auth.getName())
            .orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        try {
            DutyStatus newStatus = dutyStatusService.toggleDutyStatus(user);
            logger.info("Toggled duty status for user {}: {}", user.getUsername(), newStatus.isOnDuty());
            
            Map<String, Object> response = new HashMap<>();
            response.put("isOnDuty", newStatus.isOnDuty());
            response.put("lastDutyDuration", newStatus.getLastDutyDuration());
            
            // Convert LocalDateTime to Date and format as ISO string for proper timezone handling in JavaScript
            Date timestamp = Date.from(newStatus.getTimestamp().atZone(ZoneId.systemDefault()).toInstant());
            response.put("timestamp", timestamp.toInstant().toString());
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            logger.error("Error toggling duty status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    /**
     * Retrieves the current duty status of the authenticated user.
     * 
     * @return ResponseEntity containing the current duty status information,
     *         including isOnDuty status, lastDutyDuration, and timestamp,
     *         or an error response if no duty status exists for the user
     */
    @GetMapping("/status")
    @ResponseBody
    public ResponseEntity<?> getCurrentDutyStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findUserByUsername(auth.getName())
            .orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Optional<DutyStatus> statusOpt = dutyStatusService.getLatestDutyStatus(user);
        
        if (statusOpt.isEmpty()) {
            logger.warn("No duty status found for user: {}", user.getUsername());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "No duty status document exists for user: " + user.getUsername());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
            
        DutyStatus status = statusOpt.get();
        logger.info("Current duty status for user {}: {}", user.getUsername(), status.isOnDuty());
        
        Map<String, Object> response = new HashMap<>();
        response.put("isOnDuty", status.isOnDuty());
        response.put("lastDutyDuration", status.getLastDutyDuration());
        
        // Convert LocalDateTime to Date and format as ISO string for proper timezone handling in JavaScript
        Date timestamp = Date.from(status.getTimestamp().atZone(ZoneId.systemDefault()).toInstant());
        response.put("timestamp", timestamp.toInstant().toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a list of all users who are currently on duty.
     * 
     * @return ResponseEntity containing a list of DutyStatus objects for all users who are on duty
     */
    @GetMapping("/on-duty")
    @ResponseBody
    public ResponseEntity<?> getOnDutyUsers() {
        List<DutyStatus> onDutyUsers = dutyStatusService.getAllOnDutyUsers();
        return ResponseEntity.ok(onDutyUsers);
    }

    /**
     * Toggles the duty status for a specific staff member identified by their ID.
     * This endpoint allows administrators to toggle duty status for other users.
     * 
     * @param staffId The ID of the staff member whose duty status should be toggled
     * @return ResponseEntity containing the updated duty status information,
     *         including isOnDuty status, userId, lastDutyDuration, and timestamp,
     *         or an error response if the user is not found or an error occurs
     */
    @PostMapping("/toggle/{staffId}")
    @ResponseBody
    public ResponseEntity<?> toggleDutyStatusForStaff(@PathVariable String staffId) {
        try {
            logger.info("Toggle duty status requested for staff ID: {}", staffId);
            
            // Find the user by ID
            Optional<User> userOpt = userService.findUserById(staffId);
            
            if (userOpt.isEmpty()) {
                logger.warn("User not found with ID: {}", staffId);
                return ResponseEntity.badRequest().body("User not found");
            }
            
            User user = userOpt.get();
            logger.info("Found user: {}", user.getUsername());
            
            // Toggle duty status for the user
            DutyStatus newStatus = dutyStatusService.toggleDutyStatus(user);
            logger.info("Toggled duty status for user {}: {}", user.getUsername(), newStatus.isOnDuty());
            
            Map<String, Object> response = new HashMap<>();
            response.put("isOnDuty", newStatus.isOnDuty());
            response.put("userId", user.getId());
            response.put("lastDutyDuration", newStatus.getLastDutyDuration());
            
            // Convert LocalDateTime to Date and format as ISO string
            Date timestamp = Date.from(newStatus.getTimestamp().atZone(ZoneId.systemDefault()).toInstant());
            response.put("timestamp", timestamp.toInstant().toString());
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            logger.error("Error toggling duty status: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            logger.error("Error toggling duty status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error toggling duty status: " + e.getMessage());
        }
    }
} 