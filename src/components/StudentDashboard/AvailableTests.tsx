'use client';

import React from 'react';
import { BookOpen, Clock, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { showToast } from '../../lib/redux/slices/toastSlice';

interface AvailableTestsProps {
  activeSub: any;
  testsData: any;
  loadingTests: boolean;
  attempts: any[];
}

export default function AvailableTests({ activeSub, testsData, loadingTests, attempts }: AvailableTestsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.accessToken);

  const activePlan = activeSub?.planId;
  const tests = testsData?.data?.tests || [];

  const getAttemptsCountForTest = (testId: string) => {
    if (!activeSub) return 0;
    return attempts.filter((att: any) => 
      att.testId?._id?.toString() === testId.toString() &&
      new Date(att.createdAt) >= new Date(activeSub.startDate)
    ).length;
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
        dispatch(showToast(data.message || 'Failed to start test', 'error'));
        return;
      }
      // Redirect to exam screen
      router.push(`/test/${testId}/attempt?attemptId=${data.data._id}`);
    } catch (e) {
      console.error(e);
      dispatch(showToast('An error occurred starting this test', 'error'));
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
        <BookOpen className="w-5 h-5 text-blue-600" />
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
            const maxAttempts = test.isPublic ? test.attemptsAllowed : (activePlan?.attemptsPerTest || test.attemptsAllowed || 5);
            const attemptsRemaining = Math.max(0, maxAttempts - attemptsMade);
            const isExhausted = attemptsRemaining <= 0;

            return (
              <div
                key={test._id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-200 transition"
              >
                <div>
                  <h4 className="font-semibold text-slate-800">{test.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded font-semibold text-blue-700">
                      {test.subjectId?.name || 'General'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {test.duration} mins
                    </span>
                    <span>Marks: {test.totalMarks}</span>
                    <span className={`font-semibold ${isExhausted ? 'text-red-500' : 'text-emerald-600'}`}>
                      Attempts Remaining: {attemptsRemaining} / {maxAttempts}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartTest(test._id)}
                  disabled={isExhausted}
                  className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    isExhausted 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-none'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
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
  );
}
