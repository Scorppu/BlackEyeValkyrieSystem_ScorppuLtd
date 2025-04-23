package com.scorppultd.blackeyevalkyriesystem.service.impl;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DrugServiceImplTest {

    @Mock
    private DrugRepository drugRepository;

    @InjectMocks
    private DrugServiceImpl drugService;

    private Drug drug1;
    private Drug drug2;

    @BeforeEach
    void setUp() {
        drug1 = new Drug();
        ReflectionTestUtils.setField(drug1, "id", "1");
        ReflectionTestUtils.setField(drug1, "name", "Ibuprofen");
        ReflectionTestUtils.setField(drug1, "templateCategory", "Pain Meds - non narcotic");
        ReflectionTestUtils.setField(drug1, "routeOfAdministration", "Oral");
        ReflectionTestUtils.setField(drug1, "dosageInstructions", "200-400 mg every 4-6 hours");
        ReflectionTestUtils.setField(drug1, "contraindications", "Peptic ulcer disease; renal impairment");
        ReflectionTestUtils.setField(drug1, "sideEffects", "Gastrointestinal bleeding; renal impairment");
        ReflectionTestUtils.setField(drug1, "interactingDrugIds", new ArrayList<>());

        drug2 = new Drug();
        ReflectionTestUtils.setField(drug2, "id", "2");
        ReflectionTestUtils.setField(drug2, "name", "Amoxicillin");
        ReflectionTestUtils.setField(drug2, "templateCategory", "Antibiotics");
        ReflectionTestUtils.setField(drug2, "routeOfAdministration", "Oral");
        ReflectionTestUtils.setField(drug2, "dosageInstructions", "250-500 mg every 8 hours");
        ReflectionTestUtils.setField(drug2, "contraindications", "Penicillin allergy");
        ReflectionTestUtils.setField(drug2, "sideEffects", "Diarrhea; rash");
        ReflectionTestUtils.setField(drug2, "interactingDrugIds", new ArrayList<>());
    }

    @Test
    void getAllDrugsTest() {
        // Given
        when(drugRepository.findAll()).thenReturn(Arrays.asList(drug1, drug2));

        // When
        List<Drug> result = drugService.getAllDrugs();

        // Then
        assertEquals(2, result.size());
        verify(drugRepository).findAll();
    }

    @Test
    void getDrugByIdTest() {
        // Given
        when(drugRepository.findById("1")).thenReturn(Optional.of(drug1));

        // When
        Optional<Drug> result = drugService.getDrugById("1");

        // Then
        assertTrue(result.isPresent());
        assertEquals("Ibuprofen", ReflectionTestUtils.getField(result.get(), "name"));
        verify(drugRepository).findById("1");
    }

    @Test
    void createDrugTest() {
        // Given
        when(drugRepository.save(drug1)).thenReturn(drug1);

        // When
        Drug result = drugService.createDrug(drug1);

        // Then
        assertEquals("Ibuprofen", ReflectionTestUtils.getField(result, "name"));
        verify(drugRepository).save(drug1);
    }

    @Test
    void updateDrugTest() {
        // Given
        ReflectionTestUtils.setField(drug1, "dosageInstructions", "Updated dosage instructions");
        when(drugRepository.save(drug1)).thenReturn(drug1);

        // When
        Drug result = drugService.updateDrug(drug1);

        // Then
        assertEquals("Updated dosage instructions", ReflectionTestUtils.getField(result, "dosageInstructions"));
        verify(drugRepository).save(drug1);
    }

    @Test
    void deleteDrugTest() {
        // When
        drugService.deleteDrug("1");

        // Then
        verify(drugRepository).deleteById("1");
    }

    @Test
    void searchDrugsByNameTest() {
        // Given
        when(drugRepository.findByNameContainingIgnoreCase("ibu")).thenReturn(Arrays.asList(drug1));

        // When
        List<Drug> result = drugService.searchDrugsByName("ibu");

        // Then
        assertEquals(1, result.size());
        assertEquals("Ibuprofen", ReflectionTestUtils.getField(result.get(0), "name"));
        verify(drugRepository).findByNameContainingIgnoreCase("ibu");
    }

    @Test
    void existsByNameTest() {
        // Given
        when(drugRepository.existsByNameIgnoreCase("Ibuprofen")).thenReturn(true);
        when(drugRepository.existsByNameIgnoreCase("Unknown")).thenReturn(false);

        // When & Then
        assertTrue(drugService.existsByName("Ibuprofen"));
        assertFalse(drugService.existsByName("Unknown"));
        verify(drugRepository).existsByNameIgnoreCase("Ibuprofen");
        verify(drugRepository).existsByNameIgnoreCase("Unknown");
    }

    @Test
    void getDrugsByTemplateCategoryTest() {
        // Given
        when(drugRepository.findByTemplateCategory("Pain Meds - non narcotic")).thenReturn(Arrays.asList(drug1));

        // When
        List<Drug> result = drugService.getDrugsByTemplateCategory("Pain Meds - non narcotic");

        // Then
        assertEquals(1, result.size());
        assertEquals("Ibuprofen", ReflectionTestUtils.getField(result.get(0), "name"));
        verify(drugRepository).findByTemplateCategory("Pain Meds - non narcotic");
    }

    @Test
    void importDrugsFromCsvTest() throws IOException {
        // Given
        String csvContent = "name,templateCategory,routeOfAdministration,dosageInstructions,contraindications,sideEffects\n" +
                           "Test Drug,Test Category,Oral,Test Dosage,Test Contraindications,Test Side Effects";
        InputStream inputStream = new ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8));
        
        when(drugRepository.existsByNameIgnoreCase("Test Drug")).thenReturn(false);
        when(drugRepository.save(any(Drug.class))).thenAnswer(invocation -> {
            Drug d = invocation.getArgument(0);
            ReflectionTestUtils.setField(d, "id", "new-id");
            return d;
        });

        // When
        List<Drug> result = drugService.importDrugsFromCsv(inputStream);

        // Then
        assertEquals(1, result.size());
        assertEquals("Test Drug", ReflectionTestUtils.getField(result.get(0), "name"));
        assertEquals("Test Category", ReflectionTestUtils.getField(result.get(0), "templateCategory"));
        verify(drugRepository).existsByNameIgnoreCase("Test Drug");
        verify(drugRepository).save(any(Drug.class));
    }

    @Test
    void addInteractionToDrugTest() {
        // Given
        when(drugRepository.findById("1")).thenReturn(Optional.of(drug1));
        when(drugRepository.findById("2")).thenReturn(Optional.of(drug2));
        when(drugRepository.save(any(Drug.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Drug result = drugService.addInteractionToDrug("1", "2");

        // Then
        List<String> interactingDrugIds = (List<String>) ReflectionTestUtils.getField(result, "interactingDrugIds");
        assertTrue(interactingDrugIds.contains("2"));
        verify(drugRepository).findById("1");
        verify(drugRepository).findById("2");
        verify(drugRepository).save(any(Drug.class));
    }

    @Test
    void removeInteractionFromDrugTest() {
        // Given
        List<String> interactingDrugIds = (List<String>) ReflectionTestUtils.getField(drug1, "interactingDrugIds");
        interactingDrugIds.add("2");
        
        when(drugRepository.findById("1")).thenReturn(Optional.of(drug1));
        when(drugRepository.save(any(Drug.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Drug result = drugService.removeInteractionFromDrug("1", "2");

        // Then
        List<String> resultInteractingDrugIds = (List<String>) ReflectionTestUtils.getField(result, "interactingDrugIds");
        assertFalse(resultInteractingDrugIds.contains("2"));
        verify(drugRepository).findById("1");
        verify(drugRepository).save(any(Drug.class));
    }

    @Test
    void getAllInteractionsForDrugTest() {
        // Given
        List<String> interactingDrugIds = (List<String>) ReflectionTestUtils.getField(drug1, "interactingDrugIds");
        interactingDrugIds.add("2");
        interactingDrugIds.add("3");
        
        when(drugRepository.findById("1")).thenReturn(Optional.of(drug1));

        // When
        List<String> result = drugService.getAllInteractionsForDrug("1");

        // Then
        assertEquals(2, result.size());
        assertTrue(result.contains("2"));
        assertTrue(result.contains("3"));
        verify(drugRepository).findById("1");
    }

    @Test
    void generateCsvTemplateTest() {
        // When
        byte[] result = drugService.generateCsvTemplate();

        // Then
        assertTrue(result.length > 0);
        String csvContent = new String(result, StandardCharsets.UTF_8);
        assertTrue(csvContent.contains("templateCategory"));
        assertTrue(csvContent.contains("Acetaminophen"));
    }
} 