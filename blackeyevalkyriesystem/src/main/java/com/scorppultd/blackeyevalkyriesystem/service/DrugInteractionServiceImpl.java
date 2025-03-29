package com.scorppultd.blackeyevalkyriesystem.service;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import com.scorppultd.blackeyevalkyriesystem.model.CSVImportResult;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugInteractionRepository;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Set;
import java.util.HashSet;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DrugInteractionServiceImpl implements DrugInteractionService {

    private final DrugInteractionRepository drugInteractionRepository;
    private final DrugRepository drugRepository;
    private static final Logger logger = LoggerFactory.getLogger(DrugInteractionServiceImpl.class);
    private static final Set<String> VALID_SEVERITIES = new HashSet<>(Arrays.asList("MILD", "MODERATE", "SEVERE"));

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
                .map(drug -> {
                    // Find interactions where the drug is in either position
                    List<DrugInteraction> interactions = new ArrayList<>();
                    interactions.addAll(drugInteractionRepository.findByDrugA(drug));
                    interactions.addAll(drugInteractionRepository.findByDrugB(drug));
                    return interactions;
                })
                .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }

    @Override
    public Optional<DrugInteraction> getInteractionById(String id) {
        return drugInteractionRepository.findById(id);
    }

    @Override
    public DrugInteraction createInteraction(DrugInteraction interaction) {
        return drugInteractionRepository.save(interaction);
    }

    @Override
    public DrugInteraction updateInteraction(DrugInteraction interaction) {
        return drugInteractionRepository.save(interaction);
    }

    @Override
    public void deleteInteraction(String id) {
        drugInteractionRepository.deleteById(id);
    }
    
    @Override
    public List<DrugInteraction> importInteractionsFromCsv(InputStream csvInputStream) {
        List<DrugInteraction> importedInteractions = new ArrayList<>();
        List<String> skippedRows = new ArrayList<>();
        
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(csvInputStream, "UTF-8"));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build())) {
            
            for (CSVRecord csvRecord : csvParser) {
                try {
                    String primaryDrugId = csvRecord.get("drugAId");
                    String interactingDrugId = csvRecord.get("drugBId");
                    String severity = csvRecord.get("severity");
                    String description = csvRecord.get("description");
                    
                    Optional<Drug> primaryDrugOpt = drugRepository.findById(primaryDrugId);
                    Optional<Drug> interactingDrugOpt = drugRepository.findById(interactingDrugId);
                    
                    if (primaryDrugOpt.isPresent() && interactingDrugOpt.isPresent()) {
                        DrugInteraction interaction = new DrugInteraction();
                        interaction.setPrimaryDrug(primaryDrugOpt.get());
                        interaction.setInteractingDrug(interactingDrugOpt.get());
                        interaction.setSeverity(severity);
                        interaction.setDescription(description);
                        
                        // Save the interaction
                        DrugInteraction savedInteraction = drugInteractionRepository.save(interaction);
                        importedInteractions.add(savedInteraction);
                    } else {
                        String errorReason = "";
                        if (primaryDrugOpt.isEmpty()) {
                            errorReason += "First drug ID " + primaryDrugId + " not found";
                        }
                        if (interactingDrugOpt.isEmpty()) {
                            errorReason += (errorReason.isEmpty() ? "" : ", ") + "Second drug ID " + interactingDrugId + " not found";
                        }
                        
                        skippedRows.add("Row " + csvRecord.getRecordNumber() + ": " + errorReason);
                    }
                } catch (Exception e) {
                    skippedRows.add("Row " + csvRecord.getRecordNumber() + ": " + e.getMessage());
                }
            }
            
            // If any rows were skipped, throw an exception with details
            if (!skippedRows.isEmpty()) {
                throw new RuntimeException("Skipped " + skippedRows.size() + " interactions due to errors: " + String.join("; ", skippedRows));
            }
            
            return importedInteractions;
        } catch (IOException e) {
            logger.error("Failed to parse CSV file: ", e);
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
    }
    
    // Import method with detailed results
    public List<CSVImportResult> importFromCSV(InputStream csvFileStream) {
        List<CSVImportResult> results = new ArrayList<>();
        
        try (
            BufferedReader reader = new BufferedReader(new InputStreamReader(csvFileStream));
            CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim())
        ) {
            for (CSVRecord csvRecord : csvParser) {
                CSVImportResult result = new CSVImportResult();
                result.setRowNumber(csvRecord.getRecordNumber());
                
                try {
                    // Extract data
                    String drugAId = csvRecord.get("drugAId"); 
                    String drugBId = csvRecord.get("drugBId");
                    String severity = csvRecord.get("severity");
                    String description = csvRecord.get("description");
                    
                    // Validate severity
                    if (!VALID_SEVERITIES.contains(severity.toUpperCase())) {
                        throw new IllegalArgumentException("Invalid severity: " + severity);
                    }
                    
                    // Find drugs
                    Optional<Drug> drugAOpt = drugRepository.findById(drugAId);
                    Optional<Drug> drugBOpt = drugRepository.findById(drugBId);
                    
                    if (drugAOpt.isPresent() && drugBOpt.isPresent()) {
                        DrugInteraction interaction = new DrugInteraction();
                        interaction.setPrimaryDrug(drugAOpt.get());
                        interaction.setInteractingDrug(drugBOpt.get());
                        interaction.setSeverity(severity.toUpperCase());
                        interaction.setDescription(description);
                        
                        // Save interaction
                        DrugInteraction savedInteraction = drugInteractionRepository.save(interaction);
                        
                        result.setSuccess(true);
                        result.setInteraction(savedInteraction);
                    } else {
                        String errorReason = "";
                        if (drugAOpt.isEmpty()) {
                            errorReason += "First drug ID " + drugAId + " not found";
                        }
                        if (drugBOpt.isEmpty()) {
                            errorReason += (errorReason.isEmpty() ? "" : ", ") + "Second drug ID " + drugBId + " not found";
                        }
                        throw new IllegalArgumentException(errorReason);
                    }
                } catch (Exception e) {
                    result.setSuccess(false);
                    result.setErrorMessage(e.getMessage());
                }
                
                results.add(result);
            }
        } catch (IOException e) {
            CSVImportResult errorResult = new CSVImportResult();
            errorResult.setSuccess(false);
            errorResult.setRowNumber(0);
            errorResult.setErrorMessage("Failed to parse CSV file: " + e.getMessage());
            results.add(errorResult);
        }
        
        return results;
    }

    // Export to CSV
    public String exportToCSV() {
        StringWriter stringWriter = new StringWriter();
        CSVPrinter csvPrinter = null;
        
        try {
            csvPrinter = new CSVPrinter(stringWriter, CSVFormat.DEFAULT
                    .withHeader("drugAId", "drugBId", "severity", "description"));
            
            for (DrugInteraction interaction : getAllInteractions()) {
                csvPrinter.printRecord(
                    interaction.getPrimaryDrug().getId(),
                    interaction.getInteractingDrug().getId(),
                    interaction.getSeverity(),
                    interaction.getDescription()
                );
            }
        } catch (IOException e) {
            return "Error generating CSV: " + e.getMessage();
        } finally {
            if (csvPrinter != null) {
                try {
                    csvPrinter.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
        }
        
        return stringWriter.toString();
    }
    
    @Override
    public byte[] generateCsvTemplate() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), 
                CSVFormat.DEFAULT.builder()
                .setHeader("drugAId", "drugBId", "severity", "description")
                .build())) {
            
            // Add an example row
            csvPrinter.printRecord(
                "drug123", 
                "drug456", 
                "MODERATE", 
                "These drugs may interact, monitor closely"
            );
            
            csvPrinter.flush();
            return out.toByteArray();
        } catch (IOException e) {
            logger.error("Failed to generate CSV template: ", e);
            throw new RuntimeException("Failed to generate CSV template: " + e.getMessage());
        }
    }
} 