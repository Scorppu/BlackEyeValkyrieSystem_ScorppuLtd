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

@Controller
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired
    private UserService userService;
    
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