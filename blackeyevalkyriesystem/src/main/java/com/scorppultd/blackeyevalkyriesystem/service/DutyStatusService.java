package com.scorppultd.blackeyevalkyriesystem.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.DutyStatusRepository;

@Service
public class DutyStatusService {

    @Autowired
    private DutyStatusRepository dutyStatusRepository;

    public DutyStatus toggleDutyStatus(User user) {
        Optional<DutyStatus> existingStatus = dutyStatusRepository.findFirstByUserOrderByTimestampDesc(user);
        boolean newStatus = !existingStatus.map(DutyStatus::isOnDuty).orElse(false);
        
        DutyStatus dutyStatus;
        if (existingStatus.isPresent()) {
            // Update existing status
            dutyStatus = existingStatus.get();
            dutyStatus.setOnDuty(newStatus);
            dutyStatus.setTimestamp(LocalDateTime.now());
        } else {
            // Create new status if none exists
            dutyStatus = new DutyStatus(user, newStatus);
        }
        
        return dutyStatusRepository.save(dutyStatus);
    }

    public Optional<DutyStatus> getLatestDutyStatus(User user) {
        return dutyStatusRepository.findFirstByUserOrderByTimestampDesc(user);
    }

    public List<DutyStatus> getDutyStatusHistory(User user) {
        return dutyStatusRepository.findByUserOrderByTimestampDesc(user);
    }

    public List<DutyStatus> getDutyStatusHistory(User user, LocalDateTime start, LocalDateTime end) {
        return dutyStatusRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(user, start, end);
    }

    public List<DutyStatus> getAllOnDutyUsers() {
        return dutyStatusRepository.findAllOnDuty();
    }
} 