package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/user")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public String listUsers(
            Model model,
            HttpServletRequest request,
            @RequestParam(name = "sortBy", defaultValue = "lastName") String sortBy,
            @RequestParam(name = "direction", defaultValue = "asc") String direction) {
        
        // Add request to model for sidebar navigation
        model.addAttribute("request", request);
        
        // Get sorted users
        List<User> users = userService.getAllUsersSorted(sortBy, direction);
        
        // Count statistics
        long totalUsers = userService.countTotalUsers();
        long doctorCount = userService.countUsersByRole(User.UserRole.DOCTOR);
        long nurseCount = userService.countUsersByRole(User.UserRole.NURSE);
        
        // Add attributes to model
        model.addAttribute("users", users);
        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("doctorCount", doctorCount);
        model.addAttribute("nurseCount", nurseCount);
        model.addAttribute("currentSortBy", sortBy);
        model.addAttribute("currentDirection", direction);
        
        return "user-list";
    }
    
    @GetMapping("/create")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public String createUserForm(Model model, HttpServletRequest request) {
        // Add request to model for sidebar navigation
        model.addAttribute("request", request);
        
        // Create new user with active=true by default
        User newUser = new User();
        newUser.setActive(true);
        
        model.addAttribute("user", newUser);
        return "create-user";
    }
    
    @GetMapping("/edit/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public String editUserForm(@PathVariable String id, Model model, HttpServletRequest request, RedirectAttributes redirectAttributes) {
        // Add request to model for sidebar navigation
        model.addAttribute("request", request);
        
        Optional<User> userOpt = userService.findUserById(id);
        
        if (userOpt.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "User not found");
            return "redirect:/user/list";
        }
        
        User user = userOpt.get();
        model.addAttribute("user", user);
        model.addAttribute("isEdit", true);
        
        return "create-user";
    }
    
    @GetMapping("/delete/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public String deleteUser(@PathVariable String id, HttpServletRequest request, RedirectAttributes redirectAttributes) {
        try {
            Optional<User> userOpt = userService.findUserById(id);
            
            if (userOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "User not found");
                return "redirect:/user/list";
            }
            
            // Delete the user
            userService.deleteUser(id);
            
            redirectAttributes.addFlashAttribute("successMessage", "User deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("errorMessage", "Error deleting user: " + e.getMessage());
        }
        
        return "redirect:/user/list";
    }
}

// RESTful API controller for User operations
@RestController
@RequestMapping("/api/users")
class UserApiController {

    private static final Logger logger = LoggerFactory.getLogger(UserApiController.class);

    @Autowired
    private UserService userService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @GetMapping("/counts")
    public ResponseEntity<?> getUserCounts() {
        try {
            Map<String, Object> counts = new HashMap<>();
            counts.put("totalUsers", userService.countTotalUsers());
            counts.put("doctorCount", userService.countUsersByRole(User.UserRole.DOCTOR));
            counts.put("nurseCount", userService.countUsersByRole(User.UserRole.NURSE));
            
            logger.info("Retrieved user counts: {}", counts);
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            logger.error("Error getting user counts: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            logger.info("Received user creation request: username={}", user.getUsername());
            
            // Check if trying to create 'admin' user which is reserved
            if (userService.isReservedUsername(user.getUsername())) {
                logger.warn("Attempt to create reserved username: {}", user.getUsername());
                Map<String, String> error = new HashMap<>();
                error.put("message", "Username 'admin' is reserved for system use");
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
            }
            
            // Check if username is already taken
            if (userService.findUserByUsername(user.getUsername()).isPresent()) {
                logger.warn("Username already exists: {}", user.getUsername());
                Map<String, String> error = new HashMap<>();
                error.put("message", "Username already exists");
                return new ResponseEntity<>(error, HttpStatus.CONFLICT);
            }
            
            // Encrypt password
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            
            user.setCreatedDate(LocalDate.now());
            user.setActive(true);
            
            logger.info("Creating new user: username={}, role={}", user.getUsername(), user.getRole());
            User savedUser = userService.saveUser(user);
            logger.info("User created successfully: id={}", savedUser.getId());
            
            // Create response with user details
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("username", savedUser.getUsername());
            response.put("firstName", savedUser.getFirstName());
            response.put("lastName", savedUser.getLastName());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());
            response.put("active", savedUser.isActive());
            response.put("message", "User created successfully");
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User user) {
        try {
            logger.info("Received user update request for id={}", id);
            
            // Check if user exists
            Optional<User> existingUserOpt = userService.findUserById(id);
            if (existingUserOpt.isEmpty()) {
                logger.warn("User not found for update: id={}", id);
                Map<String, String> error = new HashMap<>();
                error.put("error", "User not found");
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
            }
            
            User existingUser = existingUserOpt.get();
            
            // Check if trying to update 'admin' user which is reserved
            if (userService.isReservedUsername(existingUser.getUsername())) {
                logger.warn("Attempt to update reserved username: {}", existingUser.getUsername());
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cannot modify the default admin user");
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
            }
            
            // Set the ID from path to the user object
            user.setId(id);
            
            // Only update password if it's provided
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                user.setPassword(existingUser.getPassword());
            } else {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
            
            // Preserve creation date
            user.setCreatedDate(existingUser.getCreatedDate());
            
            logger.info("Updating user: id={}, role={}", user.getId(), user.getRole());
            User updatedUser = userService.saveUser(user);
            logger.info("User updated successfully: id={}", updatedUser.getId());
            
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 