package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    public String listUsers(
            Model model,
            @RequestParam(name = "sortBy", defaultValue = "lastName") String sortBy,
            @RequestParam(name = "direction", defaultValue = "asc") String direction) {
        
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
    public String createUserForm(Model model) {
        model.addAttribute("user", new User());
        return "create-user";
    }
}

// RESTful API controller for User operations
@RestController
@RequestMapping("/api/users")
class UserApiController {

    @Autowired
    private UserService userService;
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // Set default values for new user
        user.setActive(true);
        user.setCreatedDate(LocalDate.now());
        
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }
} 