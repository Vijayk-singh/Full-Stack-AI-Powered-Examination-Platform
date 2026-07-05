'use client';

import React, { use, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../../lib/redux/hooks';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { setAuth, logout, hydrateAuth } from '../../../../../lib/redux/slices/authSlice';
import { jsPDF } from 'jspdf';
import { Award, ShieldAlert, Cpu, Download, ArrowLeft, RefreshCw, BarChart, BookOpen, Clock, Loader } from 'lucide-react';

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const router = useRouter();
  
  // Resolve Next.js 15 parameters
  const resolvedParams = use(params);
  const testId = resolvedParams.id;
  const attemptId = resolvedParams.attemptId;

  const token = useAppSelector(state => state.auth.accessToken);


  // 1. Fetch Attempt grading info
  const { data: attemptData, isLoading: loadingAttempt } = useQuery({
    queryKey: ['attemptDetails', attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load attempt details');
      return res.json();
    },
    enabled: !!token && !!attemptId,
  });

  // 2. Fetch AI performance report
  const { data: analysisData, isLoading: loadingAnalysis, refetch: reloadAnalysis } = useQuery({
    queryKey: ['attemptAnalysis', attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/attempts/${attemptId}/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load AI report');
      return res.json();
    },
    enabled: !!token && !!attemptId,
    retry: 3, // AI reports might generate in background, let it retry
  });

  const attempt = attemptData?.data;
  const analysis = analysisData?.data;

  const handleDownloadPDF = () => {
    if (!attempt || !analysis) return;

    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); // Navy background header
    doc.rect(0, 0, 210, 50, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Solvekar AI', 20, 25);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text('Smart AI-Powered Evaluation Suite', 20, 35);

    // Metadata
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('EXAMINATION CERTIFICATE & REPORT', 20, 70);

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Candidate Name:  Vijay Kumar`, 20, 85);
    doc.text(`Exam Sheet:      ${attempt.testId?.title || 'Online Test'}`, 20, 93);
    doc.text(`Subject:         ${attempt.testId?.subjectId?.name || 'General'}`, 20, 101);
    doc.text(`Score Obtained:  ${attempt.score} pts`, 20, 109);
    doc.text(`Time Utilization: ${Math.round(attempt.completionTime / 60)} mins ${attempt.completionTime % 60} secs`, 20, 117);
    doc.text(`Overall Accuracy: ${attempt.accuracy}%`, 20, 125);

    doc.line(20, 133, 190, 133);

    // AI Counseling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('AI Weakness & Recommendations Analysis', 20, 143);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Strong Areas: ${analysis.strengths?.join(', ') || 'N/A'}`, 20, 153);
    doc.text(`Weak Areas:   ${analysis.weaknesses?.join(', ') || 'N/A'}`, 20, 161);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Suggested Study Strategy:', 20, 175);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    const plan = analysis.recommendations?.suggestedRevisionPlan || 'Mistakes review and mock practicing recommended.';
    const splitPlan = doc.splitTextToSize(plan, 170);
    doc.text(splitPlan, 20, 183);

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This is an AI-generated verification certificate issued by Solvekar Exam platform.', 20, 280);

    doc.save(`Solvekar_Scorecard_${attemptId}.pdf`);
  };

  if (loadingAttempt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Compiling exam answers scorecards...</span>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-2" />
        <h3 className="text-xl font-bold text-white">Result sheet unavailable</h3>
        <p className="text-slate-400 text-sm mt-1 mb-4">The request reference ID could not be loaded.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-slate-800 rounded-lg text-white font-semibold flex items-center gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
      {/* Header navigations */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-slate-800 hover:border-indigo-500/25 bg-slate-900/40 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboards
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => reloadAnalysis()}
            className="p-2 border border-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer text-slate-400 hover:text-white transition"
            title="Refresh AI Report"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!analysis}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <Download className="w-4 h-4" /> Export PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Stats Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Scorecard Card */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-slate-850">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <h2 className="text-2xl font-bold tracking-tight text-white mb-6">
              {attempt.testId?.title || 'Exam Report card'}
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Score Obtained</span>
                <span className="block text-2xl font-extrabold text-indigo-400 mt-1">{attempt.score} pts</span>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Accuracy</span>
                <span className="block text-2xl font-extrabold text-emerald-400 mt-1">{attempt.accuracy}%</span>
              </div>
              <div className="p-4 bg-slate-900/60 rounded-2xl text-center border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Duration</span>
                <span className="block text-2xl font-extrabold text-amber-400 mt-1">
                  {Math.round(attempt.completionTime / 60)}m {attempt.completionTime % 60}s
                </span>
              </div>
            </div>
          </div>

          {/* Subject performance bars */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-900 flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BarChart className="w-5 h-5 text-indigo-400" />
              Subject Performance
            </h3>

            {analysis?.subjectAnalysis ? (
              <div className="flex flex-col gap-4">
                {Object.keys(analysis.subjectAnalysis).map((subName) => {
                  const stat = analysis.subjectAnalysis[subName];
                  const acc = Math.round((stat.correct / (stat.total || 1)) * 100);

                  return (
                    <div key={subName} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>{subName}</span>
                        <span>
                          {stat.correct}/{stat.total} Correct ({acc}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                [Loading Subject breakdown matrix...]
              </div>
            )}
          </div>
        </div>

        {/* Right Side AI Insights Section */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/15 relative">
            <div className="absolute top-4 right-4 text-indigo-500 flex gap-1">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
              AI Counselor Analysis
            </h3>

            {loadingAnalysis ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                <span>Running models for counseling report...</span>
              </div>
            ) : !analysis ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                AI analysis has not computed yet. Click refresh above to generate.
              </div>
            ) : (
              <div className="flex flex-col gap-5 text-xs text-slate-300">
                <div>
                  <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.strengths?.map((item: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2">Weaknesses</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.weaknesses?.map((item: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-4">
                  <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider mb-2">Study Strategies</h4>
                  <p className="leading-relaxed text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-900 whitespace-pre-line">
                    {analysis.recommendations?.suggestedRevisionPlan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
