package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;

import java.util.List;
import java.util.Optional;

public interface DrugInteractionService {
    List<DrugInteraction> getAllInteractions();
    List<DrugInteraction> getInteractionsForDrug(String drugId);
    Optional<DrugInteraction> getInteractionById(String id);
    
    // New method for creating interaction with canonical ordering
    DrugInteraction saveInteraction(Drug drugA, Drug drugB, String severity, String description);
    
    // Original methods still needed for compatibility
    DrugInteraction createInteraction(DrugInteraction interaction);
    DrugInteraction updateInteraction(DrugInteraction interaction);
    void deleteInteraction(String id);
} 