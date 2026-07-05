import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { Loader } from 'lucide-react';

interface ScheduleExamTabProps {
  onSuccess: () => void;
}

export default function ScheduleExamTab({ onSuccess }: ScheduleExamTabProps) {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testSubjectId, setTestSubjectId] = useState('');
  const [testDuration, setTestDuration] = useState(60);
  const [testType, setTestType] = useState('PRACTICE');
  const [testStartDate, setTestStartDate] = useState('');
  const [testEndDate, setTestEndDate] = useState('');
  const [testQuestions, setTestQuestions] = useState<string[]>([]);
  const [testAllowedPlans, setTestAllowedPlans] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [testLoading, setTestLoading] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });

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

  const { data: plansData } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/plans');
      return res.json();
    },
  });

  const subjects = subjectsData?.data || [];
  const questionsList = questionsData?.data?.questions || [];
  const plansList = plansData?.data || [];

  useEffect(() => {
    if (subjects.length > 0 && !testSubjectId) {
      setTestSubjectId(subjects[0]._id);
    }
  }, [subjects, testSubjectId]);

  const handleScheduleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testQuestions.length === 0) {
      dispatch(showToast('Please select at least one question for this test', 'warning'));
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
          isPublic,
          allowedPlans: isPublic ? [] : testAllowedPlans,
        }),
      });

      if (!res.ok) throw new Error('Failed to create test schedule');

      if (testType === 'SCHEDULED') {
        dispatch(showToast('Exam schedule created successfully as DRAFT! Go to the "Active Exams" tab and click the green checkmark button to publish it.', 'success'));
      } else {
        dispatch(showToast('Exam created and published successfully! It is now live for students to attempt.', 'success'));
      }
      setTestTitle('');
      setTestDesc('');
      setTestQuestions([]);
      setTestAllowedPlans([]);
      setIsPublic(true);
      queryClient.invalidateQueries({ queryKey: ['teacherTests'] });
      onSuccess();
    } catch (err: any) {
      dispatch(showToast(err.message || 'Error creating test schedule', 'error'));
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

  const handleSelectPlan = (planId: string) => {
    if (testAllowedPlans.includes(planId)) {
      setTestAllowedPlans(testAllowedPlans.filter((id) => id !== planId));
    } else {
      setTestAllowedPlans([...testAllowedPlans, planId]);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl max-w-3xl">
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
            className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Description</label>
          <textarea
            rows={2}
            value={testDesc}
            onChange={(e) => setTestDesc(e.target.value)}
            placeholder="Enter description, rules, etc..."
            className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject Category</label>
            <select
              value={testSubjectId}
              onChange={(e) => setTestSubjectId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Type</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none"
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
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={testEndDate}
                onChange={(e) => setTestEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-xs"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Access Type</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="accent-indigo-500"
                />
                <span className="text-sm font-medium">Public (All students)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="accent-indigo-500"
                />
                <span className="text-sm font-medium">Subscriber Only (Requires Plan)</span>
              </label>
            </div>
          </div>
          
          {!isPublic && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                Select Allowed Subscription Plans
              </label>
              <div className="flex flex-col gap-2">
                {plansList.map((plan: any) => (
                  <label key={plan._id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={testAllowedPlans.includes(plan._id)}
                      onChange={() => handleSelectPlan(plan._id)}
                      className="accent-indigo-500"
                    />
                    <span>{plan.name} - ${plan.price}</span>
                  </label>
                ))}
                {plansList.length === 0 && (
                  <div className="text-xs text-slate-500">No subscription plans available.</div>
                )}
              </div>
            </div>
          )}
        </div>

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
                    : 'bg-white shadow-sm border-slate-200 text-slate-500 hover:text-slate-800'
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
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
        >
          {testLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Schedule Exam</span>}
        </button>
      </form>
    </div>
  );
}
