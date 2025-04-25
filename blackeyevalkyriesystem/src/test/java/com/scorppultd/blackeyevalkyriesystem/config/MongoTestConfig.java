package com.scorppultd.blackeyevalkyriesystem.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * Configuration class for MongoDB test setup.
 * Provides utility methods for test database cleanup.
 */
@Configuration
public class MongoTestConfig {

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    /**
     * Drops all collections in the test database.
     * This method should be called before each test to ensure a clean state.
     */
    public void cleanDatabase() {
        // Skip if MongoTemplate is not available (e.g., in WebMvcTest without MongoDB)
        if (mongoTemplate == null) {
            return;
        }
        
        // Get all collection names except system collections
        mongoTemplate.getCollectionNames().stream()
                .filter(collectionName -> !collectionName.startsWith("system."))
                .forEach(collectionName -> mongoTemplate.dropCollection(collectionName));
    }
} 