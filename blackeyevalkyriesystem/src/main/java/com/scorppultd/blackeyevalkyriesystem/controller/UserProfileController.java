package com.scorppultd.blackeyevalkyriesystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller responsible for handling user profile operations.
 * This controller provides endpoints for retrieving current user profile information.
 * All endpoints require authentication to access.
 */
@Controller
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired
    private UserService userService;
    
    /**
     * Retrieves the profile information of the currently authenticated user.
     * 
     * @return A map containing user profile data with the following keys:
     *         - username: The user's login username
     *         - fullName: The user's full name (firstName + lastName)
     *         - initials: The user's initials (first letter of firstName + first letter of lastName)
     *         - role: The user's role in the system
     */
    @GetMapping
    @ResponseBody
    public Map<String, Object> getUserProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Map<String, Object> response = new HashMap<>();
        
        userService.findUserByUsername(username).ifPresent(user -> {
            response.put("username", user.getUsername());
            response.put("fullName", user.getFirstName() + " " + user.getLastName());
            response.put("initials", (user.getFirstName().substring(0, 1) + user.getLastName().substring(0, 1)).toUpperCase());
            response.put("role", user.getRole().name());
        });
        
        return response;
    }
} 