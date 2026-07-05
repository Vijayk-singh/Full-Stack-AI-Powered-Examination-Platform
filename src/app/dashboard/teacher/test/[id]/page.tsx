'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../../lib/redux/hooks';
import { useParams, useRouter } from 'next/navigation';
import { setAuth, logout, hydrateAuth } from '../../../../../lib/redux/slices/authSlice';
import DashboardLayout from '../../../../../components/DashboardLayout';
import EditTestDashboard from '../../../../../components/EditTestDashboard';
import { Loader } from 'lucide-react';

export default function TestEditPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector(state => state.auth);
    // Auth actions are now dispatched: dispatch(dispatch(setAuth(...)) or dispatch(dispatch(logout()))
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user && !localStorage.getItem('auth_token')) {
      router.push('/login');
    }
    if (user && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!isMounted || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-slate-500 text-sm mt-3">Verifying authorization...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <EditTestDashboard testId={testId} />
    </DashboardLayout>
  );
}
