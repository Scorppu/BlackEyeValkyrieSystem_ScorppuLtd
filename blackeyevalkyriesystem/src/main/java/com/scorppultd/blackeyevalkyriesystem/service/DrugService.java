package com.scorppultd.blackeyevalkyriesystem.service;

import java.util.List;
import java.util.Optional;
import java.io.InputStream;

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
    boolean existsByName(String name);
    
    // Template-specific operations
    List<Drug> getDrugsByTemplateCategory(String category);
    
    // CSV operations
    List<Drug> importDrugsFromCsv(InputStream csvInputStream);
    byte[] generateCsvTemplate();
    
    // Interaction management operations
    Drug addInteractionToDrug(String drugId, String interactingDrugId);
    Drug removeInteractionFromDrug(String drugId, String interactingDrugId);
    List<String> getAllInteractionsForDrug(String drugId);
    List<String> getAllInteractions();
} 