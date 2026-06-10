'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/auth';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Clock, Activity, AlertTriangle, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);

  // Fetch available tests
  const { data: testsData, isLoading: loadingTests } = useQuery({
    queryKey: ['availableTests'],
    queryFn: async () => {
      const res = await fetch('/api/tests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tests');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch student attempts and stats
  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['studentAttempts'],
    queryFn: async () => {
      const res = await fetch('/api/attempts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch attempts');
      return res.json();
    },
    enabled: !!token,
  });

  const tests = testsData?.data?.tests || [];
  const attempts = attemptsData?.data?.attempts || [];
  const stats = attemptsData?.data?.stats || { avgScore: 0, avgAccuracy: 0, totalCompleted: 0 };

  const handleStartTest = async (testId: string) => {
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to start test');
        return;
      }
      // Redirect to exam screen
      router.push(`/test/${testId}/attempt?attemptId=${data.data._id}`);
    } catch (e) {
      console.error(e);
      alert('An error occurred starting this test');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Student Dashboard</h1>
        <p className="text-slate-400 mt-1">Review your statistics and attempt pending exams.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Average Score</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{stats.avgScore} pts</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Overall Accuracy</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{stats.avgAccuracy}%</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed Tests</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{stats.totalCompleted} tests</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Test list and Attempt history */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Available Tests */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Available Tests
            </h2>

            {loadingTests ? (
              <div className="py-8 text-center text-slate-500">Loading tests...</div>
            ) : tests.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No active tests available for your account.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {tests.map((test: any) => (
                  <div
                    key={test._id}
                    className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700/80 transition"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{test.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-indigo-400">
                          {test.subjectId?.name || 'General'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {test.duration} mins
                        </span>
                        <span>Marks: {test.totalMarks}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartTest(test._id)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Attempt Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test History */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Recent Attempts
            </h2>

            {loadingAttempts ? (
              <div className="py-8 text-center text-slate-500">Loading attempts...</div>
            ) : attempts.length === 0 ? (
              <div className="py-8 text-center text-slate-500">You haven&apos;t attempted any tests yet.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {attempts.map((attempt: any) => (
                  <div
                    key={attempt._id}
                    className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{attempt.testId?.title || 'Practice Test'}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-emerald-400">
                          {attempt.testId?.subjectId?.name || 'General'}
                        </span>
                        <span>Time: {Math.round(attempt.completionTime / 60)}m {attempt.completionTime % 60}s</span>
                        <span>Accuracy: {attempt.accuracy}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="font-bold text-white">{attempt.score} pts</span>
                      <button
                        onClick={() => router.push(`/test/${attempt.testId?._id}/result/${attempt._id}`)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        View Analysis <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Weakness analysis list */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-900">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Focus Areas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              AI has identified these concepts based on recent incorrect responses:
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
                Concurrency Control
              </span>
              <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
                CPU Registers
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg">
                TCP Three-Way Handshake
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-900">
              <h4 className="text-sm font-semibold text-white mb-2">Revision Plan Suggested:</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review the Operating Systems lecture notes on Concurrency, then attempt a 5-question Easy practice quiz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
