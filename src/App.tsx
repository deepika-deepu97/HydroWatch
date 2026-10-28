import React, { useState } from 'react';
import {
  INITIAL_USERS,
  INITIAL_PROPERTIES,
  INITIAL_BASELINES,
  generateInitialReadings,
  INITIAL_KAFKA_EVENTS,
  INITIAL_CASES
} from './data/mockDatabase';
import { User, Property, MeterReading, BaselineRecord, KafkaAnomalyEvent, InvestigationCase, CaseStatus } from './types';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { CriticalTestTab } from './components/CriticalTestTab';
import { KafkaStreamTab } from './components/KafkaStreamTab';
import { CasesTab } from './components/CasesTab';
import { CsvUploadTab } from './components/CsvUploadTab';
import { ArchitectureTab } from './components/ArchitectureTab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default: Marcus Vance (Analyst)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('PROP-HOME-A');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-memory data store representing the 4 PostgreSQL microservice databases
  const [properties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [baselines] = useState<BaselineRecord[]>(INITIAL_BASELINES);
  const [readings, setReadings] = useState<MeterReading[]>(generateInitialReadings);
  const [kafkaEvents, setKafkaEvents] = useState<KafkaAnomalyEvent[]>(INITIAL_KAFKA_EVENTS);
  const [cases, setCases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(
    new Set(['evt-7f8e3d2a-1123-45ab-91cf-a98234120192'])
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 5000);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    // If resident switched, auto-select their authorized property if currently unauthorized
    if (user.role === 'RESIDENT' && user.authorizedProperties !== '*') {
      setSelectedPropertyId(user.authorizedProperties);
      showToast(`Logged in as resident ${user.fullName}. Token claims restricted to ${user.authorizedProperties}.`);
    } else {
      showToast(`Logged in as Utility Analyst ${user.fullName}. Full utility-wide access granted.`);
    }
  };

  const handleSwitchUserRole = (roleKey: 'UTILITY_ANALYST' | 'RESIDENT_A' | 'RESIDENT_B') => {
    if (roleKey === 'UTILITY_ANALYST') handleSelectUser(INITIAL_USERS[0]);
    if (roleKey === 'RESIDENT_A') handleSelectUser(INITIAL_USERS[1]);
    if (roleKey === 'RESIDENT_B') handleSelectUser(INITIAL_USERS[2]);
  };

  const handleTriggerEvaluation = (propertyId: string, flowRate: number, isSimulated: boolean) => {
    const baselineObj = baselines.find((b) => b.propertyId === propertyId) || baselines[0];
    const baseline = baselineObj.baselineFlowUnitsPerHour;
    const thresholdPercent = baselineObj.deviationThresholdPercent;

    const deviationPercent = ((flowRate - baseline) / baseline) * 100;
    const isAnomaly = deviationPercent >= thresholdPercent;

    // Create a new reading record
    const newReading: MeterReading = {
      id: `READ-${Date.now()}`,
      propertyId,
      timestamp: new Date().toISOString(),
      hourOfDay: 3, // Injected into 03:00 night window
      flowRateUnitsPerHour: flowRate,
      readingType: isSimulated ? 'SIMULATED' : 'REAL',
      batteryLevel: 98,
      qualityFlag: 'OK'
    };

    setReadings((prev) => [newReading, ...prev]);

    if (isAnomaly) {
      const severity = deviationPercent >= 200 ? 'CRITICAL' : deviationPercent >= 100 ? 'HIGH' : 'MEDIUM';
      const eventId = `evt-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`;
      const reason = `Observed night flow of ${flowRate.toFixed(2)} units/h exceeds baseline of ${baseline.toFixed(
        2
      )} units/h by ${deviationPercent.toFixed(2)}% (threshold: ${thresholdPercent.toFixed(1)}%)`;

      const newKafkaEvent: KafkaAnomalyEvent = {
        eventId,
        eventType: 'NightFlowAnomalyDetected',
        schemaVersion: '1.0',
        timestamp: new Date().toISOString(),
        propertyId,
        baselineValue: baseline,
        observedFlow: flowRate,
        deviation: parseFloat(deviationPercent.toFixed(2)),
        threshold: thresholdPercent,
        severity,
        reason
      };

      // 1. Baseline Service publishes to Kafka topic soa.s10.t02.events
      setKafkaEvents((prev) => [newKafkaEvent, ...prev]);

      // 2. LeakCase Service consumes the event idempotently
      if (!processedEventIds.has(eventId)) {
        setProcessedEventIds((prev) => new Set(prev).add(eventId));

        const newCase: InvestigationCase = {
          caseId: `CASE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          propertyId,
          eventId,
          status: 'NEW',
          severity,
          observedFlow: flowRate,
          baselineValue: baseline,
          deviationPercent: parseFloat(deviationPercent.toFixed(2)),
          detectedAt: new Date().toISOString(),
          detectionReason: reason,
          updatedAt: new Date().toISOString()
        };

        setCases((prev) => [newCase, ...prev]);
        showToast(`⚠️ Anomaly Flagged (+${deviationPercent.toFixed(1)}%)! Kafka event emitted and Investigation Case ${newCase.caseId} created.`);
      }
    } else {
      showToast(`✓ Evaluated flow ${flowRate.toFixed(1)} u/h is within baseline tolerance (+${deviationPercent.toFixed(1)}% < 50%). No anomaly.`);
    }
  };

  const handleSendDuplicateEvent = (existingEventId: string) => {
    const existing = kafkaEvents.find((e) => e.eventId === existingEventId);
    if (!existing) return;

    // Simulate duplicate publication to Kafka topic
    const duplicateEvent: KafkaAnomalyEvent = {
      ...existing,
      isDuplicate: true,
      timestamp: new Date().toISOString()
    };
    setKafkaEvents((prev) => [duplicateEvent, ...prev]);

    // Check if processed_events table already has this ID
    if (processedEventIds.has(existingEventId)) {
      showToast(
        `🛡️ Idempotent Deduplication Verified: Event ${existingEventId} was already present in processed_events table. Consumer discarded duplicate; no second case was created.`
      );
    }
  };

  const handlePublishManualEvent = (propertyId: string, observedFlow: number, baselineValue: number) => {
    const deviationPercent = ((observedFlow - baselineValue) / baselineValue) * 100;
    const severity = deviationPercent >= 200 ? 'CRITICAL' : deviationPercent >= 100 ? 'HIGH' : 'MEDIUM';
    const eventId = `evt-manual-${Date.now().toString(16)}`;

    const event: KafkaAnomalyEvent = {
      eventId,
      eventType: 'NightFlowAnomalyDetected',
      schemaVersion: '1.0',
      timestamp: new Date().toISOString(),
      propertyId,
      baselineValue,
      observedFlow,
      deviation: parseFloat(deviationPercent.toFixed(2)),
      threshold: 50.0,
      severity,
      reason: `Direct producer test: Flow ${observedFlow.toFixed(2)} exceeds baseline ${baselineValue.toFixed(2)} by ${deviationPercent.toFixed(2)}%`
    };

    setKafkaEvents((prev) => [event, ...prev]);
    setProcessedEventIds((prev) => new Set(prev).add(eventId));

    const newCase: InvestigationCase = {
      caseId: `CASE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      propertyId,
      eventId,
      status: 'NEW',
      severity,
      observedFlow,
      baselineValue,
      deviationPercent: parseFloat(deviationPercent.toFixed(2)),
      detectedAt: new Date().toISOString(),
      detectionReason: event.reason,
      updatedAt: new Date().toISOString()
    };

    setCases((prev) => [newCase, ...prev]);
    showToast(`Published event ${eventId} directly to soa.s10.t02.events.`);
  };

  const handleUpdateCaseStatus = (
    caseId: string,
    status: CaseStatus,
    notes?: string,
    workOrderNumber?: string
  ): { success: boolean; message: string } => {
    // BACKEND AUTHORIZATION ENFORCEMENT (Section 7)
    if (currentUser.role !== 'UTILITY_ANALYST') {
      return {
        success: false,
        message: '403 Forbidden: Residents are prohibited from modifying investigation case workflows or dispatching work orders. Backend PatchCaseStatus endpoint rejected authorization.'
      };
    }

    setCases((prev) =>
      prev.map((c) => {
        if (c.caseId === caseId) {
          return {
            ...c,
            status,
            notes: notes !== undefined ? notes : c.notes,
            workOrderNumber: workOrderNumber !== undefined ? workOrderNumber : c.workOrderNumber,
            assignedAnalyst: currentUser.fullName,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );

    return {
      success: true,
      message: `Case ${caseId} updated to ${status}.`
    };
  };

  const handleBatchIngestReadings = (newReadings: MeterReading[]) => {
    setReadings((prev) => [...newReadings, ...prev]);

    // Check if any reading in night window triggers an anomaly
    let anomaliesCreated = 0;
    newReadings.forEach((r) => {
      if (r.hourOfDay >= 1 && r.hourOfDay <= 5) {
        const baselineObj = baselines.find((b) => b.propertyId === r.propertyId);
        if (baselineObj) {
          const base = baselineObj.baselineFlowUnitsPerHour;
          const dev = ((r.flowRateUnitsPerHour - base) / base) * 100;
          if (dev >= baselineObj.deviationThresholdPercent) {
            handleTriggerEvaluation(r.propertyId, r.flowRateUnitsPerHour, r.readingType === 'SIMULATED');
            anomaliesCreated++;
          }
        }
      }
    });

    if (anomaliesCreated > 0) {
      showToast(`Batch ingestion completed! Detected and published ${anomaliesCreated} night-flow anomaly events.`);
    } else {
      showToast(`Batch ingestion of ${newReadings.length} readings completed successfully.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        users={INITIAL_USERS}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        toastMessage={toastMessage}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentUser={currentUser}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
            readings={readings}
            baselines={baselines}
            onInjectReading={(r) => setReadings((prev) => [r, ...prev])}
            onTriggerEvaluation={handleTriggerEvaluation}
            onSwitchUser={handleSwitchUserRole}
          />
        )}

        {activeTab === 'critical-test' && <CriticalTestTab />}

        {activeTab === 'kafka' && (
          <KafkaStreamTab
            events={kafkaEvents}
            onPublishManualEvent={handlePublishManualEvent}
            onSendDuplicateEvent={handleSendDuplicateEvent}
          />
        )}

        {activeTab === 'cases' && (
          <CasesTab
            currentUser={currentUser}
            cases={cases}
            onUpdateCaseStatus={handleUpdateCaseStatus}
          />
        )}

        {activeTab === 'csv' && (
          <CsvUploadTab onBatchIngest={handleBatchIngestReadings} />
        )}

        {activeTab === 'architecture' && <ArchitectureTab />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">AquaSentinel · HydroWatch</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">Smart Water Leak Detection & Night-Flow Analytics</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 italic hidden sm:inline">Detect Early. Save Water. Protect Every Drop.</span>
          </div>
          <div>
            Kafka Topic: <code className="font-mono text-slate-700">soa.s10.t02.events</code> · Spring Boot 3.3.4 & React 19
          </div>
        </div>
      </footer>
    </div>
  );
}
