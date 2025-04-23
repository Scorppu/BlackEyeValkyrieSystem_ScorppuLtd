package com.scorppultd.blackeyevalkyriesystem.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scorppultd.blackeyevalkyriesystem.config.TestConfig;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestConfig.class)
public class UserApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @Autowired
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
        ReflectionTestUtils.setField(user1, "password", "testPassword123");
        ReflectionTestUtils.setField(user1, "role", User.UserRole.DOCTOR);
        ReflectionTestUtils.setField(user1, "active", true);
        ReflectionTestUtils.setField(user1, "createdDate", LocalDate.now());

        user2 = new User();
        ReflectionTestUtils.setField(user2, "id", "2");
        ReflectionTestUtils.setField(user2, "firstName", "Jane");
        ReflectionTestUtils.setField(user2, "lastName", "Smith");
        ReflectionTestUtils.setField(user2, "username", "janesmith");
        ReflectionTestUtils.setField(user2, "email", "jane.smith@example.com");
        ReflectionTestUtils.setField(user2, "password", "testPassword456");
        ReflectionTestUtils.setField(user2, "role", User.UserRole.NURSE);
        ReflectionTestUtils.setField(user2, "active", true);
        ReflectionTestUtils.setField(user2, "createdDate", LocalDate.now());

        // Set up mock repository behavior
        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));
        when(userRepository.count()).thenReturn(2L);
        when(userRepository.countByRole(User.UserRole.DOCTOR)).thenReturn(1L);
        when(userRepository.countByRole(User.UserRole.NURSE)).thenReturn(1L);
        when(userRepository.findById("1")).thenReturn(Optional.of(user1));
        when(userRepository.findById("2")).thenReturn(Optional.of(user2));
        when(userRepository.findByUsername("johndoe")).thenReturn(Optional.of(user1));
        when(userRepository.findByUsername("janesmith")).thenReturn(Optional.of(user2));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserCountsShouldReturnCounts() throws Exception {
        mockMvc.perform(get("/api/users/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", is(2)))
                .andExpect(jsonPath("$.doctorCount", is(1)))
                .andExpect(jsonPath("$.nurseCount", is(1)));
    }

} 