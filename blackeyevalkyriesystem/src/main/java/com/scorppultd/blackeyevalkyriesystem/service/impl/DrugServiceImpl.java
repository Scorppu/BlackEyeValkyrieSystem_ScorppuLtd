package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.Drug.Interaction;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

@Service
public class DrugServiceImpl implements DrugService {

    private static final Logger logger = LoggerFactory.getLogger(DrugServiceImpl.class);
    private final DrugRepository drugRepository;
    
    @Autowired
    public DrugServiceImpl(DrugRepository drugRepository) {
        this.drugRepository = drugRepository;
    }
    
    @Override
    public List<Drug> getAllDrugs() {
        return drugRepository.findAll();
    }
    
    @Override
    public Optional<Drug> getDrugById(String id) {
        return drugRepository.findById(id);
    }
    
    @Override
    public Drug createDrug(Drug drug) {
        return drugRepository.save(drug);
    }
    
    @Override
    public Drug updateDrug(Drug drug) {
        return drugRepository.save(drug);
    }
    
    @Override
    public void deleteDrug(String id) {
        drugRepository.deleteById(id);
    }
    
    @Override
    public List<Drug> searchDrugsByName(String name) {
        return drugRepository.findByNameContainingIgnoreCase(name);
    }
    
    @Override
    public boolean existsByName(String name) {
        return drugRepository.existsByNameIgnoreCase(name);
    }
    
    @Override
    public List<Drug> getDrugsByTemplateCategory(String category) {
        return drugRepository.findByTemplateCategory(category);
    }
    
    @Override
    public List<Drug> importDrugsFromCsv(InputStream csvInputStream) {
        List<Drug> importedDrugs = new ArrayList<>();
        List<String> skippedDrugs = new ArrayList<>();
        
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(csvInputStream, "UTF-8"));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build())) {
            
            for (CSVRecord csvRecord : csvParser) {
                String drugName = csvRecord.get("name");
                
                // Skip existing drugs
                if (existsByName(drugName)) {
                    skippedDrugs.add(drugName);
                    continue;
                }
                
                Drug drug = new Drug();
                drug.setName(drugName);
                drug.setTemplateCategory(csvRecord.get("templateCategory"));
                drug.setRouteOfAdministration(csvRecord.get("routeOfAdministration"));
                drug.setDosageInstructions(csvRecord.get("dosageInstructions"));
                
                // Optional fields
                if (csvRecord.isMapped("contraindications")) {
                    drug.setContraindications(csvRecord.get("contraindications"));
                }
                if (csvRecord.isMapped("sideEffects")) {
                    drug.setSideEffects(csvRecord.get("sideEffects"));
                }
                
                // Save the drug
                Drug savedDrug = drugRepository.save(drug);
                importedDrugs.add(savedDrug);
            }
            
            // If any drugs were skipped, throw an exception with details
            if (!skippedDrugs.isEmpty()) {
                throw new RuntimeException("Skipped " + skippedDrugs.size() + " drugs that already exist: " + 
                                          String.join(", ", skippedDrugs));
            }
            
            return importedDrugs;
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage(), e);
        }
    }
    
    @Override
    public byte[] generateCsvTemplate() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), CSVFormat.DEFAULT
                    .builder()
                    .setHeader("name", "templateCategory", "routeOfAdministration", 
                              "dosageInstructions", "contraindications", "sideEffects")
                    .build())) {
            
            // Template with example data
            csvPrinter.printRecord(
                "Example Drug Name",
                "In-House Dispensary",
                "Oral",
                "Take 1 tablet twice daily with food",
                "Pregnancy, liver disease",
                "Nausea, headache, dizziness"
            );
            
            csvPrinter.flush();
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate CSV template: " + e.getMessage(), e);
        }
    }
    
    // Interaction management methods
    
    @Override
    public Drug addInteractionToDrug(String drugId, Interaction interaction) {
        return drugRepository.findById(drugId)
            .map(drug -> {
                if (drug.getInteractions() == null) {
                    System.out.println("Drug " + drugId + " has no interactions yet, initializing list");
                    drug.setInteractions(new ArrayList<>());
                }
                
                // Check if interaction with same drug already exists
                boolean exists = drug.getInteractions().stream()
                    .anyMatch(i -> i.getDrugId().equals(interaction.getDrugId()));
                
                if (!exists) {
                    System.out.println("Adding new interaction to drug " + drugId + " with target drug " + interaction.getDrugId());
                    drug.getInteractions().add(interaction);
                    return drugRepository.save(drug);
                } else {
                    // Update existing interaction
                    System.out.println("Updating existing interaction for drug " + drugId + " with target drug " + interaction.getDrugId());
                    drug.getInteractions().stream()
                        .filter(i -> i.getDrugId().equals(interaction.getDrugId()))
                        .findFirst()
                        .ifPresent(i -> {
                            i.setSeverity(interaction.getSeverity());
                            i.setDescription(interaction.getDescription());
                        });
                    return drugRepository.save(drug);
                }
            })
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public Drug removeInteractionFromDrug(String drugId, String interactingDrugId) {
        return drugRepository.findById(drugId)
            .map(drug -> {
                if (drug.getInteractions() != null) {
                    drug.setInteractions(
                        drug.getInteractions().stream()
                            .filter(i -> !i.getDrugId().equals(interactingDrugId))
                            .collect(Collectors.toList())
                    );
                    return drugRepository.save(drug);
                }
                return drug;
            })
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public List<Interaction> getAllInteractionsForDrug(String drugId) {
        return drugRepository.findById(drugId)
            .map(drug -> drug.getInteractions() != null ? 
                 (List<Interaction>)drug.getInteractions() : new ArrayList<Interaction>())
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public List<Interaction> getAllInteractions() {
        List<Interaction> allInteractions = new ArrayList<>();
        List<Drug> allDrugs = drugRepository.findAll();
        
        for (Drug drug : allDrugs) {
            if (drug.getInteractions() != null && !drug.getInteractions().isEmpty()) {
                // Add the drug's ID to each interaction for context
                for (Interaction interaction : drug.getInteractions()) {
                    // Create a copy of the interaction
                    Interaction enrichedInteraction = new Interaction(
                        interaction.getDrugId(),
                        interaction.getSeverity(),
                        interaction.getDescription()
                    );
                    allInteractions.add(enrichedInteraction);
                }
            }
        }
        
        return allInteractions;
    }
} 