package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DutyStatusService dutyStatusService;

    public List<User> getAllUsersSorted(String sortBy, String direction) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        
        // Handle custom sort fields that don't directly match properties
        if (sortBy.equals("name")) {
            return userRepository.findAll(Sort.by(sortDirection, "lastName", "firstName"));
        } else if (sortBy.equals("phone")) {
            return userRepository.findAll(Sort.by(sortDirection, "phoneNumber"));
        } else {
            return userRepository.findAll(Sort.by(sortDirection, sortBy));
        }
    }

    public long countTotalUsers() {
        return userRepository.count();
    }

    public long countUsersByRole(User.UserRole role) {
        return userRepository.countByRole(role);
    }
    
    public User saveUser(User user) {
        // Prevent saving over the hardcoded admin user
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("Cannot modify the default admin user");
        }
        
        // Save the user
        User savedUser = userRepository.save(user);
        
        // Check if this user should have a duty status record (doctors and nurses)
        if (savedUser.getRole() == User.UserRole.DOCTOR || savedUser.getRole() == User.UserRole.NURSE) {
            try {
                // Check if duty status already exists
                Optional<com.scorppultd.blackeyevalkyriesystem.model.DutyStatus> existingStatus = 
                    dutyStatusService.getLatestDutyStatus(savedUser);
                
                if (existingStatus.isEmpty()) {
                    // Create a duty status record with isOnDuty=false
                    dutyStatusService.createInitialDutyStatus(savedUser);
                    logger.info("Created initial duty status record for user: {}", savedUser.getUsername());
                }
            } catch (Exception e) {
                logger.error("Failed to create duty status record for user {}: {}", savedUser.getUsername(), e.getMessage());
            }
        }
        
        return savedUser;
    }
    
    public Optional<User> findUserById(String id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findUserByUsername(String username) {
        // Admin user is handled by in-memory authentication
        if ("admin".equalsIgnoreCase(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<User> findByRole(User.UserRole role) {
        return userRepository.findByRole(role);
    }
    
    public boolean isReservedUsername(String username) {
        return "admin".equalsIgnoreCase(username);
    }
    
    public void deleteUser(String id) {
        // Check if the user exists
        Optional<User> userOpt = findUserById(id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Prevent deleting the hardcoded admin user
            if ("admin".equalsIgnoreCase(user.getUsername())) {
                throw new IllegalArgumentException("Cannot delete the default admin user");
            }
            
            userRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
    }
} 