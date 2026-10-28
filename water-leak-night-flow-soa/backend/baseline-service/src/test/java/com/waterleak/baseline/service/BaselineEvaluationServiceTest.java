package com.waterleak.baseline.service;

import com.waterleak.baseline.event.NightFlowAnomalyDetected;
import com.waterleak.baseline.kafka.AnomalyEventProducer;
import com.waterleak.baseline.model.BaselineEvaluationResult;
import com.waterleak.baseline.repository.PropertyBaselineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * CRITICAL BASELINE DOMAIN RULE TEST
 *
 * Configured threshold: 50% above baseline.
 * - Home A baseline: 10 units/hour.
 * - Home B baseline: 30 units/hour.
 * - Current flow for both homes: 35 units/hour.
 *
 * Expected result:
 * - Home A must be flagged because its flow exceeds its own baseline by 250%.
 * - Home B must not be flagged because its flow exceeds its own baseline by approximately 16.67%.
 *
 * This test guarantees properties are NEVER compared against a single global baseline.
 */
class BaselineEvaluationServiceTest {

    private PropertyBaselineRepository baselineRepository;
    private AnomalyEventProducer anomalyEventProducer;
    private BaselineEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        baselineRepository = Mockito.mock(PropertyBaselineRepository.class);
        anomalyEventProducer = Mockito.mock(AnomalyEventProducer.class);
        evaluationService = new BaselineEvaluationService(baselineRepository, anomalyEventProducer);
    }

    @Test
    @DisplayName("Critical Domain Rule: Home A (Baseline 10, Flow 35) exceeds by 250% and is FLAGGED")
    void testHomeA_ShouldBeFlagged_WhenFlowIs35AndBaselineIs10() {
        // Given
        String propertyId = "PROP-HOME-A";
        BigDecimal baselineFlow = new BigDecimal("10.00");
        BigDecimal observedFlow = new BigDecimal("35.00");
        BigDecimal thresholdPercent = new BigDecimal("50.00");

        // When
        BaselineEvaluationResult result = evaluationService.evaluateFlowWithBaseline(
                propertyId, observedFlow, baselineFlow, thresholdPercent
        );

        // Then: Home A must be flagged because deviation is 250.00% >= 50.00%
        assertThat(result.isFlagged())
                .as("Home A must be flagged because flow 35.0 is 250% over baseline 10.0")
                .isTrue();

        assertThat(result.getDeviationPercent())
                .as("Home A deviation must equal exactly 250.00%")
                .isEqualByComparingTo(new BigDecimal("250.00"));

        assertThat(result.getSeverity())
                .as("A 250% night-flow spike must be classified as CRITICAL")
                .isEqualTo("CRITICAL");

        // Verify Kafka event published for Home A
        ArgumentCaptor<NightFlowAnomalyDetected> captor = ArgumentCaptor.forClass(NightFlowAnomalyDetected.class);
        verify(anomalyEventProducer, times(1)).publishAnomalyEvent(captor.capture());
        NightFlowAnomalyDetected emittedEvent = captor.getValue();

        assertThat(emittedEvent.getPropertyId()).isEqualTo("PROP-HOME-A");
        assertThat(emittedEvent.getBaselineValue()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(emittedEvent.getObservedFlow()).isEqualByComparingTo(new BigDecimal("35.00"));
        assertThat(emittedEvent.getDeviation()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(emittedEvent.getSeverity()).isEqualTo("CRITICAL");
    }

    @Test
    @DisplayName("Critical Domain Rule: Home B (Baseline 30, Flow 35) exceeds by ~16.67% and is NOT FLAGGED")
    void testHomeB_ShouldNotBeFlagged_WhenFlowIs35AndBaselineIs30() {
        // Given
        String propertyId = "PROP-HOME-B";
        BigDecimal baselineFlow = new BigDecimal("30.00");
        BigDecimal observedFlow = new BigDecimal("35.00");
        BigDecimal thresholdPercent = new BigDecimal("50.00");

        // When
        BaselineEvaluationResult result = evaluationService.evaluateFlowWithBaseline(
                propertyId, observedFlow, baselineFlow, thresholdPercent
        );

        // Then: Home B must NOT be flagged because deviation is ~16.67% < 50.00%
        assertThat(result.isFlagged())
                .as("Home B must NOT be flagged because flow 35.0 is only 16.67% over baseline 30.0 (under 50% threshold)")
                .isFalse();

        assertThat(result.getDeviationPercent())
                .as("Home B deviation must equal 16.67%")
                .isEqualByComparingTo(new BigDecimal("16.67"));

        assertThat(result.getSeverity())
                .as("Sub-threshold deviation must remain NORMAL")
                .isEqualTo("NORMAL");

        // Verify NO Kafka event is published for Home B
        verify(anomalyEventProducer, never()).publishAnomalyEvent(any());
    }

    @Test
    @DisplayName("Domain Rule Invariant: Identical flow (35.0) yields distinct decisions based on property baselines")
    void testPropertyIsolatedBaselines_NeverUseGlobalBaseline() {
        BigDecimal identicalFlow = new BigDecimal("35.00");
        BigDecimal threshold = new BigDecimal("50.00");

        BaselineEvaluationResult homeAResult = evaluationService.evaluateFlowWithBaseline("PROP-HOME-A", identicalFlow, new BigDecimal("10.00"), threshold);
        BaselineEvaluationResult homeBResult = evaluationService.evaluateFlowWithBaseline("PROP-HOME-B", identicalFlow, new BigDecimal("30.00"), threshold);

        // Crucial architectural assertion:
        // Even with IDENTICAL observed flow, Home A flags anomaly, Home B passes normally.
        assertThat(homeAResult.isFlagged()).isTrue();
        assertThat(homeBResult.isFlagged()).isFalse();

        assertThat(homeAResult.getDeviationPercent()).isGreaterThan(homeBResult.getDeviationPercent());
    }
}
