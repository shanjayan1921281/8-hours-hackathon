import React from 'react';
import { Shield, Users, ArrowRight, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { playClick } from '../services/sound.js';

interface HeroNavbarProps {
  onNavigate: (view: string) => void;
}

export const HeroNavbar: React.FC<HeroNavbarProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-8 py-5 border-b border-cyan-500/10 bg-slate-950/60 backdrop-blur-xl">
      {/* Left: Club Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
          <span className="font-mono font-black text-slate-950 text-sm">NM</span>
        </div>
        <div>
          <span className="text-xs sm:text-sm font-extrabold font-display tracking-wider text-white block">
            NEURAL MINDS CLUB
          </span>
          <span className="text-[10px] font-mono text-cyan-400 tracking-widest block">
            VSB ENGINEERING COLLEGE
          </span>
        </div>
      </div>

      {/* Center: Secondary Branding (Hidden on mobile) */}
      <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-full shadow-inner">
        <span className="text-cyan-400 font-bold">AI INNOVATION CLUB</span>
        <span className="text-slate-600">×</span>
        <span className="text-blue-300">AIML DEPARTMENT</span>
      </div>

      {/* Right: System Status & CTA */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wider">SYSTEM ONLINE</span>
        </div>

        {user?.role === 'team' ? (
          <button
            onClick={() => {
              playClick();
              onNavigate('team-discover');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-display text-xs tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>ARENA</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : user?.role === 'admin' ? (
          <button
            onClick={() => {
              playClick();
              onNavigate('admin-dashboard');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-display text-xs tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>COMMAND CENTER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => {
              playClick();
              onNavigate('team-login');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-display text-xs tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>ENTER HACKATHON</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
