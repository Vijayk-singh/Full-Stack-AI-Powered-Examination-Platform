'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';
import { LogOut, BookOpen, User, Settings, Award } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header bar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-900 bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              EduGauge <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {user && (
              <Link href="/dashboard/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
                <div className="hidden sm:flex flex-col text-right font-sans">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition cursor-pointer"
              title="Profile Settings"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition cursor-pointer"
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
