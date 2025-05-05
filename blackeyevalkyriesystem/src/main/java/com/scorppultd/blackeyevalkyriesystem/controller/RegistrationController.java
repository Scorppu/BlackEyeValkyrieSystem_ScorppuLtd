package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import com.scorppultd.blackeyevalkyriesystem.repository.LicenseKeyRepository;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
public class RegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(RegistrationController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private LicenseKeyService licenseKeyService;
    
    @Autowired
    private LicenseKeyRepository licenseKeyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Show the forgot password page
    @GetMapping("/forgot-password")
    public String showForgotPasswordPage() {
        return "forgot-password";
    }

    // Show the registration page
    @GetMapping("/register")
    public String showRegistrationPage() {
        return "register";
    }

    // Handle user registration
    @PostMapping("/register")
    public String registerUser(@RequestParam String licenseKey,
                               @RequestParam String fullName,
                               @RequestParam String username,
                               @RequestParam String email,
                               @RequestParam String password,
                               @RequestParam String confirmPassword,
                               RedirectAttributes redirectAttributes) {
        logger.info("Registration attempt with license key: {}", licenseKey);

        try {
            // Validate license key
            Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findByKey(licenseKey);
            if (licenseKeyOpt.isEmpty() || 
                !LicenseKey.Status.ACTIVE.equals(licenseKeyOpt.get().getStatus()) ||
                licenseKeyOpt.get().getUser() != null) {
                redirectAttributes.addFlashAttribute("error", "Invalid or used license key");
                return "redirect:/register";
            }
            
            LicenseKey validLicense = licenseKeyOpt.get();

            // Validate passwords match
            if (!password.equals(confirmPassword)) {
                redirectAttributes.addFlashAttribute("error", "Passwords do not match");
                return "redirect:/register";
            }

            // Check if username already exists
            if (userService.findUserByUsername(username).isPresent()) {
                redirectAttributes.addFlashAttribute("error", "Username already exists");
                return "redirect:/register";
            }

            // Create new user
            User newUser = new User();
            
            // Split full name into first and last name
            String[] nameParts = fullName.split(" ", 2);
            if (nameParts.length > 1) {
                newUser.setFirstName(nameParts[0]);
                newUser.setLastName(nameParts[1]);
            } else {
                newUser.setFirstName(fullName);
                newUser.setLastName("");
            }
            
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(password));
            
            // Convert role from license key to enum using the helper method
            try {
                newUser.setRole(User.UserRole.fromString(validLicense.getRole()));
                logger.info("Setting user role to: {} (from license key role: {})", 
                           newUser.getRole(), validLicense.getRole());
            } catch (IllegalArgumentException e) {
                logger.error("Invalid role found in license key: {}", validLicense.getRole());
                throw new IllegalArgumentException("Invalid role type in license key: " + validLicense.getRole());
            }
            
            newUser.setActive(true);
            newUser.setCreatedDate(LocalDate.now());

            // Save the user
            User savedUser = userService.saveUser(newUser);
            logger.info("User registered successfully: {}", savedUser.getUsername());

            // Update license key to mark as used
            validLicense.setUser(savedUser.getId());
            validLicense.setStatus(LicenseKey.Status.USED);
            licenseKeyRepository.save(validLicense);

            redirectAttributes.addFlashAttribute("successMessage", "Registration successful. You can now log in.");
            return "redirect:/login?registered=true";
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage(), e);
            redirectAttributes.addFlashAttribute("error", "An error occurred during registration: " + e.getMessage());
            return "redirect:/register";
        }
    }

    // REST API endpoint for verifying license key
    @PostMapping("/api/verify-license-key")
    @ResponseBody
    public ResponseEntity<?> verifyLicenseKey(@RequestBody Map<String, String> request) {
        String licenseKey = request.get("licenseKey");
        logger.info("License key verification request: {}", licenseKey);

        Map<String, Object> response = new HashMap<>();

        try {
            Optional<LicenseKey> licenseKeyOpt = licenseKeyService.findByKey(licenseKey);
            
            if (licenseKeyOpt.isPresent() && 
                LicenseKey.Status.ACTIVE.equals(licenseKeyOpt.get().getStatus()) &&
                licenseKeyOpt.get().getUser() == null) {
                
                LicenseKey validLicense = licenseKeyOpt.get();
                response.put("valid", true);
                response.put("role", validLicense.getRole());
                logger.info("License key verified successfully: {} for role {}", licenseKey, validLicense.getRole());
            } else {
                response.put("valid", false);
                if (licenseKeyOpt.isPresent()) {
                    logger.warn("License key found but invalid: {} - Status: {}, User: {}", 
                        licenseKey, licenseKeyOpt.get().getStatus(), licenseKeyOpt.get().getUser());
                } else {
                    logger.warn("License key not found: {}", licenseKey);
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error verifying license key: {}", e.getMessage(), e);
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // REST API endpoint for checking username availability
    @GetMapping("/api/users/check-username")
    @ResponseBody
    public ResponseEntity<?> checkUsernameAvailability(@RequestParam String username) {
        logger.info("Checking username availability: {}", username);
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isAvailable = !userService.findUserByUsername(username).isPresent();
            response.put("available", isAvailable);
            
            if (isAvailable) {
                logger.info("Username '{}' is available", username);
            } else {
                logger.info("Username '{}' is already taken", username);
            }
            
            return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            logger.error("Error checking username availability: {}", e.getMessage(), e);
            response.put("available", false);
            response.put("error", e.getMessage());
            return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(response);
        }
    }
} 