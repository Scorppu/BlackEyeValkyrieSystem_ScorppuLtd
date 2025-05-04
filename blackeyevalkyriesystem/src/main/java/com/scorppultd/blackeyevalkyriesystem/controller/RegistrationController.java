package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
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
                licenseKeyOpt.get().getStatus() != LicenseKey.Status.ACTIVE ||
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
            newUser.setRole(User.UserRole.valueOf(validLicense.getRole().name()));
            newUser.setActive(true);
            newUser.setCreatedDate(LocalDate.now());

            // Save the user
            User savedUser = userService.saveUser(newUser);
            logger.info("User registered successfully: {}", savedUser.getUsername());

            // Update license key to mark as used
            validLicense.setUser(savedUser.getId());
            validLicense.setStatus(LicenseKey.Status.USED);
            licenseKeyService.saveLicenseKey(validLicense);

            redirectAttributes.addFlashAttribute("successMessage", "Registration successful. You can now log in.");
            return "redirect:/login";
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
                licenseKeyOpt.get().getStatus() == LicenseKey.Status.ACTIVE &&
                licenseKeyOpt.get().getUser() == null) {
                
                LicenseKey validLicense = licenseKeyOpt.get();
                response.put("valid", true);
                response.put("role", validLicense.getRole().name());
                logger.info("License key verified successfully: {} for role {}", licenseKey, validLicense.getRole());
            } else {
                response.put("valid", false);
                logger.warn("Invalid license key: {}", licenseKey);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error verifying license key: {}", e.getMessage(), e);
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 