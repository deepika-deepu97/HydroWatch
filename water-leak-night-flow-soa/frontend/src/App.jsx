import React, { useState, useEffect } from 'react';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sky-800 tracking-wider uppercase">AquaSentinel</span>
          <h1 className="text-xl font-bold text-slate-900">HydroWatch</h1>
          <p className="text-xs text-slate-500">Smart Water Leak Detection & Night-Flow Analytics · Detect Early. Save Water. Protect Every Drop.</p>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <p className="text-sm text-slate-600">Frontend Client connected to Spring Cloud API Gateway.</p>
      </main>
    </div>
  );
}
