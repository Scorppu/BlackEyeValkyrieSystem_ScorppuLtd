package com.scorppultd.blackeyevalkyriesystem.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "drug_interactions")
public class DrugInteraction {

    @Id
    private String id;

    @DBRef
    private Drug drugA;

    @DBRef
    private Drug drugB;

    private String severity;

    private String description;
    
    // For backward compatibility with existing code
    public Drug getPrimaryDrug() {
        return drugA;
    }
    
    public void setPrimaryDrug(Drug drug) {
        this.drugA = drug;
    }
    
    public Drug getInteractingDrug() {
        return drugB;
    }
    
    public void setInteractingDrug(Drug drug) {
        this.drugB = drug;
    }
} 