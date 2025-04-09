package com.scorppultd.blackeyevalkyriesystem.repository;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.model.DrugInteraction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrugInteractionRepository extends MongoRepository<DrugInteraction, String> {
    // Find interactions where a drug is either drugA or drugB
    List<DrugInteraction> findByDrugAOrDrugB(Drug drugA, Drug drugB);
    
    // Find a specific interaction between two drugs
    Optional<DrugInteraction> findByDrugAAndDrugB(Drug drugA, Drug drugB);
} 