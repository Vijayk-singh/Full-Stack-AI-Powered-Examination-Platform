'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '../lib/redux/hooks';
import { showToast, removeToast } from '../lib/redux/slices/toastSlice';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export default function GlobalToast() {
  const dispatch = useAppDispatch();
    const toasts = useAppSelector(state => state.toast.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-white';
        let borderColor = 'border-slate-200';
        let icon = <Info className="w-5 h-5 text-blue-500" />;

        if (toast.type === 'success') {
          borderColor = 'border-emerald-200';
          icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
        } else if (toast.type === 'error') {
          borderColor = 'border-red-200';
          icon = <XCircle className="w-5 h-5 text-red-500" />;
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-200';
          icon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-xl shadow-lg border ${bgColor} ${borderColor} animate-fade-in`}
          >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 text-sm font-medium text-slate-800 leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
