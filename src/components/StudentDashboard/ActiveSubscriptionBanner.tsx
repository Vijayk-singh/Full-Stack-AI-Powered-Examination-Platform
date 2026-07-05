'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

interface ActiveSubscriptionBannerProps {
  activeSub: any;
  setShowPlansSelector: (val: boolean) => void;
}

export default function ActiveSubscriptionBanner({ activeSub, setShowPlansSelector }: ActiveSubscriptionBannerProps) {
  const activePlan = activeSub?.planId;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Subscription</div>
          <h4 className="text-sm font-bold text-slate-800 mt-0.5">
            {activePlan?.name} <span className="text-xs text-slate-500 font-normal">(${activePlan?.price})</span>
          </h4>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-slate-500">
        <div>
          <span className="text-slate-500">Validity:</span>{' '}
          <span className="font-medium text-slate-700">
            {new Date(activeSub.endDate).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Limit:</span>{' '}
          <span className="font-medium text-slate-700">
            {activePlan?.attemptsPerTest} attempts/test
          </span>
        </div>
        <button
          onClick={() => setShowPlansSelector(true)}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
        >
          Change Plan
        </button>
      </div>
    </div>
  );
}
