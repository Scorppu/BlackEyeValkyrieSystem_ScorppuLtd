package com.scorppultd.blackeyevalkyriesystem.controller;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.DutyStatusService;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;

@Controller
@RequestMapping("/api/duty")
public class DutyStatusController {
    private static final Logger logger = LoggerFactory.getLogger(DutyStatusController.class);

    @Autowired
    private DutyStatusService dutyStatusService;

    @Autowired
    private UserService userService;

    @PostMapping("/toggle")
    @ResponseBody
    public ResponseEntity<?> toggleDutyStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findUserByUsername(auth.getName())
            .orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        DutyStatus newStatus = dutyStatusService.toggleDutyStatus(user);
        logger.info("Toggled duty status for user {}: {}", user.getUsername(), newStatus.isOnDuty());
        
        Map<String, Object> response = new HashMap<>();
        response.put("isOnDuty", newStatus.isOnDuty());
        
        // Convert LocalDateTime to Date and format as ISO string for proper timezone handling in JavaScript
        Date timestamp = Date.from(newStatus.getTimestamp().atZone(ZoneId.systemDefault()).toInstant());
        response.put("timestamp", timestamp.toInstant().toString());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    @ResponseBody
    public ResponseEntity<?> getCurrentDutyStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findUserByUsername(auth.getName())
            .orElse(null);
        
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        DutyStatus status = dutyStatusService.getLatestDutyStatus(user)
            .orElse(new DutyStatus(user, false));
            
        logger.info("Current duty status for user {}: {}", user.getUsername(), status.isOnDuty());
        
        Map<String, Object> response = new HashMap<>();
        response.put("isOnDuty", status.isOnDuty());
        
        // Convert LocalDateTime to Date and format as ISO string for proper timezone handling in JavaScript
        Date timestamp = Date.from(status.getTimestamp().atZone(ZoneId.systemDefault()).toInstant());
        response.put("timestamp", timestamp.toInstant().toString());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/on-duty")
    @ResponseBody
    public ResponseEntity<?> getOnDutyUsers() {
        List<DutyStatus> onDutyUsers = dutyStatusService.getAllOnDutyUsers();
        return ResponseEntity.ok(onDutyUsers);
    }
} 