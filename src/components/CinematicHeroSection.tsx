import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Cpu, Terminal, Trophy, ChevronDown, Shield, Radio, CheckCircle2, Activity } from 'lucide-react';
import { HeroRobotCanvas } from './HeroRobotCanvas.js';
import { playClick, playSuccess } from '../services/sound.js';
import { useAuth } from '../context/AuthContext.js';

interface CinematicHeroSectionProps {
  onNavigate: (view: string) => void;
}

export const CinematicHeroSection: React.FC<CinematicHeroSectionProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [glitchText, setGlitchText] = useState('SYS_INITIALIZED // 8H_ARENA');
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const coreScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const coreRotate = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const coreOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.3]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    const glitchTimer = setInterval(() => {
      const statuses = [
        'NEURAL_SYNTHESIS_ACTIVE [OK]',
        'ORBITAL_TELEMETRY_LOCK [99.8%]',
        'QUANTUM_CLOCK_SYNC [SECURE]',
        '20_TEAMS_CHALLENGE_READY'
      ];
      setGlitchText(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearInterval(glitchTimer);
    };
  }, []);

  const handleEnterClick = () => {
    playSuccess();
    setIsTransitioning(true);
    setTimeout(() => {
      if (user?.role === 'team') {
        onNavigate('team-discover');
      } else if (user?.role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('team-login');
      }
    }, 850);
  };

  const handleScrollDown = () => {
    playClick();
    const element = document.getElementById('event-architecture');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen bg-[#04060c] text-slate-100 flex flex-col items-center justify-center pt-28 pb-20 px-4 sm:px-8 overflow-hidden transition-all duration-700 ${
        isTransitioning ? 'scale-105 opacity-0 blur-md' : 'scale-100 opacity-100'
      }`}
    >
      {/* Background Volumetric Lighting & Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber opacity-60 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Hero Grid Layout - Strictly non-overlapping */}
      <div className="relative z-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center my-auto">
        
        {/* Left Column: Typography, Taglines & CTAs (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          {/* Small Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-xs font-mono text-cyan-300 backdrop-blur-xl shadow-lg shadow-cyan-950/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-bold tracking-wider">LIVE AI HACKATHON SYSTEM</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-mono text-[11px]">20 TEAMS • 5 CHLS • 8 HRS</span>
            </div>
          </motion.div>

          {/* Main Title / System Initializing */}
          {isInitializing ? (
            <div className="h-24 sm:h-32 flex items-center justify-center lg:justify-start font-mono text-cyan-400 text-lg sm:text-xl font-bold animate-pulse">
              [ INITIALIZING COMMAND MATRIX... ]
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1] mb-5 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-cyan-200 to-slate-400">
                  8-HOUR
                </span>
                <br />
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 glow-cyan">
                  AI HACKATHON
                  <motion.div
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 1 }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
                  />
                </span>
              </h1>
            </motion.div>
          )}

          {/* Tagline Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full"
          >
            <div className="inline-block mb-3">
              <span className="text-xs sm:text-sm font-mono text-cyan-400 font-bold tracking-[0.2em] uppercase bg-cyan-950/50 border border-cyan-500/30 px-4 py-1.5 rounded-lg backdrop-blur-md">
                THINK. BUILD. TEST. PITCH.
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed mb-6 font-normal">
              One challenge. One team. Eight hours to architect, train, and deploy mission-critical machine intelligence in the ultimate collegiate command arena.
            </p>
          </motion.div>

          {/* Event Flow Information Strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-lg mb-8 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl backdrop-blur-xl shadow-xl"
          >
            {[
              { label: 'DISCOVER', time: '09:40', active: true },
              { label: 'BUILD', time: '10:30', active: false },
              { label: 'TEST', time: '14:45', active: false },
              { label: 'PITCH', time: '15:30', active: false }
            ].map((phase, idx) => (
              <div key={idx} className="flex flex-col items-center sm:items-start p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${phase.active ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="font-mono text-[10px] font-bold text-slate-300">{phase.label}</span>
                </div>
                <span className="font-mono text-[11px] text-cyan-400 font-semibold">{phase.time}</span>
              </div>
            ))}
          </motion.div>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 w-full"
          >
            <button
              onClick={handleEnterClick}
              className="group relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold font-display text-xs tracking-wider shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>ENTER THE HACKATHON</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 rounded-xl border border-white/40 pointer-events-none animate-pulse" />
            </button>

            <button
              onClick={handleScrollDown}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold font-display text-xs border border-slate-700/80 hover:border-cyan-500/50 transition-all shadow-lg backdrop-blur-md"
            >
              <span>VIEW EVENT FLOW</span>
            </button>
          </motion.div>

          <span className="text-[10px] font-mono text-slate-500 mt-2.5 tracking-widest uppercase">
            AUTHORIZED PARTICIPANTS ONLY • SECURED BY NEURAL MINDS
          </span>

        </div>

        {/* Right Column: 3D AI Core Canvas Card with Integrated HUD Frame (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center w-full">
          <motion.div
            style={{ scale: coreScale, rotateX: coreRotate, opacity: coreOpacity }}
            className="w-full max-w-sm sm:max-w-md relative bg-slate-950/60 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-2xl shadow-cyan-950/60"
          >
            {/* Card Header HUD */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-cyan-500/20 font-mono text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-bold">NEURAL_CORE_v4.2</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-semibold">STATUS: ONLINE</span>
            </div>

            {/* 3D Core Canvas Container */}
            <div className="w-full h-[320px] sm:h-[360px] relative rounded-xl overflow-hidden bg-[#05070f] border border-slate-800">
              <HeroRobotCanvas />
            </div>

            {/* Card Footer HUD Telemetry */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-cyan-500/20 font-mono text-[10px] text-slate-400">
              <span className="text-cyan-400 font-semibold">{glitchText}</span>
              <span className="text-blue-400">VSB_AIML</span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 cursor-pointer" onClick={handleScrollDown}>
        <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase">
          SCROLL TO ENTER
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
      </div>
    </div>
  );
};
