package com.scorppultd.blackeyevalkyriesystem.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Test configuration class for Spring Boot tests.
 * This provides test-specific beans and imports other test configurations.
 */
@TestConfiguration
@Import(MongoTestConfig.class)
public class TestConfig {

    /**
     * Provides a PasswordEncoder bean for tests.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
} 