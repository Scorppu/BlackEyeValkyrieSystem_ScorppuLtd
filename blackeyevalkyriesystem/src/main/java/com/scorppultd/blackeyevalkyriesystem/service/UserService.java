package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * Service class that manages User entities.
 * Provides methods for creating, retrieving, updating, and deleting users,
 * as well as specialized operations for pagination, sorting, and role-based filtering.
 * Also handles special cases like reserved usernames and duty status for medical staff.
 */
@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DutyStatusService dutyStatusService;

    /**
     * Retrieves all users sorted by the specified field and direction.
     * 
     * @param sortBy The field to sort by. Special handling for "name" (sorts by lastName, firstName)
     *              and "phone" (sorts by phoneNumber).
     * @param direction The sort direction ("asc" for ascending, any other value for descending)
     * @return A sorted list of all users
     */
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

    /**
     * Retrieves a paginated list of users sorted by the specified field and direction.
     * 
     * @param sortBy The field to sort by. Special handling for "name" (sorts by lastName, firstName)
     *              and "phone" (sorts by phoneNumber).
     * @param direction The sort direction ("asc" for ascending, any other value for descending)
     * @param offset The starting position of the result set
     * @param limit The maximum number of results to return
     * @return A paginated and sorted list of users
     */
    public List<User> getPaginatedUsersSorted(String sortBy, String direction, int offset, int limit) {
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest;
        
        // Handle custom sort fields that don't directly match properties
        if (sortBy.equals("name")) {
            pageRequest = PageRequest.of(offset / limit, limit, Sort.by(sortDirection, "lastName", "firstName"));
        } else if (sortBy.equals("phone")) {
            pageRequest = PageRequest.of(offset / limit, limit, Sort.by(sortDirection, "phoneNumber"));
        } else {
            pageRequest = PageRequest.of(offset / limit, limit, Sort.by(sortDirection, sortBy));
        }
        
        return userRepository.findAll(pageRequest).getContent();
    }

    /**
     * Counts the total number of users in the system.
     * 
     * @return The total number of users
     */
    public long countTotalUsers() {
        return userRepository.count();
    }

    /**
     * Counts the number of users with a specific role.
     * 
     * @param role The role to count users for
     * @return The number of users with the specified role
     */
    public long countUsersByRole(User.UserRole role) {
        return userRepository.countByRole(role);
    }
    
    /**
     * Saves a user to the database.
     * For doctors and nurses, also creates an initial duty status record if one doesn't exist.
     * 
     * @param user The user to save
     * @return The saved user with any database-generated fields populated
     * @throws IllegalArgumentException If attempting to modify the reserved admin user
     */
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
    
    /**
     * Finds a user by their ID.
     * 
     * @param id The ID of the user to find
     * @return An Optional containing the found user, or empty if no user was found
     */
    public Optional<User> findUserById(String id) {
        return userRepository.findById(id);
    }
    
    /**
     * Finds a user by their username.
     * The admin user is handled by in-memory authentication and won't be found in the database.
     * 
     * @param username The username to search for
     * @return An Optional containing the found user, or empty if no user was found
     */
    public Optional<User> findUserByUsername(String username) {
        // Admin user is handled by in-memory authentication
        if ("admin".equalsIgnoreCase(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }
    
    /**
     * Retrieves all users from the database.
     * 
     * @return A list of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Finds all users with a specific role.
     * 
     * @param role The role to filter by
     * @return A list of users with the specified role
     */
    public List<User> findByRole(User.UserRole role) {
        return userRepository.findByRole(role);
    }
    
    /**
     * Checks if a username is reserved by the system.
     * Currently only "admin" is a reserved username.
     * 
     * @param username The username to check
     * @return true if the username is reserved, false otherwise
     */
    public boolean isReservedUsername(String username) {
        return "admin".equalsIgnoreCase(username);
    }
    
    /**
     * Deletes a user by their ID.
     * 
     * @param id The ID of the user to delete
     * @throws IllegalArgumentException If the user does not exist or if attempting to delete the reserved admin user
     */
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