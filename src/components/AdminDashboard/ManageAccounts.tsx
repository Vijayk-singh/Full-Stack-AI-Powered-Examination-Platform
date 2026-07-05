import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { Users } from 'lucide-react';

export default function ManageAccounts() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!token,
  });
  const users = usersData?.data?.users || [];

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      dispatch(showToast(`User status updated to ${status}`, 'success'));
      refetchUsers();
    } catch (e: any) {
      dispatch(showToast(e.message || 'Error updating user status', 'error'));
    }
  };

  return (
    <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        Registered User Accounts
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500 border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u._id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="py-4 px-4 font-semibold text-slate-800">{u.name}</td>
                <td className="py-4 px-4">{u.email}</td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                    {u.role}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  {u.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateUserStatus(u._id, 'inactive')}
                      className="px-2.5 py-1 bg-red-600/15 border border-red-500/25 text-red-500 rounded text-xs font-semibold hover:bg-red-600/25 transition cursor-pointer"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateUserStatus(u._id, 'active')}
                      className="px-2.5 py-1 bg-emerald-600/15 border border-emerald-500/25 text-emerald-600 rounded text-xs font-semibold hover:bg-emerald-600/25 transition cursor-pointer"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
