'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import Papa from 'papaparse';
import { Plus, Users, Code, Copy, Eye, Upload } from 'lucide-react';
import { showToast } from '../../lib/redux/slices/toastSlice';


export default function ManageOATab() {
  const token = useAppSelector((state) => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'LIST' | 'CREATE_OA' | 'CREATE_DSA' | 'INVITE' | 'LEADERBOARD'>('LIST');
  const [selectedOaId, setSelectedOaId] = useState<string | null>(null);

  // Queries
  const { data: oas, isLoading: oasLoading } = useQuery({
    queryKey: ['oas'],
    queryFn: async () => {
      const res = await fetch('/api/oa', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch OAs');
      return res.json();
    },
    enabled: !!token,
  });

  const { data: dsaQuestions } = useQuery({
    queryKey: ['dsaQuestions'],
    queryFn: async () => {
      const res = await fetch('/api/oa/dsa', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch DSA questions');
      return res.json();
    },
    enabled: !!token,
  });

  const { data: mcqQuestions } = useQuery({
    queryKey: ['questions'], // assuming this matches the standard questions endpoint
    queryFn: async () => {
      const res = await fetch('/api/questions', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch MCQ questions');
      return res.json();
    },
    enabled: !!token,
  });

  // State for DSA Creation
  const [dsaForm, setDsaForm] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    languageTemplates: [{ language: 'javascript', code: 'function solve(input) {\n  // Your code here\n}' }],
    testCases: [{ input: '', output: '', isHidden: false }],
    constraints: ['']
  });

  const createDsaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/oa/dsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create DSA');
      return res.json();
    },
    onSuccess: () => {
      dispatch(showToast('DSA Question created!', 'success'));
      queryClient.invalidateQueries({ queryKey: ['dsaQuestions'] });
      setView('LIST');
    }
  });

  // State for OA Creation
  const [oaForm, setOaForm] = useState({
    title: '',
    description: '',
    duration: 60,
    mcqQuestions: [] as string[],
    dsaQuestions: [] as string[],
  });

  const createOaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/oa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create OA');
      return res.json();
    },
    onSuccess: () => {
      dispatch(showToast('OA created successfully!', 'success'));
      queryClient.invalidateQueries({ queryKey: ['oas'] });
      setView('LIST');
    }
  });

  // State for Invite
  const [emailsToInvite, setEmailsToInvite] = useState('');
  
  const inviteMutation = useMutation({
    mutationFn: async (data: { id: string, emails: string[] }) => {
      const res = await fetch(`/api/oa/${data.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emails: data.emails }),
      });
      if (!res.ok) throw new Error('Failed to invite');
      return res.json();
    },
    onSuccess: () => {
      dispatch(showToast('Candidates invited!', 'success'));
      setEmailsToInvite('');
      setView('LIST');
    }
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          // simple assumption: first column or any column containing @ is email
          const emails = new Set<string>();
          results.data.forEach((row: any) => {
            row.forEach((cell: string) => {
              if (cell && cell.includes('@')) emails.add(cell.trim());
            });
          });
          setEmailsToInvite(Array.from(emails).join(', '));
        }
      });
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOaId) return;
    const emails = emailsToInvite.split(',').map(e => e.trim()).filter(e => e.length > 0);
    inviteMutation.mutate({ id: selectedOaId, emails });
  };

  // State for Leaderboard
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', selectedOaId],
    queryFn: async () => {
      if (!selectedOaId) return null;
      const res = await fetch(`/api/oa/${selectedOaId}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    enabled: !!token && view === 'LEADERBOARD' && !!selectedOaId,
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Online Assessments (OA)</h2>
        {view === 'LIST' && (
          <div className="flex gap-2">
            <button onClick={() => setView('CREATE_DSA')} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-700">
              <Code className="w-4 h-4" /> New DSA Question
            </button>
            <button onClick={() => setView('CREATE_OA')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Create OA
            </button>
          </div>
        )}
        {view !== 'LIST' && (
          <button onClick={() => setView('LIST')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200">
            Back to List
          </button>
        )}
      </div>

      {view === 'LIST' && (
        <div className="space-y-4">
          {oasLoading ? (
            <p>Loading...</p>
          ) : oas?.data?.length === 0 ? (
            <p className="text-slate-500">No OAs found. Create one to get started.</p>
          ) : (
            <div className="grid gap-4">
              {oas?.data?.map((oa: any) => (
                <div key={oa._id} className="border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">{oa.title}</h3>
                    <p className="text-sm text-slate-500">{oa.description}</p>
                    <div className="flex gap-4 mt-2 text-xs font-semibold text-slate-500">
                      <span>{oa.duration} mins</span>
                      <span>{oa.mcqQuestions?.length || 0} MCQs</span>
                      <span>{oa.dsaQuestions?.length || 0} DSAs</span>
                      <span>{oa.invitedStudents?.length || 0} Invited</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/oa/${oa._id}`);
                        dispatch(showToast('Public link copied!', 'success'));
                      }} 
                      className="p-2 bg-slate-100 rounded hover:bg-slate-200 text-slate-600" title="Copy Public Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setSelectedOaId(oa._id); setView('INVITE'); }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded text-sm font-semibold hover:bg-indigo-100 flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4" /> Invite
                    </button>
                    <button 
                      onClick={() => { setSelectedOaId(oa._id); setView('LEADERBOARD'); }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded text-sm font-semibold hover:bg-emerald-100 flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'CREATE_DSA' && (
        <form onSubmit={(e) => { e.preventDefault(); createDsaMutation.mutate(dsaForm); }} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
            <input required type="text" className="w-full p-2 border border-slate-300 rounded" value={dsaForm.title} onChange={e => setDsaForm({...dsaForm, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea required rows={4} className="w-full p-2 border border-slate-300 rounded" value={dsaForm.description} onChange={e => setDsaForm({...dsaForm, description: e.target.value})}></textarea>
          </div>
          
          <div className="border border-slate-200 p-4 rounded bg-slate-50">
            <h4 className="font-bold text-slate-700 mb-2">Test Cases</h4>
            {dsaForm.testCases.map((tc, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input placeholder="Input" className="p-2 border rounded w-1/3" value={tc.input} onChange={e => { const newTc = [...dsaForm.testCases]; newTc[idx].input = e.target.value; setDsaForm({...dsaForm, testCases: newTc}); }} />
                <input placeholder="Output" className="p-2 border rounded w-1/3" value={tc.output} onChange={e => { const newTc = [...dsaForm.testCases]; newTc[idx].output = e.target.value; setDsaForm({...dsaForm, testCases: newTc}); }} />
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={tc.isHidden} onChange={e => { const newTc = [...dsaForm.testCases]; newTc[idx].isHidden = e.target.checked; setDsaForm({...dsaForm, testCases: newTc}); }} /> Hidden</label>
              </div>
            ))}
            <button type="button" onClick={() => setDsaForm({...dsaForm, testCases: [...dsaForm.testCases, {input:'', output:'', isHidden:false}]})} className="text-sm text-blue-600 font-semibold mt-2">+ Add Test Case</button>
          </div>

          <button disabled={createDsaMutation.isPending} type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50">
            Save DSA Question
          </button>
        </form>
      )}

      {view === 'CREATE_OA' && (
        <form onSubmit={(e) => { e.preventDefault(); createOaMutation.mutate(oaForm); }} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">OA Title</label>
            <input required type="text" className="w-full p-2 border border-slate-300 rounded" value={oaForm.title} onChange={e => setOaForm({...oaForm, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea required rows={2} className="w-full p-2 border border-slate-300 rounded" value={oaForm.description} onChange={e => setOaForm({...oaForm, description: e.target.value})}></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Duration (minutes)</label>
            <input required type="number" min="1" className="w-full p-2 border border-slate-300 rounded" value={oaForm.duration} onChange={e => setOaForm({...oaForm, duration: parseInt(e.target.value)})} />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Select DSA Questions</label>
            <div className="max-h-40 overflow-y-auto border border-slate-300 rounded p-2">
              {dsaQuestions?.data?.map((q: any) => (
                <label key={q._id} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={oaForm.dsaQuestions.includes(q._id)} onChange={(e) => {
                    const newQs = e.target.checked ? [...oaForm.dsaQuestions, q._id] : oaForm.dsaQuestions.filter(id => id !== q._id);
                    setOaForm({...oaForm, dsaQuestions: newQs});
                  }} />
                  <span className="text-sm font-medium">{q.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Select MCQ Questions</label>
            <div className="max-h-40 overflow-y-auto border border-slate-300 rounded p-2">
              {mcqQuestions?.data?.map((q: any) => (
                <label key={q._id} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={oaForm.mcqQuestions.includes(q._id)} onChange={(e) => {
                    const newQs = e.target.checked ? [...oaForm.mcqQuestions, q._id] : oaForm.mcqQuestions.filter(id => id !== q._id);
                    setOaForm({...oaForm, mcqQuestions: newQs});
                  }} />
                  <span className="text-sm font-medium truncate">{q.text}</span>
                </label>
              ))}
            </div>
          </div>

          <button disabled={createOaMutation.isPending} type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50">
            Publish Online Assessment
          </button>
        </form>
      )}

      {view === 'INVITE' && (
        <form onSubmit={handleInviteSubmit} className="space-y-4 max-w-xl">
          <p className="text-sm text-slate-500 mb-4">Enter comma-separated emails or upload a CSV file containing emails to invite candidates directly to this assessment.</p>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition">
            <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleCsvUpload} />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">Upload CSV file</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Emails</label>
            <textarea required rows={4} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="john@example.com, jane@example.com" value={emailsToInvite} onChange={e => setEmailsToInvite(e.target.value)}></textarea>
          </div>

          <button disabled={inviteMutation.isPending} type="submit" className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 disabled:opacity-50">
            {inviteMutation.isPending ? 'Sending Invites...' : 'Invite Candidates'}
          </button>
        </form>
      )}

      {view === 'LEADERBOARD' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="p-3 font-bold text-slate-600 text-sm">Rank</th>
                <th className="p-3 font-bold text-slate-600 text-sm">Candidate Name</th>
                <th className="p-3 font-bold text-slate-600 text-sm">Email</th>
                <th className="p-3 font-bold text-slate-600 text-sm">Score</th>
                <th className="p-3 font-bold text-slate-600 text-sm">Completed At</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData?.data?.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">No submissions yet.</td></tr>
              )}
              {leaderboardData?.data?.map((attempt: any, idx: number) => (
                <tr key={attempt._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{idx + 1}</td>
                  <td className="p-3 text-slate-800">{attempt.studentId?.name || 'Unknown'}</td>
                  <td className="p-3 text-slate-600 text-sm">{attempt.studentId?.email || 'N/A'}</td>
                  <td className="p-3 font-bold text-blue-600">{attempt.totalScore}</td>
                  <td className="p-3 text-sm text-slate-500">{new Date(attempt.completedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
