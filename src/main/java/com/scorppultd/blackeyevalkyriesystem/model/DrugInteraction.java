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
    private Drug drugA; // Always the drug with lexicographically smaller ID

    @DBRef
    private Drug drugB; // Always the drug with lexicographically larger ID

    private String severity;

    private String description;
} 