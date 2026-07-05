'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../lib/redux/hooks';
import { useRouter } from 'next/navigation';
import { setAuth, logout, hydrateAuth } from '../../../lib/redux/slices/authSlice';
import DashboardLayout from '../../../components/DashboardLayout';
import { User, Mail, Shield, Key, Camera, Loader, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector(state => state.auth);
    // Auth actions are now dispatched: dispatch(setAuth({ user: ...)) or dispatch(logout()))

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user && !localStorage.getItem('auth_token')) {
      router.push('/login');
      return;
    }

    // Fetch latest user details from server
    const fetchProfile = async () => {
      try {
        const token = accessToken || localStorage.getItem('auth_token');
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const result = await res.json();
        const userData = result.data;
        setName(userData.name);
        setEmail(userData.email);
        setAvatar(userData.avatar || '');
      } catch (e) {
        console.error(e);
        // Fallback to store user if fetch fails
        if (user) {
          setName(user.name);
          setEmail(user.email);
          setAvatar(user.avatar || '');
        }
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('auth_token');
      const body: any = { name, email, avatar };
      if (password) body.password = password;

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      const updatedUser = result.data;
      
      // Update Zustand Auth Store
      const mappedUser = {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      };
      dispatch(setAuth({ user: mappedUser, token: token }));
      
      // Reset passwords fields
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'An error occurred saving changes' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm mt-3">Fetching profile details...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold t">Profile Settings</h1>
          <p className="text-slate-400 mt-1">Manage your identity credentials and avatar representation.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className=" p-8 rounded-2xl border border-slate-900 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Avatar Section */}
            <div className="flex items-center gap-5 pb-6 border-b border-slate-900">
              <div className="w-20 h-20 rounded-full bg-indigo-600/10 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 text-3xl font-extrabold shadow-lg overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none text-sm transition"
                />
              </div>
            </div>

            {/* Role Info - Read-only */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Role Profile
              </label>
              <input
                type="text"
                disabled
                value={user?.role}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-500 outline-none text-sm font-semibold cursor-not-allowed uppercase tracking-wider"
              />
            </div>

            {/* Password Update */}
            <div className="pt-6 border-t border-slate-900 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-400" /> Security Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Leave blank if you do not wish to change your password.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype password"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-white outline-none text-sm transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 text-sm mt-4 shadow-lg shadow-indigo-600/10"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Save Changes</span>}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
