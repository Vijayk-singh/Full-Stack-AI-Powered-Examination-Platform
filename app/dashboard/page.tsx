'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/auth';
import DashboardLayout from '../../components/DashboardLayout';
import StudentDashboard from '../../components/StudentDashboard';
import TeacherDashboard from '../../components/TeacherDashboard';
import AdminDashboard from '../../components/AdminDashboard';
import { Loader } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!user && !localStorage.getItem('auth_token')) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Hydrating user session...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {user.role === 'STUDENT' && <StudentDashboard />}
      {user.role === 'TEACHER' && <TeacherDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </DashboardLayout>
  );
}
