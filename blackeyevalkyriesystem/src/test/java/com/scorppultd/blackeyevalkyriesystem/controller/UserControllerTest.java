package com.scorppultd.blackeyevalkyriesystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scorppultd.blackeyevalkyriesystem.config.TestConfig;
import com.scorppultd.blackeyevalkyriesystem.config.MongoTestConfig;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.autoconfigure.thymeleaf.ThymeleafAutoConfiguration;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for the UserController class
 */
@WebMvcTest(value = UserController.class, excludeAutoConfiguration = ThymeleafAutoConfiguration.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        ReflectionTestUtils.setField(user1, "id", "1");
        ReflectionTestUtils.setField(user1, "firstName", "John");
        ReflectionTestUtils.setField(user1, "lastName", "Doe");
        ReflectionTestUtils.setField(user1, "username", "johndoe");
        ReflectionTestUtils.setField(user1, "email", "john.doe@example.com");
        ReflectionTestUtils.setField(user1, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(user1, "active", true);
        ReflectionTestUtils.setField(user1, "createdDate", LocalDate.now());

        user2 = new User();
        ReflectionTestUtils.setField(user2, "id", "2");
        ReflectionTestUtils.setField(user2, "firstName", "Jane");
        ReflectionTestUtils.setField(user2, "lastName", "Smith");
        ReflectionTestUtils.setField(user2, "username", "janesmith");
        ReflectionTestUtils.setField(user2, "email", "jane.smith@example.com");
        ReflectionTestUtils.setField(user2, "role", User.UserRole.NURSE);
        ReflectionTestUtils.setField(user2, "active", true);
        ReflectionTestUtils.setField(user2, "createdDate", LocalDate.now());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listUsersTest() throws Exception {
        // Given
        when(userService.getAllUsersSorted(anyString(), anyString()))
                .thenReturn(Arrays.asList(user1, user2));
        when(userService.countTotalUsers()).thenReturn(2L);
        when(userService.countUsersByRole(User.UserRole.DOCTOR)).thenReturn(1L);
        when(userService.countUsersByRole(User.UserRole.NURSE)).thenReturn(1L);

        // When & Then
        mockMvc.perform(get("/user/list")
                        .param("sortBy", "lastName")
                        .param("direction", "asc"))
                .andExpect(status().isOk())
                .andExpect(view().name("user-list"))
                .andExpect(model().attribute("users", hasSize(2)))
                .andExpect(model().attribute("totalUsers", 2L))
                .andExpect(model().attribute("doctorCount", 1L))
                .andExpect(model().attribute("nurseCount", 1L));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUserFormTest() throws Exception {
        mockMvc.perform(get("/user/create"))
                .andExpect(status().isOk())
                .andExpect(view().name("create-user"))
                .andExpect(model().attributeExists("user"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editUserFormSuccessTest() throws Exception {
        // Given
        when(userService.findUserById("1")).thenReturn(Optional.of(user1));

        // When & Then
        mockMvc.perform(get("/user/edit/1"))
                .andExpect(status().isOk())
                .andExpect(view().name("create-user"))
                .andExpect(model().attributeExists("user"))
                .andExpect(model().attribute("isEdit", true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void editUserFormUserNotFoundTest() throws Exception {
        // Given
        when(userService.findUserById("999")).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/user/edit/999"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/user/list"))
                .andExpect(flash().attributeExists("errorMessage"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUserSuccessTest() throws Exception {
        // Given
        when(userService.findUserById("1")).thenReturn(Optional.of(user1));

        // When & Then
        mockMvc.perform(get("/user/delete/1").with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/user/list"))
                .andExpect(flash().attributeExists("successMessage"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUserNotFoundTest() throws Exception {
        // Given
        when(userService.findUserById("999")).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/user/delete/999").with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/user/list"))
                .andExpect(flash().attributeExists("errorMessage"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUserExceptionTest() throws Exception {
        // Given
        when(userService.findUserById("1")).thenReturn(Optional.of(user1));
        doThrow(new IllegalArgumentException("Cannot delete user")).when(userService).deleteUser("1");

        // When & Then
        mockMvc.perform(get("/user/delete/1").with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/user/list"))
                .andExpect(flash().attributeExists("errorMessage"));
    }

}

@WebMvcTest(value = UserApiController.class, excludeAutoConfiguration = ThymeleafAutoConfiguration.class)
@Import({TestConfig.class, MongoTestConfig.class})
class UserApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user1;

    @BeforeEach
    void setUp() {
        user1 = new User();
        ReflectionTestUtils.setField(user1, "id", "1");
        ReflectionTestUtils.setField(user1, "firstName", "John");
        ReflectionTestUtils.setField(user1, "lastName", "Doe");
        ReflectionTestUtils.setField(user1, "username", "johndoe");
        ReflectionTestUtils.setField(user1, "email", "john.doe@example.com");
        ReflectionTestUtils.setField(user1, "password", "testPassword123");
        ReflectionTestUtils.setField(user1, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(user1, "active", true);
        ReflectionTestUtils.setField(user1, "createdDate", LocalDate.now());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserCountsTest() throws Exception {
        // Given
        when(userService.countTotalUsers()).thenReturn(10L);
        when(userService.countUsersByRole(User.UserRole.DOCTOR)).thenReturn(5L);
        when(userService.countUsersByRole(User.UserRole.NURSE)).thenReturn(5L);

        // When & Then
        mockMvc.perform(get("/api/users/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", is(10)))
                .andExpect(jsonPath("$.doctorCount", is(5)))
                .andExpect(jsonPath("$.nurseCount", is(5)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUserTest() throws Exception {
        // Given
        when(userService.isReservedUsername(anyString())).thenReturn(false);
        when(userService.findUserByUsername(anyString())).thenReturn(Optional.empty());
        
        // Setup a proper response with encoded password
        User responseUser = new User();
        ReflectionTestUtils.setField(responseUser, "id", "1");
        ReflectionTestUtils.setField(responseUser, "firstName", "John");
        ReflectionTestUtils.setField(responseUser, "lastName", "Doe");
        ReflectionTestUtils.setField(responseUser, "username", "johndoe");
        ReflectionTestUtils.setField(responseUser, "email", "john.doe@example.com");
        ReflectionTestUtils.setField(responseUser, "password", "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // Encoded password
        ReflectionTestUtils.setField(responseUser, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(responseUser, "active", true);
        ReflectionTestUtils.setField(responseUser, "createdDate", LocalDate.now());
        
        when(userService.saveUser(any(User.class))).thenReturn(responseUser);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("1")))
                .andExpect(jsonPath("$.username", is("johndoe")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUserReservedUsernameTest() throws Exception {
        // Given
        ReflectionTestUtils.setField(user1, "username", "admin");
        when(userService.isReservedUsername("admin")).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUserUsernameExistsTest() throws Exception {
        // Given
        when(userService.isReservedUsername(anyString())).thenReturn(false);
        when(userService.findUserByUsername("johndoe")).thenReturn(Optional.of(user1));

        // When & Then
        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").exists());
    }
} 