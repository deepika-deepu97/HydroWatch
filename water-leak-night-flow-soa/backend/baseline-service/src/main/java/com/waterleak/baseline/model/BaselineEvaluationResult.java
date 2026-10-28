package com.waterleak.baseline.model;

import java.math.BigDecimal;

public class BaselineEvaluationResult {
    private String propertyId;
    private BigDecimal baseline;
    private BigDecimal observedFlow;
    private BigDecimal deviationPercent;
    private BigDecimal thresholdPercent;
    private boolean flagged;
    private String severity;
    private String reason;

    public BaselineEvaluationResult() {}
    public BaselineEvaluationResult(String propertyId, BigDecimal baseline, BigDecimal observedFlow,
                                  BigDecimal deviationPercent, BigDecimal thresholdPercent,
                                  boolean flagged, String severity, String reason) {
        this.propertyId = propertyId;
        this.baseline = baseline;
        this.observedFlow = observedFlow;
        this.deviationPercent = deviationPercent;
        this.thresholdPercent = thresholdPercent;
        this.flagged = flagged;
        this.severity = severity;
        this.reason = reason;
    }

    public String getPropertyId() { return propertyId; }
    public BigDecimal getBaseline() { return baseline; }
    public BigDecimal getObservedFlow() { return observedFlow; }
    public BigDecimal getDeviationPercent() { return deviationPercent; }
    public BigDecimal getThresholdPercent() { return thresholdPercent; }
    public boolean isFlagged() { return flagged; }
    public String getSeverity() { return severity; }
    public String getReason() { return reason; }
}
