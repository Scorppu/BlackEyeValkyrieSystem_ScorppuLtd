package com.scorppultd.blackeyevalkyriesystem.config;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.repository.LicenseKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * Initializes sample license keys on startup for testing
 */
@Configuration
public class LicenseKeyInitializer {

    /**
     * Creates sample license keys if none exist
     */
    @Bean
    @Profile("!prod") // Only run in non-production environments
    public CommandLineRunner initLicenseKeys(LicenseKeyRepository licenseKeyRepository) {
        return args -> {
            // Check if we already have license keys
            if (licenseKeyRepository.count() == 0) {
                // Create some sample license keys
                List<LicenseKey> sampleKeys = Arrays.asList(
                    LicenseKey.builder()
                        .key("AAAA-BBBB-CCCC-DDDD")
                        .issuedOn(LocalDate.now())
                        .expiresOn(LocalDate.now().plusYears(1))
                        .isActive(true)
                        .build(),
                    LicenseKey.builder()
                        .key("TEST-1234-ABCD-5678")
                        .issuedOn(LocalDate.now())
                        .expiresOn(LocalDate.now().plusYears(1))
                        .isActive(true)
                        .build(),
                    LicenseKey.builder()
                        .key("DEMO-9876-WXYZ-5432")
                        .issuedOn(LocalDate.now())
                        .expiresOn(LocalDate.now().plusMonths(1))
                        .isActive(true)
                        .build()
                );
                
                // Save the sample keys
                licenseKeyRepository.saveAll(sampleKeys);
                
                System.out.println("Initialized " + sampleKeys.size() + " sample license keys");
            }
        };
    }
} 