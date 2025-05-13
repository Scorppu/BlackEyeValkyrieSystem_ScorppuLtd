package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.config.MongoTestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Base class for repository tests that handles common setup and teardown.
 * All repository test classes should extend this base class to ensure consistent test environment.
 */
@DataMongoTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.mongodb.embedded.version=4.0.21")
@Import(MongoTestConfig.class)
public abstract class BaseRepositoryTest {

    @Autowired
    private MongoTestConfig mongoTestConfig;

    /**
     * Clean the MongoDB database before each test.
     * This ensures that each test starts with a fresh database state.
     */
    @BeforeEach
    void setUp() {
        mongoTestConfig.cleanDatabase();
    }
} 