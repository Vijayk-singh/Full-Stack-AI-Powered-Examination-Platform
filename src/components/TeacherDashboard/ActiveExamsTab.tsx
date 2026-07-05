import React from 'react';
import { useAppSelector } from '../../lib/redux/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BookOpen, Edit, Check, X, Trash2 } from 'lucide-react';

export default function ActiveExamsTab() {
  const router = useRouter();
  const token = useAppSelector(state => state.auth.accessToken);
  const queryClient = useQueryClient();

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

  const tests = testsData?.data?.tests || [];

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

  return (
    <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200">
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
                <tr key={test._id} className="border-b border-slate-200 hover:bg-slate-50 transition">
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
                        if (window.confirm('Are you sure you want to delete this test?')) {
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
  );
}
