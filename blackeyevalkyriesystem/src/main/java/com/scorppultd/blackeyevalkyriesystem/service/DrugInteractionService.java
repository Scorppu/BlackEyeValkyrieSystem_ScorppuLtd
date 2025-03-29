package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import com.scorppultd.blackeyevalkyriesystem.model.CSVImportResult;

import java.util.List;
import java.util.Optional;
import java.io.InputStream;

public interface DrugInteractionService {
    List<DrugInteraction> getAllInteractions();
    List<DrugInteraction> getInteractionsForDrug(String drugId);
    Optional<DrugInteraction> getInteractionById(String id);
    DrugInteraction createInteraction(DrugInteraction interaction);
    DrugInteraction updateInteraction(DrugInteraction interaction);
    void deleteInteraction(String id);
    
    // CSV operations
    List<DrugInteraction> importInteractionsFromCsv(InputStream csvInputStream);
    byte[] generateCsvTemplate();
    List<CSVImportResult> importFromCSV(InputStream csvFileStream);
    String exportToCSV();
} 