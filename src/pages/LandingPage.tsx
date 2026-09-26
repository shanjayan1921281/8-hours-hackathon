import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Users, Clock, Cpu, Trophy, Terminal, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { TimerDisplay } from '../components/TimerDisplay.js';
import { HeroNavbar } from '../components/HeroNavbar.js';
import { CinematicHeroSection } from '../components/CinematicHeroSection.js';
import { CinematicBootSequence } from '../components/CinematicBootSequence.js';
import { useSocket } from '../context/SocketContext.js';
import { useAuth } from '../context/AuthContext.js';
import { startAmbientHum } from '../services/sound.js';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { hackathon, slotStats } = useSocket();
  const { user } = useAuth();
  const [showBoot, setShowBoot] = useState(() => {
    // Show boot sequence on first load in session
    const hasBooted = sessionStorage.getItem('hackathon_booted');
    return !hasBooted;
  });

  useEffect(() => {
    const cleanup = startAmbientHum();
    return () => cleanup();
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('hackathon_booted', 'true');
    setShowBoot(false);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      {/* Cinematic Boot / Loading Sequence */}
      {showBoot && <CinematicBootSequence onComplete={handleBootComplete} />}

      {/* Top Glass Navigation Bar */}
      <HeroNavbar onNavigate={onNavigate} />

      {/* Cinematic AI Hackathon Command Center Hero Section */}
      <CinematicHeroSection onNavigate={onNavigate} />

      {/* 3 Core Numbers Banner & Master Timer Section */}
      <section className="py-12 px-4 sm:px-8 max-w-5xl mx-auto w-full flex flex-col items-center z-20">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl w-full p-6 rounded-2xl border border-slate-800 bg-[#070b16]/90 backdrop-blur-xl shadow-2xl mb-12 ring-1 ring-white/5">
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-extrabold font-mono text-cyan-400 glow-text-cyan">20</span>
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400 mt-1 font-semibold">Participating Teams</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800/80 px-4">
            <span className="text-3xl sm:text-5xl font-extrabold font-mono text-cyan-400 glow-text-cyan">5</span>
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400 mt-1 font-semibold">AI Challenges</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-extrabold font-mono text-cyan-400 glow-text-cyan">8</span>
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400 mt-1 font-semibold">Continuous Hours</span>
          </div>
        </div>

        {/* Live Master Timer Section */}
        <div className="w-full max-w-3xl">
          <TimerDisplay />
        </div>
      </section>

      {/* 4 Phases Flow Breakdown */}
      <section id="event-architecture" className="py-16 px-4 sm:px-8 border-t border-slate-900 bg-[#060913]/90">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 block mb-2">
              EVENT ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              The 4-Phase Execution Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                phase: 'DISCOVER',
                time: '9:40 AM – 10:30 AM',
                desc: '3D Bowl Shuffle challenge release. Teams randomly discover and lock their designated problem statements.',
                icon: Sparkles
              },
              {
                step: '02',
                phase: 'BUILD',
                time: '10:30 AM – 2:45 PM',
                desc: 'Core architecture design, model synthesis, fine-tuning, telemetry pipelines, and interface engineering.',
                icon: Cpu
              },
              {
                step: '03',
                phase: 'TEST',
                time: '2:45 PM – 3:30 PM',
                desc: 'Rigorous benchmark validation, stress testing, edge-case failure mitigation, and output verification.',
                icon: Terminal
              },
              {
                step: '04',
                phase: 'PITCH',
                time: '3:30 PM – 4:30 PM',
                desc: 'Live functional demonstration to faculty jury, architecture defense, and final rubric evaluation.',
                icon: Trophy
              }
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.step} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-sm font-bold text-cyan-400">{p.step}</span>
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold font-display text-white mb-1">{p.phase}</h3>
                    <div className="text-xs font-mono text-slate-400 mb-3">{p.time}</div>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Discovery Rules & Fair Allocation Section */}
      <section className="py-16 px-4 sm:px-8 border-t border-slate-900 bg-[#05070f]">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/40 p-8">
            <h3 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <span>Fair Server-Side Random Allocation Rules</span>
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>5 Problem Statements:</strong> Spanning Edge AI, Healthcare Multimodal, Agentic Cybersecurity, Geospatial Logistics, and Green Neuromorphic Hardware.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Strict 4-Team Capacity:</strong> Exactly 4 teams are allocated to each problem statement (4 × 5 = 20 teams total). Once a statement hits 4 teams, it is marked FULL and sealed.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>One-Time Permanent Lock:</strong> The server executes an atomic database transaction. Once claimed, the assignment is permanently locked to your team.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#03050a] py-8 px-4 text-center text-xs text-slate-400 relative z-20">
        <p className="font-mono">
          Neural Minds Club × AI Innovation Club • AIML Department • VSB Engineering College
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          8-Hour AI Hackathon Challenge Discovery Platform © 2026. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
