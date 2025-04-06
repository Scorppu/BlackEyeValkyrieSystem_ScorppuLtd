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

@Configuration
public class MongoConfig {

    private final ApplicationContext applicationContext;

    public MongoConfig(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Bean
    public MongoCustomConversions customConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new StringToDrugConverter());
        return new MongoCustomConversions(converters);
    }

    private class StringToDrugConverter implements Converter<String, Drug> {
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