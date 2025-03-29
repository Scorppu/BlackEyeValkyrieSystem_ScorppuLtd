package com.scorppultd.blackeyevalkyriesystem.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.model.User.UserRole;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    // Find by role
    List<User> findByRole(UserRole role);
    
    // Find by name
    List<User> findByFirstName(String firstName);
    List<User> findByLastName(String lastName);
    List<User> findByFirstNameAndLastName(String firstName, String lastName);
    
    // Find by contact info
    Optional<User> findByEmail(String email);
    List<User> findByPhoneNumber(String phoneNumber);
    
    // Find by status
    List<User> findByActive(boolean active);
    List<User> findByCreatedDateBefore(LocalDate date);
    List<User> findByCreatedDateAfter(LocalDate date);
    List<User> findByLastLoginDateBefore(LocalDate date);
    
    // Find by address info
    List<User> findByAddress_City(String city);
    List<User> findByAddress_State(String state);
    List<User> findByAddress_Country(String country);
} 