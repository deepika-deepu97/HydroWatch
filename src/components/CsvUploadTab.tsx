import React, { useState } from 'react';
import { MeterReading, ReadingType } from '../types';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Download, RefreshCw, Database } from 'lucide-react';

interface CsvUploadTabProps {
  onBatchIngest: (readings: MeterReading[]) => void;
}

export const CsvUploadTab: React.FC<CsvUploadTabProps> = ({ onBatchIngest }) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedReadings, setParsedReadings] = useState<MeterReading[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const sampleHomeA = `property_id,timestamp,flow_rate_units_per_hour,reading_type,battery_level
PROP-HOME-A,2026-10-28T01:00:00Z,34.80,REAL,98
PROP-HOME-A,2026-10-28T02:00:00Z,35.20,REAL,98
PROP-HOME-A,2026-10-28T03:00:00Z,35.00,REAL,98
PROP-HOME-A,2026-10-28T04:00:00Z,34.90,REAL,98
PROP-HOME-A,2026-10-28T05:00:00Z,35.10,REAL,98`;

  const sampleHomeB = `property_id,timestamp,flow_rate_units_per_hour,reading_type,battery_level
PROP-HOME-B,2026-10-28T01:00:00Z,31.20,REAL,99
PROP-HOME-B,2026-10-28T02:00:00Z,33.50,REAL,99
PROP-HOME-B,2026-10-28T03:00:00Z,35.00,REAL,99
PROP-HOME-B,2026-10-28T04:00:00Z,32.00,REAL,99
PROP-HOME-B,2026-10-28T05:00:00Z,31.00,REAL,99`;

  const validateAndParse = (text: string) => {
    setCsvContent(text);
    setUploadSuccessMessage(null);
    const lines = text.trim().split('\n');
    const errors: string[] = [];
    const validRows: MeterReading[] = [];

    if (lines.length < 2) {
      setValidationErrors(['CSV file is empty or missing data rows.']);
      setParsedReadings([]);
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const propIdx = header.indexOf('property_id');
    const timeIdx = header.indexOf('timestamp');
    const flowIdx = header.indexOf('flow_rate_units_per_hour');
    const typeIdx = header.indexOf('reading_type');
    const batteryIdx = header.indexOf('battery_level');

    if (propIdx === -1 || timeIdx === -1 || flowIdx === -1) {
      errors.push('Missing required CSV columns: property_id, timestamp, flow_rate_units_per_hour');
      setValidationErrors(errors);
      setParsedReadings([]);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map((p) => p.trim());

      const propId = parts[propIdx];
      const timeStr = parts[timeIdx];
      const flowStr = parts[flowIdx];
      const typeStr = (typeIdx !== -1 ? parts[typeIdx] : 'REAL').toUpperCase();
      const batteryStr = batteryIdx !== -1 ? parts[batteryIdx] : '98';

      if (!propId) {
        errors.push(`Row ${i + 1}: Empty property_id`);
        continue;
      }

      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${i + 1}: Invalid ISO-8601 timestamp "${timeStr}"`);
        continue;
      }

      const flow = parseFloat(flowStr);
      if (isNaN(flow) || flow < 0) {
        errors.push(`Row ${i + 1}: Invalid numerical flow rate "${flowStr}"`);
        continue;
      }

      validRows.push({
        id: `CSV-ROW-${i}-${Date.now()}`,
        propertyId: propId,
        timestamp: timeStr,
        hourOfDay: date.getUTCHours(),
        flowRateUnitsPerHour: flow,
        readingType: (typeStr === 'SIMULATED' ? 'SIMULATED' : 'REAL') as ReadingType,
        batteryLevel: parseInt(batteryStr, 10) || 98,
        qualityFlag: 'OK'
      });
    }

    setValidationErrors(errors);
    setParsedReadings(validRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const handleIngest = () => {
    if (parsedReadings.length === 0) return;
    onBatchIngest(parsedReadings);
    setUploadSuccessMessage(
      `Successfully ingested ${parsedReadings.length} hourly meter readings into meter-series-service!`
    );
  };

  const handleDownloadTemplate = () => {
    const csvData = `property_id,timestamp,flow_rate_units_per_hour,reading_type,battery_level\nPROP-HOME-A,2026-10-28T03:00:00Z,35.00,REAL,98\n`;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_meter_readings_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-700" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Meter Telemetry CSV Ingestion & Validation
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Parsed and verified by <code className="font-mono text-slate-800">meter-series-service</code> via endpoint <code className="font-mono text-slate-800">POST /api/v1/readings/csv-upload</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        {/* Load Sample Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center pr-2">
            Load Test Datasets:
          </span>
          <button
            onClick={() => validateAndParse(sampleHomeA)}
            className="px-3 py-1.5 text-xs font-medium bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-md transition-colors"
          >
            Load Home A Night Leak CSV (35 u/h)
          </button>
          <button
            onClick={() => validateAndParse(sampleHomeB)}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md transition-colors"
          >
            Load Home B Normal CSV (35 u/h)
          </button>
        </div>
      </div>

      {/* Upload Box / Input Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Upload CSV File or Paste Raw Content</h3>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs text-slate-600 mb-1">
              Drag and drop your meter CSV file here, or browse
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-700 file:text-white hover:file:bg-sky-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Raw CSV Text Editor:</label>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => validateAndParse(e.target.value)}
              placeholder="property_id,timestamp,flow_rate_units_per_hour,reading_type,battery_level&#10;PROP-HOME-A,2026-10-28T03:00:00Z,35.00,REAL,98"
              className="w-full p-3 bg-slate-950 text-sky-300 rounded-lg text-xs font-mono border border-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Validation Results & Ingest Action */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Validation Status & Preview</h3>
            {parsedReadings.length > 0 && validationErrors.length === 0 && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Valid Schema ({parsedReadings.length} rows)
              </span>
            )}
          </div>

          {/* Errors list */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                CSV Validation Errors Found:
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadSuccessMessage && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{uploadSuccessMessage}</span>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                <tr>
                  <th className="p-2">Property</th>
                  <th className="p-2">Timestamp (UTC)</th>
                  <th className="p-2">Flow Rate</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Battery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {parsedReadings.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-800">{r.propertyId}</td>
                    <td className="p-2 text-slate-600">{r.timestamp}</td>
                    <td className="p-2 text-sky-700 font-bold">{r.flowRateUnitsPerHour.toFixed(2)} u/h</td>
                    <td className="p-2 text-slate-600">{r.readingType}</td>
                    <td className="p-2 text-slate-600">{r.batteryLevel}%</td>
                  </tr>
                ))}
                {parsedReadings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 font-sans text-xs">
                      No records parsed. Paste CSV or load sample above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleIngest}
            disabled={parsedReadings.length === 0 || validationErrors.length > 0}
            className={`w-full py-2.5 px-4 rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 ${
              parsedReadings.length > 0 && validationErrors.length === 0
                ? 'bg-sky-700 hover:bg-sky-800 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Ingest {parsedReadings.length} Readings into Backend Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
