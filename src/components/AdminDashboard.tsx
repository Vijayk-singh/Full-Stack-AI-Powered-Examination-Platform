'use client';

import React, { useState } from 'react';
import SystemStats from './AdminDashboard/SystemStats';
import ManageAccounts from './AdminDashboard/ManageAccounts';
import CurriculumManagement from './AdminDashboard/CurriculumManagement';
import AiTelemetry from './AdminDashboard/AiTelemetry';
import Subscriptions from './AdminDashboard/Subscriptions';
import ActivityLogsTab from './AdminDashboard/ActivityLogsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'curriculum' | 'ai' | 'subscriptions' | 'logs'>('stats');

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Administration Portal</h1>
        <p className="text-slate-500 mt-1">Supervise accounts, configure curricular subjects, and review AI usage metrics.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'stats' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          System Stats
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'users' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Accounts
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'curriculum' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subjects & Topics
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'ai' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          AI Usage Analytics
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'subscriptions' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'logs' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Activity Logs
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'stats' && <SystemStats />}
      {activeTab === 'users' && <ManageAccounts />}
      {activeTab === 'curriculum' && <CurriculumManagement />}
      {activeTab === 'ai' && <AiTelemetry />}
      {activeTab === 'subscriptions' && <Subscriptions />}
      {activeTab === 'logs' && <ActivityLogsTab />}
    </div>
  );
}
