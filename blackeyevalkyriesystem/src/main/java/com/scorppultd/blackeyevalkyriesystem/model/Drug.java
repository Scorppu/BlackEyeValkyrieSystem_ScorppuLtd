package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "drugs")
public class Drug {
    
    @Id
    private String id;
    
    private String name;
    
    // Additional pharmaceutical information
    private String contraindications;
    private String sideEffects;
    private String interactions;
    
    // Administration details
    private String dosageInstructions;
    private String routeOfAdministration; // oral, intravenous, etc.
} 