'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '../lib/redux/hooks';
import { useRouter } from 'next/navigation';
import { setAuth, logout, hydrateAuth } from '../lib/redux/slices/authSlice';
import { LogOut, BookOpen, User, Settings, Award } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector(state => state.auth);
    // Auth actions are now dispatched: dispatch(dispatch(setAuth(...)) or dispatch(dispatch(logout()))

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
              E
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-700">
              Solvekar
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition cursor-pointer">
                <div className="hidden sm:flex flex-col text-right font-sans mr-1">
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-blue-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
{/* 
            <Link
              href="/dashboard/profile"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Profile Settings"
            >
              <Settings className="w-5 h-5" />
            </Link> */}

            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 container mx-auto px-6 py-8 flex flex-col">{children}</div>
    </div>
  );
}
