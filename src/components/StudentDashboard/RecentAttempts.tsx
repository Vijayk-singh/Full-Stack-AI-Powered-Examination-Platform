'use client';

import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecentAttemptsProps {
  attempts: any[];
  loadingAttempts: boolean;
}

export default function RecentAttempts({ attempts, loadingAttempts }: RecentAttemptsProps) {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
        <Activity className="w-5 h-5 text-emerald-600" />
        Recent Attempts
      </h2>

      {loadingAttempts ? (
        <div className="py-8 text-center text-slate-500">Loading attempts...</div>
      ) : attempts.length === 0 ? (
        <div className="py-8 text-center text-slate-500">You haven't attempted any tests yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {attempts.map((attempt: any) => (
            <div
              key={attempt._id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition"
            >
              <div>
                <h4 className="font-semibold text-slate-800">{attempt.testId?.title || 'Practice Test'}</h4>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded font-semibold text-emerald-700">
                    {attempt.testId?.subjectId?.name || 'General'}
                  </span>
                  <span>Time: {Math.round(attempt.completionTime / 60)}m {attempt.completionTime % 60}s</span>
                  <span>Accuracy: {attempt.accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <span className="font-bold text-slate-800">{attempt.score} pts</span>
                <button
                  onClick={() => router.push(`/test/${attempt.testId?._id}/result/${attempt._id}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer"
                >
                  View Analysis <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
