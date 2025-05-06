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

@RestController
@RequestMapping("/api/drugs")
public class DrugController {

    private final DrugService drugService;
    
    @Autowired
    public DrugController(DrugService drugService) {
        this.drugService = drugService;
    }
    
    @GetMapping
    public ResponseEntity<List<Drug>> getAllDrugs() {
        return ResponseEntity.ok(drugService.getAllDrugs());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Drug> getDrugById(@PathVariable String id) {
        Optional<Drug> drug = drugService.getDrugById(id);
        return drug.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Drug>> searchDrugs(@RequestParam String name) {
        return ResponseEntity.ok(drugService.searchDrugsByName(name));
    }
    
    @GetMapping("/template/{category}")
    public ResponseEntity<List<Drug>> getDrugsByTemplate(@PathVariable String category) {
        return ResponseEntity.ok(drugService.getDrugsByTemplateCategory(category));
    }
    
    @GetMapping("/{id}/interactions")
    public ResponseEntity<List<String>> getDrugInteractions(@PathVariable String id) {
        try {
            List<String> interactionIds = drugService.getAllInteractionsForDrug(id);
            return ResponseEntity.ok(interactionIds);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
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