import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { CreditCard, Calendar, Users, Loader } from 'lucide-react';

export default function Subscriptions() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();

  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState(30);
  const [newPlanExpiryDate, setNewPlanExpiryDate] = useState('');
  const [newPlanAttempts, setNewPlanAttempts] = useState(1);
  const [newPlanTests, setNewPlanTests] = useState<string[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const { data: testsData } = useQuery({
    queryKey: ['adminTestsList'],
    queryFn: async () => {
      const res = await fetch('/api/tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch tests');
      return res.json();
    },
    enabled: !!token,
  });
  const allTests = testsData?.data?.tests || [];

  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['adminPlansList'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    enabled: !!token,
  });
  const plans = plansData?.data?.plans || [];

  const { data: userSubsData, refetch: refetchUserSubs } = useQuery({
    queryKey: ['adminUserSubsList'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user subscriptions');
      return res.json();
    },
    enabled: !!token,
  });
  const userSubs = userSubsData?.data?.subscriptions || [];

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanLoading(true);
    try {
      const body: any = {
        name: newPlanName,
        description: newPlanDesc,
        price: newPlanPrice,
        attemptsPerTest: newPlanAttempts,
        availableTests: newPlanTests,
      };
      if (newPlanExpiryDate) {
        body.expiryDate = new Date(newPlanExpiryDate).toISOString();
      } else {
        body.durationDays = newPlanDuration;
      }

      if (editingPlanId) {
        const res = await fetch(`/api/subscriptions/plans/${editingPlanId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to update plan');
        }
        dispatch(showToast(`Subscription plan "${newPlanName}" updated successfully!`, 'success'));
      } else {
        const res = await fetch('/api/subscriptions/plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create plan');
        }
        dispatch(showToast(`Subscription plan "${newPlanName}" created successfully!`, 'success'));
      }

      resetForm();
      refetchPlans();
      refetchUserSubs();
    } catch (e: any) {
      dispatch(showToast(e.message || 'Error saving subscription plan', 'error'));
    } finally {
      setPlanLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPlanId(null);
    setNewPlanName('');
    setNewPlanDesc('');
    setNewPlanPrice(0);
    setNewPlanDuration(30);
    setNewPlanExpiryDate('');
    setNewPlanAttempts(1);
    setNewPlanTests([]);
  };

  const handleEditPlanClick = (plan: any) => {
    setEditingPlanId(plan._id);
    setNewPlanName(plan.name);
    setNewPlanDesc(plan.description || '');
    setNewPlanPrice(plan.price || 0);
    setNewPlanAttempts(plan.attemptsPerTest || 1);
    setNewPlanTests(plan.availableTests || []);
    if (plan.expiryDate) {
      setNewPlanExpiryDate(new Date(plan.expiryDate).toISOString().split('T')[0]);
    } else {
      setNewPlanExpiryDate('');
      setNewPlanDuration(plan.durationDays || 30);
    }
    // Scroll to form (optional, for UX)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      const res = await fetch(`/api/subscriptions/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete plan');
      dispatch(showToast('Subscription plan deleted successfully', 'success'));
      refetchPlans();
      refetchUserSubs();
    } catch (e: any) {
      dispatch(showToast(e.message || 'Error deleting plan', 'error'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Columns: Plans list & Enrollments list */}
      <div className="lg:col-span-2 flex flex-col gap-8 animate-fade-in">
        {/* Subscription Plans */}
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Dynamic Subscription Plans
          </h2>
          <div className="flex flex-col gap-3">
            {plans.map((plan: any) => (
              <div key={plan._id} className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300/80 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800 text-lg">{plan.name}</h4>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                      ${plan.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{plan.description || 'No description added'}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> 
                      {plan.expiryDate 
                        ? `Expires: ${new Date(plan.expiryDate).toLocaleDateString()}`
                        : `Duration: ${plan.durationDays} days`
                      }
                    </span>
                    <span>Attempts per Test: <strong className="text-slate-600">{plan.attemptsPerTest}</strong></span>
                    <span>Tests included: <strong className="text-slate-600">{plan.availableTests?.length || 0}</strong></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleEditPlanClick(plan)}
                    className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 text-blue-600 rounded-lg text-xs font-semibold cursor-pointer transition text-center"
                  >
                    Edit Plan
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold cursor-pointer transition text-center"
                  >
                    Delete Plan
                  </button>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="text-center py-8 text-slate-500">No subscription plans created yet. Use the form on the right to create one.</div>
            )}
          </div>
        </div>

        {/* Student Subscriptions List */}
        <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Active Student Subscriptions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {userSubs.map((sub: any) => (
                  <tr key={sub._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <div>
                        <div>{sub.userId?.name || 'Unknown Student'}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{sub.userId?.email || ''}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{sub.planId?.name || 'Deleted Plan'}</td>
                    <td className="py-4 px-4 text-xs">{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-xs">{new Date(sub.endDate).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : sub.status === 'EXPIRED'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {userSubs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No active student subscriptions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl flex flex-col gap-5 sticky top-6 self-start">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{editingPlanId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</h3>
            <p className="text-xs text-slate-500 mt-1">Configure pricing, test accessibility, attempts, and duration.</p>
          </div>
          {editingPlanId && (
            <button onClick={resetForm} className="text-xs font-bold text-blue-600 hover:underline">
              Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Plan Name</label>
            <input
              type="text"
              required
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="e.g. Premium Access Pack"
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={newPlanDesc}
              onChange={(e) => setNewPlanDesc(e.target.value)}
              placeholder="What is included in this subscription plan..."
              className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Price ($)</label>
              <input
                type="number"
                min={0}
                required
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Attempts per Test</label>
              <input
                type="number"
                min={1}
                required
                value={newPlanAttempts}
                onChange={(e) => setNewPlanAttempts(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Expiry Type</label>
            <div className="grid grid-cols-2 gap-4 mb-2 text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="radio"
                  name="expiryType"
                  checked={!newPlanExpiryDate}
                  onChange={() => setNewPlanExpiryDate('')}
                  className="accent-indigo-500"
                />
                Duration (Days)
              </label>
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="radio"
                  name="expiryType"
                  checked={!!newPlanExpiryDate}
                  onChange={() => setNewPlanExpiryDate(new Date().toISOString().split('T')[0])}
                  className="accent-indigo-500"
                />
                Fixed Expiry Date
              </label>
            </div>

            {!newPlanExpiryDate ? (
              <input
                type="number"
                min={1}
                required
                value={newPlanDuration}
                onChange={(e) => setNewPlanDuration(parseInt(e.target.value) || 30)}
                placeholder="e.g. 30 days"
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
              />
            ) : (
              <input
                type="date"
                required
                value={newPlanExpiryDate}
                onChange={(e) => setNewPlanExpiryDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 outline-none text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Included Tests</label>
            <div className="max-h-40 overflow-y-auto border border-slate-850 rounded-xl p-3 bg-[#f8f9fa]/40 flex flex-col gap-2">
              {allTests.map((t: any) => (
                <label key={t._id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newPlanTests.includes(t._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewPlanTests([...newPlanTests, t._id]);
                      } else {
                        setNewPlanTests(newPlanTests.filter(id => id !== t._id));
                      }
                    }}
                    className="accent-indigo-500 rounded border-slate-850"
                  />
                  <span>{t.title}</span>
                </label>
              ))}
              {allTests.length === 0 && (
                <span className="text-slate-600 text-xs italic">No tests available. Create a test first.</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={planLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 text-sm mt-2"
          >
            {planLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>{editingPlanId ? 'Update Plan' : 'Create Plan'}</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
