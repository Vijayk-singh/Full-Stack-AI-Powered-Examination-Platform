'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/store/auth';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Search, Loader } from 'lucide-react';

export default function EditTestDashboard({ testId }: { testId: string }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');

  // Test form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(60);
  const [testType, setTestType] = useState('PRACTICE');
  const [attemptsAllowed, setAttemptsAllowed] = useState(5);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);

  // Question form states (for adding new)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'new' | 'existing'>('existing');
  
  // Existing questions state
  const [searchQ, setSearchQ] = useState('');

  // Fetch Test Details
  const { data: testData, isLoading: loadingTest } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const res = await fetch(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch test');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Plans
  const { data: plansData } = useQuery({
    queryKey: ['adminPlansList'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });

  // Fetch All Questions
  const { data: allQuestionsData } = useQuery({
    queryKey: ['allQuestions'],
    queryFn: async () => {
      const res = await fetch('/api/questions?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token,
  });

  const testInfo = testData?.data;
  const plans = plansData?.data?.plans || [];
  const subjects = subjectsData?.data || [];
  const allQuestions = allQuestionsData?.data?.questions || [];

  useEffect(() => {
    if (testInfo) {
      setTitle(testInfo.title || '');
      setDescription(testInfo.description || '');
      setSubjectId(testInfo.subjectId || '');
      setDuration(testInfo.duration || 60);
      setTestType(testInfo.testType || 'PRACTICE');
      setAttemptsAllowed(testInfo.attemptsAllowed ?? 5);
      // Determine which plan contains this test
      const planWithTest = plans.find((p: any) => p.availableTests.includes(testId));
      if (planWithTest) {
        setSelectedPlanId(planWithTest._id);
      } else {
        setSelectedPlanId('');
      }
      setQuestions(testInfo.questions || []);
    }
  }, [testInfo, plans, testId]);

  const saveTestMutation = useMutation({
    mutationFn: async () => {
      // Update Test
      const resTest = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          duration,
          testType,
          attemptsAllowed,
          questions: questions.map((q: any) => q._id || q),
        }),
      });
      if (!resTest.ok) throw new Error('Failed to update test');

      // Update Plan
      if (selectedPlanId) {
        const selectedPlan = plans.find((p: any) => p._id === selectedPlanId);
        if (selectedPlan && !selectedPlan.availableTests.includes(testId)) {
          await fetch(`/api/subscriptions/plans/${selectedPlanId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              availableTests: [...selectedPlan.availableTests, testId],
            }),
          });
        }
      } else {
        // Find if any plan had it and remove
        const planWithTest = plans.find((p: any) => p.availableTests.includes(testId));
        if (planWithTest) {
           await fetch(`/api/subscriptions/plans/${planWithTest._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              availableTests: planWithTest.availableTests.filter((id: string) => id !== testId),
            }),
          });
        }
      }

      return resTest.json();
    },
    onSuccess: () => {
      alert('Test updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
      queryClient.invalidateQueries({ queryKey: ['adminPlansList'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Error saving test');
    }
  });

  const handleSave = () => {
    saveTestMutation.mutate();
  };

  const handleRemoveQuestion = (qId: string) => {
    setQuestions(questions.filter(q => (q._id || q) !== qId));
  };

  const handleAddExistingQuestion = (q: any) => {
    if (!questions.find(existing => (existing._id || existing) === q._id)) {
      setQuestions([...questions, q]);
    }
  };

  // Manual Question States
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('MEDIUM');
  const [qMarks, setQMarks] = useState(4);
  const [qNegMarks, setQNegMarks] = useState(1);
  const [qTimeLimit, setQTimeLimit] = useState(60);

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
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
          subjectName: subjects.find((s:any)=>s._id === subjectId)?.name || 'General',
          topicName: 'Custom Topic',
          marks: qMarks,
          negativeMarks: qNegMarks,
          timeLimit: qTimeLimit,
        }),
      });
      if (!res.ok) throw new Error('Failed to create question');
      return res.json();
    },
    onSuccess: (data) => {
      setQuestions([...questions, data.data]);
      alert('Question added successfully!');
      setQText('');
      setQExplanation('');
      setAddMode('existing');
    },
    onError: (err: any) => {
      alert(err.message || 'Error creating question');
    }
  });

  if (loadingTest) {
    return <div className="p-8 text-center text-slate-500">Loading test data...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto w-full pb-20">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Test</h1>
          <p className="text-sm text-slate-500">Modify test details, timers, types, and questions.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Test Details & Rules
        </button>
        <button
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('questions')}
        >
          Questions ({questions.length})
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              >
                <option value="">Select Subject...</option>
                {subjects.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subscription Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              >
                <option value="">No Plan (Free/Public)</option>
                {plans.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Attempts Allowed</label>
              <input
                type="number"
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              >
                <option value="PRACTICE">PRACTICE</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="INSTANT">INSTANT</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={saveTestMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2 transition"
            >
              {saveTestMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Test Rules
            </button>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Test Questions</h3>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddModal(true); setAddMode('existing'); }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg flex items-center gap-2 transition"
              >
                <Search className="w-4 h-4" /> Add from Bank
              </button>
              <button
                onClick={() => { setShowAddModal(true); setAddMode('new'); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Create New
              </button>
              <button
                onClick={handleSave}
                disabled={saveTestMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-2 transition"
              >
                {saveTestMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {questions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl">
                No questions added to this test yet.
              </div>
            ) : (
              questions.map((q: any, i: number) => (
                <div key={q._id || q} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400">Q{i + 1}.</span>
                    <p className="text-slate-800 font-medium mt-1">{q.questionText || 'Unknown Question (Please save and refresh)'}</p>
                    <div className="flex gap-3 mt-2 text-[10px] uppercase font-bold text-slate-500">
                      <span>Type: {q.type}</span>
                      <span>Marks: {q.marks}</span>
                      {q.timeLimit && <span>Timer: {q.timeLimit}s</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveQuestion(q._id || q)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                    title="Remove from test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Add Question</h2>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded ${addMode === 'existing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() => setAddMode('existing')}
                >
                  From Bank
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded ${addMode === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() => setAddMode('new')}
                >
                  Create New
                </button>
                <button onClick={() => setShowAddModal(false)} className="ml-4 p-1 text-slate-400 hover:text-slate-800">
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {addMode === 'existing' ? (
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                  <div className="flex flex-col gap-3">
                    {allQuestions
                      .filter((q: any) => q.questionText?.toLowerCase().includes(searchQ.toLowerCase()))
                      .slice(0, 50)
                      .map((q: any) => {
                        const isAdded = questions.find((eq) => (eq._id || eq) === q._id);
                        return (
                          <div key={q._id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 line-clamp-2">{q.questionText}</p>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{q.subjectName || 'General'} • {q.topicName || 'Misc'}</span>
                            </div>
                            <button
                              disabled={!!isAdded}
                              onClick={() => handleAddExistingQuestion(q)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                isAdded ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                              }`}
                            >
                              {isAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Question Text</label>
                    <textarea
                      required
                      rows={3}
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Type</label>
                      <select value={qType} onChange={(e) => setQType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none">
                        <option value="MCQ">Single Correct MCQ</option>
                        <option value="MULTIPLE_CORRECT">Multiple Correct MCQ</option>
                        <option value="TRUE_FALSE">True / False</option>
                        <option value="NUMERICAL">Numerical Input</option>
                        <option value="SUBJECTIVE">Subjective text</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Difficulty</label>
                      <select value={qDifficulty} onChange={(e) => setQDifficulty(e.target.value)} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none">
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Correct Answer</label>
                      <input type="text" value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none" />
                    </div>
                  </div>

                  {(qType === 'MCQ' || qType === 'MULTIPLE_CORRECT') && (
                    <div className="flex flex-col gap-3">
                      <label className="block text-xs font-semibold uppercase text-slate-500">Options List</label>
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-blue-600">Opt {i + 1}</span>
                          <input type="text" value={opt} onChange={(e) => { const newOpts = [...qOptions]; newOpts[i] = e.target.value; setQOptions(newOpts); }} className="flex-1 px-4 py-1.5 border border-slate-200 focus:border-blue-500 rounded-xl outline-none" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Marks</label>
                      <input type="number" value={qMarks} onChange={(e) => setQMarks(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Neg Marks</label>
                      <input type="number" step="0.1" value={qNegMarks} onChange={(e) => setQNegMarks(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Time Limit (Secs)</label>
                      <input type="number" value={qTimeLimit} onChange={(e) => setQTimeLimit(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-200 focus:border-blue-500 rounded-xl outline-none" />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => createQuestionMutation.mutate()}
                      disabled={createQuestionMutation.isPending}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2 transition"
                    >
                      {createQuestionMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Create & Add to Test'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
