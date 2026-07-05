'use client';

import React, { useState } from 'react';
import ActiveExamsTab from './TeacherDashboard/ActiveExamsTab';
import ManualQuestionTab from './TeacherDashboard/ManualQuestionTab';
import AIGenerationTab from './TeacherDashboard/AIGenerationTab';
import PDFExtractionTab from './TeacherDashboard/PDFExtractionTab';
import ScheduleExamTab from './TeacherDashboard/ScheduleExamTab';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'manual' | 'ai' | 'pdf' | 'schedule'>('overview');

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Teacher Portal</h1>
        <p className="text-slate-500 mt-1">Manage exam sheets, use AI question tools, or ingest files.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'overview' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Exams
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'manual' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Add Question
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'ai' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          AI Test Builder
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'pdf' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          PDF Ingestion
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 font-semibold text-sm transition cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'schedule' ? 'border-indigo-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Schedule Test
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <ActiveExamsTab />}
      {activeTab === 'manual' && <ManualQuestionTab />}
      {activeTab === 'ai' && <AIGenerationTab />}
      {activeTab === 'pdf' && <PDFExtractionTab />}
      {activeTab === 'schedule' && <ScheduleExamTab onSuccess={() => setActiveTab('overview')} />}
    </div>
  );
}
