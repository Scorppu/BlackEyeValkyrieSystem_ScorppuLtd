package com.scorppultd.blackeyevalkyriesystem.config;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.repository.LicenseKeyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;

/**
 * Initializes sample license keys for development
 */
@Configuration
public class LicenseKeyInitializer {

    private static final Logger logger = LoggerFactory.getLogger(LicenseKeyInitializer.class);

    /**
     * CommandLineRunner bean to initialize sample license keys
     */
    @Bean
    @Profile("dev")
    public CommandLineRunner initializeLicenseKeys(LicenseKeyRepository licenseKeyRepository) {
        return args -> {
            // Check if there are already license keys
            if (licenseKeyRepository.count() > 0) {
                logger.info("License keys already exist, skipping initialization");
                return;
            }
            
            logger.info("Initializing sample license keys");
            
            // Create a license key that never expires
            LicenseKey adminKey = LicenseKey.builder()
                    .key("AAAA-BBBB-CCCC-DDDD")
                    .issuedOn(LocalDate.now())
                    .expiresOn(LocalDate.now().plusDays(365))
                    .status(LicenseKey.Status.ACTIVE)
                    .role(LicenseKey.Role.ADMIN)
                    .build();
            licenseKeyRepository.save(adminKey);
            
            // Create a license key that expires in 30 days
            LicenseKey doctorKey = LicenseKey.builder()
                    .key("TEST-1234-ABCD-5678")
                    .issuedOn(LocalDate.now())
                    .expiresOn(LocalDate.now().plusDays(30))
                    .status(LicenseKey.Status.ACTIVE)
                    .role(LicenseKey.Role.DOCTOR)
                    .build();
            licenseKeyRepository.save(doctorKey);
            
            // Create a license key that expires in 90 days
            LicenseKey nurseKey = LicenseKey.builder()
                    .key("DEMO-9876-WXYZ-5432")
                    .issuedOn(LocalDate.now())
                    .expiresOn(LocalDate.now().plusDays(90))
                    .status(LicenseKey.Status.ACTIVE)
                    .role(LicenseKey.Role.NURSE)
                    .build();
            licenseKeyRepository.save(nurseKey);
            
            logger.info("Sample license keys initialized successfully");
        };
    }
} 