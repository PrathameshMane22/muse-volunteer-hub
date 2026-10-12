'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Calendar, CheckSquare, ShieldCheck, 
  LogOut, AlertCircle, Plus, X, KeyRound, CheckCircle2,
  Trash2, Video, Clock, UserCheck, MessageSquare
} from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'volunteers' | 'events' | 'meetings' | 'tasks' | 'attendance'>('overview');
  
  // Datasets
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  // State Modals
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });

  // Creation Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', category: 'Field Drive', date: '', venue_or_link: '', description: '' });

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '18:00', link_or_venue: '', agenda: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' });

  const [showVolModal, setShowVolModal] = useState(false);
  const [newVol, setNewVol] = useState({ name: '', email: '', role: 'volunteer', status: 'active' });

  // Attendance Form
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [newAttendance, setNewAttendance] = useState({ volunteer_id: '', event_or_meeting_title: '', session_date: '', status: 'present' });

  // Candidate Update Modal
  const [candidateTaskModal, setCandidateTaskModal] = useState<any>(null);
  const [candidateUpdate, setCandidateUpdate] = useState({ status: 'pending', candidate_comment: '', extension_requested: false, requested_due_date: '' });

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
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

    const { data: meetData } = await supabase.from('meetings').select('*').order('date', { ascending: true });
    if (meetData) setMeetings(meetData);

    const { data: taskData } = await supabase.from('tasks').select('*');
    if (taskData) setTasks(taskData);

    const { data: attData } = await supabase.from('attendance').select('*');
    if (attData) setAttendance(attData);
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
      setTimeout(() => { setShowPasswordModal(false); setPasswordStatus({ type: '', message: '' }); }, 1500);
    }
    setActionLoading(false);
  }

  // Deletions
  async function handleDelete(table: string, id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchDashboardData();
    else alert('Error deleting: ' + error.message);
  }

  // Create Handlers
  async function handleCreateVol(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);
    const { error } = await supabase.from('profiles').insert([newVol]);
    if (error) setModalError(error.message);
    else {
      setShowVolModal(false);
      setNewVol({ name: '', email: '', role: 'volunteer', status: 'active' });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);
    const { error } = await supabase.from('events').insert([newEvent]);
    if (error) setModalError(error.message);
    else {
      setShowEventModal(false);
      setNewEvent({ title: '', category: 'Field Drive', date: '', venue_or_link: '', description: '' });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);
    const { error } = await supabase.from('meetings').insert([newMeeting]);
    if (error) setModalError(error.message);
    else {
      setShowMeetingModal(false);
      setNewMeeting({ title: '', date: '', time: '18:00', link_or_venue: '', agenda: '' });
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
      assigned_to: newTask.assigned_to || null
    };
    const { error } = await supabase.from('tasks').insert([payload]);
    if (error) setModalError(error.message);
    else {
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  async function handleRecordAttendance(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);
    const { error } = await supabase.from('attendance').upsert([newAttendance]);
    if (error) setModalError(error.message);
    else {
      setShowAttendanceModal(false);
      setNewAttendance({ volunteer_id: '', event_or_meeting_title: '', session_date: '', status: 'present' });
      fetchDashboardData();
    }
    setActionLoading(false);
  }

  // Candidate Progress Update
  async function handleCandidateTaskUpdate(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    const payload: any = {
      status: candidateUpdate.status,
      candidate_comment: candidateUpdate.candidate_comment,
      extension_requested: candidateUpdate.extension_requested
    };
    if (candidateUpdate.extension_requested && candidateUpdate.requested_due_date) {
      payload.requested_due_date = candidateUpdate.requested_due_date;
    }
    const { error } = await supabase.from('tasks').update(payload).eq('id', candidateTaskModal.id);
    if (!error) {
      setCandidateTaskModal(null);
      fetchDashboardData();
    } else {
      alert('Error updating task: ' + error.message);
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

  // Calculate Attendance Metrics per Volunteer
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const volunteerStats = volunteers.map((vol) => {
    const volRecords = attendance.filter((a) => a.volunteer_id === vol.id);
    const overallTotal = volRecords.length;
    const overallPresent = volRecords.filter((a) => a.status === 'present').length;
    const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

    const monthRecords = volRecords.filter((a) => a.session_date && a.session_date.startsWith(currentMonth));
    const monthTotal = monthRecords.length;
    const monthPresent = monthRecords.filter((a) => a.status === 'present').length;
    const monthPct = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

    return {
      ...vol,
      overallPresent,
      overallTotal,
      overallPct,
      monthPresent,
      monthTotal,
      monthPct
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
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
            onClick={() => setActiveTab('meetings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'meetings' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Video className="w-4 h-4" /> Meetings ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tasks' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'attendance' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Attendance Tracker
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name || 'Team Member'}</h2>
              <p className="text-sm text-slate-500">MUSE Foundation Operations & Volunteering Dashboard</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Volunteers</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{volunteers.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Scheduled Drives</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{events.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming Meetings</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{meetings.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Tasks</span>
                <p className="text-3xl font-bold text-slate-900 mt-2">{tasks.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOLUNTEERS */}
        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Volunteer Directory</h2>
                <p className="text-xs text-slate-500">Manage team members, roles, and roster status</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowVolModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
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
                    {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{vol.name || '—'}</td>
                      <td className="px-4 py-3">{vol.email}</td>
                      <td className="px-4 py-3 capitalize">{vol.role}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${
                          vol.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {vol.status || 'active'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete('profiles', vol.id)}
                            title="Remove Volunteer"
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Events & Field Drives</h2>
                <p className="text-xs text-slate-500">Upcoming community clean-ups, workshops, and drives</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowEventModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  No events scheduled yet.
                </div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 relative">
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete('events', ev.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-xs font-bold text-emerald-600 uppercase">{ev.category}</span>
                    <h3 className="font-bold text-slate-900 text-base">{ev.title}</h3>
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

        {/* TAB 4: MEETINGS */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Team Meetings & Syncs</h2>
                <p className="text-xs text-slate-500">Internal coordination calls and operational discussions</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowMeetingModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Add Meeting
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  No meetings scheduled yet.
                </div>
              ) : (
                meetings.map((m) => (
                  <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 relative">
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete('meetings', m.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Internal Sync</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{m.title}</h3>
                    <p className="text-xs text-slate-500">{m.agenda}</p>
                    <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                      <span>Date: {m.date} at {m.time}</span>
                      <span>Link / Venue: {m.link_or_venue}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TASKS & DELIVERABLES */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tasks & Deliverables</h2>
                <p className="text-xs text-slate-500">Track assignment progress, updates, and extension requests</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowTaskModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Assign Task
                </button>
              )}
            </div>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  No tasks assigned yet.
                </div>
              ) : (
                tasks.map((task) => {
                  const assignedUser = volunteers.find((v) => v.id === task.assigned_to);
                  const isAssignedToMe = task.assigned_to === session?.user?.id;

                  return (
                    <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{task.title}</h4>
                            <span className="text-xs px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-700 font-medium">
                              {task.status}
                            </span>
                            {task.extension_requested && (
                              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
                                Extension Requested (New Date: {task.requested_due_date || 'N/A'})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                          <div className="text-[11px] text-slate-400 mt-1 flex gap-4">
                            <span>Assigned to: <strong className="text-slate-700">{assignedUser?.name || assignedUser?.email || 'Unassigned'}</strong></span>
                            <span>Due: <strong className="text-slate-700">{task.due_date || 'None'}</strong></span>
                            <span>Priority: <strong className="text-slate-700">{task.priority}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(isAssignedToMe || isAdmin) && (
                            <button
                              onClick={() => {
                                setCandidateTaskModal(task);
                                setCandidateUpdate({
                                  status: task.status || 'pending',
                                  candidate_comment: task.candidate_comment || '',
                                  extension_requested: task.extension_requested || false,
                                  requested_due_date: task.requested_due_date || ''
                                });
                              }}
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold transition"
                            >
                              Update Status / Notes
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete('tasks', task.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {task.candidate_comment && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <div>
                            <strong className="text-slate-900">Volunteer Update:</strong> {task.candidate_comment}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ATTENDANCE TRACKER */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Attendance Tracker</h2>
                <p className="text-xs text-slate-500">Track monthly and overall participation percentage for all members</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setModalError(''); setShowAttendanceModal(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Record Attendance
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Volunteer</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">This Month ({currentMonth})</th>
                    <th className="px-4 py-3">Overall Ratio</th>
                    <th className="px-4 py-3">Overall Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteerStats.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{vol.name || 'Unnamed'}</p>
                        <p className="text-xs text-slate-400">{vol.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{vol.role}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{vol.monthPresent}</span> / {vol.monthTotal} sessions
                        <span className="ml-2 text-xs text-slate-500">({vol.monthPct}%)</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{vol.overallPresent}</span> / {vol.overallTotal} sessions
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${vol.overallPct >= 75 ? 'bg-emerald-500' : vol.overallPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${vol.overallPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-slate-900">{vol.overallPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Add Volunteer */}
      {showVolModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Add New Volunteer</h3>
              <button onClick={() => setShowVolModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>
            )}
            <form onSubmit={handleCreateVol} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Kadam"
                  value={newVol.name}
                  onChange={(e) => setNewVol({ ...newVol, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="volunteer@example.org"
                  value={newVol.email}
                  onChange={(e) => setNewVol({ ...newVol, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Role</label>
                  <select
                    value={newVol.role}
                    onChange={(e) => setNewVol({ ...newVol, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin / Domain Lead</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Status</label>
                  <select
                    value={newVol.status}
                    onChange={(e) => setNewVol({ ...newVol, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Saving...' : 'Save Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Event */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Create Field Drive / Event</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Event Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mangrove Clean-up Drive"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Category</label>
                  <input
                    type="text"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Venue / Location</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bhuigaon Beach, Vasai"
                  value={newEvent.venue_or_link}
                  onChange={(e) => setNewEvent({ ...newEvent, venue_or_link: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
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

      {/* MODAL: Add Meeting */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Schedule Meeting</h3>
              <button onClick={() => setShowMeetingModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Meeting Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Weekly Strategy Sync"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Date</label>
                  <input
                    required
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Time</label>
                  <input
                    required
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Google Meet / Zoom / Venue</label>
                <input
                  required
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={newMeeting.link_or_venue}
                  onChange={(e) => setNewMeeting({ ...newMeeting, link_or_venue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Agenda</label>
                <textarea
                  rows={2}
                  value={newMeeting.agenda}
                  onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Assign New Task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Task Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Design Event Flyers"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Assign To Volunteer</label>
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
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
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
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
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Task Instructions</label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Saving...' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Attendance */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Record Attendance</h3>
              <button onClick={() => setShowAttendanceModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
            <form onSubmit={handleRecordAttendance} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Volunteer</label>
                <select
                  required
                  value={newAttendance.volunteer_id}
                  onChange={(e) => setNewAttendance({ ...newAttendance, volunteer_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="">Select Volunteer...</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name || v.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Session Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mangrove Clean-up Drive or Team Sync"
                  value={newAttendance.event_or_meeting_title}
                  onChange={(e) => setNewAttendance({ ...newAttendance, event_or_meeting_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Session Date</label>
                  <input
                    required
                    type="date"
                    value={newAttendance.session_date}
                    onChange={(e) => setNewAttendance({ ...newAttendance, session_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Status</label>
                  <select
                    value={newAttendance.status}
                    onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Saving...' : 'Save Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Candidate Task Update & Extension */}
      {candidateTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="font-bold text-slate-900">Task Status & Progress</h3>
                <p className="text-xs text-slate-500">{candidateTaskModal.title}</p>
              </div>
              <button onClick={() => setCandidateTaskModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCandidateTaskUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Status</label>
                <select
                  value={candidateUpdate.status}
                  onChange={(e) => setCandidateUpdate({ ...candidateUpdate, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Progress Note / Feedback</label>
                <textarea
                  rows={2}
                  placeholder="Share current update or links to work..."
                  value={candidateUpdate.candidate_comment}
                  onChange={(e) => setCandidateUpdate({ ...candidateUpdate, candidate_comment: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>
              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={candidateUpdate.extension_requested}
                    onChange={(e) => setCandidateUpdate({ ...candidateUpdate, extension_requested: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  Request Deadline Extension
                </label>
                {candidateUpdate.extension_requested && (
                  <div className="mt-2">
                    <label className="text-xs text-slate-500 uppercase">Proposed Due Date</label>
                    <input
                      type="date"
                      value={candidateUpdate.requested_due_date}
                      onChange={(e) => setCandidateUpdate({ ...candidateUpdate, requested_due_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Updating...' : 'Submit Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Change Password */}
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
                passwordStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                <label className="text-xs font-semibold text-slate-700 uppercase">Confirm Password</label>
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
