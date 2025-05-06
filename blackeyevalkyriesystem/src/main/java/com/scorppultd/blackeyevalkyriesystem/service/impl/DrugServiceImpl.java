package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

@Service
public class DrugServiceImpl implements DrugService {

    private static final Logger logger = LoggerFactory.getLogger(DrugServiceImpl.class);
    private final DrugRepository drugRepository;
    
    @Autowired
    public DrugServiceImpl(DrugRepository drugRepository) {
        this.drugRepository = drugRepository;
    }
    
    @Override
    public List<Drug> getAllDrugs() {
        return drugRepository.findAll();
    }
    
    @Override
    public Optional<Drug> getDrugById(String id) {
        return drugRepository.findById(id);
    }
    
    @Override
    public Drug createDrug(Drug drug) {
        return drugRepository.save(drug);
    }
    
    @Override
    public Drug updateDrug(Drug drug) {
        return drugRepository.save(drug);
    }
    
    @Override
    public void deleteDrug(String id) {
        drugRepository.deleteById(id);
    }
    
    @Override
    public List<Drug> searchDrugsByName(String name) {
        return drugRepository.findByNameContainingIgnoreCase(name);
    }
    
    @Override
    public boolean existsByName(String name) {
        return drugRepository.existsByNameIgnoreCase(name);
    }
    
    @Override
    public List<Drug> getDrugsByTemplateCategory(String category) {
        return drugRepository.findByTemplateCategory(category);
    }
    
    @Override
    public List<Drug> importDrugsFromCsv(InputStream csvInputStream) {
        List<Drug> importedDrugs = new ArrayList<>();
        List<String> skippedDrugs = new ArrayList<>();
        
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(csvInputStream, "UTF-8"));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build())) {
            
            for (CSVRecord csvRecord : csvParser) {
                String drugName = csvRecord.get("name");
                
                // Skip existing drugs
                if (existsByName(drugName)) {
                    skippedDrugs.add(drugName);
                    continue;
                }
                
                Drug drug = new Drug();
                drug.setName(drugName);
                drug.setTemplateCategory(csvRecord.get("templateCategory"));
                drug.setRouteOfAdministration(csvRecord.get("routeOfAdministration"));
                drug.setDosageInstructions(csvRecord.get("dosageInstructions"));
                
                // Optional fields
                if (csvRecord.isMapped("contraindications")) {
                    drug.setContraindications(csvRecord.get("contraindications"));
                }
                if (csvRecord.isMapped("sideEffects")) {
                    drug.setSideEffects(csvRecord.get("sideEffects"));
                }
                
                // Save the drug
                Drug savedDrug = drugRepository.save(drug);
                importedDrugs.add(savedDrug);
            }
            
            // If any drugs were skipped, throw an exception with details
            if (!skippedDrugs.isEmpty()) {
                throw new RuntimeException("Skipped " + skippedDrugs.size() + " drugs that already exist: " + 
                                          String.join(", ", skippedDrugs));
            }
            
            return importedDrugs;
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage(), e);
        }
    }
    
    @Override
    public byte[] generateCsvTemplate() {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVPrinter csvPrinter = new CSVPrinter(new OutputStreamWriter(out), CSVFormat.DEFAULT
                    .builder()
                    .setHeader("name", "templateCategory", "routeOfAdministration", 
                              "dosageInstructions", "contraindications", "sideEffects", "interactions")
                    .build())) {
            
            // Add all drug examples
            csvPrinter.printRecord(
                "Acetaminophen (Tylenol)",
                "Pain Meds - non narcotic",
                "Oral",
                "325-650 mg every 4-6 hours as needed (max 3000 mg/day)",
                "Severe liver disease; alcohol use",
                "Liver damage with overdose; nausea",
                "Alcohol; warfarin; isoniazid"
            );
            
            csvPrinter.printRecord(
                "Ibuprofen (Advil)",
                "Pain Meds - non narcotic",
                "Oral",
                "200-400 mg every 4-6 hours as needed (max 1200 mg/day)",
                "Peptic ulcer disease; renal impairment; heart failure",
                "Gastrointestinal bleeding; renal impairment; increased blood pressure",
                "ACE inhibitors; anticoagulants; aspirin; diuretics"
            );
            
            csvPrinter.printRecord(
                "Amoxicillin",
                "Antibiotics",
                "Oral",
                "250-500 mg every 8 hours for 7-10 days",
                "Penicillin allergy; mononucleosis",
                "Diarrhea; rash; nausea",
                "Allopurinol; oral contraceptives; probenecid"
            );
            
            csvPrinter.printRecord(
                "Azithromycin",
                "Antibiotics",
                "Oral",
                "500 mg on day 1 then 250 mg daily for 4 days",
                "QT prolongation; myasthenia gravis; liver disease",
                "Diarrhea; abdominal pain; nausea",
                "Statins; warfarin; digoxin; antacids"
            );
            
            csvPrinter.printRecord(
                "Lisinopril",
                "Cardiovascular",
                "Oral",
                "5-40 mg once daily",
                "Pregnancy; angioedema history; bilateral renal artery stenosis",
                "Dry cough; dizziness; hyperkalemia",
                "NSAIDs; potassium supplements; lithium"
            );
            
            csvPrinter.printRecord(
                "Atorvastatin (Lipitor)",
                "Cardiovascular",
                "Oral",
                "10-80 mg once daily at bedtime",
                "Active liver disease; pregnancy; breastfeeding",
                "Muscle pain; liver enzyme elevation; headache",
                "Grapefruit juice; macrolide antibiotics; cyclosporine; gemfibrozil"
            );
            
            csvPrinter.printRecord(
                "Albuterol",
                "Respiratory",
                "Inhalation",
                "1-2 puffs every 4-6 hours as needed",
                "Hypersensitivity to albuterol",
                "Tremor; tachycardia; headache",
                "Beta-blockers; loop diuretics; MAOIs"
            );
            
            csvPrinter.printRecord(
                "Fluticasone (Flonase)",
                "Respiratory",
                "Inhalation",
                "1-2 sprays in each nostril once daily",
                "Untreated fungal infection; recent nasal surgery",
                "Nasal irritation; headache; epistaxis",
                "Ritonavir; ketoconazole; other CYP3A4 inhibitors"
            );
            
            csvPrinter.printRecord(
                "Omeprazole (Prilosec)",
                "Gastrointestinal",
                "Oral",
                "20-40 mg once daily before breakfast",
                "Hypersensitivity to PPIs; rilpivirine therapy",
                "Headache; abdominal pain; diarrhea",
                "Clopidogrel; diazepam; warfarin; phenytoin"
            );
            
            csvPrinter.printRecord(
                "Metformin",
                "Antidiabetic",
                "Oral",
                "500-1000 mg twice daily with meals",
                "Kidney disease; liver disease; heart failure; alcohol abuse",
                "Diarrhea; nausea; lactic acidosis",
                "Iodinated contrast media; cimetidine; furosemide; nifedipine"
            );
            
            csvPrinter.printRecord(
                "Sertraline (Zoloft)",
                "CNS Agents",
                "Oral",
                "50-200 mg once daily",
                "MAOIs use within 14 days; pimozide therapy",
                "Nausea; insomnia; diarrhea; sexual dysfunction",
                "MAOIs; pimozide; other SSRIs; tramadol; warfarin"
            );
            
            csvPrinter.printRecord(
                "Lorazepam (Ativan)",
                "CNS Agents",
                "Oral",
                "0.5-2 mg 2-3 times daily as needed",
                "Acute narrow-angle glaucoma; primary depressive disorder",
                "Sedation; dizziness; weakness; unsteadiness",
                "Alcohol; CNS depressants; opioids; antipsychotics"
            );
            
            csvPrinter.printRecord(
                "Prednisone",
                "In-House Dispensary",
                "Oral",
                "5-60 mg daily in the morning",
                "Systemic fungal infections; hypersensitivity to prednisone",
                "Increased appetite; fluid retention; mood changes; insomnia",
                "NSAIDs; anticoagulants; diabetes medications; vaccines"
            );
            
            csvPrinter.printRecord(
                "Levothyroxine (Synthroid)",
                "In-House Dispensary",
                "Oral",
                "25-200 mcg once daily on empty stomach",
                "Thyrotoxicosis; acute myocardial infarction",
                "Headache; insomnia; tremors; weight loss",
                "Calcium supplements; iron; antacids; sucralfate; cholestyramine"
            );
            
            csvPrinter.printRecord(
                "Amlodipine",
                "Cardiovascular",
                "Oral",
                "2.5-10 mg once daily",
                "Hypersensitivity to amlodipine; severe hypotension",
                "Peripheral edema; dizziness; flushing; headache",
                "Simvastatin; cyclosporine; CYP3A4 inhibitors"
            );
            
            csvPrinter.printRecord(
                "Warfarin (Coumadin)",
                "Cardiovascular",
                "Oral",
                "2-10 mg once daily (dose adjusted to INR)",
                "Pregnancy; active bleeding; severe liver disease",
                "Bleeding; necrosis; purple toe syndrome",
                "Antibiotics; NSAIDs; antiplatelet drugs; herbs (ginkgo; St. John's wort)"
            );
            
            csvPrinter.printRecord(
                "Ciprofloxacin",
                "Antibiotics",
                "Oral",
                "250-750 mg twice daily for 7-14 days",
                "QT prolongation; myasthenia gravis; tendon disorders",
                "Tendon rupture; QT prolongation; nausea; diarrhea",
                "Antacids; dairy products; iron; zinc; tizanidine; theophylline"
            );
            
            csvPrinter.printRecord(
                "Hydrochlorothiazide",
                "Cardiovascular",
                "Oral",
                "12.5-50 mg once daily",
                "Anuria; sulfonamide allergy; hepatic coma",
                "Electrolyte imbalance; hyperglycemia; photosensitivity",
                "Lithium; NSAIDs; digitalis glycosides; antidiabetic agents"
            );
            
            csvPrinter.printRecord(
                "Furosemide (Lasix)",
                "Cardiovascular",
                "Oral",
                "20-80 mg once or twice daily",
                "Anuria; sulfonamide allergy; severe electrolyte depletion",
                "Electrolyte imbalance; dehydration; ototoxicity",
                "Aminoglycosides; cisplatin; lithium; NSAIDs; digoxin"
            );
            
            csvPrinter.printRecord(
                "Metoprolol",
                "Cardiovascular",
                "Oral",
                "25-100 mg twice daily",
                "Cardiogenic shock; severe bradycardia; heart block",
                "Fatigue; dizziness; bradycardia; hypotension",
                "Calcium channel blockers; antiarrhythmics; clonidine; digoxin"
            );
            
            csvPrinter.flush();
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate CSV template: " + e.getMessage(), e);
        }
    }
    
    // Interaction management methods
    
    @Override
    public Drug addInteractionToDrug(String drugId, String interactingDrugId) {
        return drugRepository.findById(drugId)
            .map(drug -> {
                // First verify that the interacting drug exists
                if (!drugRepository.findById(interactingDrugId).isPresent()) {
                    throw new RuntimeException("Interacting drug not found with ID: " + interactingDrugId);
                }
                
                if (drug.getInteractingDrugIds() == null) {
                    System.out.println("Drug " + drugId + " has no interactions yet, initializing list");
                    drug.setInteractingDrugIds(new ArrayList<>());
                }
                
                // Check if interaction with same drug already exists
                boolean exists = drug.getInteractingDrugIds().contains(interactingDrugId);
                
                if (!exists) {
                    System.out.println("Adding new interaction to drug " + drugId + " with target drug " + interactingDrugId);
                    drug.getInteractingDrugIds().add(interactingDrugId);
                    return drugRepository.save(drug);
                } else {
                    // If the interaction already exists, just leave it as is
                    System.out.println("Interaction already exists for drug " + drugId + " with target drug " + interactingDrugId);
                    return drug;
                }
            })
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public Drug removeInteractionFromDrug(String drugId, String interactingDrugId) {
        return drugRepository.findById(drugId)
            .map(drug -> {
                if (drug.getInteractingDrugIds() != null) {
                    drug.getInteractingDrugIds().remove(interactingDrugId);
                    return drugRepository.save(drug);
                }
                return drug;
            })
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public List<String> getAllInteractionsForDrug(String drugId) {
        return drugRepository.findById(drugId)
            .map(drug -> {
                if (drug.getInteractingDrugIds() == null) {
                    return new ArrayList<String>();
                }
                return new ArrayList<>(drug.getInteractingDrugIds());
            })
            .orElseThrow(() -> new RuntimeException("Drug not found with ID: " + drugId));
    }
    
    @Override
    public List<String> getAllInteractions() {
        List<String> allInteractions = new ArrayList<>();
        List<Drug> allDrugs = drugRepository.findAll();
        
        for (Drug drug : allDrugs) {
            if (drug.getInteractingDrugIds() != null && !drug.getInteractingDrugIds().isEmpty()) {
                allInteractions.addAll(drug.getInteractingDrugIds());
            }
        }
        
        return allInteractions;
    }
} 