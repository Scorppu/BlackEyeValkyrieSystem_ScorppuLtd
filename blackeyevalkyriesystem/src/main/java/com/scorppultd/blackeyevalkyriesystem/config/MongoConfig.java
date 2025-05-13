package com.scorppultd.blackeyevalkyriesystem.config;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * MongoDB configuration class that provides custom type conversions.
 * This configuration specifically handles the conversion of String IDs to Drug objects
 * for seamless integration with MongoDB repositories.
 */
@Configuration
public class MongoConfig {

    private final ApplicationContext applicationContext;

    /**
     * Constructs a new MongoConfig with the specified ApplicationContext.
     * 
     * @param applicationContext the Spring application context used for lazily retrieving beans
     */
    public MongoConfig(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    /**
     * Creates and configures custom MongoDB type conversions.
     * Currently registers a converter for String to Drug object conversion.
     * 
     * @return MongoCustomConversions with the registered type converters
     */
    @Bean
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new StringToDrugConverter());
        return new MongoCustomConversions(converters);
    }

    /**
     * Converter implementation that transforms String IDs into Drug objects
     * by looking them up in the DrugRepository.
     * 
     * Designed to avoid circular dependencies by lazily accessing the repository
     * only when conversion is needed.
     */
    private class StringToDrugConverter implements Converter<String, Drug> {
        /**
         * Converts a String ID to a Drug object.
         * 
         * @param id the String ID of the Drug to retrieve
         * @return the Drug object if found, or null if the ID is null/empty or the Drug cannot be found
         */
        @Override
        public Drug convert(String id) {
            if (id == null || id.isEmpty()) {
                return null;
            }
            
            // Get repository lazily to avoid circular dependency
            try {
                DrugRepository repository = applicationContext.getBean(DrugRepository.class);
                Optional<Drug> drug = repository.findById(id);
                return drug.orElse(null);
            } catch (Exception e) {
                // If the repository is not yet available, return null
                // The conversion will be attempted again later when needed
                return null;
            }
        }
    }
} 