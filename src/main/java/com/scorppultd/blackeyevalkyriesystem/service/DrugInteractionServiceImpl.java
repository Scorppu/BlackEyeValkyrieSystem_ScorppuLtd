package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugInteractionRepository;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DrugInteractionServiceImpl implements DrugInteractionService {

    private final DrugInteractionRepository drugInteractionRepository;
    private final DrugRepository drugRepository;

    @Autowired
    public DrugInteractionServiceImpl(DrugInteractionRepository drugInteractionRepository, 
                                     DrugRepository drugRepository) {
        this.drugInteractionRepository = drugInteractionRepository;
        this.drugRepository = drugRepository;
    }

    @Override
    public List<DrugInteraction> getAllInteractions() {
        return drugInteractionRepository.findAll();
    }

    @Override
    public List<DrugInteraction> getInteractionsForDrug(String drugId) {
        return drugRepository.findById(drugId)
                .map(drug -> drugInteractionRepository.findByDrugAOrDrugB(drug, drug))
                .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }

    @Override
    public Optional<DrugInteraction> getInteractionById(String id) {
        return drugInteractionRepository.findById(id);
    }
    
    @Override
    public DrugInteraction saveInteraction(Drug drugA, Drug drugB, String severity, String description) {
        // Ensure consistent ordering of drugs (lexicographically by ID)
        if (drugA.getId().compareTo(drugB.getId()) > 0) {
            Drug temp = drugA;
            drugA = drugB;
            drugB = temp;
        }
        
        // Check if interaction already exists
        Optional<DrugInteraction> existingInteraction = drugInteractionRepository.findByDrugAAndDrugB(drugA, drugB);
        
        if (existingInteraction.isPresent()) {
            // Update existing interaction
            DrugInteraction interaction = existingInteraction.get();
            interaction.setSeverity(severity);
            interaction.setDescription(description);
            return drugInteractionRepository.save(interaction);
        } else {
            // Create new interaction
            DrugInteraction interaction = new DrugInteraction();
            interaction.setDrugA(drugA);
            interaction.setDrugB(drugB);
            interaction.setSeverity(severity);
            interaction.setDescription(description);
            return drugInteractionRepository.save(interaction);
        }
    }

    @Override
    public DrugInteraction createInteraction(DrugInteraction interaction) {
        // Enforce the canonical ordering rule
        Drug drugA = interaction.getDrugA();
        Drug drugB = interaction.getDrugB();
        
        // If provided in wrong order, swap them
        if (drugA.getId().compareTo(drugB.getId()) > 0) {
            interaction.setDrugA(drugB);
            interaction.setDrugB(drugA);
        }
        
        // Check for existing interaction to avoid duplicates
        Optional<DrugInteraction> existingInteraction = 
            drugInteractionRepository.findByDrugAAndDrugB(interaction.getDrugA(), interaction.getDrugB());
        
        if (existingInteraction.isPresent()) {
            // Update the existing interaction instead of creating a new one
            DrugInteraction existing = existingInteraction.get();
            existing.setSeverity(interaction.getSeverity());
            existing.setDescription(interaction.getDescription());
            return drugInteractionRepository.save(existing);
        }
        
        return drugInteractionRepository.save(interaction);
    }

    @Override
    public DrugInteraction updateInteraction(DrugInteraction interaction) {
        // Similar ordering check as in createInteraction
        Drug drugA = interaction.getDrugA();
        Drug drugB = interaction.getDrugB();
        
        if (drugA.getId().compareTo(drugB.getId()) > 0) {
            interaction.setDrugA(drugB);
            interaction.setDrugB(drugA);
        }
        
        return drugInteractionRepository.save(interaction);
    }

    @Override
    public void deleteInteraction(String id) {
        drugInteractionRepository.deleteById(id);
    }
} 