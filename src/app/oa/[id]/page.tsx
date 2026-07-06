'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppSelector } from '../../../lib/redux/hooks';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronRight, CheckCircle, XCircle, Code } from 'lucide-react';

export default function OATestPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.accessToken);
  const { id } = params as { id: string };

  const [activeDsaIndex, setActiveDsaIndex] = useState(0);
  const [dsaCodes, setDsaCodes] = useState<Record<string, string>>({});
  const [dsaResults, setDsaResults] = useState<Record<string, any>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  
  const [activeTab, setActiveTab] = useState<'DSA' | 'MCQ'>('DSA');

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['oa', id],
    queryFn: async () => {
      const res = await fetch(`/api/oa/${id}/attempt`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Not authorized or assessment not found');
      return res.json();
    },
    enabled: !!token,
  });

  const oa = assessment?.data;

  // Initialize code templates
  useEffect(() => {
    if (oa?.dsaQuestions) {
      const initialCodes: Record<string, string> = {};
      oa.dsaQuestions.forEach((q: any) => {
        initialCodes[q._id] = q.languageTemplates?.[0]?.code || '// Write your code here';
      });
      setDsaCodes(initialCodes);
    }
  }, [oa]);

  const runCodeMutation = useMutation({
    mutationFn: async (data: { language: string, code: string, input: string }) => {
      const res = await fetch('/api/oa/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    }
  });

  const submitOAMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/oa/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Assessment submitted successfully!');
      router.push('/dashboard');
    }
  });

  const handleRunCode = async (q: any) => {
    const code = dsaCodes[q._id];
    let passed = 0;
    const results = [];
    
    // We will test against all non-hidden test cases first
    const visibleTestCases = q.testCases.filter((tc: any) => !tc.isHidden);
    
    for (const tc of visibleTestCases) {
      const res = await runCodeMutation.mutateAsync({
        language: q.languageTemplates[0]?.language || 'javascript',
        code,
        input: tc.input
      });
      
      const output = res.data?.run?.stdout?.trim();
      const isCorrect = output === tc.output.trim();
      if (isCorrect) passed++;
      
      results.push({ input: tc.input, expected: tc.output, actual: output, isCorrect });
    }
    
    setDsaResults({ ...dsaResults, [q._id]: { passed, total: visibleTestCases.length, details: results } });
  };

  const handleFinalSubmit = () => {
    if (!confirm('Are you sure you want to submit the assessment?')) return;
    
    // Calculate total score (simplified for demo)
    let totalScore = 0;
    
    // Collect MCQ answers
    const formattedMcqAnswers = Object.entries(mcqAnswers).map(([qId, option]) => {
      // we don't know correctness here securely, backend should calculate.
      return { questionId: qId, selectedOption: option };
    });

    // Collect DSA Submissions
    const formattedDsaSubmissions = Object.entries(dsaCodes).map(([qId, code]) => {
      // Again, backend should execute against hidden cases, but here we just pass it along
      const q = oa.dsaQuestions.find((dq: any) => dq._id === qId);
      const passed = dsaResults[qId]?.passed || 0;
      totalScore += (passed * 10); // Arbitrary scoring logic
      
      return {
        questionId: qId,
        language: q?.languageTemplates?.[0]?.language || 'javascript',
        code,
        passedTestCases: passed,
        totalTestCases: q?.testCases?.length || 0,
        score: passed * 10
      };
    });

    submitOAMutation.mutate({
      mcqAnswers: formattedMcqAnswers,
      dsaSubmissions: formattedDsaSubmissions,
      totalScore
    });
  };

  if (isLoading) return <div className="p-10 text-center">Loading Assessment Workspace...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error.message}</div>;
  if (!oa) return null;

  const activeDsa = oa.dsaQuestions?.[activeDsaIndex];
  const dsaResult = dsaResults[activeDsa?._id];

  return (
    <div className="flex h-screen bg-slate-50 flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0">
        <h1 className="font-bold text-lg">{oa.title}</h1>
        <div className="flex gap-4">
          <div className="flex bg-slate-800 rounded-lg overflow-hidden p-1">
            <button onClick={() => setActiveTab('DSA')} className={`px-4 py-1 text-sm font-bold rounded ${activeTab === 'DSA' ? 'bg-indigo-600' : 'text-slate-400'}`}>Coding ({oa.dsaQuestions?.length})</button>
            <button onClick={() => setActiveTab('MCQ')} className={`px-4 py-1 text-sm font-bold rounded ${activeTab === 'MCQ' ? 'bg-indigo-600' : 'text-slate-400'}`}>MCQ ({oa.mcqQuestions?.length})</button>
          </div>
          <button onClick={handleFinalSubmit} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <Send className="w-4 h-4" /> Final Submit
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeTab === 'DSA' ? (
          <>
            {/* Left Pane: Question Description */}
            <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
              {/* Question Navigation */}
              <div className="flex overflow-x-auto border-b border-slate-200 shrink-0">
                {oa.dsaQuestions.map((q: any, idx: number) => (
                  <button 
                    key={q._id} 
                    onClick={() => setActiveDsaIndex(idx)}
                    className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 ${activeDsaIndex === idx ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    Problem {idx + 1}
                  </button>
                ))}
              </div>

              {activeDsa ? (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeDsa.title}</h2>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-6 ${activeDsa.difficulty === 'EASY' ? 'bg-green-100 text-green-700' : activeDsa.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {activeDsa.difficulty}
                  </span>
                  
                  <div className="prose prose-sm text-slate-700">
                    <p>{activeDsa.description}</p>
                    
                    {activeDsa.constraints && activeDsa.constraints.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-bold text-slate-800">Constraints:</h4>
                        <ul className="list-disc pl-5 bg-slate-50 p-4 rounded-lg mt-2">
                          {activeDsa.constraints.map((c: string, i: number) => <li key={i} className="font-mono text-sm">{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-slate-500">No coding questions available.</div>
              )}
            </div>

            {/* Right Pane: Code Editor & Terminal */}
            <div className="flex-1 flex flex-col bg-[#1E1E1E]">
              {/* Editor Header */}
              <div className="h-10 bg-[#2D2D2D] flex items-center justify-between px-4 shrink-0 text-white">
                <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-2">
                  <Code className="w-4 h-4" /> {activeDsa?.languageTemplates?.[0]?.language || 'javascript'}
                </span>
                <button 
                  onClick={() => handleRunCode(activeDsa)}
                  disabled={runCodeMutation.isPending}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {runCodeMutation.isPending ? 'Running...' : 'Run Code'}
                </button>
              </div>
              
              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                {activeDsa && (
                  <Editor
                    height="100%"
                    language={activeDsa.languageTemplates?.[0]?.language === 'c++' ? 'cpp' : (activeDsa.languageTemplates?.[0]?.language || 'javascript')}
                    theme="vs-dark"
                    value={dsaCodes[activeDsa._id]}
                    onChange={(val) => setDsaCodes({ ...dsaCodes, [activeDsa._id]: val || '' })}
                    options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                  />
                )}
              </div>

              {/* Terminal / Results Area */}
              <div className="h-64 bg-[#181818] border-t border-[#333] flex flex-col shrink-0">
                <div className="bg-[#252526] px-4 py-2 text-xs font-bold text-slate-400 border-b border-[#333] tracking-widest">TEST RESULTS</div>
                <div className="p-4 overflow-y-auto flex-1 font-mono text-sm">
                  {!dsaResult ? (
                    <div className="text-slate-500 italic flex items-center justify-center h-full">Click "Run Code" to compile and execute against sample test cases.</div>
                  ) : (
                    <div>
                      <div className="mb-4 text-white font-bold flex items-center gap-2">
                        {dsaResult.passed === dsaResult.total ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                        Passed {dsaResult.passed} / {dsaResult.total} Sample Test Cases
                      </div>
                      <div className="space-y-4">
                        {dsaResult.details.map((res: any, idx: number) => (
                          <div key={idx} className="bg-[#2D2D2D] rounded p-3">
                            <div className="text-xs text-slate-400 mb-1">Test Case {idx + 1} {res.isCorrect ? <span className="text-emerald-500 font-bold ml-2">PASS</span> : <span className="text-red-500 font-bold ml-2">FAIL</span>}</div>
                            <div className="text-slate-300">Input: {res.input}</div>
                            <div className="text-slate-300">Expected: {res.expected}</div>
                            <div className={res.isCorrect ? 'text-slate-300' : 'text-red-400'}>Output: {res.actual}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* MCQ Pane */
          <div className="w-full bg-white overflow-y-auto p-10 flex justify-center">
            <div className="max-w-3xl w-full">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">Multiple Choice Questions</h2>
              {oa.mcqQuestions?.length === 0 && <p className="text-slate-500">No MCQs in this assessment.</p>}
              
              <div className="space-y-8">
                {oa.mcqQuestions.map((q: any, idx: number) => (
                  <div key={q._id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex gap-2">
                      <span className="text-indigo-600">{idx + 1}.</span> {q.text}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <label key={optIdx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${mcqAnswers[q._id] === optIdx ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-100 bg-white'}`}>
                          <input 
                            type="radio" 
                            name={`mcq-${q._id}`} 
                            className="mr-3" 
                            checked={mcqAnswers[q._id] === optIdx}
                            onChange={() => setMcqAnswers({...mcqAnswers, [q._id]: optIdx})}
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
