package com.scorppultd.blackeyevalkyriesystem.service;

import java.util.List;
import java.util.Optional;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;

public interface DrugService {
    
    // Basic CRUD operations
    List<Drug> getAllDrugs();
    Optional<Drug> getDrugById(String id);
    Drug createDrug(Drug drug);
    Drug updateDrug(Drug drug);
    void deleteDrug(String id);
    
    // Search operations
    List<Drug> searchDrugsByName(String name);
    
    // Template-specific operations
    List<Drug> getDrugsByTemplateCategory(String category);
} 