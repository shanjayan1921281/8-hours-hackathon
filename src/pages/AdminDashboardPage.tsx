import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Unlock, Megaphone, Users, Layers, 
  Search, Edit3, CheckCircle2, Clock, AlertCircle, ShieldAlert,
  Send, RefreshCw, X, FileText, Sparkles, Eye, Zap, Radio,
  ShieldCheck, Activity, Cpu, Lock
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useSocket, HackathonState, SlotStat } from '../context/SocketContext.js';
import { TimerDisplay } from '../components/TimerDisplay.js';
import { AllocationGrid } from '../components/AllocationGrid.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { ServerHeartbeatWidget } from '../components/ServerHeartbeatWidget.js';
import { AIRevealOperatorRobot, RobotState } from '../components/AIRevealOperatorRobot.js';
import { playClick } from '../services/sound.js';

interface AdminTeam {
  id: number;
  team_code: string;
  team_name: string;
  selected_problem_id: number | null;
  selected_at: string | null;
  problem_code: string | null;
  problem_title: string | null;
}

interface ProblemItem {
  id: number;
  problem_code: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  expected_output: string;
  evaluation_focus: string;
  is_revealed: number;
  total_slots: number;
  consumed_slots: number;
}

export const AdminDashboardPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { hackathon, announcements, slotStats, requestSync } = useSocket();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [robotState, setRobotState] = useState<RobotState>('idle');

  // Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDangerous?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    isDangerous: false,
    confirmText: 'Confirm'
  });

  // Announcements
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // Filter
  const [teamSearch, setTeamSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<'ALL' | 'WAITING' | 'DISCOVERED'>('ALL');

  // Edit Problem Modal
  const [editingProblem, setEditingProblem] = useState<ProblemItem | null>(null);
  const [savingProblem, setSavingProblem] = useState(false);

  // Create Team Modal
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamCode, setNewTeamCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamCreateError, setTeamCreateError] = useState<string | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamCode.trim() || !newTeamName.trim() || !newTeamPassword) {
      setTeamCreateError('All fields are required.');
      return;
    }
    setTeamCreateError(null);
    setCreatingTeam(true);

    try {
      await apiRequest('/api/admin/teams', {
        method: 'POST',
        body: JSON.stringify({
          team_code: newTeamCode.trim(),
          team_name: newTeamName.trim(),
          password: newTeamPassword
        })
      });
      setNewTeamCode('');
      setNewTeamName('');
      setNewTeamPassword('');
      setShowCreateTeamModal(false);
      fetchAdminData();
    } catch (err: any) {
      setTeamCreateError(err.message || 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = (teamId: number, teamCode: string) => {
    playClick();
    setConfirmModal({
      isOpen: true,
      title: `DELETE TEAM ${teamCode}?`,
      message: `This will permanently remove team ${teamCode} and release any claimed challenge slots back to the bowl.`,
      confirmText: 'DELETE TEAM',
      isDangerous: true,
      action: async () => {
        await apiRequest(`/api/admin/teams/${teamId}`, { method: 'DELETE' });
        fetchAdminData();
      }
    } as any);
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        hackathon: HackathonState;
        problems: ProblemItem[];
        teams: AdminTeam[];
      }>('/api/admin/state');

      setProblems(res.problems || []);
      setTeams(res.teams || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Controls Handlers
  const handleStartTimer = () => {
    playClick();
    setConfirmModal({
      isOpen: true,
      title: 'START 8-HOUR HACKATHON?',
      message: 'This will synchronize the official 8-hour master countdown across all 20 participating team terminals and lock the event start timestamp.',
      confirmText: 'START TIMER NOW',
      isDangerous: false,
      action: async () => {
        await apiRequest('/api/admin/timer/start', { method: 'POST' });
        fetchAdminData();
        requestSync();
      }
    } as any);
  };

  const handlePauseTimer = async () => {
    playClick();
    try {
      await apiRequest('/api/admin/timer/pause', { method: 'POST' });
      fetchAdminData();
      requestSync();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResumeTimer = async () => {
    playClick();
    try {
      await apiRequest('/api/admin/timer/resume', { method: 'POST' });
      fetchAdminData();
      requestSync();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetTimer = () => {
    playClick();
    setConfirmModal({
      isOpen: true,
      title: 'RESET MASTER TIMER?',
      message: 'This will reset the event timer back to SETUP state (08:00:00). Ensure all teams are aware before triggering a reset.',
      confirmText: 'RESET TIMER',
      isDangerous: true,
      action: async () => {
        await apiRequest('/api/admin/timer/reset', { method: 'POST' });
        fetchAdminData();
        requestSync();
      }
    } as any);
  };

  const handleRevealProblems = () => {
    playClick();
    setConfirmModal({
      isOpen: true,
      title: 'REVEAL CHALLENGES?',
      message: 'Once revealed, problem statements are permanently visible and all teams can engage the 3D Bowl Shuffle to discover their challenge. This action cannot be undone.',
      confirmText: 'REVEAL NOW',
      isDangerous: false,
      action: async () => {
        try {
          // Step 1: WAKE
          setRobotState('wake');
          await new Promise(r => setTimeout(r, 450));

          // Step 2: CONTROL / AUTHORIZE
          setRobotState('authorizing');
          await new Promise(r => setTimeout(r, 650));

          // Step 3: ACTIVATE (Energy pulse to button)
          setRobotState('activating');
          await new Promise(r => setTimeout(r, 700));

          // Step 4: REVEAL REAL BACKEND CALL
          await apiRequest('/api/admin/problems/reveal', { method: 'POST' });

          // Step 5: SUCCESS & CELEBRATION
          setRobotState('success');
          fetchAdminData();
          requestSync();
        } catch (err: any) {
          setRobotState('error');
          setError(err.message);
          setTimeout(() => setRobotState('idle'), 3500);
        }
      }
    } as any);
  };

  const handleResetReveal = () => {
    playClick();
    setConfirmModal({
      isOpen: true,
      title: 'RESET PROBLEM STATEMENT REVEAL?',
      message: 'This will clear the current reveal state and allow the Problem Statements to be revealed again.',
      confirmText: 'RESET & ENABLE REVEAL',
      isDangerous: true,
      action: async () => {
        try {
          await apiRequest('/api/admin/problems/reset-reveal', { method: 'POST' });
          setRobotState('idle');
          fetchAdminData();
          requestSync();
        } catch (err: any) {
          setError(`RESET FAILED: ${err.message || 'Unable to reset the reveal state. Please try again.'}`);
        }
      }
    } as any);
  };

  const handleSetPhase = async (phase: string) => {
    playClick();
    try {
      await apiRequest('/api/admin/phase/set', {
        method: 'POST',
        body: JSON.stringify({ phase })
      });
      fetchAdminData();
      requestSync();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setSendingAnnouncement(true);
    playClick();
    try {
      await apiRequest('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ message: announcementText.trim() })
      });
      setAnnouncementText('');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleSaveProblemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem) return;

    setSavingProblem(true);
    try {
      await apiRequest(`/api/admin/problems/${editingProblem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingProblem.title,
          category: editingProblem.category,
          description: editingProblem.description,
          requirements: editingProblem.requirements,
          expected_output: editingProblem.expected_output,
          evaluation_focus: editingProblem.evaluation_focus
        })
      });
      setEditingProblem(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingProblem(false);
    }
  };

  // Group assigned teams by problem code for visualization
  const assignedTeamsByProblem: { [code: string]: string[] } = {};
  teams.forEach(t => {
    if (t.problem_code) {
      if (!assignedTeamsByProblem[t.problem_code]) {
        assignedTeamsByProblem[t.problem_code] = [];
      }
      assignedTeamsByProblem[t.problem_code].push(t.team_code);
    }
  });

  // Calculate team status based on hackathon phase
  const getTeamStatus = (team: AdminTeam) => {
    if (!team.selected_problem_id) return 'WAITING';
    const phase = hackathon?.current_phase || 'DISCOVER';
    if (phase === 'DISCOVER') return 'DISCOVERED';
    if (phase === 'BUILD') return 'BUILDING';
    if (phase === 'TEST') return 'TESTING';
    if (phase === 'PITCH') return 'PITCHING';
    return 'COMPLETED';
  };

  // Filtered teams list
  const filteredTeams = teams.filter(t => {
    const status = getTeamStatus(t);
    const matchesSearch = t.team_name.toLowerCase().includes(teamSearch.toLowerCase()) ||
                          t.team_code.toLowerCase().includes(teamSearch.toLowerCase()) ||
                          (t.problem_code && t.problem_code.toLowerCase().includes(teamSearch.toLowerCase()));
    
    if (teamFilter === 'WAITING') return matchesSearch && status === 'WAITING';
    if (teamFilter === 'DISCOVERED') return matchesSearch && status !== 'WAITING';
    return matchesSearch;
  });

  const discoveredCount = teams.filter(t => t.selected_problem_id !== null).length;
  const isRevealed = hackathon?.problems_revealed === 1;

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Bar: HACKATHON CONTROL CENTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              HACKATHON CONTROL CENTER
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              ROOT ADMIN
            </span>
            <ServerHeartbeatWidget />
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            20 TEAMS • 5 CHALLENGES • MASTER REAL-TIME TELEMETRY
          </p>
        </div>

        {/* Global Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {hackathon?.status === 'ACTIVE' ? (
            <button
              onClick={handlePauseTimer}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-display rounded-lg transition-colors shadow-lg shadow-amber-900/30"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE TIMER</span>
            </button>
          ) : hackathon?.status === 'PAUSED' ? (
            <button
              onClick={handleResumeTimer}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-display rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>RESUME TIMER</span>
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-display rounded-lg transition-colors shadow-lg shadow-cyan-900/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>START TIMER</span>
            </button>
          )}

          <button
            onClick={handleResetTimer}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>

          {!isRevealed ? (
            <button
              onClick={handleRevealProblems}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-display rounded-lg transition-all shadow-lg shadow-purple-900/30 animate-pulse cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>REVEAL CHALLENGES</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CHALLENGES REVEALED</span>
              </div>
              <button
                onClick={handleResetReveal}
                className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-mono font-semibold rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                title="Reset Problem Statement Reveal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET REVEAL</span>
              </button>
            </div>
          )}

          <button
            onClick={fetchAdminData}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            title="Refresh State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Timer on Left, Announcements on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Master Timer & Phase Controls */}
        <div className="lg:col-span-2 space-y-6">
          <TimerDisplay />

          {/* Phase Manual Override Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16]/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-400">
              <span>MANUAL PHASE OVERRIDE:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['DISCOVER', 'BUILD', 'TEST', 'PITCH', 'COMPLETED'].map((ph) => {
                const isCurrent = hackathon?.current_phase === ph;
                return (
                  <button
                    key={ph}
                    onClick={() => handleSetPhase(ph)}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {ph}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Announcements Composer & Log */}
        <div className="rounded-xl border border-slate-800 bg-[#090d16]/90 p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase mb-3">
              <Megaphone className="w-4 h-4" />
              <span>BROADCAST ANNOUNCEMENT</span>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-3 mb-4">
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Broadcast real-time transmission to all 20 team screens..."
                className="w-full p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {[
                    'Challenges Unlocked!',
                    '1 Hour Remaining in Build Phase',
                    'Prepare for Test Validation'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAnnouncementText(preset)}
                      className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 rounded transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={sendingAnnouncement || !announcementText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors ml-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SEND</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent announcements list */}
          <div className="border-t border-slate-800/80 pt-3">
            <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase tracking-wider">
              RECENT BROADCAST LOG:
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-xs">
                  <p className="text-slate-300 leading-snug">{a.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROBLEM STATEMENT REVEAL CHAMBER (Official Master Event Control Chamber) */}
      {/* ========================================================================= */}
      <section className="mb-12 relative">
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#08122a]/95 via-[#040817]/98 to-[#02040b]/98 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden relative">
          {/* Corner Tech HUD Brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

          {/* Holographic Ambient Background Glows */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-cyan-500/12 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[260px] bg-purple-600/12 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute inset-0 bg-grid-cyber opacity-15 pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10">
            {/* 1. CHAMBER HEADER */}
            <div className="flex flex-col items-center gap-1.5 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400/90 uppercase px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  EVENT CONTROL / 05
                </span>
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/60">
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRevealed ? 'bg-emerald-400' : 'bg-cyan-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isRevealed ? 'bg-emerald-400' : 'bg-cyan-400'}`}></span>
                  </span>
                  <span className={`text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase ${isRevealed ? 'text-emerald-400' : 'text-cyan-300'}`}>
                    {isRevealed ? 'MASTER BROADCAST LIVE' : 'SYSTEM READY'}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white mt-1 drop-shadow-[0_0_25px_rgba(34,211,238,0.3)]">
                PROBLEM STATEMENT REVEAL
              </h2>

              <p className="text-xs sm:text-sm font-mono text-cyan-300/70 tracking-wide">
                Official Hackathon Problem Discovery System
              </p>
            </div>

            {/* 2. CENTRAL VISUAL: AI REVEAL OPERATOR ROBOT */}
            <div className="my-2 mb-4">
              <AIRevealOperatorRobot
                robotState={robotState}
                isRevealed={isRevealed}
              />
            </div>

            {/* 3. MAIN REVEAL / RESET REVEAL CONTROLS */}
            {!isRevealed ? (
              <div className="w-full flex justify-center mb-8">
                <motion.button
                  onClick={handleRevealProblems}
                  onMouseEnter={() => {
                    if (!isRevealed && robotState === 'idle') setRobotState('hover');
                  }}
                  onMouseLeave={() => {
                    if (!isRevealed && robotState === 'hover') setRobotState('idle');
                  }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative group w-full max-w-[500px] min-h-[105px] rounded-2xl p-[2px] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    robotState === 'activating' || robotState === 'authorizing'
                      ? 'shadow-[0_0_70px_rgba(6,182,212,0.9)] ring-2 ring-cyan-300'
                      : 'shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_65px_rgba(6,182,212,0.75)]'
                  }`}
                >
                  {/* Outer Breathing Energy Glow */}
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-sky-400 opacity-75 group-hover:opacity-100 blur-md transition-opacity duration-500"
                    animate={{
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Traveling Border Light Energy */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <motion.div
                      className="absolute top-0 left-0 h-[2px] w-[60%] bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-95"
                      animate={{ left: ['-60%', '100%'] }}
                      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 h-[2px] w-[60%] bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-95"
                      animate={{ right: ['-60%', '100%'] }}
                      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                    />
                  </div>

                  {/* Inner Polished Glass Surface */}
                  <div className="relative w-full h-full min-h-[101px] rounded-2xl bg-gradient-to-r from-slate-950/95 via-[#130d2a]/85 to-slate-950/95 backdrop-blur-2xl border border-cyan-400/50 p-5 flex items-center justify-center gap-5 overflow-hidden">
                    {/* Inner Holographic Grid */}
                    <div className="absolute inset-0 bg-grid-cyber opacity-25 pointer-events-none" />

                    {/* Futuristic Activation Icon */}
                    <div className="relative shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/60 flex items-center justify-center shadow-lg shadow-cyan-950/60 group-hover:border-cyan-300 group-hover:scale-105 transition-all">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Unlock className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
                      </motion.div>
                    </div>

                    {/* Typography */}
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase flex items-center gap-1.5">
                          <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                          INITIATE OFFICIAL REVEAL
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-black font-display tracking-tight text-white group-hover:text-cyan-100 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                        REVEAL PROBLEM STATEMENTS
                      </h3>
                    </div>

                    {/* Right Accent Sparkle / Activation Indicator */}
                    <div className="hidden sm:flex items-center justify-center ml-auto pl-2">
                      <div className="w-9 h-9 rounded-lg bg-cyan-950/70 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shadow-inner">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4 mb-8">
                {/* State 2 Primary Status Card: PROBLEM STATEMENTS REVEALED */}
                <div className="w-full max-w-[540px] min-h-[105px] rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-emerald-950/60 via-[#041914]/90 to-emerald-950/60 p-5 flex items-center justify-between gap-4 shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-xl">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/80">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase block mb-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        BROADCAST ACTIVE & LOCKED
                      </span>
                      <h3 className="text-base sm:text-lg font-bold font-display text-white">
                        PROBLEM STATEMENTS REVEALED
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400">
                        ALL 20 TEAMS AUTHORIZED FOR 3D QUANTUM DISCOVERY
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secondary Administrative Control: RESET REVEAL */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <motion.button
                    onClick={handleResetReveal}
                    whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all font-mono text-xs font-bold tracking-wider uppercase cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>RESET REVEAL</span>
                  </motion.button>
                  <span className="text-[11px] font-mono text-slate-400">
                    Allows re-authorizing the reveal sequence if needed
                  </span>
                </div>
              </div>
            )}

            {/* 4. STATUS & EVENT TELEMETRY GRID */}
            <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-left">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase mb-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>CHALLENGE VECTORS</span>
                </div>
                <div className="text-xs sm:text-sm font-bold font-display text-white">
                  5 PRIMED & LOADED
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase mb-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  <span>TEAM CONSOLES</span>
                </div>
                <div className="text-xs sm:text-sm font-bold font-display text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>20 SYNCED</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase mb-1">
                  <ShieldCheck className="w-3 h-3 text-sky-400" />
                  <span>ALLOCATION LOCK</span>
                </div>
                <div className="text-xs sm:text-sm font-bold font-display text-white">
                  {isRevealed ? 'ENGAGED & SECURE' : 'ARMED & READY'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase mb-1">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>CHAMBER STATUS</span>
                </div>
                <div className={`text-xs sm:text-sm font-bold font-display ${isRevealed ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {isRevealed ? 'MASTER LIVE' : 'ARMED / STANDBY'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Allocation Visual Matrix */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>PROBLEM ALLOCATION MATRIX (4 SLOTS PER CHALLENGE)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400">
              TOTAL CLAIMED: {discoveredCount} / 20 TEAMS • CLICK ANY CARD TO EDIT BRIEF
            </p>
          </div>
        </div>

        <AllocationGrid
          slots={problems.map(p => ({
            id: p.id,
            problem_code: p.problem_code,
            title: p.title,
            category: p.category,
            total_slots: p.total_slots || 4,
            consumed_slots: p.consumed_slots || 0,
            is_revealed: p.is_revealed
          }))}
          assignedTeams={assignedTeamsByProblem}
          canEdit
          onSelectProblem={(id) => {
            const found = problems.find(p => p.id === id);
            if (found) setEditingProblem(found);
          }}
        />
      </section>

      {/* 20-Team Real-Time Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>REGISTERED TEAMS TELEMETRY</span>
              </h2>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-display rounded-lg transition-colors shadow"
              >
                <span>+ REGISTER TEAM</span>
              </button>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              REAL-TIME PARTICIPANT DISCOVERY & PHASE MONITORING
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
              <button
                onClick={() => setTeamFilter('ALL')}
                className={`px-3 py-1 rounded transition-colors ${teamFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                ALL (20)
              </button>
              <button
                onClick={() => setTeamFilter('WAITING')}
                className={`px-3 py-1 rounded transition-colors ${teamFilter === 'WAITING' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                WAITING ({20 - discoveredCount})
              </button>
              <button
                onClick={() => setTeamFilter('DISCOVERED')}
                className={`px-3 py-1 rounded transition-colors ${teamFilter === 'DISCOVERED' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                CLAIMED ({discoveredCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search team or code..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* 20 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTeams.map((team) => {
            const status = getTeamStatus(team);
            const isWaiting = status === 'WAITING';

            return (
              <div
                key={team.id}
                className={`rounded-xl border p-4 transition-all ${
                  !isWaiting
                    ? 'border-cyan-500/30 bg-[#070e1b]/90 shadow-md'
                    : 'border-slate-800/80 bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {team.team_code}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isWaiting
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-2 truncate">
                  {team.team_name}
                </h4>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-2">
                  <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                    ASSIGNED CHALLENGE:
                  </span>
                  {team.problem_code ? (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {team.problem_code}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={team.problem_title || ''}>
                        {team.problem_title}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">
                      Pending Bowl Discovery
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  {team.selected_at ? (
                    <span className="truncate">CLAIMED: {new Date(team.selected_at).toLocaleTimeString()}</span>
                  ) : (
                    <span>READY TO SHUFFLE</span>
                  )}
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.team_code)}
                    className="text-rose-400 hover:text-rose-300 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-500/10 ml-2"
                    title="Delete Team"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filteredTeams.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Teams Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Click "+ Register Team" above to create team login credentials with custom team codes and passcodes.
            </p>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg"
            >
              Register First Team
            </button>
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        confirmText={confirmModal.confirmText}
        onConfirm={async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await confirmModal.action();
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Register New Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-base font-bold font-display text-white">
                Register New Hackathon Team
              </h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teamCreateError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{teamCreateError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Team Code (e.g. TEAM-01)</label>
                <input
                  type="text"
                  required
                  value={newTeamCode}
                  onChange={(e) => setNewTeamCode(e.target.value)}
                  placeholder="TEAM-01"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Team / College Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Neural Nexus Labs"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Team Security Passcode</label>
                <input
                  type="password"
                  required
                  value={newTeamPassword}
                  onChange={(e) => setNewTeamPassword(e.target.value)}
                  placeholder="Secret access passcode"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg"
                >
                  {creatingTeam ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Problem Statement Modal */}
      {editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/30">
                  {editingProblem.problem_code}
                </span>
                <h3 className="text-base font-bold font-display text-white">
                  Edit Problem Statement Specifications
                </h3>
              </div>
              <button
                onClick={() => setEditingProblem(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblemEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingProblem.title}
                  onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editingProblem.category}
                  onChange={(e) => setEditingProblem({ ...editingProblem, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Challenge Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingProblem.description}
                  onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Key Requirements</label>
                <textarea
                  rows={3}
                  required
                  value={editingProblem.requirements}
                  onChange={(e) => setEditingProblem({ ...editingProblem, requirements: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Expected Output</label>
                  <textarea
                    rows={2}
                    required
                    value={editingProblem.expected_output}
                    onChange={(e) => setEditingProblem({ ...editingProblem, expected_output: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Evaluation Focus</label>
                  <textarea
                    rows={2}
                    required
                    value={editingProblem.evaluation_focus}
                    onChange={(e) => setEditingProblem({ ...editingProblem, evaluation_focus: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProblem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProblem}
                  className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg"
                >
                  {savingProblem ? 'Saving...' : 'Save Specifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
