import React, { useState } from 'react';
import { KafkaAnomalyEvent } from '../types';
import { Activity, Copy, Check, AlertTriangle, ShieldCheck, Database, RefreshCw, Send } from 'lucide-react';

interface KafkaStreamTabProps {
  events: KafkaAnomalyEvent[];
  onPublishManualEvent: (propertyId: string, observedFlow: number, baselineValue: number) => void;
  onSendDuplicateEvent: (eventId: string) => void;
}

export const KafkaStreamTab: React.FC<KafkaStreamTabProps> = ({
  events,
  onPublishManualEvent,
  onSendDuplicateEvent
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.eventId || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [manualProp, setManualProp] = useState('PROP-HOME-A');
  const [manualFlow, setManualFlow] = useState('38.5');
  const [manualBase, setManualBase] = useState('10.0');
  const [viewMode, setViewMode] = useState<'EVENTS' | 'SCHEMA'>('EVENTS');

  const selectedEvent = events.find((e) => e.eventId === selectedEventId) || events[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    onPublishManualEvent(manualProp, parseFloat(manualFlow), parseFloat(manualBase));
  };

  return (
    <div className="space-y-6">
      {/* Topic Status Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apache Kafka Topic</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono mt-0.5">
            soa.s10.t02.events
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Partitions: <strong>3</strong></span>
            <span aria-hidden="true">·</span>
            <span>Replication: <strong>1</strong></span>
            <span aria-hidden="true">·</span>
            <span>Key Serializer: <strong>StringSerializer (Property ID Key)</strong></span>
            <span aria-hidden="true">·</span>
            <span>Value: <strong>JsonSerializer</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('EVENTS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'EVENTS' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Event Stream ({events.length})
            </button>
            <button
              onClick={() => setViewMode('SCHEMA')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'SCHEMA' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              JSON Schema v1.0
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'SCHEMA' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 font-mono">
              NightFlowAnomalyDetected.v1.json
            </h3>
            <span className="text-xs text-slate-500">Draft-07 Compliant Schema</span>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
{`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NightFlowAnomalyDetected",
  "type": "object",
  "required": [
    "eventId", "eventType", "schemaVersion", "timestamp",
    "propertyId", "baselineValue", "observedFlow",
    "deviation", "threshold", "severity", "reason"
  ],
  "properties": {
    "eventId": { "type": "string" },
    "eventType": { "type": "string", "enum": ["NightFlowAnomalyDetected"] },
    "schemaVersion": { "type": "string", "enum": ["1.0"] },
    "timestamp": { "type": "string", "format": "date-time" },
    "propertyId": { "type": "string" },
    "baselineValue": { "type": "number", "minimum": 0 },
    "observedFlow": { "type": "number", "minimum": 0 },
    "deviation": { "type": "number" },
    "threshold": { "type": "number", "minimum": 0 },
    "severity": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    "reason": { "type": "string" }
  }
}`}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Event Stream Feed */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Event Records ({events.length})
              </span>
              <span className="text-[11px] text-slate-400">Chronological feed</span>
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {events.map((evt) => {
                const isSelected = selectedEvent?.eventId === evt.eventId;
                return (
                  <div
                    key={evt.eventId}
                    onClick={() => setSelectedEventId(evt.eventId)}
                    className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900">{evt.propertyId}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                      <span>Flow: {evt.observedFlow.toFixed(1)} u/h</span>
                      <span className="text-rose-600 font-bold">+{evt.deviation.toFixed(1)}%</span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
                      ID: {evt.eventId}
                    </div>

                    {evt.isDuplicate && (
                      <div className="mt-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-semibold">
                        ⚠️ Duplicate Test Event (Deduplicated)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Event Inspector & Idempotency Test */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEvent ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-500">Payload Inspector</span>
                    <h3 className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {selectedEvent.eventType} <span className="text-xs text-sky-700 font-sans">v{selectedEvent.schemaVersion}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedEvent, null, 2), selectedEvent.eventId)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      {copiedId === selectedEvent.eventId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>

                    {/* Idempotency Test Button */}
                    <button
                      onClick={() => onSendDuplicateEvent(selectedEvent.eventId)}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                      title="Re-send this exact event ID to test consumer duplicate rejection"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Test Duplicate Protection</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Property ID</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedEvent.propertyId}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Baseline Value</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedEvent.baselineValue.toFixed(1)} u/h</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Observed Flow</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedEvent.observedFlow.toFixed(1)} u/h</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Deviation</span>
                    <div className="font-mono font-bold text-rose-600 mt-0.5">+{selectedEvent.deviation.toFixed(1)}%</div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Kafka JSON Message</span>
                  <pre className="mt-1.5 p-4 bg-slate-950 text-sky-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                </div>

                <div className="mt-4 p-3.5 bg-sky-50 rounded-lg border border-sky-200 text-xs text-sky-900">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Database className="w-4 h-4 text-sky-700" />
                    <span>Downstream Consumption Guarantee:</span>
                  </div>
                  The <strong>LeakCase Service</strong> consumes from group <code className="font-mono text-sky-950 font-semibold">leak-case-group</code>. When this event was received, it queried its own PostgreSQL table <code className="font-mono text-sky-950 font-semibold">processed_events</code> using <code className="font-mono font-semibold">existsByEventId("{selectedEvent.eventId}")</code> to enforce idempotency before persisting an investigation case into <code className="font-mono text-sky-950 font-semibold">investigation_cases</code>.
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No events currently on topic soa.s10.t02.events.
              </div>
            )}

            {/* Manual Kafka Publisher Console */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-sky-700" />
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Direct Kafka Producer Simulator
                </h4>
              </div>
              <form onSubmit={handlePublish} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Target Property:</label>
                  <select
                    value={manualProp}
                    onChange={(e) => setManualProp(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                  >
                    <option value="PROP-HOME-A">PROP-HOME-A (Base 10)</option>
                    <option value="PROP-HOME-B">PROP-HOME-B (Base 30)</option>
                    <option value="PROP-COMM-C">PROP-COMM-C (Base 65)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Observed Flow (u/h):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualFlow}
                    onChange={(e) => setManualFlow(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Baseline (u/h):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualBase}
                    onChange={(e) => setManualBase(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-md shadow-xs transition-colors"
                  >
                    Publish to Kafka
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
