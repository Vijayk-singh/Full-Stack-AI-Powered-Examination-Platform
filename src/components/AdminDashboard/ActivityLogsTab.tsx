'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../lib/redux/hooks';
import { Activity, Clock, Server, User } from 'lucide-react';

export default function ActivityLogsTab() {
  const token = useAppSelector((state) => state.auth.accessToken);
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminLogs', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
    enabled: !!token,
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination || { pages: 1 };

  return (
    <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          <Activity className="w-5 h-5 text-blue-600" />
          System Activity Logs
        </h2>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 bg-slate-100 text-slate-600 rounded disabled:opacity-50 text-xs font-semibold"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-600">Page {page} of {pagination.pages || 1}</span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-slate-100 text-slate-600 rounded disabled:opacity-50 text-xs font-semibold"
          >
            Next
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Loading logs...</div>
      ) : isError ? (
        <div className="text-center py-10 text-red-500">Error loading logs</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No activity logged yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 px-2 font-semibold">Timestamp</th>
                <th className="pb-3 px-2 font-semibold">User</th>
                <th className="pb-3 px-2 font-semibold">Action</th>
                <th className="pb-3 px-2 font-semibold">Endpoint</th>
                <th className="pb-3 px-2 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="py-3 px-2 text-xs text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.userId ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{log.userId.name}</span>
                          <span className="text-[10px] text-slate-500">{log.userId.role}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Anonymous</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.method === 'GET' ? 'bg-blue-50 text-blue-600' :
                      log.method === 'POST' ? 'bg-emerald-50 text-emerald-600' :
                      log.method === 'PUT' ? 'bg-amber-50 text-amber-600' :
                      log.method === 'DELETE' ? 'bg-red-50 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-600 font-mono flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    {log.endpoint}
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-500 font-mono">
                    {log.ipAddress}
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
