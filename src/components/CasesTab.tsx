import React, { useState } from 'react';
import { InvestigationCase, User, CaseStatus, Severity } from '../types';
import {
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench,
  Search,
  Filter,
  PlusCircle,
  Lock,
  FileText,
  UserCheck
} from 'lucide-react';

interface CasesTabProps {
  currentUser: User;
  cases: InvestigationCase[];
  onUpdateCaseStatus: (caseId: string, status: CaseStatus, notes?: string, workOrderNumber?: string) => { success: boolean; message: string };
}

export const CasesTab: React.FC<CasesTabProps> = ({
  currentUser,
  cases,
  onUpdateCaseStatus
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.caseId || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newStatus, setNewStatus] = useState<CaseStatus>('INVESTIGATING');
  const [analystNoteInput, setAnalystNoteInput] = useState<string>('');
  const [workOrderInput, setWorkOrderInput] = useState<string>('');
  const [feedbackNotice, setFeedbackNotice] = useState<{ isError: boolean; text: string } | null>(null);

  const isAnalyst = currentUser.role === 'UTILITY_ANALYST';

  // Residents only see cases for their authorized properties
  const filteredCases = cases.filter((c) => {
    if (!isAnalyst && currentUser.authorizedProperties !== '*') {
      if (!currentUser.authorizedProperties.includes(c.propertyId)) {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const selectedCase = cases.find((c) => c.caseId === selectedCaseId) || filteredCases[0];

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    const result = onUpdateCaseStatus(
      selectedCase.caseId,
      newStatus,
      analystNoteInput.trim() ? analystNoteInput : undefined,
      workOrderInput.trim() ? workOrderInput : undefined
    );

    setFeedbackNotice({
      isError: !result.success,
      text: result.message
    });

    if (result.success) {
      setAnalystNoteInput('');
    }
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INVESTIGATING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED_LEAK':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'REPAIRED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FALSE_POSITIVE':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'CLOSED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-sky-700" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Investigation Cases & Workflow State
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Owned by <code className="font-mono text-slate-800">leak-case-service</code> (Port 8084 · Database: <code className="font-mono text-slate-800">leak_case_db</code>). Cases automatically spawn from Kafka <code className="font-mono text-sky-800">NightFlowAnomalyDetected</code> events.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {['ALL', 'NEW', 'INVESTIGATING', 'CONFIRMED_LEAK', 'REPAIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Cases' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {feedbackNotice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-fade-in ${
            feedbackNotice.isError
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.isError ? (
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-xs font-semibold px-2 py-0.5 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Cases Table / List + Case Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">
              {isAnalyst ? 'Utility-Wide Cases' : `Cases for ${currentUser.authorizedProperties}`} ({filteredCases.length})
            </span>
            <span>{isAnalyst ? 'Analyst Mode' : 'Resident View'}</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.caseId === c.caseId;
              return (
                <div
                  key={c.caseId}
                  onClick={() => {
                    setSelectedCaseId(c.caseId);
                    setNewStatus(c.status);
                    setWorkOrderInput(c.workOrderNumber || '');
                  }}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-900">{c.caseId}</span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${getStatusColor(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-slate-600 font-medium">{c.propertyId}</div>

                  <div className="flex items-center justify-between mt-2 text-slate-500 text-[11px] font-mono">
                    <span>Flow: {c.observedFlow.toFixed(1)} u/h</span>
                    <span className="text-rose-600 font-bold">+{c.deviationPercent.toFixed(1)}%</span>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400">
                    Detected: {new Date(c.detectedAt).toLocaleDateString()} at {new Date(c.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}

            {filteredCases.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No investigation cases match filter.
              </div>
            )}
          </div>
        </div>

        {/* Case Detail & Workflow Transitions */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">Case Identifier:</span>
                    <h3 className="text-lg font-bold font-mono text-slate-900">{selectedCase.caseId}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Triggered by Kafka Event: <code className="font-mono text-sky-800">{selectedCase.eventId}</code>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-md text-xs font-bold border ${getStatusColor(selectedCase.status)}`}>
                  Status: {selectedCase.status.replace('_', ' ')}
                </div>
              </div>

              {/* Anomaly Evidence Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 uppercase text-[10px] font-semibold">Target Property</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">{selectedCase.propertyId}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 uppercase text-[10px] font-semibold">Observed Flow</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">{selectedCase.observedFlow.toFixed(1)} u/h</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 uppercase text-[10px] font-semibold">Property Baseline</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">{selectedCase.baselineValue.toFixed(1)} u/h</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 uppercase text-[10px] font-semibold">Deviation</span>
                  <div className="font-mono font-bold text-rose-600 mt-1">+{selectedCase.deviationPercent.toFixed(1)}%</div>
                </div>
              </div>

              {/* Detection Reason */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Detection Logic</h4>
                <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-xs text-rose-900 leading-relaxed font-mono">
                  {selectedCase.detectionReason}
                </div>
              </div>

              {/* Case Workflow & Audit Notes */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Analyst Audit Log & Dispatch</h4>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Assigned Analyst: <strong>{selectedCase.assignedAnalyst || 'Unassigned'}</strong></span>
                    <span>Work Order: <strong className="font-mono text-sky-800">{selectedCase.workOrderNumber || 'None'}</strong></span>
                  </div>
                  {selectedCase.notes ? (
                    <div className="pt-2 border-t border-slate-200 text-slate-800 font-sans">
                      <span className="text-slate-500 text-[11px] block mb-0.5">Investigation Notes:</span>
                      {selectedCase.notes}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[11px]">No notes added yet.</div>
                  )}
                </div>
              </div>

              {/* Analyst Action Form (Section 7 RBAC Enforcement Demo) */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-sky-700" />
                    <h4 className="text-xs font-semibold uppercase text-slate-900 tracking-wider">
                      Workflow State Transition
                    </h4>
                  </div>
                  {!isAnalyst && (
                    <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Analyst Permission Required
                    </span>
                  )}
                </div>

                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Update Status:</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-medium"
                      >
                        <option value="NEW">NEW</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="CONFIRMED_LEAK">CONFIRMED_LEAK</option>
                        <option value="REPAIRED">REPAIRED</option>
                        <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Dispatch Work Order # (optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. WO-2026-9901"
                        value={workOrderInput}
                        onChange={(e) => setWorkOrderInput(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Analyst Investigation Note:</label>
                    <textarea
                      rows={2}
                      placeholder="Enter acoustic sensor findings, valve inspection outcome, or technician feedback..."
                      value={analystNoteInput}
                      onChange={(e) => setAnalystNoteInput(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-xs font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      PATCH <code className="font-mono text-slate-700">/api/v1/cases/{selectedCase.caseId}/status</code>
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-md shadow-xs transition-colors"
                    >
                      Apply Case Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              Select a case from the list to view investigation details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
