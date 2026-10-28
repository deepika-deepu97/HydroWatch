package com.waterleak.baseline.event;

import java.math.BigDecimal;
import java.time.Instant;

public class NightFlowAnomalyDetected {
    private String eventId;
    private String eventType = "NightFlowAnomalyDetected";
    private String schemaVersion = "1.0";
    private Instant timestamp;
    private String propertyId;
    private BigDecimal baselineValue;
    private BigDecimal observedFlow;
    private BigDecimal deviation;
    private BigDecimal threshold;
    private String severity;
    private String reason;

    public NightFlowAnomalyDetected() {}

    public NightFlowAnomalyDetected(String eventId, Instant timestamp, String propertyId,
                                  BigDecimal baselineValue, BigDecimal observedFlow,
                                  BigDecimal deviation, BigDecimal threshold,
                                  String severity, String reason) {
        this.eventId = eventId;
        this.timestamp = timestamp;
        this.propertyId = propertyId;
        this.baselineValue = baselineValue;
        this.observedFlow = observedFlow;
        this.deviation = deviation;
        this.threshold = threshold;
        this.severity = severity;
        this.reason = reason;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getSchemaVersion() { return schemaVersion; }
    public void setSchemaVersion(String schemaVersion) { this.schemaVersion = schemaVersion; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public BigDecimal getBaselineValue() { return baselineValue; }
    public void setBaselineValue(BigDecimal baselineValue) { this.baselineValue = baselineValue; }

    public BigDecimal getObservedFlow() { return observedFlow; }
    public void setObservedFlow(BigDecimal observedFlow) { this.observedFlow = observedFlow; }

    public BigDecimal getDeviation() { return deviation; }
    public void setDeviation(BigDecimal deviation) { this.deviation = deviation; }

    public BigDecimal getThreshold() { return threshold; }
    public void setThreshold(BigDecimal threshold) { this.threshold = threshold; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
