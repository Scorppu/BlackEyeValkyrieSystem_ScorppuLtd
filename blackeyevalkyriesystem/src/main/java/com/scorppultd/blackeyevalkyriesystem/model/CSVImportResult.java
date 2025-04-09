package com.scorppultd.blackeyevalkyriesystem.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import com.scorppultd.blackeyevalkyriesystem.model.Drug.Interaction;

/**
 * Class to track results of CSV import operations
 */
@Data
@NoArgsConstructor
public class CSVImportResult {
    private long rowNumber;
    private boolean success;
    private String errorMessage;
    private Interaction interaction;
} 