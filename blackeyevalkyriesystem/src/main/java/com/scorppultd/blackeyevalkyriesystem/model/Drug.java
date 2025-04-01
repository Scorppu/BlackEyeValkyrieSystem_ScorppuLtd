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
    private List<Interaction> interactions;
    
    // Administration details
    private String dosageInstructions;
    private String routeOfAdministration; // oral, intravenous, etc.
    
    // For template categorization
    private String templateCategory; // e.g., "In-House Dispensary", "Pain Meds - non narcotic"

    public static class Interaction {
        private String drugId;
        private Integer severity; // 1-5
        private String description;

        public Interaction() {
        }

        public Interaction(String drugId, Integer severity, String description) {
            this.drugId = drugId;
            this.severity = severity;
            this.description = description;
        }

        public String getDrugId() { return drugId; }
        public void setDrugId(String drugId) { this.drugId = drugId; }
        
        public Integer getSeverity() { return severity; }
        public void setSeverity(Integer severity) { this.severity = severity; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
} 