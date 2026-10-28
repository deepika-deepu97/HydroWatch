package com.waterleak.baseline.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "property_baselines")
public class PropertyBaseline {
    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String propertyId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baselineFlowUnitsPerHour;

    private int windowStartHour = 1;
    private int windowEndHour = 5;
    private int sampleReadingsCount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal deviationThresholdPercent = new BigDecimal("50.00");

    private String calculationMethod = "MEDIAN_NIGHT_FLOW_30D";
    private String status = "ACTIVE";
    private Instant updatedAt = Instant.now();

    public PropertyBaseline() {}
    public PropertyBaseline(String id, String propertyId, BigDecimal baselineFlowUnitsPerHour, int sampleReadingsCount, BigDecimal deviationThresholdPercent) {
        this.id = id;
        this.propertyId = propertyId;
        this.baselineFlowUnitsPerHour = baselineFlowUnitsPerHour;
        this.sampleReadingsCount = sampleReadingsCount;
        this.deviationThresholdPercent = deviationThresholdPercent;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public BigDecimal getBaselineFlowUnitsPerHour() { return baselineFlowUnitsPerHour; }
    public void setBaselineFlowUnitsPerHour(BigDecimal baselineFlowUnitsPerHour) { this.baselineFlowUnitsPerHour = baselineFlowUnitsPerHour; }

    public int getWindowStartHour() { return windowStartHour; }
    public void setWindowStartHour(int windowStartHour) { this.windowStartHour = windowStartHour; }

    public int getWindowEndHour() { return windowEndHour; }
    public void setWindowEndHour(int windowEndHour) { this.windowEndHour = windowEndHour; }

    public int getSampleReadingsCount() { return sampleReadingsCount; }
    public void setSampleReadingsCount(int sampleReadingsCount) { this.sampleReadingsCount = sampleReadingsCount; }

    public BigDecimal getDeviationThresholdPercent() { return deviationThresholdPercent; }
    public void setDeviationThresholdPercent(BigDecimal deviationThresholdPercent) { this.deviationThresholdPercent = deviationThresholdPercent; }

    public String getCalculationMethod() { return calculationMethod; }
    public void setCalculationMethod(String calculationMethod) { this.calculationMethod = calculationMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
