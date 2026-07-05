'use client';

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useQuery } from '@tanstack/react-query';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { CreditCard, Loader } from 'lucide-react';

interface SubscriptionPlansProps {
  activeSub: any;
  setShowPlansSelector: (val: boolean) => void;
  refetchActiveSub: () => void;
}

export default function SubscriptionPlans({ activeSub, setShowPlansSelector, refetchActiveSub }: SubscriptionPlansProps) {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

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

  const availablePlans = plansData?.data?.plans || [];

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
      dispatch(showToast('Subscription plan activated successfully!', 'success'));
      setShowPlansSelector(false);
      refetchActiveSub();
    } catch (e: any) {
      dispatch(showToast(e.message || 'Error activating subscription', 'error'));
    } finally {
      setSubscribingId(null);
    }
  };

  if (loadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Choose a Subscription Plan</h1>
          <p className="text-slate-500 mt-1">Select a plan to start attempting mock tests and reviewing AI analyses.</p>
        </div>
        {activeSub && (
          <button
            onClick={() => setShowPlansSelector(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {availablePlans.map((plan: any) => (
          <div key={plan._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{plan.name}</h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-lg text-sm">
                  rs{plan.price}
                </span>
              </div>
              
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.description || 'Access a selection of exams with customized attempt policies.'}</p>
              
              <div className="my-6 border-t border-slate-100 pt-4 flex flex-col gap-3 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium text-slate-700">
                    {plan.expiryDate 
                      ? `Valid until ${new Date(plan.expiryDate).toLocaleDateString()}`
                      : `${plan.durationDays} Days`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Attempts Per Test:</span>
                  <span className="font-medium text-slate-700">{plan.attemptsPerTest}</span>
                </div>
                <div className="flex justify-between">
                  <span>Included Tests:</span>
                  <span className="font-medium text-slate-700">{plan.availableTests?.length || 0} tests</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(plan._id)}
              disabled={subscribingId !== null}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer mt-4"
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
