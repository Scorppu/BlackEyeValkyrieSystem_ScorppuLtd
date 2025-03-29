package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DrugInteractionRepository extends MongoRepository<DrugInteraction, String> {
    List<DrugInteraction> findByDrugA(Drug drug);
    List<DrugInteraction> findByDrugB(Drug drug);
    
    // Keeping old methods for compatibility
    List<DrugInteraction> findByPrimaryDrug(Drug drug);
    List<DrugInteraction> findByInteractingDrug(Drug drug);
} 