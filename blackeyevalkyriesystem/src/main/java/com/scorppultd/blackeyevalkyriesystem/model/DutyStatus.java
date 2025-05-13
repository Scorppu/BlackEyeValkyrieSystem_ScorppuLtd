package com.scorppultd.blackeyevalkyriesystem.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "duty_status")
public class DutyStatus {
    @Id
    private String id;
    
    @DBRef
    private User user;
    
    private boolean isOnDuty;
    private LocalDateTime timestamp;
    private Integer lastDutyDuration;

    public DutyStatus() {
        this.timestamp = LocalDateTime.now();
    }

    public DutyStatus(User user, boolean isOnDuty) {
        this.user = user;
        this.isOnDuty = isOnDuty;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isOnDuty() {
        return isOnDuty;
    }

    public void setOnDuty(boolean isOnDuty) {
        this.isOnDuty = isOnDuty;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Integer getLastDutyDuration() {
        return lastDutyDuration;
    }
    
    public void setLastDutyDuration(Integer lastDutyDuration) {
        this.lastDutyDuration = lastDutyDuration;
    }
} 