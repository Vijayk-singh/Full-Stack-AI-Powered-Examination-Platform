'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/auth';
import { Cpu, FileText, Plus, Trash2, Check, X, ShieldAlert, BookOpen, AlertCircle, Loader, Edit } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'manual' | 'ai' | 'pdf' | 'schedule'>('overview');

  // Form states for manual question creation
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('MEDIUM');
  const [qSubject, setQSubject] = useState('Computer Science');
  const [qTopic, setQTopic] = useState('Database Normalization');
  const [qMarks, setQMarks] = useState(4);
  const [qNegMarks, setQNegMarks] = useState(1);
  const [qLoading, setQLoading] = useState(false);

  // Form states for AI Test Generation
  const [aiSubject, setAiSubject] = useState('Computer Science');
  const [aiTopic, setAiTopic] = useState('Process Synchronization');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultQuestions, setAiResultQuestions] = useState<any[]>([]);

  // Form states for PDF uploading
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResultQuestions, setPdfResultQuestions] = useState<any[]>([]);
  const [pyqAnalysis, setPyqAnalysis] = useState<any | null>(null);
  const [pdfType, setPdfType] = useState<'extract' | 'pyq'>('extract');

  // Form states for scheduling tests
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testSubjectId, setTestSubjectId] = useState('');
  const [testDuration, setTestDuration] = useState(60);
  const [testType, setTestType] = useState('PRACTICE');
  const [testStartDate, setTestStartDate] = useState('');
  const [testEndDate, setTestEndDate] = useState('');
  const [testQuestions, setTestQuestions] = useState<string[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  // Fetch created tests
  const { data: testsData, isLoading: loadingTests } = useQuery({
    queryKey: ['teacherTests'],
    queryFn: async () => {
      const res = await fetch('/api/tests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tests');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch subjects list for select
  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });

  // Fetch all questions for scheduling
  const { data: questionsData } = useQuery({
    queryKey: ['allQuestions'],
    queryFn: async () => {
      const res = await fetch('/api/questions?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token,
  });

  const tests = testsData?.data?.tests || [];
  const subjects = subjectsData?.data || [];
  const questionsList = questionsData?.data?.questions || [];

  // Set default subjectId if loading finishes
  useEffect(() => {
    if (subjects.length > 0 && !testSubjectId) {
      setTestSubjectId(subjects[0]._id);
    }
  }, [subjects, testSubjectId]);

  // Mutation to toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherTests'] });
    },
  });

  // Mutation to delete test
  const deleteTestMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete test');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherTests'] });
    },
  });

  // Create manual question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQLoading(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionText: qText,
          type: qType,
          options: qType === 'MCQ' || qType === 'MULTIPLE_CORRECT' ? qOptions : qType === 'TRUE_FALSE' ? ['True', 'False'] : [],
          correctAnswer: qType === 'MULTIPLE_CORRECT' ? qCorrect.split(',').map(Number) : qType === 'MCQ' ? Number(qCorrect) : qCorrect,
          explanation: qExplanation,
          difficulty: qDifficulty,
          subjectName: qSubject,
          topicName: qTopic,
          marks: qMarks,
          negativeMarks: qNegMarks,
        }),
      });

      if (!res.ok) throw new Error('Failed to create question');

      alert('Question created and cataloged successfully!');
      setQText('');
      setQExplanation('');
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (err: any) {
      alert(err.message || 'Error creating question');
    } finally {
      setQLoading(false);
    }
  };

  // Generate test questions via AI
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiResultQuestions([]);
    try {
      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI request failed');

      setAiResultQuestions(data.data || []);
      alert('AI questions successfully drafted! Review below.');
    } catch (err: any) {
      alert(err.message || 'Error generating AI questions');
    } finally {
      setAiLoading(false);
    }
  };

  // Bulk save AI generated questions
  const saveAIGenerated = async () => {
    try {
      for (const q of aiResultQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...q,
            subjectName: aiSubject,
            topicName: aiTopic,
          }),
        });
      }
      alert('All AI questions cataloged successfully into database!');
      setAiResultQuestions([]);
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (e) {
      alert('Failed bulk saving questions');
    }
  };

  // Parse PDF
  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;
    setPdfLoading(true);
    setPdfResultQuestions([]);
    setPyqAnalysis(null);

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const endpoint = pdfType === 'extract' ? '/api/ai/analyze-pdf' : '/api/ai/analyze-pyq';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'PDF processing failed');

      if (pdfType === 'extract') {
        setPdfResultQuestions(data.data.questions || []);
        alert('PDF question extraction complete!');
      } else {
        setPyqAnalysis(data.data || null);
        alert('PYQ weightage analysis complete!');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // Bulk save PDF extracted questions
  const savePdfExtracted = async () => {
    try {
      for (const q of pdfResultQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...q,
            subjectName: q.subject || 'General Studies',
            topicName: q.topic || 'PDF Extraction',
          }),
        });
      }
      alert('Extracted questions cataloged successfully!');
      setPdfResultQuestions([]);
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (e) {
      alert('Failed saving PDF extracted questions');
    }
  };

  // Create exam schedule
  const handleScheduleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testQuestions.length === 0) {
      alert('Please select at least one question for this test');
      return;
    }
    setTestLoading(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: testTitle,
          description: testDesc,
          subjectId: testSubjectId,
          duration: testDuration,
          testType,
          startDate: testStartDate ? new Date(testStartDate) : undefined,
          endDate: testEndDate ? new Date(testEndDate) : undefined,
          questions: testQuestions,
          status: testType === 'SCHEDULED' ? 'DRAFT' : 'PUBLISHED',
          attemptsAllowed: 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create test schedule');

      if (testType === 'SCHEDULED') {
        alert('Exam schedule created successfully as DRAFT! Go to the "Active Exams" tab and click the green checkmark button to publish it.');
      } else {
        alert('Exam created and published successfully! It is now live for students to attempt.');
      }
      setTestTitle('');
      setTestDesc('');
      setTestQuestions([]);
      setActiveTab('overview');
      queryClient.invalidateQueries({ queryKey: ['teacherTests'] });
    } catch (err: any) {
      alert(err.message || 'Error creating test schedule');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSelectQuestion = (qId: string) => {
    if (testQuestions.includes(qId)) {
      setTestQuestions(testQuestions.filter((id) => id !== qId));
    } else {
      setTestQuestions([...testQuestions, qId]);
    }
  };

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

      {/* TAB 1: OVERVIEW / ACTIVE EXAMS */}
      {activeTab === 'overview' && (
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Exams Created
          </h2>

          {loadingTests ? (
            <div className="py-8 text-center text-slate-500">Loading exams...</div>
          ) : tests.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No exams created yet. Switch to Schedule Test to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test: any) => (
                    <tr key={test._id} className="border-b border-slate-200 hover:bg-white">
                      <td className="py-4 px-4 font-semibold text-slate-800">{test.title}</td>
                      <td className="py-4 px-4">{test.subjectId?.name || 'General'}</td>
                      <td className="py-4 px-4">{test.duration} mins</td>
                      <td className="py-4 px-4">{test.questions?.length || 0}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            test.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : test.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right flex justify-end gap-3">
                        <button
                          onClick={() => router.push(`/dashboard/teacher/test/${test._id}`)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition cursor-pointer"
                          title="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {test.status !== 'PUBLISHED' ? (
                          <button
                            onClick={() => toggleStatusMutation.mutate({ id: test._id, status: 'PUBLISHED' })}
                            className="p-1.5 bg-emerald-600/10 border border-emerald-500/25 text-emerald-600 rounded hover:bg-emerald-600/20 transition cursor-pointer"
                            title="Publish Test"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatusMutation.mutate({ id: test._id, status: 'UNPUBLISHED' })}
                            className="p-1.5 bg-amber-600/10 border border-amber-500/25 text-amber-600 rounded hover:bg-amber-600/20 transition cursor-pointer"
                            title="Unpublish"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this test?')) {
                              deleteTestMutation.mutate(test._id);
                            }
                          }}
                          className="p-1.5 bg-red-600/10 border border-red-500/25 text-red-500 rounded hover:bg-red-600/20 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL QUESTION ADD */}
      {activeTab === 'manual' && (
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-slate-200 max-w-3xl">
          <h2 className="text-xl font-bold mb-6">Create Manual Question</h2>
          <form onSubmit={handleCreateQuestion} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={qSubject}
                  onChange={(e) => setQSubject(e.target.value)}
                  placeholder="e.g. Physics"
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Topic</label>
                <input
                  type="text"
                  required
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics"
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Question Text</label>
              <textarea
                required
                rows={3}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter question context here..."
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Type</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                >
                  <option value="MCQ">Single Correct MCQ</option>
                  <option value="MULTIPLE_CORRECT">Multiple Correct MCQ</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="NUMERICAL">Numerical Input</option>
                  <option value="SUBJECTIVE">Subjective text</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Difficulty</label>
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Correct Answer</label>
                <input
                  type="text"
                  required
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  placeholder={qType === 'MCQ' ? '0 to 3 index' : qType === 'MULTIPLE_CORRECT' ? '0,2 (comma array)' : qType === 'TRUE_FALSE' ? 'true/false' : 'number/value'}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>
            </div>

            {(qType === 'MCQ' || qType === 'MULTIPLE_CORRECT') && (
              <div className="flex flex-col gap-3">
                <label className="block text-xs font-semibold uppercase text-slate-500">Options List</label>
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-blue-600">Option {i + 1}</span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qOptions];
                        newOpts[i] = e.target.value;
                        setQOptions(newOpts);
                      }}
                      placeholder={`Enter Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 px-4 py-1.5 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Marks Allocated</label>
                <input
                  type="number"
                  required
                  value={qMarks}
                  onChange={(e) => setQMarks(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Negative Marks</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={qNegMarks}
                  onChange={(e) => setQNegMarks(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Explanation</label>
              <textarea
                rows={2}
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Explanation or grading rationale..."
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={qLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {qLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Catalog Question</span>}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AI TEST GENERATOR */}
      {activeTab === 'ai' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
              <Cpu className="w-5 h-5" />
              AI Test Builder
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Prompt the platform model to generate and structure examination questions.
            </p>

            <form onSubmit={handleAIGenerate} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Topic</label>
                  <input
                    type="text"
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Question Count</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {aiLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Draft with AI</span>}
              </button>
            </form>
          </div>

          {aiResultQuestions.length > 0 && (
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-blue-600">Review AI Draft</h3>
                <button
                  onClick={saveAIGenerated}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Save All to Catalog
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {aiResultQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-850">
                    <h4 className="font-semibold text-slate-800">
                      {idx + 1}. {q.questionText}
                    </h4>
                    <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt: string, oi: number) => (
                        <li
                          key={oi}
                          className={`p-2 rounded border ${
                            oi === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600'
                              : 'bg-[#f8f9fa] border-slate-200'
                          }`}
                        >
                          Option {oi}: {opt}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-indigo-950/20 p-2.5 rounded border border-indigo-500/10">
                      <strong>AI Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PDF INGESTION */}
      {activeTab === 'pdf' && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
              <FileText className="w-5 h-5" />
              PDF Ingestion (OCR / PYQ / Notes)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Upload study sheets, questions banks, or past year papers. AI will ingest the PDF and extract syllabus metadata or raw questions.
            </p>

            <form onSubmit={handlePdfUpload} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Action Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPdfType('extract')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      pdfType === 'extract'
                        ? 'bg-blue-600/15 border-indigo-500/40 text-blue-600'
                        : 'bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-500'
                    }`}
                  >
                    Extract Raw Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfType('pyq')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      pdfType === 'pyq'
                        ? 'bg-blue-600/15 border-indigo-500/40 text-blue-600'
                        : 'bg-white border border-slate-200 shadow-sm border-slate-200 text-slate-500'
                    }`}
                  >
                    PYQ Weightage Analysis
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Select PDF File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 text-xs outline-none cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={pdfLoading || !pdfFile}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {pdfLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Process PDF File</span>}
              </button>
            </form>
          </div>

          {/* PDF Raw questions list */}
          {pdfResultQuestions.length > 0 && (
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-blue-600">Extracted PDF Questions</h3>
                <button
                  onClick={savePdfExtracted}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition"
                >
                  Save Extracted to Catalog
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {pdfResultQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-850">
                    <h4 className="font-semibold text-slate-800">
                      {idx + 1}. {q.questionText}
                    </h4>
                    <div className="flex gap-2 my-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-blue-600 font-bold">{q.subject}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-emerald-600 font-bold">{q.topic}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-amber-600 font-bold">{q.difficulty}</span>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt: string, oi: number) => (
                          <li
                            key={oi}
                            className={`p-2 rounded border ${
                              oi === Number(q.correctAnswer)
                                ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600'
                                : 'bg-[#f8f9fa] border-slate-200'
                            }`}
                          >
                            Option {oi}: {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-indigo-950/20 p-2.5 rounded border border-indigo-500/10">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PYQ Analysis summary */}
          {pyqAnalysis && (
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-blue-100 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-blue-600 border-b border-slate-200 pb-2">
                PYQ Syllabus Weightage Analysis
              </h3>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Repeated Focus Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {pyqAnalysis.repeatedTopics?.map((topic: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold rounded-lg">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Chapter Weightage Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pyqAnalysis.weightageAnalysis?.map((ch: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                      <span className="block text-xs text-slate-500 truncate">{ch.chapter}</span>
                      <span className="block font-bold text-blue-600 mt-1">{ch.weightage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Predicted Examination Questions</h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
                  {pyqAnalysis.probableQuestions?.map((q: string, i: number) => (
                    <li key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <strong>Q{i + 1}:</strong> {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CREATE TEST SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl border border-slate-200 max-w-3xl">
          <h2 className="text-xl font-bold mb-6">Create Exam Schedule</h2>
          <form onSubmit={handleScheduleTest} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Exam Title</label>
              <input
                type="text"
                required
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g. Operating Systems Final"
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Description</label>
              <textarea
                rows={2}
                value={testDesc}
                onChange={(e) => setTestDesc(e.target.value)}
                placeholder="Enter description, rules, etc..."
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject Category</label>
                <select
                  value={testSubjectId}
                  onChange={(e) => setTestSubjectId(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                >
                  {subjects.map((sub: any) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                  {subjects.length === 0 && <option value="">Loading...</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Duration (Mins)</label>
                <input
                  type="number"
                  required
                  value={testDuration}
                  onChange={(e) => setTestDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
                >
                  <option value="PRACTICE">Practice (Instant feedback)</option>
                  <option value="SCHEDULED">Scheduled (Window bounded)</option>
                  <option value="INSTANT">Instant test</option>
                </select>
              </div>
            </div>

            {testType === 'SCHEDULED' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={testStartDate}
                    onChange={(e) => setTestStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={testEndDate}
                    onChange={(e) => setTestEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Select Questions ({testQuestions.length} Selected)
              </label>
              <div className="max-h-60 overflow-y-auto border border-slate-200 bg-white rounded-xl p-3 flex flex-col gap-2">
                {questionsList.map((q: any) => (
                  <label
                    key={q._id}
                    className={`p-2.5 rounded-lg border text-xs flex gap-3 items-center cursor-pointer transition ${
                      testQuestions.includes(q._id)
                        ? 'bg-blue-600/10 border-indigo-500/35 text-blue-600'
                        : 'bg-white border border-slate-200 shadow-sm border-slate-850 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={testQuestions.includes(q._id)}
                      onChange={() => handleSelectQuestion(q._id)}
                      className="cursor-pointer accent-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold block">{q.questionText}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Subject: {q.subjectId?.name || 'General'} | Topic: {q.topicId?.name || 'General'} | Type:{' '}
                        {q.type} | Marks: {q.marks}
                      </span>
                    </div>
                  </label>
                ))}
                {questionsList.length === 0 && (
                  <div className="text-center py-6 text-slate-500">
                    No questions cataloged yet. Please create questions first.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {testLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Schedule Exam</span>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
