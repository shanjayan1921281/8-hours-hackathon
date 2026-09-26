import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, Clock, Sparkles, ShieldCheck, 
  HelpCircle, RefreshCw, Terminal, Layers, ArrowLeft
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket, HackathonState } from '../context/SocketContext.js';
import { TimerDisplay } from '../components/TimerDisplay.js';
import { ThreeBowlScene } from '../components/ThreeBowlScene.js';
import { ProblemCard, ProblemData } from '../components/ProblemCard.js';
import { ChallengeDiscoveryCard } from '../components/ChallengeDiscoveryCard.js';
import { playClick } from '../services/sound.js';

export const TeamDiscoveryPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const { hackathon, announcements } = useSocket();
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamState = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ team: any; hackathon: HackathonState }>('/api/team/state');
      setTeamData(res.team);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sync team state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamState();
  }, []);

  const handleShuffle = async (): Promise<void> => {
    try {
      setError(null);
      await apiRequest<{
        success: boolean;
        message: string;
        assignment: any;
      }>('/api/team/discover', { method: 'POST' });

      // Refresh state
      await fetchTeamState();
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Discovery allocation failed');
    }
  };

  const isRevealed = hackathon?.problems_revealed === 1;
  const isClaimed = Boolean(teamData?.selected_problem_id);

  // Assigned problem data formatting
  const assignedProblem: ProblemData | null = isClaimed && teamData ? {
    problem_code: teamData.problem_code,
    title: teamData.problem_title,
    category: teamData.problem_category,
    description: teamData.problem_description,
    requirements: teamData.problem_requirements,
    expected_output: teamData.problem_expected_output,
    evaluation_focus: teamData.problem_evaluation_focus,
    selected_at: teamData.selected_at,
    team_code: teamData.team_code,
    team_name: teamData.team_name
  } : null;

  return (
    <div className="min-h-screen text-slate-100 py-8 px-4 sm:px-8 max-w-6xl mx-auto relative z-10">
      {/* Header Profile Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                playClick();
                onNavigate('landing');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>COMMAND CENTER</span>
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              AIML DEPT, VSB ENGINEERING COLLEGE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white mt-1">
            {teamData?.team_name || user?.teamName || 'Participating Team'}
          </h1>

          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {teamData?.team_code || user?.teamCode || 'TEAM-XX'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              STATUS: {isClaimed ? (
                <span className="text-emerald-400 font-semibold">CHALLENGE CLAIMED & LOCKED</span>
              ) : isRevealed ? (
                <span className="text-cyan-400 font-semibold">READY TO SHUFFLE</span>
              ) : (
                <span className="text-slate-500 font-semibold">WAITING FOR REVEAL</span>
              )}
            </span>
          </div>
        </div>

        {/* Compact Timer Widget */}
        <div className="sm:text-right">
          <TimerDisplay compact />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Stunning Glassmorphic Challenge Discovery Card UI */}
      <div className="mb-12">
        <ChallengeDiscoveryCard
          teamName={teamData?.team_name || user?.teamName || 'Participating Team'}
          teamCode={teamData?.team_code || user?.teamCode || 'TEAM-XX'}
          isRevealed={isRevealed}
          isClaimed={isClaimed}
          assignedProblem={assignedProblem}
        />
      </div>

      {/* 3D Bowl Shuffle Scene */}
      <div className="mb-12">
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-1">
            IMMERSIVE 3D BOWL MATRIX
          </span>
          <h3 className="text-xl font-bold font-display text-white">
            Neural Token Shuffle Chamber
          </h3>
        </div>
        <ThreeBowlScene
          isRevealed={isRevealed}
          isClaimed={isClaimed}
          assignedProblemCode={teamData?.problem_code}
          onShuffle={async () => {
            await handleShuffle();
            return teamData?.problem_code ? { problemCode: teamData.problem_code } : null;
          }}
          disabled={loading}
        />
      </div>

      {/* If Claimed: Full Problem Specifications */}
      {isClaimed && assignedProblem && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400">
                OFFICIALLY ASSIGNED CHALLENGE SPECIFICATION
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              PERMANENTLY LOCKED
            </span>
          </div>

          <ProblemCard
            problem={assignedProblem}
            teamCode={teamData.team_code}
            teamName={teamData.team_name}
            selectedAt={teamData.selected_at}
            highlight
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#03050a] py-6 px-4 text-center text-xs text-slate-400">
        <p className="font-mono">
          Neural Minds Club × AI Innovation Club • AIML Department • VSB Engineering College
        </p>
      </footer>
    </div>
  );
};
