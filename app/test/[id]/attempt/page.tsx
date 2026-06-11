'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/auth';
import { useExamStore } from '../../../../lib/store/exam';
import { Shield, Clock, AlertTriangle, Video, CheckSquare, Info } from 'lucide-react';

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked_for_review';

export default function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId: string }>;
}) {
  const router = useRouter();
  
  // Resolve Next.js 15 parameters
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const testId = resolvedParams.id;
  const attemptId = resolvedSearchParams.attemptId;

  const token = useAuthStore((state: any) => state.accessToken);
  const {
    activeAttemptId,
    testTitle,
    questions,
    answers,
    timeLeft,
    tabSwitches,
    isExamActive,
    startExam,
    updateAnswer,
    tickTime,
    incrementTabSwitches,
    finishExam,
  } = useExamStore();

  const [activeQIndex, setActiveQIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cheatingAlert, setCheatingAlert] = useState<string | null>(null);

  // TCS iON status tracker for each question ID
  const [qStatuses, setQStatuses] = useState<Record<string, QuestionStatus>>({});

  // 1. Fetch Exam questions
  useEffect(() => {
    if (!token || !testId || !attemptId) return;

    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests/${testId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch test details');

        startExam(attemptId, testId, data.data.title, data.data.questions || [], data.data.duration);
        
        // Initialize statuses
        const initialStatuses: Record<string, QuestionStatus> = {};
        data.data.questions?.forEach((q: any, idx: number) => {
          initialStatuses[q._id] = idx === 0 ? 'not_answered' : 'not_visited';
        });
        setQStatuses(initialStatuses);

        setLoading(false);
      } catch (err: any) {
        alert(err.message || 'Error loading exam content');
        router.push('/dashboard');
      }
    };

    fetchTest();
  }, [token, testId, attemptId, startExam, router]);

  // 2. Exam Timer tick
  useEffect(() => {
    if (!isExamActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      tickTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive, timeLeft, tickTime]);

  // 3. Trigger auto-submit when timer hits 0
  useEffect(() => {
    if (isExamActive && timeLeft === 0) {
      alert('Time is up! Submitting your exam sheet automatically.');
      submitExamSheet();
    }
  }, [timeLeft, isExamActive]);

  // 4. Anti-Cheating Event hooks
  useEffect(() => {
    if (!isExamActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementTabSwitches();
        setCheatingAlert('WARNING: Tab switch detected! Violations are recorded in the audit logs.');
        setTimeout(() => setCheatingAlert(null), 5000);
      }
    };

    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      setCheatingAlert('SECURITY: Copy and paste actions are strictly prohibited.');
      setTimeout(() => setCheatingAlert(null), 4000);
    };

    const handleWindowBlur = () => {
      incrementTabSwitches();
      setCheatingAlert('WARNING: Focus lost! Please keep your exam browser active.');
      setTimeout(() => setCheatingAlert(null), 5000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isExamActive, incrementTabSwitches]);

  // E. Automatic submit on excess violations (e.g. 5 focus loss)
  useEffect(() => {
    if (isExamActive && tabSwitches >= 5) {
      alert('Security violation limit exceeded! System is auto-submitting this attempt.');
      submitExamSheet();
    }
  }, [tabSwitches, isExamActive]);

  const submitExamSheet = async () => {
    if (!token || !attemptId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers,
          completionTime: (answers.length * 30) + (tabSwitches * 5),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit exam sheet');

      finishExam();
      alert('Exam submitted successfully!');
      router.push(`/test/${testId}/result/${attemptId}`);
    } catch (e) {
      alert('Error submitting answers. Return to Dashboard.');
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-800">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600 text-sm mt-3 font-semibold">Loading Exam Environment...</span>
      </div>
    );
  }

  const activeQuestion = questions[activeQIndex];
  const currentAnswer = answers.find((ans) => ans.questionId === activeQuestion?._id)?.answer;

  const handleSelectOption = (idx: number) => {
    updateAnswer(activeQuestion._id, idx);
  };

  const handleNumericalAnswer = (val: string) => {
    updateAnswer(activeQuestion._id, val);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // TCS iON Navigation Action Handlers
  const handleSaveAndNext = () => {
    const isAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    
    setQStatuses((prev) => ({
      ...prev,
      [activeQuestion._id]: isAnswered ? 'answered' : 'not_answered',
    }));

    if (activeQIndex < questions.length - 1) {
      const nextQId = questions[activeQIndex + 1]._id;
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'not_visited' ? 'not_answered' : prev[nextQId],
      }));
      setActiveQIndex(activeQIndex + 1);
    }
  };

  const handleMarkForReview = () => {
    const isAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    
    setQStatuses((prev) => ({
      ...prev,
      [activeQuestion._id]: isAnswered ? 'answered_and_marked_for_review' : 'marked_for_review',
    }));

    if (activeQIndex < questions.length - 1) {
      const nextQId = questions[activeQIndex + 1]._id;
      setQStatuses((prev) => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'not_visited' ? 'not_answered' : prev[nextQId],
      }));
      setActiveQIndex(activeQIndex + 1);
    }
  };

  const handleClearResponse = () => {
    updateAnswer(activeQuestion._id, null);
    setQStatuses((prev) => ({
      ...prev,
      [activeQuestion._id]: 'not_answered',
    }));
  };

  const handlePaletteClick = (idx: number) => {
    const currentQId = questions[activeQIndex]._id;
    const isCurrentAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
    
    // Update current question status if it was not flagged
    setQStatuses((prev) => {
      const currStatus = prev[currentQId];
      if (currStatus !== 'marked_for_review' && currStatus !== 'answered_and_marked_for_review') {
        return {
          ...prev,
          [currentQId]: isCurrentAnswered ? 'answered' : 'not_answered',
        };
      }
      return prev;
    });

    const nextQId = questions[idx]._id;
    setQStatuses((prev) => ({
      ...prev,
      [nextQId]: prev[nextQId] === 'not_visited' ? 'not_answered' : prev[nextQId],
    }));
    
    setActiveQIndex(idx);
  };

  // Helpers to render palette shapes
  const getPaletteStyle = (status: QuestionStatus) => {
    switch (status) {
      case 'answered':
        return 'bg-[#44a248] text-white rounded-b-[10px] rounded-t-[4px] border-b border-[#2e7d32] shadow-sm';
      case 'not_answered':
        return 'bg-[#d84315] text-white rounded-t-[10px] rounded-b-[4px] border-t border-[#c62828] shadow-sm';
      case 'marked_for_review':
        return 'bg-[#5e35b1] text-white rounded-full border border-[#4527a0] shadow-sm';
      case 'answered_and_marked_for_review':
        return 'bg-[#5e35b1] text-white rounded-full border border-[#4527a0] relative after:content-["✓"] after:absolute after:-bottom-0.5 after:-right-0.5 after:bg-emerald-500 after:text-[8px] after:w-3.5 after:h-3.5 after:rounded-full after:flex after:items-center after:justify-center after:border after:border-white shadow-sm';
      case 'not_visited':
      default:
        return 'bg-[#f0f0f0] text-slate-700 border border-slate-300 rounded-[4px] hover:bg-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#eaf2f8] text-slate-800 font-sans">
      {/* Top Banner */}
      <header className="h-14 bg-[#34495e] text-white px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-300" />
          <span className="font-bold text-sm tracking-wide uppercase">{testTitle}</span>
        </div>

        {/* Dynamic section indicator */}
        <div className="hidden md:flex gap-1">
          <span className="px-3 py-1 bg-[#2c3e50] text-[11px] rounded font-bold uppercase text-slate-300">
            Section: General Syllabus
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#2c3e50] rounded border border-slate-700">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Time Left:</span>
            <span className="font-mono font-bold text-sm text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main TCS Exam Room Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        
        {/* Left 3/4 Column: Question Box & Answer Area */}
        <div className="lg:col-span-3 flex flex-col bg-white border-r border-slate-300">
          
          {/* Section tabs select bar */}
          <div className="h-10 bg-[#f4f6f7] border-b border-slate-300 px-4 flex items-center gap-1">
            <button className="px-4 py-1.5 bg-white border-t-2 border-t-blue-600 border-x border-slate-300 text-xs font-bold text-slate-800">
              General Syllabus Questions
            </button>
          </div>

          {cheatingAlert && (
            <div className="p-3 bg-red-100 border-b border-red-200 flex items-center gap-3 text-red-700 text-xs font-semibold animate-pulse">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
              <span>{cheatingAlert}</span>
            </div>
          )}

          {activeQuestion ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              
              {/* Question metadata header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-5">
                <span className="font-bold text-sm text-slate-700">
                  Question No. {activeQIndex + 1}
                </span>
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-500">Marks: <strong className="text-slate-700">+{activeQuestion.marks}</strong></span>
                  <span className="text-slate-500">Negative: <strong className="text-red-500">-{activeQuestion.negativeMarks}</strong></span>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="text-slate-800 text-sm font-medium leading-relaxed bg-[#f8f9fa] p-4 rounded border border-slate-200">
                  {activeQuestion.questionText}
                </div>
                 // add question img here from imgUrl
                  <div className="text-slate-800 text-sm font-medium leading-relaxed bg-[#f8f9fa] p-4 rounded border border-slate-200">
                  {activeQuestion.imageUrl}
                </div>
                {/* Answer Input Areas */}
                <div className="flex flex-col gap-3 max-w-2xl">
                  {(activeQuestion.type === 'MCQ' || activeQuestion.type === 'TRUE_FALSE') && (
                    <div className="flex flex-col gap-2.5">
                      {activeQuestion.options?.map((opt: string, oi: number) => (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-xs transition ${
                            currentAnswer === oi
                              ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${activeQuestion._id}`}
                            checked={currentAnswer === oi}
                            onChange={() => handleSelectOption(oi)}
                            className="w-4 h-4 cursor-pointer accent-blue-600"
                          />
                          <span className="font-bold text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded text-slate-500">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {activeQuestion.type === 'MULTIPLE_CORRECT' && (
                    <div className="flex flex-col gap-2.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Select one or more:</span>
                      {activeQuestion.options?.map((opt: string, oi: number) => {
                        const selectedArr = Array.isArray(currentAnswer) ? currentAnswer : [];
                        const isSelected = selectedArr.includes(oi);

                        const handleToggle = () => {
                          const newSelection = isSelected
                            ? selectedArr.filter((item) => item !== oi)
                            : [...selectedArr, oi];
                          updateAnswer(activeQuestion._id, newSelection);
                        };

                        return (
                          <label
                            key={oi}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-xs transition ${
                              isSelected
                                ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={handleToggle}
                              className="w-4 h-4 cursor-pointer accent-blue-600"
                            />
                            <span className="font-bold text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded text-slate-500">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {activeQuestion.type === 'NUMERICAL' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] text-slate-500 font-bold uppercase">Enter your answer value:</label>
                      <input
                        type="number"
                        step="any"
                        value={currentAnswer || ''}
                        onChange={(e) => handleNumericalAnswer(e.target.value)}
                        placeholder="Type answer here..."
                        className="w-48 px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded text-slate-800 text-xs outline-none"
                      />
                    </div>
                  )}

                  {activeQuestion.type === 'SUBJECTIVE' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] text-slate-500 font-bold uppercase">Your subjective response:</label>
                      <textarea
                        rows={6}
                        value={currentAnswer || ''}
                        onChange={(e) => handleNumericalAnswer(e.target.value)}
                        placeholder="Type subjective explanation..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-500 rounded text-slate-800 text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* TCS iON Exam Control Button Bar */}
              <div className="h-16 border-t border-slate-200 mt-6 pt-4 flex justify-between items-center">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleMarkForReview}
                    className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-sm cursor-pointer transition"
                  >
                    Mark for Review & Next
                  </button>
                  <button
                    onClick={handleClearResponse}
                    className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-sm cursor-pointer transition"
                  >
                    Clear Response
                  </button>
                </div>
                
                <button
                  onClick={handleSaveAndNext}
                  className="px-6 py-2 bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-xs font-bold rounded shadow shadow-emerald-700/20 cursor-pointer transition"
                >
                  Save & Next
                </button>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">No questions loaded.</div>
          )}

        </div>

        {/* Right 1/4 Column: Palette & Candidate Panel */}
        <div className="bg-[#f2f4f4] flex flex-col border-l border-slate-300">
          
          {/* Candidate Profile Details */}
          <div className="p-4 bg-white border-b border-slate-300 flex items-center gap-3">
            <div className="w-16 h-16 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-slate-400 font-bold overflow-hidden relative shrink-0">
              <Video className="w-6 h-6 opacity-30" />
              <div className="absolute inset-0 bg-blue-500/5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">Vijay Kumar</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Roll: EG-2026-9812</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold uppercase mt-1 w-max">
                Proctored Active
              </span>
            </div>
          </div>

          {/* Question Palette Matrix */}
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Question Palette
            </h3>

            <div className="grid grid-cols-4 gap-2 pr-1">
              {questions.map((q, idx) => {
                const status = qStatuses[q._id] || 'not_visited';
                const isActive = activeQIndex === idx;

                return (
                  <button
                    key={q._id}
                    onClick={() => handlePaletteClick(idx)}
                    className={`w-10 h-10 text-xs font-extrabold transition flex items-center justify-center cursor-pointer ${
                      isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${getPaletteStyle(status)}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* TCS Status Legend */}
            <div className="mt-4 pt-4 border-t border-slate-300 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Legend</span>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#44a248] text-white rounded-b-[6px] rounded-t-[2px] flex items-center justify-center font-bold">0</div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#d84315] text-white rounded-t-[6px] rounded-b-[2px] flex items-center justify-center font-bold">0</div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#f0f0f0] text-slate-700 border border-slate-300 rounded-[2px] flex items-center justify-center font-bold">0</div>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#5e35b1] text-white rounded-full flex items-center justify-center font-bold">0</div>
                  <span>For Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Box */}
          <div className="p-4 bg-white border-t border-slate-300 flex flex-col gap-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to finish and submit this examination?')) {
                  submitExamSheet();
                }
              }}
              className="w-full py-2.5 bg-[#d32f2f] hover:bg-[#c62828] text-white text-xs font-bold rounded shadow-md cursor-pointer transition text-center uppercase"
            >
              Submit Exam
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
