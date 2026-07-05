import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../lib/redux/hooks';
import { Users, ShieldCheck, BookOpen, Server, Activity } from 'lucide-react';

export default function SystemStats() {
  const token = useAppSelector(state => state.auth.accessToken);

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!token,
  });
  const users = usersData?.data?.users || [];

  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });
  const subjects = subjectsData?.data || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Users</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{users.length}</h3>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Teachers</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
              {users.filter((u: any) => u.role === 'TEACHER').length}
            </h3>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Subjects Catalog</span>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{subjects.length}</h3>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-red-500">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Platform Health</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">99.9%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Platform Activity Log
          </h3>
          <div className="flex flex-col gap-3.5 text-xs text-slate-500 font-mono">
            <div className="p-3 bg-white rounded border border-slate-850 flex justify-between">
              <span>[2026-06-09 15:05:42] User Register success: vijay@gmail.com</span>
              <span className="text-blue-600">INFO</span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-850 flex justify-between">
              <span>[2026-06-09 15:03:14] User Authentication: jane@solvekar.com</span>
              <span className="text-blue-600">INFO</span>
            </div>
            <div className="p-3 bg-white rounded border border-slate-850 flex justify-between">
              <span>[2026-06-09 14:58:30] AI Model Call: gemini-1.5-flash generated 5 questions</span>
              <span className="text-blue-600">INFO</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-800">System Settings</h3>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Self Registration</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">ENABLED</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Webcam Proctoring</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">READY</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">PDF Parsing Node</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
