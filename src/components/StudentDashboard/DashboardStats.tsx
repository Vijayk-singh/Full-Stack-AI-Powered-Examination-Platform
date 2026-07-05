'use client';

import React from 'react';
import { Award, Activity, CheckCircle2 } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    avgScore: number;
    avgAccuracy: number;
    totalCompleted: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Average Score</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.avgScore} pts</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Overall Accuracy</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.avgAccuracy}%</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed Tests</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalCompleted} tests</h3>
        </div>
      </div>
    </div>
  );
}
