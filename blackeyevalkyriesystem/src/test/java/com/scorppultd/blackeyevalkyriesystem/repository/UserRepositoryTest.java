package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class UserRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByRoleTest() {
        // Setup
        User doctor = createTestUser("1", "John", "Doe", "john@example.com", 
                                   "johndoe", "1234567890", User.UserRole.DOCTOR);
        User nurse = createTestUser("2", "Jane", "Smith", "jane@example.com", 
                                  "janesmith", "0987654321", User.UserRole.NURSE);
        
        userRepository.save(doctor);
        userRepository.save(nurse);

        // Execute
        List<User> doctors = userRepository.findByRole(User.UserRole.DOCTOR);
        List<User> nurses = userRepository.findByRole(User.UserRole.NURSE);

        // Verify
        assertEquals(1, doctors.size());
        assertEquals("John", ReflectionTestUtils.getField(doctors.get(0), "firstName"));
        assertEquals(1, nurses.size());
        assertEquals("Jane", ReflectionTestUtils.getField(nurses.get(0), "firstName"));
    }

    @Test
    void findByFirstNameAndLastNameTest() {
        // Setup
        User user = createTestUser("1", "John", "Doe", "john@example.com", 
                                 "johndoe", "1234567890", User.UserRole.DOCTOR);
        userRepository.save(user);

        // Execute
        List<User> users = userRepository.findByFirstNameAndLastName("John", "Doe");

        // Verify
        assertEquals(1, users.size());
        assertEquals("johndoe", ReflectionTestUtils.getField(users.get(0), "username"));
    }

    @Test
    void findByEmailTest() {
        // Setup
        User user = createTestUser("1", "John", "Doe", "john@example.com", 
                                 "johndoe", "1234567890", User.UserRole.DOCTOR);
        userRepository.save(user);

        // Execute
        Optional<User> foundUser = userRepository.findByEmail("john@example.com");

        // Verify
        assertTrue(foundUser.isPresent());
        assertEquals("John", ReflectionTestUtils.getField(foundUser.get(), "firstName"));
    }

    @Test
    void findByUsernameTest() {
        // Setup
        User user = createTestUser("1", "John", "Doe", "john@example.com", 
                                 "johndoe", "1234567890", User.UserRole.DOCTOR);
        userRepository.save(user);

        // Execute
        Optional<User> foundUser = userRepository.findByUsername("johndoe");

        // Verify
        assertTrue(foundUser.isPresent());
        assertEquals("John", ReflectionTestUtils.getField(foundUser.get(), "firstName"));
    }

    @Test
    void findByActiveTest() {
        // Setup
        User activeUser = createTestUser("1", "John", "Doe", "john@example.com", 
                                       "johndoe", "1234567890", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(activeUser, "active", true);
        
        User inactiveUser = createTestUser("2", "Jane", "Smith", "jane@example.com", 
                                         "janesmith", "0987654321", User.UserRole.NURSE);
        ReflectionTestUtils.setField(inactiveUser, "active", false);
        
        userRepository.save(activeUser);
        userRepository.save(inactiveUser);

        // Execute
        List<User> activeUsers = userRepository.findByActive(true);
        List<User> inactiveUsers = userRepository.findByActive(false);

        // Verify
        assertEquals(1, activeUsers.size());
        assertTrue(activeUsers.stream().anyMatch(u -> "John".equals(ReflectionTestUtils.getField(u, "firstName"))));
        assertEquals(1, inactiveUsers.size());
        assertEquals("Jane", ReflectionTestUtils.getField(inactiveUsers.get(0), "firstName"));
    }

    @Test
    void countByRoleTest() {
        // Setup
        User doctor1 = createTestUser("1", "John", "Doe", "john@example.com", 
                                    "johndoe", "1234567890", User.UserRole.DOCTOR);
        User doctor2 = createTestUser("2", "Alice", "White", "alice@example.com", 
                                    "alicewhite", "1122334455", User.UserRole.DOCTOR);
        User nurse = createTestUser("3", "Jane", "Smith", "jane@example.com", 
                                  "janesmith", "0987654321", User.UserRole.NURSE);
        
        userRepository.save(doctor1);
        userRepository.save(doctor2);
        userRepository.save(nurse);

        // Execute
        long doctorCount = userRepository.countByRole(User.UserRole.DOCTOR);
        long nurseCount = userRepository.countByRole(User.UserRole.NURSE);

        // Verify
        assertEquals(2, doctorCount);
        assertEquals(1, nurseCount);
    }

    private User createTestUser(String id, String firstName, String lastName, String email, 
                              String username, String phoneNumber, User.UserRole role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        ReflectionTestUtils.setField(user, "firstName", firstName);
        ReflectionTestUtils.setField(user, "lastName", lastName);
        ReflectionTestUtils.setField(user, "email", email);
        ReflectionTestUtils.setField(user, "username", username);
        ReflectionTestUtils.setField(user, "password", "password");
        ReflectionTestUtils.setField(user, "phoneNumber", phoneNumber);
        ReflectionTestUtils.setField(user, "role", role);
        ReflectionTestUtils.setField(user, "createdDate", LocalDate.now());
        ReflectionTestUtils.setField(user, "active", true);
        return user;
    }

    @Test
    void findByAddress_CityTest() {
        // Setup
        User user = createTestUser("1", "John", "Doe", "john@example.com", 
                                 "johndoe", "1234567890", User.UserRole.DOCTOR);
        
        User.Address address = new User.Address();
        ReflectionTestUtils.setField(address, "city", "New York");
        ReflectionTestUtils.setField(address, "state", "NY");
        ReflectionTestUtils.setField(address, "country", "USA");
        ReflectionTestUtils.setField(address, "postalCode", "10001");
        ReflectionTestUtils.setField(address, "street", "123 Main St");
        
        ReflectionTestUtils.setField(user, "address", address);
        userRepository.save(user);

        // Execute
        List<User> users = userRepository.findByAddress_City("New York");

        // Verify
        assertEquals(1, users.size());
        assertEquals("John", ReflectionTestUtils.getField(users.get(0), "firstName"));
        
        User.Address retrievedAddress = (User.Address) ReflectionTestUtils.getField(users.get(0), "address");
        assertEquals("New York", ReflectionTestUtils.getField(retrievedAddress, "city"));
    }
} 