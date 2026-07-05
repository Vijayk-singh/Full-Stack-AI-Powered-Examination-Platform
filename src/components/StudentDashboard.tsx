'use client';

import React, { useState } from 'react';
import { useAppSelector } from '../lib/redux/hooks';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import SubscriptionPlans from './StudentDashboard/SubscriptionPlans';
import ActiveSubscriptionBanner from './StudentDashboard/ActiveSubscriptionBanner';
import DashboardStats from './StudentDashboard/DashboardStats';
import AvailableTests from './StudentDashboard/AvailableTests';
import RecentAttempts from './StudentDashboard/RecentAttempts';

export default function StudentDashboard() {
  const token = useAppSelector(state => state.auth.accessToken);
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
  const attempts = attemptsData?.data?.attempts || [];
  const stats = attemptsData?.data?.stats || { avgScore: 0, avgAccuracy: 0, totalCompleted: 0 };

  if (loadingSub) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Loading your account details...</span>
      </div>
    );
  }

  if (!activeSub || showPlansSelector) {
    return (
      <SubscriptionPlans 
        activeSub={activeSub} 
        setShowPlansSelector={setShowPlansSelector} 
        refetchActiveSub={refetchActiveSub} 
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Student Dashboard</h1>
        <p className="text-slate-500 mt-1">Review your statistics and attempt pending exams.</p>
      </div>

      <ActiveSubscriptionBanner 
        activeSub={activeSub} 
        setShowPlansSelector={setShowPlansSelector} 
      />

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AvailableTests 
            activeSub={activeSub} 
            testsData={testsData} 
            loadingTests={loadingTests} 
            attempts={attempts} 
          />

          <RecentAttempts 
            attempts={attempts} 
            loadingAttempts={loadingAttempts} 
          />
        </div>
      </div>
    </div>
  );
}
