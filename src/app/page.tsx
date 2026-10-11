'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Calendar, CheckSquare, 
  ShieldCheck, LogOut, AlertCircle
} from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'volunteers' | 'events' | 'tasks'>('overview');
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(prof);
        fetchDashboardData();
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  async function fetchDashboardData() {
    const { data: volData } = await supabase.from('profiles').select('*');
    if (volData) setVolunteers(volData);

    const { data: evData } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (evData) setEvents(evData);

    const { data: taskData } = await supabase.from('tasks').select('*');
    if (taskData) setTasks(taskData);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return;
    }
    setSession(data.session);
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    setProfile(prof);
    fetchDashboardData();
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-slate-600 font-medium">Connecting to MUSE Volunteer Hub...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MUSE Volunteer Hub</h1>
              <p className="text-xs text-slate-500">MUSE Foundation Operations Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prathammane18@gmail.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">M</div>
            <span className="font-bold text-white text-base">MUSE Hub</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
            {profile?.role || 'User'}
          </span>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Overview
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'volunteers' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Volunteers ({volunteers.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'events' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" /> Drives & Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tasks' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Tasks ({tasks.length})
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{profile?.name || session.user.email}</p>
            <p className="text-[10px] text-slate-400 truncate">{session.user.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-400 p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name || 'Team Member'}</h2>
              <p className="text-sm text-slate-500">MUSE Foundation Operations & Volunteering Dashboard</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Registered Volunteers</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{volunteers.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Drives Scheduled</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{events.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Tasks</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{tasks.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Volunteer Directory</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((vol) => (
                    <tr key={vol.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{vol.name || '—'}</td>
                      <td className="px-4 py-3">{vol.email}</td>
                      <td className="px-4 py-3 capitalize">{vol.role}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700">
                          {vol.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Events & Field Drives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No events scheduled yet.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-emerald-600 uppercase">{ev.category}</span>
                    <h3 className="font-bold text-slate-900">{ev.title}</h3>
                    <p className="text-xs text-slate-500">{ev.description}</p>
                    <div className="text-xs text-slate-600 flex items-center gap-3 pt-2">
                      <span>Date: {ev.date}</span>
                      <span>Mode: {ev.mode}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500">No assigned tasks yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-500">{task.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
