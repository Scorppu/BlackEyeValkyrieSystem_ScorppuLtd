package com.scorppultd.blackeyevalkyriesystem.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller for handling general application pages
 */
@Controller
public class WebController {
    
    /**
     * Display the home page
     */
    @GetMapping("/")
    public String index(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "index";
    }
    
    /**
     * Display the login page
     */
    @GetMapping("/login")
    public String login(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "login";
    }
    
    /**
     * Display the appointments page
     */
    @GetMapping("/appointments")
    public String appointments(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "appointments";
    }
    
    /**
     * Display the settings page
     */
    @GetMapping("/settings")
    public String settings(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "settings";
    }
    
    /**
     * Display the error page
     */
    @GetMapping("/error")
    public String error(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "error";
    }
    
    @GetMapping("/access-denied")
    public String accessDenied(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "access-denied";
    }
} 