'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Calendar, CheckSquare, ShieldCheck, 
  LogOut, AlertCircle, Plus, X, KeyRound, CheckCircle2 
} from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'volunteers' | 'events' | 'tasks'>('tasks');
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Action Loading & Errors
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Field Drive',
    date: '',
    mode: 'offline',
    venue_or_link: '',
    description: ''
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: ''
  });

  const [showVolModal, setShowVolModal] = useState(false);
  const [newVol, setNewVol] = useState({
    name: '',
    email: '',
    role: 'volunteer'
  });

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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setActionLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus({ type: 'error', message: error.message });
    } else {
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ type: '', message: '' });
      }, 1500);
    }
    setActionLoading(false);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);

    const { error } = await supabase.from('events').insert([newEvent]);
    if (error) {
      setModalError(error.message);
    } else {
      setShowEventModal(false);
      setNewEvent({
        title: '',
        category: 'Field Drive',
        date: '',
        mode: 'offline',
        venue_or_link: '',
        description: ''
      });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);

    const payload = {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'pending',
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to ? newTask.assigned_to : null
    };

    const { error } = await supabase.from('tasks').insert([payload]);
    if (error) {
      setModalError(error.message);
    } else {
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'Medium',
        due_date: ''
      });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  async function handleCreateVol(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);

    const { error } = await supabase.from('profiles').insert([{
      name: newVol.name,
      email: newVol.email,
      role: newVol.role,
      status: 'active'
    }]);

    if (error) {
      setModalError(error.message);
    } else {
      setShowVolModal(false);
      setNewVol({ name: '', email: '', role: 'volunteer' });
      fetchDashboardData();
    }
    setActionLoading(false);
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
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">M</div>
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

  const roleClean = String(profile?.role || '').toLowerCase();
  const isAdmin = roleClean === 'super_admin' || roleClean === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">M</div>
            <span className="font-bold text-white text-base">MUSE Hub</span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono uppercase">
            {profile?.role || 'volunteer'}
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
          <div className="flex items-center gap-1">
            <button 
              onClick={() => { setModalError(''); setShowPasswordModal(true); }} 
              title="Change Password" 
              className="text-slate-400 hover:text-emerald-400 p-1.5 rounded transition hover:bg-slate-800"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout} 
              title="Logout" 
              className="text-slate-400 hover:text-red-400 p-1.5 rounded transition hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Volunteer Directory</h2>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowVolModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Add Volunteer
                </button>
              )}
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Events & Field Drives</h2>
                <p className="text-xs text-slate-500">Schedule drives and track organization events</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowEventModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 space-y-3">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">No events scheduled yet.</p>
                </div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-emerald-600 uppercase">{ev.category}</span>
                    <h3 className="font-bold text-slate-900">{ev.title}</h3>
                    <p className="text-xs text-slate-500">{ev.description}</p>
                    <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                      <span>Date: {ev.date}</span>
                      <span>Venue: {ev.venue_or_link}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tasks & Deliverables</h2>
                <p className="text-xs text-slate-500">Track assignments across members</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowTaskModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Assign Task
                </button>
              )}
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 space-y-3">
                  <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">No tasks assigned yet.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-500">{task.description}</p>
                      <span className="text-[10px] text-slate-400">Due: {task.due_date || 'None'} | Priority: {task.priority}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-full text-slate-700 font-medium">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Assign Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Assign New Task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Task Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Design Awareness Posters"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Assign To Volunteer</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Leave Unassigned</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name || v.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Task Instructions</label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Saving Task...' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Event */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Create Field Drive / Event</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Event Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mangrove Clean-up Drive"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Category</label>
                  <input
                    type="text"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Venue or Online Link</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bhuigaon Beach or Google Meet link"
                  value={newEvent.venue_or_link}
                  onChange={(e) => setNewEvent({ ...newEvent, venue_or_link: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Description & Instructions</label>
                <textarea
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Publishing...' : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Change Password</h3>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPasswordStatus({ type: '', message: '' }); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {passwordStatus.message && (
              <div className={`p-3 text-xs rounded-lg flex items-center gap-2 border ${
                passwordStatus.type === 'error' 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {passwordStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">New Password</label>
                <input
                  required
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Confirm New Password</label>
                <input
                  required
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
