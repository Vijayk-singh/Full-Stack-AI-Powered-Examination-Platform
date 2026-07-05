import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { Cpu, Loader } from 'lucide-react';

export default function AIGenerationTab() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [aiSubject, setAiSubject] = useState('Computer Science');
  const [aiTopic, setAiTopic] = useState('Process Synchronization');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiCount, setAiCount] = useState(5);
  const [aiExam, setAiExam] = useState('');
  const [aiExamYear, setAiExamYear] = useState('');
  const [aiCategory, setAiCategory] = useState('AI_GENERATED');
  const [aiBatch, setAiBatch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultQuestions, setAiResultQuestions] = useState<any[]>([]);

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
      dispatch(showToast('AI questions successfully drafted! Review below.', 'success'));
    } catch (err: any) {
      dispatch(showToast(err.message || 'Error generating AI questions', 'error'));
    } finally {
      setAiLoading(false);
    }
  };

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
            exam: aiExam,
            examYear: aiExamYear ? Number(aiExamYear) : undefined,
            category: aiCategory,
            batch: aiBatch,
          }),
        });
      }
      dispatch(showToast('All AI questions cataloged successfully into database!', 'success'));
      setAiResultQuestions([]);
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (e) {
      dispatch(showToast('Failed bulk saving questions', 'error'));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
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
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Topic</label>
              <input
                type="text"
                required
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Difficulty</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Target Exam (Optional)</label>
              <input
                type="text"
                value={aiExam}
                onChange={(e) => setAiExam(e.target.value)}
                placeholder="e.g. UPSC, JEE"
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Exam Year (Optional)</label>
              <input
                type="number"
                value={aiExamYear}
                onChange={(e) => setAiExamYear(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Category</label>
              <select
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              >
                <option value="AI_GENERATED">AI Generated</option>
                <option value="MOCK">Mock</option>
                <option value="TEST_SERIES">Test Series</option>
                <option value="RANDOM">Random</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Batch Name (Optional)</label>
              <input
                type="text"
                value={aiBatch}
                onChange={(e) => setAiBatch(e.target.value)}
                placeholder="e.g. Batch-A"
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={aiLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {aiLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Draft with AI</span>}
          </button>
        </form>
      </div>

      {aiResultQuestions.length > 0 && (
        <div className="bg-white shadow-sm border border-blue-100 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-600">Review AI Draft</h3>
            <button
              onClick={saveAIGenerated}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Save All to Catalog
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {aiResultQuestions.map((q, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200">
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
  );
}
