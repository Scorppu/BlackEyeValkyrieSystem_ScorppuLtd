package com.scorppultd.blackeyevalkyriesystem.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

/**
 * REST controller for managing drug-related operations in the system.
 * Provides endpoints for retrieving, searching, and managing drug information.
 */
@RestController
@RequestMapping("/api/drugs")
public class DrugController {

    private final DrugService drugService;
    
    /**
     * Constructor for DrugController.
     * 
     * @param drugService The service that handles drug business logic
     */
    @Autowired
    public DrugController(DrugService drugService) {
        this.drugService = drugService;
    }
    
    /**
     * Retrieves all drugs in the system.
     * 
     * @return ResponseEntity containing a list of all drugs
     */
    @GetMapping
    public ResponseEntity<List<Drug>> getAllDrugs() {
        return ResponseEntity.ok(drugService.getAllDrugs());
    }
    
    /**
     * Retrieves a drug by its ID.
     * 
     * @param id The ID of the drug to retrieve
     * @return ResponseEntity containing the drug if found, or NOT_FOUND status
     */
    @GetMapping("/{id}")
    public ResponseEntity<Drug> getDrugById(@PathVariable String id) {
        Optional<Drug> drug = drugService.getDrugById(id);
        return drug.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Searches for drugs by name.
     * 
     * @param name The name or part of the name to search for
     * @return ResponseEntity containing a list of drugs matching the search criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<Drug>> searchDrugs(@RequestParam String name) {
        return ResponseEntity.ok(drugService.searchDrugsByName(name));
    }
    
    /**
     * Retrieves drugs by template category.
     * 
     * @param category The template category to filter drugs by
     * @return ResponseEntity containing a list of drugs in the specified template category
     */
    @GetMapping("/template/{category}")
    public ResponseEntity<List<Drug>> getDrugsByTemplate(@PathVariable String category) {
        return ResponseEntity.ok(drugService.getDrugsByTemplateCategory(category));
    }
    
    /**
     * Retrieves all drug interactions for a specific drug.
     * 
     * @param id The ID of the drug whose interactions to retrieve
     * @return ResponseEntity containing a list of interacting drug IDs, or NOT_FOUND status if the drug is not found
     */
    @GetMapping("/{id}/interactions")
    public ResponseEntity<List<String>> getDrugInteractions(@PathVariable String id) {
        try {
            List<String> interactionIds = drugService.getAllInteractionsForDrug(id);
            return ResponseEntity.ok(interactionIds);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    /**
     * Retrieves drugs that are available for interaction with a specific drug.
     * Returns all drugs except the specified drug and those that already have interactions with it.
     * 
     * @param id The ID of the drug to find potential interactions for
     * @return ResponseEntity containing a list of drugs available for interaction, 
     *         or NOT_FOUND if the drug is not found, or INTERNAL_SERVER_ERROR if an exception occurs
     */
    @GetMapping("/{id}/available-for-interaction")
    public ResponseEntity<List<Drug>> getDrugsAvailableForInteraction(@PathVariable String id) {
        try {
            // Get the main drug
            Optional<Drug> mainDrugOpt = drugService.getDrugById(id);
            if (!mainDrugOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Drug mainDrug = mainDrugOpt.get();
            List<String> existingInteractions = mainDrug.getInteractingDrugIds() != null 
                ? mainDrug.getInteractingDrugIds() 
                : List.of();
            
            // Get all drugs except the main drug and those that already have interactions
            List<Drug> availableDrugs = drugService.getAllDrugs().stream()
                .filter(drug -> !drug.getId().equals(id) && !existingInteractions.contains(drug.getId()))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(availableDrugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 