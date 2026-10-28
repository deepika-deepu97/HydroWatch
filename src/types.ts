export type Role = 'RESIDENT' | 'UTILITY_ANALYST';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  authorizedProperties: string; // e.g. "PROP-HOME-A" or "*"
  token: string;
}

export interface Property {
  id: string;
  address: string;
  propertyType: string;
  zoneName: string;
  meterSerialNumber: string;
  residentUserId: string;
  residentName: string;
  baselineFlow: number; // units/hr
  deviationThresholdPercent: number; // e.g. 50%
}

export type ReadingType = 'REAL' | 'SIMULATED';

export interface MeterReading {
  id: string;
  propertyId: string;
  timestamp: string;
  hourOfDay: number;
  flowRateUnitsPerHour: number;
  readingType: ReadingType;
  batteryLevel?: number;
  qualityFlag?: string;
}

export interface BaselineRecord {
  id: string;
  propertyId: string;
  baselineFlowUnitsPerHour: number;
  windowStartHour: number;
  windowEndHour: number;
  sampleReadingsCount: number;
  deviationThresholdPercent: number;
  calculationMethod: string;
  updatedAt: string;
}

export type CaseStatus = 'NEW' | 'INVESTIGATING' | 'CONFIRMED_LEAK' | 'REPAIRED' | 'FALSE_POSITIVE' | 'CLOSED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NORMAL';

export interface KafkaAnomalyEvent {
  eventId: string;
  eventType: 'NightFlowAnomalyDetected';
  schemaVersion: '1.0';
  timestamp: string;
  propertyId: string;
  baselineValue: number;
  observedFlow: number;
  deviation: number;
  threshold: number;
  severity: Severity;
  reason: string;
  isDuplicate?: boolean;
}

export interface InvestigationCase {
  caseId: string;
  propertyId: string;
  eventId: string;
  status: CaseStatus;
  severity: Severity;
  observedFlow: number;
  baselineValue: number;
  deviationPercent: number;
  detectedAt: string;
  assignedAnalyst?: string;
  workOrderNumber?: string;
  detectionReason: string;
  notes?: string;
  updatedAt: string;
}
