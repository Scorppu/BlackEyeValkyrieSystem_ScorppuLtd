package com.scorppultd.blackeyevalkyriesystem.service.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.repository.DrugRepository;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;

@Service
public class DrugServiceImpl implements DrugService {

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
    public List<Drug> getDrugsByTemplateCategory(String category) {
        return drugRepository.findByTemplateCategory(category);
    }
} 