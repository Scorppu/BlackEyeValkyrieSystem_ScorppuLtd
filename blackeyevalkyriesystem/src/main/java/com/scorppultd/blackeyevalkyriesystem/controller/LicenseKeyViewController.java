package com.scorppultd.blackeyevalkyriesystem.controller;

import com.scorppultd.blackeyevalkyriesystem.model.LicenseKey;
import com.scorppultd.blackeyevalkyriesystem.service.LicenseKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Controller for license key management views (admin only)
 */
@Controller
@RequestMapping("/admin/licenses")
public class LicenseKeyViewController {

    private final LicenseKeyService licenseKeyService;

    @Autowired
    public LicenseKeyViewController(LicenseKeyService licenseKeyService) {
        this.licenseKeyService = licenseKeyService;
    }

    /**
     * View all license keys
     * 
     * @param model The model
     * @return The license keys view
     */
    @GetMapping
    public String viewLicenseKeys(Model model) {
        List<LicenseKey> licenseKeys = licenseKeyService.getAllLicenseKeys();
        model.addAttribute("licenseKeys", licenseKeys);
        return "license-keys";  // This will map to a license-keys.html template
    }

    /**
     * View for generating new license keys
     * 
     * @param model The model
     * @return The generate license key view
     */
    @GetMapping("/generate")
    public String generateLicenseKeyView(Model model) {
        return "generate-license-key";  // This will map to a generate-license-key.html template
    }
} 