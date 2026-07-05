import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { BookOpen, Loader } from 'lucide-react';

export default function CurriculumManagement() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [subjectLoading, setSubjectLoading] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjectsList'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      return res.json();
    },
  });
  const subjects = subjectsData?.data || [];

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectLoading(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionText: `System Category Initialization: ${newSubName}`,
          type: 'SUBJECTIVE',
          correctAnswer: 'System Admin Setup',
          subjectName: newSubName,
          topicName: 'General Information',
          marks: 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create category');

      dispatch(showToast(`Category ${newSubName} created successfully!`, 'success'));
      setNewSubName('');
      setNewSubDesc('');
      queryClient.invalidateQueries({ queryKey: ['subjectsList'] });
    } catch (e: any) {
      dispatch(showToast(e.message || 'Error creating category', 'error'));
    } finally {
      setSubjectLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Subjects Catalog
        </h2>
        <div className="flex flex-col gap-3">
          {subjects.map((sub: any) => (
            <div key={sub._id} className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-slate-800">{sub.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{sub.description || 'No description added'}</p>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="text-center py-8 text-slate-500">No subjects cataloged. Add one using the form on the right.</div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4">Add Curriculum Subject</h3>
        <form onSubmit={handleCreateSubject} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject Name</label>
            <input
              type="text"
              required
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={newSubDesc}
              onChange={(e) => setNewSubDesc(e.target.value)}
              placeholder="Subject scope description..."
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={subjectLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 text-sm"
          >
            {subjectLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Add Subject</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
