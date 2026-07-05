'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setAuth, logout, hydrateAuth } from '../../lib/redux/slices/authSlice';
import { Cpu, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector(state => state.auth);
    // Auth actions are now dispatched: dispatch(setAuth({ user: ...)) or dispatch(logout()))
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect them immediately
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save user session in Zustand state
      dispatch(setAuth({ user: data.data.user, token: data.data.accessToken }));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (testEmail: string, testPass: string) => {
    setError(null);
    setLoading(true);
    setEmail(testEmail);
    setPassword(testPass);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPass }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      dispatch(setAuth({ user: data.data.user, token: data.data.accessToken }));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen px-4 bg-slate-950 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-slate-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl relative border border-slate-800 shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-600/30 mb-3">
            SolveKar
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to your Solvekar account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-xs text-center text-slate-500 font-semibold mb-3 uppercase tracking-wider">Test Accounts (One-Click Login)</p>
          <div className="flex gap-2 justify-center">
            <button 
              type="button"
              onClick={() => handleQuickLogin('admin@solvekar.com', 'admin123')}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 disabled:opacity-50"
            >
              Admin
            </button>
            <button 
              type="button"
              onClick={() => handleQuickLogin('teacher@solvekar.com', 'teacher123')}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 disabled:opacity-50"
            >
              Teacher
            </button>
            <button 
              type="button"
              onClick={() => handleQuickLogin('student@solvekar.com', 'student123')}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-white-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700 disabled:opacity-50"
            >
              Student
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
