import React, { useState } from 'react';
import { Users, Lock, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface TeamLoginPageProps {
  onNavigate: (view: string) => void;
}

export const TeamLoginPage: React.FC<TeamLoginPageProps> = ({ onNavigate }) => {
  const { loginTeam } = useAuth();
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim() || !password) {
      setError('Please enter your assigned Team Code and Team Passcode.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await loginTeam(teamCode.trim().toUpperCase(), password);
      onNavigate('team-discover');
    } catch (err: any) {
      setError(err.message || 'Invalid team code or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-6 font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Overview</span>
        </button>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#090d18]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto mb-4">
            <Users className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold font-display text-white text-center mb-1">
            Team Authentication
          </h2>
          <p className="text-xs text-slate-400 font-mono text-center mb-6">
            ENTER ASSIGNED CREDENTIALS TO ENTER ARENA
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Assigned Team Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  placeholder="e.g. TEAM-01"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                Team Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter confidential passcode"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold font-display rounded-xl text-sm shadow-lg shadow-cyan-900/40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="font-mono text-xs">VERIFYING CREDENTIALS...</span>
              ) : (
                <span>ENTER DISCOVERY ARENA</span>
              )}
            </button>
          </form>

          {/* Secure Instruction */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-500 block leading-relaxed">
              Official hackathon team badges and passcodes are distributed by Neural Minds Club & AI Innovation Club registration desk.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
