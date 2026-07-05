import React from 'react';
import { Cpu } from 'lucide-react';

export default function AiTelemetry() {
  return (
    <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600">
        <Cpu className="w-5 h-5" />
        AI Execution Logs & Usage
      </h2>
      <p className="text-xs text-slate-500">
        Audit logs tracking LLM api execution counts, token consumption estimates, and operational logs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white border border-slate-850 rounded-xl">
          <span className="text-xs text-slate-500 block">Total API Calls</span>
          <span className="text-2xl font-bold text-slate-800 block mt-1">48 calls</span>
        </div>
        <div className="p-4 bg-white border border-slate-850 rounded-xl">
          <span className="text-xs text-slate-500 block">Estimated Tokens</span>
          <span className="text-2xl font-bold text-blue-600 block mt-1">142,400</span>
        </div>
        <div className="p-4 bg-white border border-slate-850 rounded-xl">
          <span className="text-xs text-slate-500 block">Monthly Token Budget</span>
          <span className="text-2xl font-bold text-emerald-600 block mt-1">1.4% Used</span>
        </div>
      </div>
    </div>
  );
}
