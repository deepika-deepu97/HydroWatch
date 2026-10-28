import { User, Property, MeterReading, BaselineRecord, KafkaAnomalyEvent, InvestigationCase, CaseStatus } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-analyst-001',
    username: 'analyst@utility.gov',
    email: 'analyst@utility.gov',
    fullName: 'Marcus Vance',
    role: 'UTILITY_ANALYST',
    authorizedProperties: '*',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmFseXN0QHV0aWxpdHkuZ292IiwidXNlcklkIjoidXNyLWFuYWx5c3QtMDAxIiwicm9sZSI6IlVUSUxJVFlfQU5BTFlTVCIsInByb3BlcnRpZXMiOiIqIiwiZnVsbE5hbWUiOiJNYXJjdXMgVmFuY2UiLCJpYXQiOjE3OTMyMjAwMDAsImV4cCI6MTgwMDkyMDAwMH0.s10t02sig_analyst_verified'
  },
  {
    id: 'usr-resident-001',
    username: 'alice@home-a.com',
    email: 'alice@home-a.com',
    fullName: 'Alice Chen',
    role: 'RESIDENT',
    authorizedProperties: 'PROP-HOME-A',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGljZUBob21lLWEuY29tIiwidXNlcklkIjoidXNyLXJlc2lkZW50LTAwMSIsInJvbGUiOiJSRVNJREVOVCIsInByb3BlcnRpZXMiOiJQUk9QLUhPTUUtQSIsImZ1bGxOYW1lIjoiQWxpY2UgQ2hlbiIsImlhdCI6MTc5MzIyMDAwMCwiZXhwIjoxODAwOTIwMDAwfQ.s10t02sig_residentA_verified'
  },
  {
    id: 'usr-resident-002',
    username: 'bob@home-b.com',
    email: 'bob@home-b.com',
    fullName: 'Bob Davis',
    role: 'RESIDENT',
    authorizedProperties: 'PROP-HOME-B',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJib2JAaG9tZS1iLmNvbSIsInVzZXJJZCI6InVzci1yZXNpZGVudC0wMDIiLCJyb2xlIjoiUkVTSURFTlQiLCJwcm9wZXJ0aWVzIjoiUFJPUC1IT01FLUIiLCJmdWxsTmFtZSI6IkJvYiBEYXZpcyIsImlhdCI6MTc5MzIyMDAwMCwiZXhwIjoxODAwOTIwMDAwfQ.s10t02sig_residentB_verified'
  }
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'PROP-HOME-A',
    address: '742 Evergreen Terrace, Sector 4',
    propertyType: 'RESIDENTIAL_SINGLE_FAMILY',
    zoneName: 'North Distribution Zone',
    meterSerialNumber: 'MTR-882109',
    residentUserId: 'usr-resident-001',
    residentName: 'Alice Chen',
    baselineFlow: 10.0,
    deviationThresholdPercent: 50.0
  },
  {
    id: 'PROP-HOME-B',
    address: '1004 Willow Creek Lane, Sector 9',
    propertyType: 'RESIDENTIAL_SINGLE_FAMILY',
    zoneName: 'South Distribution Zone',
    meterSerialNumber: 'MTR-994311',
    residentUserId: 'usr-resident-002',
    residentName: 'Bob Davis',
    baselineFlow: 30.0,
    deviationThresholdPercent: 50.0
  },
  {
    id: 'PROP-COMM-C',
    address: '55 Industrial Parkway, Sector 2',
    propertyType: 'COMMERCIAL_OFFICE',
    zoneName: 'Central Commercial Zone',
    meterSerialNumber: 'MTR-441022',
    residentUserId: 'usr-analyst-001',
    residentName: 'Metro Water Commercial Hub',
    baselineFlow: 65.0,
    deviationThresholdPercent: 50.0
  }
];

export const INITIAL_BASELINES: BaselineRecord[] = [
  {
    id: 'BASE-HOME-A',
    propertyId: 'PROP-HOME-A',
    baselineFlowUnitsPerHour: 10.0,
    windowStartHour: 1,
    windowEndHour: 5,
    sampleReadingsCount: 120,
    deviationThresholdPercent: 50.0,
    calculationMethod: 'MEDIAN_NIGHT_FLOW_30D',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'BASE-HOME-B',
    propertyId: 'PROP-HOME-B',
    baselineFlowUnitsPerHour: 30.0,
    windowStartHour: 1,
    windowEndHour: 5,
    sampleReadingsCount: 120,
    deviationThresholdPercent: 50.0,
    calculationMethod: 'MEDIAN_NIGHT_FLOW_30D',
    updatedAt: '2026-10-28T00:00:00Z'
  },
  {
    id: 'BASE-COMM-C',
    propertyId: 'PROP-COMM-C',
    baselineFlowUnitsPerHour: 65.0,
    windowStartHour: 1,
    windowEndHour: 5,
    sampleReadingsCount: 120,
    deviationThresholdPercent: 50.0,
    calculationMethod: 'MEDIAN_NIGHT_FLOW_30D',
    updatedAt: '2026-10-28T00:00:00Z'
  }
];

// Generate 24 hours of telemetry for Home A (with severe night leak ~35 u/h) and Home B (normal night flow ~32-35 u/h)
export function generateInitialReadings(): MeterReading[] {
  const readings: MeterReading[] = [];
  const baseDate = '2026-10-28T';

  // Home A: Normal day hours, but anomalous night flow of 35 u/h in 01:00-05:00 window (baseline is 10.0 u/h)
  const homeAFlows = [
    12.4, // 00:00
    34.8, // 01:00 (Night window leak!)
    35.2, // 02:00 (Night window leak!)
    35.0, // 03:00 (Night window leak! Critical test anchor)
    34.9, // 04:00 (Night window leak!)
    35.1, // 05:00 (Night window leak!)
    45.0, // 06:00
    88.5, // 07:00 (Morning peak)
    95.2, // 08:00
    40.1, // 09:00
    32.0, // 10:00
    28.5, // 11:00
    35.0, // 12:00
    30.2, // 13:00
    25.8, // 14:00
    28.0, // 15:00
    42.5, // 16:00
    65.0, // 17:00
    110.4, // 18:00 (Evening peak)
    95.0, // 19:00
    70.2, // 20:00
    45.0, // 21:00
    28.0, // 22:00
    15.0  // 23:00
  ];

  // Home B: Multi-person home with larger appliances, baseline is 30.0 u/h. At 03:00 flow is 35.0 u/h (only +16.67%, under 50% threshold!)
  const homeBFlows = [
    29.5, // 00:00
    31.2, // 01:00
    33.0, // 02:00
    35.0, // 03:00 (Critical test anchor: 35 u/h vs 30 u/h baseline)
    32.4, // 04:00
    31.0, // 05:00
    55.2, // 06:00
    120.0, // 07:00
    135.4, // 08:00
    60.0, // 09:00
    45.0, // 10:00
    42.0, // 11:00
    50.0, // 12:00
    44.0, // 13:00
    38.0, // 14:00
    40.0, // 15:00
    58.0, // 16:00
    90.0, // 17:00
    150.0, // 18:00
    130.0, // 19:00
    98.0, // 20:00
    65.0, // 21:00
    45.0, // 22:00
    32.0  // 23:00
  ];

  for (let h = 0; h < 24; h++) {
    const timeStr = `${baseDate}${h.toString().padStart(2, '0')}:00:00Z`;
    readings.push({
      id: `MTR-A-${h}`,
      propertyId: 'PROP-HOME-A',
      timestamp: timeStr,
      hourOfDay: h,
      flowRateUnitsPerHour: homeAFlows[h],
      readingType: 'REAL',
      batteryLevel: 98,
      qualityFlag: 'OK'
    });

    readings.push({
      id: `MTR-B-${h}`,
      propertyId: 'PROP-HOME-B',
      timestamp: timeStr,
      hourOfDay: h,
      flowRateUnitsPerHour: homeBFlows[h],
      readingType: 'REAL',
      batteryLevel: 99,
      qualityFlag: 'OK'
    });
  }

  return readings;
}

export const INITIAL_KAFKA_EVENTS: KafkaAnomalyEvent[] = [
  {
    eventId: 'evt-7f8e3d2a-1123-45ab-91cf-a98234120192',
    eventType: 'NightFlowAnomalyDetected',
    schemaVersion: '1.0',
    timestamp: '2026-10-28T03:00:00Z',
    propertyId: 'PROP-HOME-A',
    baselineValue: 10.0,
    observedFlow: 35.0,
    deviation: 250.0,
    threshold: 50.0,
    severity: 'CRITICAL',
    reason: 'Observed night flow of 35.00 units/h exceeds baseline of 10.00 units/h by 250.00% (threshold: 50.0%) during 01:00-05:00 window'
  }
];

export const INITIAL_CASES: InvestigationCase[] = [
  {
    caseId: 'CASE-7A99B12',
    propertyId: 'PROP-HOME-A',
    eventId: 'evt-7f8e3d2a-1123-45ab-91cf-a98234120192',
    status: 'INVESTIGATING',
    severity: 'CRITICAL',
    observedFlow: 35.0,
    baselineValue: 10.0,
    deviationPercent: 250.0,
    detectedAt: '2026-10-28T03:00:00Z',
    assignedAnalyst: 'Marcus Vance',
    workOrderNumber: 'WO-2026-8819',
    detectionReason: 'Night flow sustained at 35.0 u/h (+250% over individual baseline 10.0 u/h). Potential ruptured pipe or failed pressure relief valve.',
    notes: 'Analyst Marcus dispatched field technician for acoustic leak detection check.',
    updatedAt: '2026-10-28T04:15:00Z'
  }
];
