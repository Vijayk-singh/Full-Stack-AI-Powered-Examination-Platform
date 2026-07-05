import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { Loader } from 'lucide-react';

export default function ManualQuestionTab() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [qText, setQText] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('MEDIUM');
  const [qSubject, setQSubject] = useState('Computer Science');
  const [qTopic, setQTopic] = useState('Database Normalization');
  const [qMarks, setQMarks] = useState(4);
  const [qNegMarks, setQNegMarks] = useState(1);
  const [qExam, setQExam] = useState('');
  const [qExamYear, setQExamYear] = useState('');
  const [qCategory, setQCategory] = useState('MANUAL');
  const [qBatch, setQBatch] = useState('');
  const [qLoading, setQLoading] = useState(false);

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
          imageUrl: qImageUrl,
          type: qType,
          options: qType === 'MCQ' || qType === 'MULTIPLE_CORRECT' ? qOptions : qType === 'TRUE_FALSE' ? ['True', 'False'] : [],
          correctAnswer: qType === 'MULTIPLE_CORRECT' ? qCorrect.split(',').map(Number) : qType === 'MCQ' ? Number(qCorrect) : qCorrect,
          explanation: qExplanation,
          difficulty: qDifficulty,
          subjectName: qSubject,
          topicName: qTopic,
          marks: qMarks,
          negativeMarks: qNegMarks,
          exam: qExam,
          examYear: qExamYear ? Number(qExamYear) : undefined,
          category: qCategory,
          batch: qBatch,
        }),
      });

      if (!res.ok) throw new Error('Failed to create question');

      dispatch(showToast('Question created and cataloged successfully!', 'success'));
      setQText('');
      setQExplanation('');
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (err: any) {
      dispatch(showToast(err.message || 'Error creating question', 'error'));
    } finally {
      setQLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 max-w-3xl">
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
            className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5 mt-4">Question Image URL (Optional)</label>
          <input
            type="text"
            value={qImageUrl}
            onChange={(e) => setQImageUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Type</label>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
                  className="flex-1 px-4 py-1.5 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Target Exam (Optional)</label>
            <input
              type="text"
              value={qExam}
              onChange={(e) => setQExam(e.target.value)}
              placeholder="e.g. UPSC, JEE"
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Exam Year (Optional)</label>
            <input
              type="number"
              value={qExamYear}
              onChange={(e) => setQExamYear(e.target.value)}
              placeholder="e.g. 2024"
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Category</label>
            <select
              value={qCategory}
              onChange={(e) => setQCategory(e.target.value)}
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
            >
              <option value="MANUAL">Manual</option>
              <option value="PYQ">Previous Year Question (PYQ)</option>
              <option value="TEST_SERIES">Test Series</option>
              <option value="MOCK">Mock</option>
              <option value="RANDOM">Random</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Batch Name (Optional)</label>
            <input
              type="text"
              value={qBatch}
              onChange={(e) => setQBatch(e.target.value)}
              placeholder="e.g. Batch-A"
              className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
            className="w-full px-4 py-2 bg-white shadow-sm border border-slate-200 focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={qLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
        >
          {qLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Catalog Question</span>}
        </button>
      </form>
    </div>
  );
}
