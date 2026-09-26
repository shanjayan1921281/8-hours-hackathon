import React from 'react';
import { Volume2, VolumeX, Shield, Users, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { toggleSound, isSoundEnabled } from '../services/sound.js';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const { connected, hackathon } = useSocket();
  const [soundOn, setSoundOn] = React.useState<boolean>(isSoundEnabled());

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#05070f]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark in display face */}
      <button
        onClick={() => onNavigate('landing')}
        className="font-display text-lg sm:text-xl font-bold tracking-tight text-white hover:text-cyan-400 transition-colors flex items-center gap-2 text-left"
      >
        <span>8-HOUR AI HACKATHON</span>
      </button>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        <button
          onClick={() => onNavigate('landing')}
          className={`hover:text-white transition-colors relative py-1 ${
            currentView === 'landing' ? 'text-cyan-400 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400' : ''
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => onNavigate('team-discover')}
          className={`hover:text-white transition-colors relative py-1 ${
            currentView === 'team-discover' ? 'text-cyan-400 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400' : ''
          }`}
        >
          Challenge Discovery
        </button>

        <button
          onClick={() => onNavigate('admin-dashboard')}
          className={`hover:text-white transition-colors relative py-1 ${
            currentView === 'admin-dashboard' ? 'text-cyan-400 font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400' : ''
          }`}
        >
          Command Center
        </button>
      </nav>

      {/* Zone 3: Primary Actions & User Info */}
      <div className="flex items-center gap-3">
        {/* Real-time Connection Indicator */}
        <div 
          className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 px-2 py-1 bg-slate-900/60 rounded border border-slate-800"
          title={connected ? 'Connected to Event Realtime Server' : 'Disconnected, reconnecting...'}
        >
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span>{connected ? 'LIVE SYNC' : 'OFFLINE'}</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleSound}
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          title={soundOn ? 'Mute Interface Sounds' : 'Unmute Interface Sounds'}
          aria-label="Toggle Sound"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Authentication Controls */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white tracking-wide">
                {user.role === 'admin' ? 'SYSTEM ADMIN' : user.teamName || user.teamCode}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {user.role === 'admin' ? 'Root Access' : user.teamCode}
              </span>
            </div>
            <button
              onClick={async () => {
                await logout();
                onNavigate('landing');
              }}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 rounded-lg transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('team-login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Team Login</span>
            </button>
            <button
              onClick={() => onNavigate('admin-login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
