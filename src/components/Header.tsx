import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Key, Droplets, CheckCircle, AlertTriangle, UserCheck, Lock } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  toastMessage?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeTab,
  onSelectTab,
  toastMessage
}) => {
  const [showTokenModal, setShowTokenModal] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Night-Flow Dashboard' },
    { id: 'critical-test', label: 'Critical Baseline Test (Section 6)' },
    { id: 'kafka', label: 'Kafka Event Stream' },
    { id: 'cases', label: 'Investigation Cases' },
    { id: 'csv', label: 'CSV Telemetry Upload' },
    { id: 'architecture', label: 'Microservices & Code' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Service Identity & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-700 flex items-center justify-center text-white shadow-xs ring-1 ring-sky-700/20">
            <Droplets className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">AquaSentinel · HydroWatch</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 hidden sm:inline">Detect Early. Save Water. Protect Every Drop.</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                HydroWatch
              </h1>
              <span className="text-xs font-medium text-slate-600 hidden md:inline">
                — Smart Water Leak Detection & Night-Flow Analytics
              </span>
            </div>
          </div>
        </div>

        {/* Right side: User Switcher & JWT Token Inspector */}
        <div className="flex items-center flex-wrap gap-2">
          {/* JWT Token inspect button */}
          <button
            onClick={() => setShowTokenModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            title="View signed JWT token header, claims, and role authorization"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Inspect JWT</span>
          </button>

          {/* Role / User Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 pl-2 font-medium">Role:</span>
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {u.role === 'UTILITY_ANALYST' ? 'Utility Analyst' : u.fullName.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <nav className="flex space-x-1 sm:space-x-6 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`whitespace-nowrap px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-sky-700 text-sky-800 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Live Feedback Toast Banner */}
      {toastMessage && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center gap-2 w-full">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* JWT Inspector Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-700" />
                <h3 className="text-base font-semibold text-slate-900">Signed JWT Authorization Token</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Active Identity & Role</span>
                <div className="mt-1 p-3 bg-slate-50 rounded-lg text-xs grid grid-cols-2 gap-2 border border-slate-200">
                  <div>
                    <span className="text-slate-500">Subject (sub): </span>
                    <strong className="text-slate-900">{currentUser.username}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Role claim: </span>
                    <span className="font-mono text-sky-700 font-semibold">{currentUser.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Authorized Properties: </span>
                    <span className="font-mono font-medium text-slate-900">{currentUser.authorizedProperties}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Algorithm: </span>
                    <span className="font-mono text-emerald-700 font-semibold">HMAC-SHA256 (HS256)</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Raw Bearer Token</span>
                <pre className="mt-1 p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-800">
                  {currentUser.token}
                </pre>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">Decoded Claims Payload</span>
                <pre className="mt-1 p-3 bg-slate-900 text-sky-300 rounded-lg text-[11px] font-mono overflow-x-auto">
{JSON.stringify({
  sub: currentUser.username,
  userId: currentUser.id,
  role: currentUser.role,
  properties: currentUser.authorizedProperties,
  fullName: currentUser.fullName,
  iat: 1793220000,
  exp: 1800920000
}, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-sky-50 rounded-lg text-xs text-sky-900 border border-sky-200">
                <strong>Backend Authorization Enforcement:</strong> The API Gateway extracts these claims and injects verified HTTP headers <code className="font-mono text-sky-950 font-semibold">X-User-Id</code>, <code className="font-mono text-sky-950 font-semibold">X-User-Role</code>, and <code className="font-mono text-sky-950 font-semibold">X-User-Properties</code> into downstream microservices. If a resident attempts to access an unauthorized property ID, the downstream service returns a <code className="font-mono font-semibold">403 Forbidden</code> response.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
