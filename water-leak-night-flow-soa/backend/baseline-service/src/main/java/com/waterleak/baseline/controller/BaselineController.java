package com.waterleak.baseline.controller;

import com.waterleak.baseline.model.BaselineEvaluationResult;
import com.waterleak.baseline.model.PropertyBaseline;
import com.waterleak.baseline.repository.PropertyBaselineRepository;
import com.waterleak.baseline.service.BaselineEvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/baselines")
public class BaselineController {
    private final PropertyBaselineRepository baselineRepository;
    private final BaselineEvaluationService evaluationService;

    public BaselineController(PropertyBaselineRepository baselineRepository, BaselineEvaluationService evaluationService) {
        this.baselineRepository = baselineRepository;
        this.evaluationService = evaluationService;
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<PropertyBaseline> getBaseline(@PathVariable String propertyId) {
        return baselineRepository.findByPropertyId(propertyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/evaluate")
    public ResponseEntity<BaselineEvaluationResult> evaluate(@RequestBody Map<String, Object> payload) {
        String propertyId = (String) payload.get("propertyId");
        BigDecimal observedFlow = new BigDecimal(payload.get("observedFlow").toString());
        return ResponseEntity.ok(evaluationService.evaluateFlow(propertyId, observedFlow));
    }
}
