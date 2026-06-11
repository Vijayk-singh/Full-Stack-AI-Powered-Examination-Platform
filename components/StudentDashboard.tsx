'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/auth';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Clock, Activity, AlertTriangle, ArrowRight, Play, CheckCircle2, CreditCard, Calendar, Loader } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [showPlansSelector, setShowPlansSelector] = useState(false);

  // Fetch active subscription
  const { data: activeSubData, isLoading: loadingSub, refetch: refetchActiveSub } = useQuery({
    queryKey: ['activeSubscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch active subscription');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch available subscription plans
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['availablePlans'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/plans?activeOnly=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch subscription plans');
      return res.json();
    },
    enabled: !!token,
  });

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

  const activeSub = activeSubData?.data || null;
  const activePlan = activeSub?.planId;
  const availablePlans = plansData?.data?.plans || [];
  
  const allowedTestIds = activePlan?.availableTests || [];
  const tests = (testsData?.data?.tests || []).filter((test: any) => 
    allowedTestIds.some((tId: any) => (tId._id || tId).toString() === test._id.toString())
  );

  const attempts = attemptsData?.data?.attempts || [];
  const stats = attemptsData?.data?.stats || { avgScore: 0, avgAccuracy: 0, totalCompleted: 0 };

  const getAttemptsCountForTest = (testId: string) => {
    if (!activeSub) return 0;
    return attempts.filter((att: any) => 
      att.testId?._id?.toString() === testId.toString() &&
      new Date(att.createdAt) >= new Date(activeSub.startDate)
    ).length;
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribingId(planId);
    try {
      const res = await fetch('/api/subscriptions/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to subscribe');
      }
      alert('Subscription plan activated successfully!');
      setShowPlansSelector(false);
      refetchActiveSub();
    } catch (e: any) {
      alert(e.message || 'Error activating subscription');
    } finally {
      setSubscribingId(null);
    }
  };

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

  if (loadingSub || loadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Loading your account details...</span>
      </div>
    );
  }

  if (!activeSub || showPlansSelector) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Choose a Subscription Plan</h1>
            <p className="text-slate-400 mt-1">Select a plan to start attempting mock tests and reviewing AI analyses.</p>
          </div>
          {activeSub && (
            <button
              onClick={() => setShowPlansSelector(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {availablePlans.map((plan: any) => (
            <div key={plan._id} className="glass-panel p-6 rounded-2xl border border-slate-900 flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold text-white leading-tight">{plan.name}</h3>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-sm">
                    ${plan.price}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.description || 'Access a selection of exams with customized attempt policies.'}</p>
                
                <div className="my-6 border-t border-slate-900 pt-4 flex flex-col gap-3 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold text-slate-300">
                      {plan.expiryDate 
                        ? `Valid until ${new Date(plan.expiryDate).toLocaleDateString()}`
                        : `${plan.durationDays} Days`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attempts Per Test:</span>
                    <span className="font-semibold text-slate-300">{plan.attemptsPerTest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Included Tests:</span>
                    <span className="font-semibold text-slate-300">{plan.availableTests?.length || 0} tests</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan._id)}
                disabled={subscribingId !== null}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer mt-4"
              >
                {subscribingId === plan._id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Subscribe (Bypass Payment)</span>
                  </>
                )}
              </button>
            </div>
          ))}
          {availablePlans.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No active subscription plans are currently configured by the Administrator. Please contact support.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Student Dashboard</h1>
        <p className="text-slate-400 mt-1">Review your statistics and attempt pending exams.</p>
      </div>

      {/* Active Subscription Status Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 bg-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Subscription</div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {activePlan?.name} <span className="text-xs text-slate-400 font-normal">(${activePlan?.price})</span>
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Validity:</span>{' '}
            <span className="font-semibold text-slate-300">
              {new Date(activeSub.endDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Limit:</span>{' '}
            <span className="font-semibold text-slate-300">
              {activePlan?.attemptsPerTest} attempts/test
            </span>
          </div>
          <button
            onClick={() => setShowPlansSelector(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-lg transition cursor-pointer"
          >
            Change Plan
          </button>
        </div>
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
              <div className="py-8 text-center text-slate-500">No active tests available for your current subscription plan.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {tests.map((test: any) => {
                  const attemptsMade = getAttemptsCountForTest(test._id);
                  const maxAttempts = activePlan?.attemptsPerTest || 0;
                  const attemptsRemaining = Math.max(0, maxAttempts - attemptsMade);
                  const isExhausted = attemptsRemaining <= 0;

                  return (
                    <div
                      key={test._id}
                      className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700/80 transition"
                    >
                      <div>
                        <h4 className="font-semibold text-white">{test.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-indigo-400">
                            {test.subjectId?.name || 'General'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {test.duration} mins
                          </span>
                          <span>Marks: {test.totalMarks}</span>
                          <span className={`font-semibold ${isExhausted ? 'text-rose-400' : 'text-emerald-400'}`}>
                            Attempts Remaining: {attemptsRemaining} / {maxAttempts}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartTest(test._id)}
                        disabled={isExhausted}
                        className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                          isExhausted 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-none'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isExhausted ? (
                          <span>Attempts Exhausted</span>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Attempt Test
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
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
