'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Calendar, CheckSquare, ShieldCheck, 
  LogOut, AlertCircle, Plus, X, KeyRound, CheckCircle2,
  Trash2, Video, UserCheck, MessageSquare, Image as ImageIcon,
  UploadCloud, Maximize2
} from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'volunteers' | 'events' | 'meetings' | 'tasks' | 'attendance' | 'gallery'>('overview');
  
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });

  const [showVolModal, setShowVolModal] = useState(false);
  const [newVol, setNewVol] = useState({ name: '', email: '', password: '', role: 'volunteer', status: 'active' });

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', category: 'Field Drive', date: '', venue_or_link: '', description: '' });

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '18:00', link_or_venue: '', agenda: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '' });

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSessionKey, setSelectedSessionKey] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<{ [volunteerId: string]: string }>({});

  const [candidateTaskModal, setCandidateTaskModal] = useState<any>(null);
  const [candidateUpdate, setCandidateUpdate] = useState({ status: 'pending', candidate_comment: '', extension_requested: false, requested_due_date: '' });

  // Gallery Modals & States
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newPhoto, setNewPhoto] = useState({ title: '', category: 'Drive', event_or_meeting_title: '', session_date: '' });
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !prof || prof.status === 'inactive') {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setAuthError('Your account has been deactivated or removed by an administrator.');
          setLoading(false);
          return;
        }

        setProfile(prof);
        fetchDashboardData();
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  async function fetchDashboardData() {
    const { data: volData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (volData) setVolunteers(volData);

    const { data: evData } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (evData) setEvents(evData);

    const { data: meetData } = await supabase.from('meetings').select('*').order('date', { ascending: true });
    if (meetData) setMeetings(meetData);

    const { data: taskData } = await supabase.from('tasks').select('*');
    if (taskData) setTasks(taskData);

    const { data: attData } = await supabase.from('attendance').select('*').order('session_date', { ascending: false });
    if (attData) setAttendance(attData);

    const { data: photoData } = await supabase.from('gallery_photos').select('*').order('created_at', { ascending: false });
    if (photoData) setPhotos(photoData);
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

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profError || !prof || prof.status === 'inactive') {
      await supabase.auth.signOut();
      setAuthError('Your account has been deactivated or removed by an administrator.');
      setLoading(false);
      return;
    }

    setSession(data.session);
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

  async function handleDelete(table: string, id: string) {
    if (!confirm('Are you sure you want to delete this?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) fetchDashboardData();
    else alert('Error deleting: ' + error.message);
  }

  async function handleUpdateRole(volId: string, updatedRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: updatedRole })
      .eq('id', volId);

    if (error) {
      alert('Failed to update role: ' + error.message);
    } else {
      fetchDashboardData();
    }
  }

  async function handleCreateVol(e: React.FormEvent) {
    e.preventDefault();
    setModalError('');
    setActionLoading(true);

    if (newVol.password.length < 6) {
      setModalError('Temporary password must be at least 6 characters long.');
      setActionLoading(false);
      return;
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzqglxczmsfplguomkdg.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rMj5ISZjZtA7GeJ0WtHPmg_LJE5AThM';
      
      const isolatedAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error: signUpError } = await isolatedAuthClient.auth.signUp({
        email: newVol.email,
        password: newVol.password,
        options: {
          data: {
            name: newVol.name,
            role: newVol.role
          }
        }
      });

      if (signUpError) {
        setModalError(signUpError.message);
        setActionLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').upsert([{
          id: data.user.id,
          name: newVol.name,
          email: newVol.email,
          role: newVol.role,
          status: newVol.status
        }]);
      }

      setShowVolModal(false);
      setNewVol({ name: '', email: '', password: '', role: 'volunteer', status: 'active' });
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.message || 'Error creating user account');
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

  const scheduledSessions = [
    ...events.map(e => ({ key: `event:${e.id}`, title: e.title, date: e.date, type: 'Event' })),
    ...meetings.map(m => ({ key: `meeting:${m.id}`, title: m.title, date: m.date, type: 'Meeting' }))
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  async function handleSaveSessionAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSessionKey) {
      setModalError('Please select an event or meeting first.');
      return;
    }

    const sessionObj = scheduledSessions.find(s => s.key === selectedSessionKey);
    if (!sessionObj) return;

    setActionLoading(true);
    setModalError('');

    const recordsToInsert = volunteers.map(vol => ({
      volunteer_id: vol.id,
      event_or_meeting_title: sessionObj.title,
      session_date: sessionObj.date,
      session_type: sessionObj.type.toLowerCase(),
      status: attendanceRecords[vol.id] || 'present'
    }));

    const { error } = await supabase.from('attendance').upsert(recordsToInsert, {
      onConflict: 'volunteer_id,event_or_meeting_title,session_date'
    });

    if (error) {
      setModalError(error.message);
    } else {
      setShowAttendanceModal(false);
      setSelectedSessionKey('');
      setAttendanceRecords({});
      fetchDashboardData();
    }
    setActionLoading(false);
  }

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

  // Upload Photo to Supabase Storage & Database
  async function handleUploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setModalError('Please select an image file to upload.');
      return;
    }

    setActionLoading(true);
    setModalError('');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('gallery_photos').insert([{
        title: newPhoto.title,
        category: newPhoto.category,
        image_url: publicUrl,
        uploaded_by: session.user.id,
        uploader_name: profile?.name || session.user.email,
        event_or_meeting_title: newPhoto.event_or_meeting_title || null,
        session_date: newPhoto.session_date || null
      }]);

      if (dbError) throw dbError;

      setShowPhotoModal(false);
      setSelectedFile(null);
      setNewPhoto({ title: '', category: 'Drive', event_or_meeting_title: '', session_date: '' });
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to upload photo');
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
  const isSuperAdmin = roleClean === 'super_admin';
  const isDomainLead = roleClean === 'admin';
  const canManageOperations = isSuperAdmin || isDomainLead;

  const currentMonth = new Date().toISOString().slice(0, 7);
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

  const filteredPhotos = activeFilter === 'All' 
    ? photos 
    : photos.filter(p => p.category?.toLowerCase() === activeFilter.toLowerCase());

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
          
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'volunteers' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" /> Volunteers ({volunteers.length})
          </button>
          
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
          <button
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'gallery' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Volunteer Gallery ({photos.length})
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
        {/* OVERVIEW */}
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

        {/* VOLUNTEERS */}
        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Volunteer Directory</h2>
                <p className="text-xs text-slate-500">Manage team members, assign operational roles, and check roster status</p>
              </div>
              {isSuperAdmin && (
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
                    {isSuperAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{vol.name || '—'}</td>
                      <td className="px-4 py-3">{vol.email}</td>
                      <td className="px-4 py-3">
                        {isSuperAdmin && vol.role !== 'super_admin' ? (
                          <select
                            value={vol.role}
                            onChange={(e) => handleUpdateRole(vol.id, e.target.value)}
                            className="text-xs border rounded-lg px-2.5 py-1 bg-white font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                          >
                            <option value="volunteer">Volunteer</option>
                            <option value="admin">Domain Lead (Admin)</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                            vol.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            vol.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {vol.role === 'super_admin' ? 'Super Admin' : vol.role === 'admin' ? 'Domain Lead' : 'Volunteer'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${
                          vol.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {vol.status || 'active'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          {vol.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDelete('profiles', vol.id)}
                              title="Remove Volunteer"
                              className="text-slate-400 hover:text-red-600 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Events & Field Drives</h2>
                <p className="text-xs text-slate-500">Upcoming community clean-ups, workshops, and drives</p>
              </div>
              {canManageOperations && (
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
                    {canManageOperations && (
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

        {/* MEETINGS */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Team Meetings & Syncs</h2>
                <p className="text-xs text-slate-500">Internal coordination calls and operational discussions</p>
              </div>
              {canManageOperations && (
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
                    {canManageOperations && (
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

        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tasks & Deliverables</h2>
                <p className="text-xs text-slate-500">Track assignment progress, updates, and extension requests</p>
              </div>
              {canManageOperations && (
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
                          {(isAssignedToMe || canManageOperations) && (
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
                          {canManageOperations && (
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

        {/* ATTENDANCE TRACKER */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Attendance Tracker</h2>
                <p className="text-xs text-slate-500">Record session attendance and monitor member participation rates</p>
              </div>
              {canManageOperations && (
                <button
                  onClick={() => {
                    setModalError('');
                    setSelectedSessionKey(scheduledSessions[0]?.key || '');
                    const initialStatus: { [id: string]: string } = {};
                    volunteers.forEach(v => { initialStatus[v.id] = 'present'; });
                    setAttendanceRecords(initialStatus);
                    setShowAttendanceModal(true);
                  }}
                  disabled={scheduledSessions.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Mark Event / Meeting Attendance
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

            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Recorded Attendance Logs</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Session Title</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Volunteer</th>
                      <th className="px-4 py-3">Status</th>
                      {canManageOperations && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          No attendance records stored yet.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((rec) => {
                        const vol = volunteers.find(v => v.id === rec.volunteer_id);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{rec.event_or_meeting_title}</td>
                            <td className="px-4 py-3 capitalize text-xs text-slate-500">{rec.session_type || 'Event'}</td>
                            <td className="px-4 py-3 text-xs">{rec.session_date}</td>
                            <td className="px-4 py-3 text-slate-800">{vol?.name || vol?.email || 'Unknown'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                                rec.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                rec.status === 'excused' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            {canManageOperations && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDelete('attendance', rec.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VOLUNTEER GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Volunteer Photo Gallery</h2>
                <p className="text-xs text-slate-500">Memories, field drives, clean-up milestones, and team meetings</p>
              </div>
              <button
                onClick={() => { setModalError(''); setSelectedFile(null); setShowPhotoModal(true); }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition w-fit"
              >
                <UploadCloud className="w-4 h-4" /> Upload Photo
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              {['All', 'Drive', 'Meeting', 'Workshop', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                    activeFilter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            {filteredPhotos.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No photos in this category yet.</p>
                <p className="text-xs">Click "Upload Photo" above to share memories from your phone or desktop.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group relative">
                    <div 
                      className="aspect-video bg-slate-100 overflow-hidden relative cursor-pointer"
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      <img 
                        src={photo.image_url} 
                        alt={photo.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-6 h-6 drop-shadow-md" />
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/70 text-white backdrop-blur-sm uppercase">
                        {photo.category}
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{photo.title}</h4>
                        {photo.event_or_meeting_title && (
                          <p className="text-xs text-emerald-600 font-medium line-clamp-1">{photo.event_or_meeting_title}</p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{photo.session_date || new Date(photo.created_at).toLocaleDateString()}</span>
                        {canManageOperations && (
                          <button
                            onClick={() => handleDelete('gallery_photos', photo.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative text-white">
            <button 
              onClick={() => setPreviewPhoto(null)} 
              className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full z-10 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[75vh] bg-black flex items-center justify-center overflow-hidden">
              <img src={previewPhoto.image_url} alt={previewPhoto.title} className="max-h-[75vh] w-auto object-contain" />
            </div>
            <div className="p-4 bg-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">{previewPhoto.title}</h3>
                <p className="text-xs text-slate-400">
                  {previewPhoto.event_or_meeting_title ? `${previewPhoto.event_or_meeting_title} • ` : ''}
                  Uploaded by {previewPhoto.uploader_name || 'Volunteer'}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-semibold uppercase">
                {previewPhoto.category}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Upload Photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Upload to Volunteer Gallery</h3>
              <button onClick={() => setShowPhotoModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
            
            <form onSubmit={handleUploadPhoto} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Select Image</label>
                <input
                  required
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border rounded-lg text-xs text-slate-600 mt-1 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Caption / Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mangrove planting milestone group photo"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Category</label>
                  <select
                    value={newPhoto.category}
                    onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  >
                    <option value="Drive">Field Drive</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Workshop">Workshop</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase">Date</label>
                  <input
                    type="date"
                    value={newPhoto.session_date}
                    onChange={(e) => setNewPhoto({ ...newPhoto, session_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Associated Drive / Meeting (Optional)</label>
                <select
                  value={newPhoto.event_or_meeting_title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, event_or_meeting_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="">None / Standalone</option>
                  {scheduledSessions.map((s) => (
                    <option key={s.key} value={s.title}>{s.title} ({s.date})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition mt-2"
              >
                {actionLoading ? 'Uploading Image...' : 'Upload Image'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Attendance */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="font-bold text-slate-900">Mark Session Attendance</h3>
                <p className="text-xs text-slate-500">Pick an active event or meeting to log attendance</p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}

            <form onSubmit={handleSaveSessionAttendance} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Select Drive / Meeting</label>
                <select
                  required
                  value={selectedSessionKey}
                  onChange={(e) => setSelectedSessionKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                >
                  <option value="">Choose session...</option>
                  {scheduledSessions.map((s) => (
                    <option key={s.key} value={s.key}>
                      [{s.type}] {s.title} ({s.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase block mb-2">Member Attendance Status</label>
                <div className="space-y-2 border rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto">
                  {volunteers.map((vol) => (
                    <div key={vol.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{vol.name || 'Unnamed'}</p>
                        <p className="text-[10px] text-slate-500">{vol.email}</p>
                      </div>
                      <select
                        value={attendanceRecords[vol.id] || 'present'}
                        onChange={(e) => setAttendanceRecords({ ...attendanceRecords, [vol.id]: e.target.value })}
                        className="text-xs border rounded-lg px-2 py-1 bg-white font-medium text-slate-700 outline-none"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition"
              >
                {actionLoading ? 'Saving Roster Attendance...' : 'Save Roster Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Volunteer */}
      {showVolModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900">Add New Volunteer</h3>
              <button onClick={() => setShowVolModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {modalError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>}
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
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase">Initial Password</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Volunteer@123"
                  value={newVol.password}
                  onChange={(e) => setNewVol({ ...newVol, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Share this password with them. They can update it after login.</p>
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
                {actionLoading ? 'Creating Account...' : 'Create Account & Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Event */}
      {showEventModal && canManageOperations && (
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

      {/* MODAL: Meeting */}
      {showMeetingModal && canManageOperations && (
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
                <label className="text-xs font-semibold text-slate-700 uppercase">Link or Venue</label>
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

      {/* MODAL: Task */}
      {showTaskModal && canManageOperations && (
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

      {/* MODAL: Candidate Task Progress */}
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
                  placeholder="Share updates, work status, or drive links..."
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
