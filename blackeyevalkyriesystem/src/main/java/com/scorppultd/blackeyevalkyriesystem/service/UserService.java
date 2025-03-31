package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

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
        return userRepository.save(user);
    }
    
    public Optional<User> findUserById(String id) {
        return userRepository.findById(id);
    }
} 