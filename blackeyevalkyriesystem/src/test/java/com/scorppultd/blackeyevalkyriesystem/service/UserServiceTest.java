package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        // Setup test data using direct instantiation and reflection to set fields
        user1 = new User();
        ReflectionTestUtils.setField(user1, "id", "1");
        ReflectionTestUtils.setField(user1, "firstName", "John");
        ReflectionTestUtils.setField(user1, "lastName", "Doe");
        ReflectionTestUtils.setField(user1, "email", "john.doe@example.com");
        ReflectionTestUtils.setField(user1, "username", "johndoe");
        ReflectionTestUtils.setField(user1, "password", "password");
        ReflectionTestUtils.setField(user1, "phoneNumber", "1234567890");
        ReflectionTestUtils.setField(user1, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(user1, "active", true);
        ReflectionTestUtils.setField(user1, "createdDate", LocalDate.now());

        user2 = new User();
        ReflectionTestUtils.setField(user2, "id", "2");
        ReflectionTestUtils.setField(user2, "firstName", "Jane");
        ReflectionTestUtils.setField(user2, "lastName", "Smith");
        ReflectionTestUtils.setField(user2, "email", "jane.smith@example.com");
        ReflectionTestUtils.setField(user2, "username", "janesmith");
        ReflectionTestUtils.setField(user2, "password", "password");
        ReflectionTestUtils.setField(user2, "phoneNumber", "0987654321");
        ReflectionTestUtils.setField(user2, "role", User.UserRole.NURSE);
        ReflectionTestUtils.setField(user2, "active", true);
        ReflectionTestUtils.setField(user2, "createdDate", LocalDate.now());
    }

    @Test
    void getAllUsersSortedByNameTest() {
        // Given
        when(userRepository.findAll(any(Sort.class))).thenReturn(Arrays.asList(user1, user2));

        // When
        List<User> result = userService.getAllUsersSorted("name", "asc");

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userRepository).findAll(any(Sort.class));
    }

    @Test
    void countTotalUsersTest() {
        // Given
        when(userRepository.count()).thenReturn(2L);

        // When
        long count = userService.countTotalUsers();

        // Then
        assertEquals(2L, count);
        verify(userRepository).count();
    }

    @Test
    void countUsersByRoleTest() {
        // Given
        User.UserRole role = User.UserRole.DOCTOR;
        when(userRepository.countByRole(role)).thenReturn(1L);

        // When
        long count = userService.countUsersByRole(role);

        // Then
        assertEquals(1L, count);
        verify(userRepository).countByRole(role);
    }

    @Test
    void saveUserTest() {
        // Given
        when(userRepository.save(user1)).thenReturn(user1);

        // When
        User savedUser = userService.saveUser(user1);

        // Then
        assertNotNull(savedUser);
        assertEquals(ReflectionTestUtils.getField(user1, "id"), ReflectionTestUtils.getField(savedUser, "id"));
        verify(userRepository).save(user1);
    }

    @Test
    void saveAdminUserThrowsExceptionTest() {
        // Given
        User adminUser = new User();
        ReflectionTestUtils.setField(adminUser, "username", "admin");

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.saveUser(adminUser)
        );
        assertEquals("Cannot modify the default admin user", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void findUserByIdTest() {
        // Given
        String userId = "1";
        when(userRepository.findById(userId)).thenReturn(Optional.of(user1));

        // When
        Optional<User> result = userService.findUserById(userId);

        // Then
        assertTrue(result.isPresent());
        assertEquals(userId, ReflectionTestUtils.getField(result.get(), "id"));
        verify(userRepository).findById(userId);
    }

    @Test
    void findUserByUsernameTest() {
        // Given
        String username = "johndoe";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user1));

        // When
        Optional<User> result = userService.findUserByUsername(username);

        // Then
        assertTrue(result.isPresent());
        assertEquals(username, ReflectionTestUtils.getField(result.get(), "username"));
        verify(userRepository).findByUsername(username);
    }

    @Test
    void findAdminUserByUsernameReturnsEmptyTest() {
        // Given
        String username = "admin";

        // When
        Optional<User> result = userService.findUserByUsername(username);

        // Then
        assertTrue(result.isEmpty());
        verify(userRepository, never()).findByUsername(username);
    }

    @Test
    void getAllUsersTest() {
        // Given
        List<User> users = Arrays.asList(user1, user2);
        when(userRepository.findAll()).thenReturn(users);

        // When
        List<User> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userRepository).findAll();
    }

    @Test
    void findByRoleTest() {
        // Given
        User.UserRole role = User.UserRole.DOCTOR;
        when(userRepository.findByRole(role)).thenReturn(Arrays.asList(user1));

        // When
        List<User> result = userService.findByRole(role);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(role, ReflectionTestUtils.getField(result.get(0), "role"));
        verify(userRepository).findByRole(role);
    }

    @Test
    void isReservedUsernameTest() {
        // When & Then
        assertTrue(userService.isReservedUsername("admin"));
        assertTrue(userService.isReservedUsername("ADMIN"));
        assertFalse(userService.isReservedUsername("johndoe"));
    }

    @Test
    void deleteUserTest() {
        // Given
        String userId = "1";
        when(userRepository.findById(userId)).thenReturn(Optional.of(user1));

        // When
        userService.deleteUser(userId);

        // Then
        verify(userRepository).findById(userId);
        verify(userRepository).deleteById(userId);
    }

    @Test
    void deleteNonexistentUserThrowsExceptionTest() {
        // Given
        String userId = "nonexistent";
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.deleteUser(userId)
        );
        assertEquals("User not found with ID: " + userId, exception.getMessage());
        verify(userRepository).findById(userId);
        verify(userRepository, never()).deleteById(anyString());
    }

    @Test
    void deleteAdminUserThrowsExceptionTest() {
        // Given
        String userId = "admin";
        User adminUser = new User();
        ReflectionTestUtils.setField(adminUser, "id", userId);
        ReflectionTestUtils.setField(adminUser, "username", "admin");
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> userService.deleteUser(userId)
        );
        assertEquals("Cannot delete the default admin user", exception.getMessage());
        verify(userRepository).findById(userId);
        verify(userRepository, never()).deleteById(anyString());
    }

    @Test
    void updateUserActiveStatusTest() {
        // Given
        String userId = "1";
        User inactiveUser = new User();
        ReflectionTestUtils.setField(inactiveUser, "id", "1");
        ReflectionTestUtils.setField(inactiveUser, "firstName", "John");
        ReflectionTestUtils.setField(inactiveUser, "lastName", "Doe");
        ReflectionTestUtils.setField(inactiveUser, "email", "john.doe@example.com");
        ReflectionTestUtils.setField(inactiveUser, "username", "johndoe");
        ReflectionTestUtils.setField(inactiveUser, "password", "password");
        ReflectionTestUtils.setField(inactiveUser, "phoneNumber", "1234567890");
        ReflectionTestUtils.setField(inactiveUser, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(inactiveUser, "active", false);
        ReflectionTestUtils.setField(inactiveUser, "createdDate", LocalDate.now());
        
        when(userRepository.save(any(User.class))).thenReturn(inactiveUser);
        
        // When
        User updatedUser = userService.saveUser(inactiveUser);
        
        // Then
        assertNotNull(updatedUser);
        assertFalse((Boolean) ReflectionTestUtils.getField(updatedUser, "active"));
        verify(userRepository).save(any(User.class));
    }
} 