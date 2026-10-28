package com.waterleak.baseline.service;

import com.waterleak.baseline.event.NightFlowAnomalyDetected;
import com.waterleak.baseline.kafka.AnomalyEventProducer;
import com.waterleak.baseline.model.BaselineEvaluationResult;
import com.waterleak.baseline.model.PropertyBaseline;
import com.waterleak.baseline.repository.PropertyBaselineRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
public class BaselineEvaluationService {
    private final PropertyBaselineRepository baselineRepository;
    private final AnomalyEventProducer anomalyEventProducer;

    public BaselineEvaluationService(PropertyBaselineRepository baselineRepository,
                                    AnomalyEventProducer anomalyEventProducer) {
        this.baselineRepository = baselineRepository;
        this.anomalyEventProducer = anomalyEventProducer;
    }

    /**
     * Evaluates whether an observed nighttime water flow rate represents an anomaly
     * relative to the property's OWN historical night baseline.
     */
    public BaselineEvaluationResult evaluateFlow(String propertyId, BigDecimal observedFlow) {
        PropertyBaseline baseline = baselineRepository.findByPropertyId(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("No baseline found for property: " + propertyId));

        return evaluateFlowWithBaseline(propertyId, observedFlow, baseline.getBaselineFlowUnitsPerHour(), baseline.getDeviationThresholdPercent());
    }

    public BaselineEvaluationResult evaluateFlowWithBaseline(String propertyId, BigDecimal observedFlow,
                                                           BigDecimal baselineFlow, BigDecimal thresholdPercent) {
        if (baselineFlow.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Baseline flow must be greater than zero for percentage calculation");
        }

        // Deviation percentage: ((Observed - Baseline) / Baseline) * 100
        BigDecimal difference = observedFlow.subtract(baselineFlow);
        BigDecimal deviationPercent = difference.divide(baselineFlow, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        boolean flagged = deviationPercent.compareTo(thresholdPercent) >= 0;

        String severity = "NORMAL";
        if (flagged) {
            if (deviationPercent.compareTo(new BigDecimal("200")) >= 0) {
                severity = "CRITICAL";
            } else if (deviationPercent.compareTo(new BigDecimal("100")) >= 0) {
                severity = "HIGH";
            } else {
                severity = "MEDIUM";
            }
        }

        String reason = flagged
                ? String.format("Observed flow %.2f units/h exceeds baseline %.2f units/h by %.2f%% (threshold: %.2f%%)",
                observedFlow, baselineFlow, deviationPercent, thresholdPercent)
                : String.format("Observed flow %.2f units/h is within normal range (deviation: %.2f%%, threshold: %.2f%%)",
                observedFlow, deviationPercent, thresholdPercent);

        BaselineEvaluationResult result = new BaselineEvaluationResult(
                propertyId,
                baselineFlow,
                observedFlow,
                deviationPercent,
                thresholdPercent,
                flagged,
                severity,
                reason
        );

        if (flagged) {
            NightFlowAnomalyDetected event = new NightFlowAnomalyDetected(
                    "evt-" + UUID.randomUUID(),
                    Instant.now(),
                    propertyId,
                    baselineFlow,
                    observedFlow,
                    deviationPercent,
                    thresholdPercent,
                    severity,
                    reason
            );
            anomalyEventProducer.publishAnomalyEvent(event);
        }

        return result;
    }
}
