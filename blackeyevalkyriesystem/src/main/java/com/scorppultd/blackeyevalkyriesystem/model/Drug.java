package com.scorppultd.blackeyevalkyriesystem.model;

import java.util.List;

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
    private List<String> interactingDrugIds;  // Storing just the IDs of interacting drugs
    
    // Administration details
    private String dosageInstructions;
    private String routeOfAdministration; // oral, intravenous, etc.
    
    // For template categorization
    private String templateCategory; // e.g., "In-House Dispensary", "Pain Meds - non narcotic"
} 