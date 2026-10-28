import React, { useState } from 'react';
import { Property, MeterReading, BaselineRecord, User, Severity } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Sliders,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardTabProps {
  currentUser: User;
  properties: Property[];
  selectedPropertyId: string;
  onSelectProperty: (id: string) => void;
  readings: MeterReading[];
  baselines: BaselineRecord[];
  onInjectReading: (reading: MeterReading) => void;
  onTriggerEvaluation: (propertyId: string, flowRate: number, isSimulated: boolean) => void;
  onSwitchUser: (userRole: 'UTILITY_ANALYST' | 'RESIDENT_A' | 'RESIDENT_B') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentUser,
  properties,
  selectedPropertyId,
  onSelectProperty,
  readings,
  baselines,
  onInjectReading,
  onTriggerEvaluation,
  onSwitchUser
}) => {
  const [simulatedFlowInput, setSimulatedFlowInput] = useState<number>(35.0);
  const [selectedHour, setSelectedHour] = useState<number>(3); // 03:00 AM
  const [simFilter, setSimFilter] = useState<'ALL' | 'REAL_ONLY' | 'SIMULATED_ONLY'>('ALL');

  // Authorization Check for current property
  const isAuthorized =
    currentUser.role === 'UTILITY_ANALYST' ||
    currentUser.authorizedProperties === '*' ||
    currentUser.authorizedProperties.includes(selectedPropertyId);

  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const activeBaseline = baselines.find((b) => b.propertyId === selectedPropertyId) || {
    baselineFlowUnitsPerHour: activeProperty.baselineFlow,
    deviationThresholdPercent: activeProperty.deviationThresholdPercent,
    windowStartHour: 1,
    windowEndHour: 5,
    sampleReadingsCount: 120,
    calculationMethod: 'MEDIAN_NIGHT_FLOW_30D',
    id: 'BASE-DEFAULT',
    propertyId: activeProperty.id,
    updatedAt: ''
  };

  // Filter readings for chart
  const propertyReadings = readings
    .filter((r) => r.propertyId === selectedPropertyId)
    .filter((r) => {
      if (simFilter === 'REAL_ONLY') return r.readingType === 'REAL';
      if (simFilter === 'SIMULATED_ONLY') return r.readingType === 'SIMULATED';
      return true;
    })
    .sort((a, b) => a.hourOfDay - b.hourOfDay);

  // Transform readings into 24-hr chart data
  const chartData = propertyReadings.map((r) => {
    const isNightWindow = r.hourOfDay >= activeBaseline.windowStartHour && r.hourOfDay <= activeBaseline.windowEndHour;
    const thresholdFlow = activeBaseline.baselineFlowUnitsPerHour * (1 + activeBaseline.deviationThresholdPercent / 100);
    const deviation = ((r.flowRateUnitsPerHour - activeBaseline.baselineFlowUnitsPerHour) / activeBaseline.baselineFlowUnitsPerHour) * 100;
    const isAnomaly = isNightWindow && deviation >= activeBaseline.deviationThresholdPercent;

    return {
      hour: `${r.hourOfDay.toString().padStart(2, '0')}:00`,
      hourNum: r.hourOfDay,
      flowRate: r.flowRateUnitsPerHour,
      baseline: activeBaseline.baselineFlowUnitsPerHour,
      threshold: thresholdFlow,
      deviation: deviation.toFixed(1),
      isNightWindow,
      isAnomaly,
      readingType: r.readingType
    };
  });

  // Calculate current night flow at 03:00 (critical observation anchor)
  const nightReading = propertyReadings.find((r) => r.hourOfDay === 3) || propertyReadings[0];
  const currentFlow = nightReading ? nightReading.flowRateUnitsPerHour : activeProperty.baselineFlow;
  const deviationPercent = ((currentFlow - activeBaseline.baselineFlowUnitsPerHour) / activeBaseline.baselineFlowUnitsPerHour) * 100;
  const isFlagged = deviationPercent >= activeBaseline.deviationThresholdPercent;

  const handleApplyPreset = (flow: number) => {
    setSimulatedFlowInput(flow);
  };

  const handleRunSimulation = () => {
    onTriggerEvaluation(selectedPropertyId, simulatedFlowInput, true);
  };

  // If user is denied access to this property
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl border border-rose-200 p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">403 Forbidden: Access Denied</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
            Resident <strong>{currentUser.fullName}</strong> is authorized strictly for property{' '}
            <code className="font-mono text-rose-700 font-semibold">{currentUser.authorizedProperties}</code>.
            As enforced by the backend <code className="font-mono text-slate-800">PropertyAuthorizationFilter</code>, residents are prohibited from accessing other properties' telemetry or baselines.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onSelectProperty(currentUser.authorizedProperties)}
              className="px-4 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-md transition-colors"
            >
              Return to Authorized Property ({currentUser.authorizedProperties})
            </button>
            <button
              onClick={() => onSwitchUser('UTILITY_ANALYST')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            >
              Switch to Utility Analyst Role
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Selector & Info Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="property-select" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Selected Property:
          </label>
          <select
            id="property-select"
            value={selectedPropertyId}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            {properties.map((p) => {
              const allowed =
                currentUser.role === 'UTILITY_ANALYST' ||
                currentUser.authorizedProperties === '*' ||
                currentUser.authorizedProperties.includes(p.id);
              return (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.address} {allowed ? '' : '🔒 (Forbidden)'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quiet metadata and branding */}
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="text-sky-800 font-semibold hidden md:inline">HydroWatch</span>
          <span className="text-slate-300 hidden md:inline" aria-hidden="true">·</span>
          <span>Meter: <strong className="font-mono text-slate-800">{activeProperty.meterSerialNumber}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Zone: <strong className="text-slate-800">{activeProperty.zoneName}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Window: <strong className="font-mono text-sky-800">01:00 – 05:00</strong></span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Night Flow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Property Baseline Flow</span>
            <Gauge className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {activeBaseline.baselineFlowUnitsPerHour.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">units/hour</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            30-day median during 01:00-05:00 window ({activeBaseline.sampleReadingsCount} samples)
          </div>
        </div>

        {/* Night-Window Observed Flow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Observed Night Flow (03:00)</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {currentFlow.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">units/hour</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Threshold limit: {(activeBaseline.baselineFlowUnitsPerHour * 1.5).toFixed(1)} units/hour (+50%)
          </div>
        </div>

        {/* Deviation Percentage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Flow Deviation</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                deviationPercent >= activeBaseline.deviationThresholdPercent
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}
            >
              {deviationPercent >= 0 ? `+${deviationPercent.toFixed(1)}%` : `${deviationPercent.toFixed(1)}%`}
            </span>
            <span className="text-xs text-slate-500">vs baseline</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Configured anomaly threshold: <strong className="font-mono text-slate-700">+{activeBaseline.deviationThresholdPercent}%</strong>
          </div>
        </div>

        {/* Real-time Status Card */}
        <div
          className={`rounded-xl border p-5 shadow-2xs transition-colors ${
            isFlagged
              ? 'bg-rose-50/50 border-rose-300'
              : 'bg-emerald-50/50 border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={isFlagged ? 'text-rose-800 font-semibold' : 'text-emerald-800 font-semibold'}>
              Anomaly Status
            </span>
            {isFlagged ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold tracking-tight ${
                isFlagged ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {isFlagged ? 'ANOMALY FLAGGED' : 'NORMAL NIGHT FLOW'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            {isFlagged
              ? 'Deviation exceeds +50% threshold. Kafka event published.'
              : 'Night flow is within acceptable baseline variance.'}
          </div>
        </div>
      </div>

      {/* 24-Hour Telemetry Timeline Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              24-Hour Flow Profile & Night Baseline Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Night-flow evaluation window (01:00 to 05:00) highlighted in blue. Flow spikes above threshold indicate leak.
            </p>
          </div>

          {/* Filter between real and simulated */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setSimFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                simFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Telemetry
            </button>
            <button
              onClick={() => setSimFilter('REAL_ONLY')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                simFilter === 'REAL_ONLY' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Real Only
            </button>
            <button
              onClick={() => setSimFilter('SIMULATED_ONLY')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                simFilter === 'SIMULATED_ONLY' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulated Only
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit=" u/h" domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg space-y-1 font-mono">
                        <div className="text-slate-300 font-sans font-semibold">Time: {label}</div>
                        <div>
                          Observed Flow: <strong className="text-sky-300">{data.flowRate} units/h</strong>
                        </div>
                        <div>
                          Property Baseline: <span className="text-slate-400">{data.baseline} units/h</span>
                        </div>
                        <div>
                          Threshold (+50%): <span className="text-amber-400">{data.threshold.toFixed(1)} units/h</span>
                        </div>
                        <div>
                          Deviation: <span className={data.isAnomaly ? 'text-rose-400 font-bold' : 'text-emerald-400'}>+{data.deviation}%</span>
                        </div>
                        {data.isNightWindow && (
                          <div className="pt-1 text-[10px] text-sky-400 border-t border-slate-700">
                            ★ Night-Flow Analysis Window (01:00-05:00)
                          </div>
                        )}
                        {data.isAnomaly && (
                          <div className="text-[10px] text-rose-400 font-bold">
                            ⚠️ ANOMALY DETECTED (Exceeds +50%)
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Highlight Night Window: 01:00 to 05:00 */}
              <ReferenceArea
                x1="01:00"
                x2="05:00"
                fill="#38bdf8"
                fillOpacity={0.08}
                label={{
                  value: 'Night Window (01:00 - 05:00)',
                  position: 'insideTopLeft',
                  fill: '#0284c7',
                  fontSize: 10
                }}
              />
              {/* Baseline Reference Line */}
              <ReferenceLine
                y={activeBaseline.baselineFlowUnitsPerHour}
                stroke="#0284c7"
                strokeDasharray="4 4"
                label={{
                  value: `Baseline: ${activeBaseline.baselineFlowUnitsPerHour} u/h`,
                  fill: '#0284c7',
                  fontSize: 10,
                  position: 'left'
                }}
              />
              {/* +50% Threshold Reference Line */}
              <ReferenceLine
                y={activeBaseline.baselineFlowUnitsPerHour * 1.5}
                stroke="#e11d48"
                strokeDasharray="3 3"
                label={{
                  value: `Threshold (+50%): ${(activeBaseline.baselineFlowUnitsPerHour * 1.5).toFixed(1)} u/h`,
                  fill: '#e11d48',
                  fontSize: 10,
                  position: 'right'
                }}
              />
              <Line
                type="monotone"
                dataKey="flowRate"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0f172a' }}
                activeDot={{ r: 6 }}
                name="Observed Flow Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
              <span>Observed Flow</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-sky-600 inline-block"></span>
              <span>Baseline ({activeBaseline.baselineFlowUnitsPerHour} u/h)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-rose-600 inline-block"></span>
              <span>Anomaly Threshold (+50%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-sky-200/40 inline-block rounded-xs"></span>
              <span>Night Window (01:00 - 05:00)</span>
            </span>
          </div>
          <div>
            Data Source: <strong className="font-mono text-slate-700">meter_series_db.meter_readings</strong>
          </div>
        </div>
      </div>

      {/* Deterministic Flow Simulator Section (Domain Requirement #8) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-700" />
            <h3 className="text-base font-bold text-slate-900">Deterministic Night-Flow Simulator</h3>
          </div>
          <span className="text-xs text-slate-500">Generates SIMULATED readings & evaluates Kafka trigger</span>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Inject test telemetry into the night-flow window (01:00–05:00) for{' '}
          <strong>{activeProperty.id}</strong>. The backend Baseline Service computes deviation relative to this property's baseline ({activeBaseline.baselineFlowUnitsPerHour} u/h). If deviation $\ge 50\%$, it emits a <code className="font-mono text-sky-800">NightFlowAnomalyDetected</code> event to Kafka.
        </p>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Simulation Presets:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPreset(activeBaseline.baselineFlowUnitsPerHour)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            >
              Normal Sleep ({activeBaseline.baselineFlowUnitsPerHour} u/h · 0%)
            </button>
            <button
              onClick={() => handleApplyPreset(35.0)}
              className="px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors"
            >
              Exact Test Case: 35.0 u/h ({selectedPropertyId === 'PROP-HOME-A' ? '+250% FLAG' : '+16.7% PASS'})
            </button>
            <button
              onClick={() => handleApplyPreset(activeBaseline.baselineFlowUnitsPerHour + 20)}
              className="px-3 py-1.5 text-xs font-medium bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-md transition-colors"
            >
              Toilet Flapper Leak ({(activeBaseline.baselineFlowUnitsPerHour + 20).toFixed(1)} u/h)
            </button>
            <button
              onClick={() => handleApplyPreset(activeBaseline.baselineFlowUnitsPerHour + 65)}
              className="px-3 py-1.5 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-md transition-colors"
            >
              Ruptured Pipe Emergency ({(activeBaseline.baselineFlowUnitsPerHour + 65).toFixed(1)} u/h)
            </button>
          </div>
        </div>

        {/* Slider & Execution Bar */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">Simulated Flow Rate:</span>
              <strong className="font-mono text-sky-700 text-sm">{simulatedFlowInput.toFixed(1)} u/h</strong>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="0.5"
              value={simulatedFlowInput}
              onChange={(e) => setSimulatedFlowInput(parseFloat(e.target.value))}
              className="w-full accent-sky-600"
            />
          </div>

          <div className="text-xs space-y-1 border-l border-slate-200 pl-4">
            <div>
              Baseline: <span className="font-mono font-semibold">{activeBaseline.baselineFlowUnitsPerHour} u/h</span>
            </div>
            <div>
              Projected Deviation:{' '}
              <strong
                className={`font-mono ${
                  ((simulatedFlowInput - activeBaseline.baselineFlowUnitsPerHour) /
                    activeBaseline.baselineFlowUnitsPerHour) *
                    100 >=
                  50
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {(
                  ((simulatedFlowInput - activeBaseline.baselineFlowUnitsPerHour) /
                    activeBaseline.baselineFlowUnitsPerHour) *
                  100
                ).toFixed(1)}
                %
              </strong>
            </div>
            <div>
              Evaluation:{' '}
              <span className="font-semibold">
                {((simulatedFlowInput - activeBaseline.baselineFlowUnitsPerHour) /
                  activeBaseline.baselineFlowUnitsPerHour) *
                  100 >=
                50
                  ? '⚠️ Anomalous (Will publish Kafka event)'
                  : '✓ Normal Range'}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunSimulation}
              className="w-full md:w-auto px-5 py-2.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simulate Reading & Evaluate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
