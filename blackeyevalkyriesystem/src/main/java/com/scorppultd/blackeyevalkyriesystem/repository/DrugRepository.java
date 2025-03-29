package com.scorppultd.blackeyevalkyriesystem.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;

@Repository
public interface DrugRepository extends MongoRepository<Drug, String> {
    
    // Find drugs by name (case insensitive, partial match)
    List<Drug> findByNameContainingIgnoreCase(String name);
    
    // Find drugs by route of administration
    List<Drug> findByRouteOfAdministration(String route);
    
    // Custom query for finding drugs by template category
    List<Drug> findByTemplateCategory(String category);
} 