import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Coffee, Laptop, Terminal, Activity, Shield, 
  Sparkles, Zap, CheckCircle2, AlertTriangle, Flame, Clock
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';
import { AITimeKeeperRobot } from './AITimeKeeperRobot.js';

interface TimerDisplayProps {
  compact?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ compact = false }) => {
  const { hackathon, serverTimeOffset } = useSocket();
  const [timeLeftMs, setTimeLeftMs] = useState<number>(8 * 60 * 60 * 1000);
  const [pulseSecond, setPulseSecond] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Authoritative server-synchronized countdown calculation
  useEffect(() => {
    const calculateTime = () => {
      if (!hackathon) {
        setTimeLeftMs(8 * 60 * 60 * 1000);
        return;
      }

      if (hackathon.status === 'SETUP') {
        setTimeLeftMs(8 * 60 * 60 * 1000);
        return;
      }

      if (hackathon.status === 'COMPLETED') {
        setTimeLeftMs(0);
        return;
      }

      const now = Date.now() - serverTimeOffset;

      if (hackathon.status === 'PAUSED') {
        if (hackathon.paused_at && hackathon.end_time) {
          const remaining = Math.max(0, hackathon.end_time - hackathon.paused_at);
          setTimeLeftMs(remaining);
        }
        return;
      }

      if (hackathon.status === 'ACTIVE' && hackathon.end_time) {
        const remaining = Math.max(0, hackathon.end_time - now);
        setTimeLeftMs(remaining);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 250);
    return () => clearInterval(interval);
  }, [hackathon, serverTimeOffset]);

  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));

  // Pulse effect on every second tick
  useEffect(() => {
    setPulseSecond(true);
    const t = setTimeout(() => setPulseSecond(false), 350);
    return () => clearTimeout(t);
  }, [totalSeconds]);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedHours = pad(hours);
  const formattedMinutes = pad(minutes);
  const formattedSeconds = pad(seconds);

  const status = hackathon?.status || 'SETUP';
  const currentPhase = hackathon?.current_phase || 'DISCOVER';

  // 8-hour progress calculation: 100% at 8:00:00 -> 0% at 00:00:00
  const totalDuration = 8 * 60 * 60 * 1000;
  const remainingPercentNum = Math.min(100, Math.max(0, (timeLeftMs / totalDuration) * 100));
  const remainingPercent = remainingPercentNum.toFixed(1);
  const elapsedPercent = (100 - remainingPercentNum).toFixed(1);

  // Energy Behavior Stages
  const isMissionComplete = status === 'COMPLETED' || timeLeftMs <= 0;
  const isFinalMinute = !isMissionComplete && timeLeftMs <= 60 * 1000;
  const isFinalTenMins = !isMissionComplete && timeLeftMs <= 10 * 60 * 1000 && !isFinalMinute;
  const isFinalHour = !isMissionComplete && timeLeftMs <= 60 * 60 * 1000 && !isFinalTenMins && !isFinalMinute;
  const isCriticalPhase = !isMissionComplete && timeLeftMs <= 3 * 60 * 60 * 1000 && !isFinalHour && !isFinalTenMins && !isFinalMinute;
  const isActivePhase = !isMissionComplete && timeLeftMs <= 6 * 60 * 60 * 1000 && !isCriticalPhase && !isFinalHour && !isFinalTenMins && !isFinalMinute;
  const isFullPower = !isMissionComplete && timeLeftMs > 6 * 60 * 60 * 1000;
  const isPaused = status === 'PAUSED';

  // Energy state label and theme color
  const energyState = useMemo(() => {
    if (isMissionComplete) return { label: 'MISSION COMPLETE', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', glow: 'from-emerald-500/20 via-cyan-500/20 to-transparent', ringColor: '#10b981' };
    if (isPaused) return { label: 'TIMER PAUSED (STANDBY)', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse', glow: 'from-amber-500/20 via-orange-500/10 to-transparent', ringColor: '#f59e0b' };
    if (isFinalMinute) return { label: 'FINAL COUNTDOWN', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-bounce', glow: 'from-rose-500/30 via-red-600/20 to-purple-600/20', ringColor: '#f43f5e' };
    if (isFinalTenMins) return { label: 'FINAL 10 MINUTES', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse', glow: 'from-amber-500/25 via-orange-600/20 to-transparent', ringColor: '#f59e0b' };
    if (isFinalHour) return { label: 'FINAL HOUR', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', glow: 'from-purple-500/25 via-pink-600/20 to-cyan-500/15', ringColor: '#a855f7' };
    if (isCriticalPhase) return { label: 'CRITICAL PHASE', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40', glow: 'from-sky-500/20 via-purple-600/15 to-transparent', ringColor: '#38bdf8' };
    if (isActivePhase) return { label: 'ACTIVE HARMONICS', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40', glow: 'from-cyan-500/20 via-blue-600/15 to-transparent', ringColor: '#06b6d4' };
    return { label: 'FULL POWER (8H REACTOR)', badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]', glow: 'from-cyan-500/25 via-sky-500/20 to-purple-600/20', ringColor: '#22d3ee' };
  }, [isMissionComplete, isPaused, isFinalMinute, isFinalTenMins, isFinalHour, isCriticalPhase, isActivePhase, isFullPower]);

  // Interactive diagnostic scan trigger
  const handleReactorClick = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage(`DIAGNOSTIC SCAN: AI REACTOR STABLE • ${remainingPercent}% CAPACITY`);
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage(null);
    }, 2800);
  };

  // Compact View (Used on Team Discovery & Header consoles)
  if (compact) {
    return (
      <div className="flex items-center gap-3.5 bg-slate-950/95 border border-cyan-500/40 rounded-2xl px-4 py-2.5 shadow-[0_0_25px_rgba(6,182,212,0.2)] backdrop-blur-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-600/10 pointer-events-none" />
        
        {/* Mini Rotating Reactor Glyph */}
        <div className="relative w-7 h-7 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-950/60 shrink-0">
          <motion.div
            className="absolute inset-0.5 rounded-full border border-dashed border-cyan-300/60"
            animate={{ rotate: isPaused ? 0 : 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          <div className={`w-2 h-2 rounded-full ${isMissionComplete ? 'bg-emerald-400' : isPaused ? 'bg-amber-400' : 'bg-cyan-400'} shadow-[0_0_8px_#22d3ee]`} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              AI TIME REACTOR
            </span>
            <span className="font-mono text-base sm:text-lg font-black tabular-nums tracking-widest text-white leading-none">
              {formattedHours}:{formattedMinutes}:{formattedSeconds}
            </span>
          </div>

          <div className="flex flex-col items-end border-l border-cyan-500/30 pl-3">
            <span className="text-[9px] font-mono text-slate-400 uppercase">PHASE</span>
            <span className="text-xs font-mono font-extrabold text-cyan-300">{currentPhase}</span>
          </div>
        </div>
      </div>
    );
  }

  // Circular 3D Progress Ring Geometry Calculations
  // Outer Ring (Event Progress: 8 Hours)
  const outerRadius = 150;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const outerStrokeDashoffset = outerCircumference - (remainingPercentNum / 100) * outerCircumference;

  // Middle Ring (Minutes Cycle in current hour: 60 mins)
  const minuteProgress = (minutes / 60) * 100;
  const middleRadius = 126;
  const middleCircumference = 2 * Math.PI * middleRadius;
  const middleStrokeDashoffset = middleCircumference - (minuteProgress / 100) * middleCircumference;

  // Inner Ring (Seconds Sweep: 60 secs)
  const secondsAngle = (seconds / 60) * 360;

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* 1. ORIGINAL FUTURISTIC AI TIME KEEPER ROBOT (Positioned Above Reactor) */}
      <AITimeKeeperRobot
        phase={currentPhase}
        timeLeftMs={timeLeftMs}
        isPaused={isPaused}
        isMissionComplete={isMissionComplete}
        pulseSecond={pulseSecond}
      />

      {/* 2. MAIN 8-HOUR AI TIME REACTOR CHAMBER */}
      <div 
        onClick={handleReactorClick}
        className="relative overflow-visible rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#060c1d]/95 via-[#040817]/98 to-[#02040b]/98 p-6 sm:p-10 shadow-[0_0_80px_rgba(6,182,212,0.18)] backdrop-blur-3xl group w-full cursor-pointer transition-all hover:border-cyan-400/70"
        title="Click to trigger Quantum Diagnostic Telemetry"
      >
        {/* Corner Tech Brackets */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

        {/* Volumetric Reactor Ambient Atmospheric Glows */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-gradient-to-r ${energyState.glow} rounded-full blur-[130px] pointer-events-none transition-all duration-1000`} />
        <div className="absolute inset-0 bg-grid-cyber opacity-15 pointer-events-none rounded-3xl" />

        {/* Diagnostic Scan Overlay Effect */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-cyan-950/60 border-2 border-cyan-400/80 rounded-3xl pointer-events-none flex items-center justify-center backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            >
              <div className="bg-slate-950/95 border border-cyan-400 px-6 py-3 rounded-2xl text-cyan-300 font-mono text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>{scanMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Mission Control Telemetry Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 tracking-[0.25em] uppercase mb-1.5">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AI TIME REACTOR — MISSION CONTROL</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-slate-400">STATUS:</span>
              <span className={`text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-lg border ${energyState.badge}`}>
                {energyState.label}
              </span>
            </div>
          </div>

          {/* Phase Indicator Badge */}
          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">Active Hackathon Phase</span>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-950/70 border border-cyan-400/50 rounded-xl text-cyan-200 font-mono font-bold text-xs shadow-lg shadow-cyan-950/60">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>PHASE: {currentPhase}</span>
            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* CENTRAL 3D AI TIME REACTOR (Multi-Layer Rings, Quantum Core & Big Digits) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center py-10 relative z-10">
        
        {/* Layer 1: Background Energy Dimensional Portal */}
        <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full bg-gradient-to-tr from-cyan-950/40 via-purple-950/30 to-slate-900/60 blur-2xl animate-pulse pointer-events-none" />

        {/* Layer 2: Multi-Layered Mechanical Orbital Rings & Particle Field */}
        <div 
          className="absolute w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] rounded-full border border-cyan-500/25 animate-spin pointer-events-none shadow-[0_0_30px_rgba(6,182,212,0.15)]" 
          style={{ animationDuration: isPaused ? '0s' : '45s' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-300 rounded-full shadow-[0_0_12px_#22d3ee]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
        </div>

        <div 
          className="absolute w-[320px] h-[320px] sm:w-[370px] sm:h-[370px] rounded-full border border-purple-500/25 animate-spin pointer-events-none" 
          style={{ animationDuration: isPaused ? '0s' : '30s', animationDirection: 'reverse' }}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_12px_#c084fc]" />
        </div>

        {/* Layer 3: Dynamic 3D Internal Quantum Gyroscope Geometry */}
        <motion.div
          className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-cyan-400/20 pointer-events-none flex items-center justify-center"
          animate={{ rotate: isPaused ? 0 : 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 border border-purple-400/25 rounded-lg"
            animate={{ rotate: isPaused ? 0 : -720 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Layer 4: SVG Multi-Layer Time Rings (Outer 8H Progress + Middle 60M Progress) */}
        <div className="absolute pointer-events-none flex items-center justify-center">
          <svg className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] -rotate-90">
            {/* Outer Ring Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={outerRadius}
              stroke="#0b1329"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Outer Ring (8-Hour Event Remaining: 100% -> 0%) */}
            <circle
              cx="50%"
              cy="50%"
              r={outerRadius}
              stroke="url(#aiTimeReactorGrad)"
              strokeWidth="8"
              strokeDasharray={outerCircumference}
              strokeDashoffset={outerStrokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />

            {/* Middle Ring Background Track */}
            <circle
              cx="50%"
              cy="50%"
              r={middleRadius}
              stroke="#0b1329"
              strokeWidth="4"
              strokeDasharray="4 6"
              fill="transparent"
            />
            {/* Middle Ring (Minutes Calibration) */}
            <circle
              cx="50%"
              cy="50%"
              r={middleRadius}
              stroke="#8b5cf6"
              strokeWidth="4"
              strokeDasharray={middleCircumference}
              strokeDashoffset={middleStrokeDashoffset}
              strokeLinecap="round"
              opacity="0.6"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />

            <defs>
              <linearGradient id="aiTimeReactorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 5: Inner Ring Seconds Quantum Sweep Needle */}
        <div 
          className="absolute w-[330px] h-[330px] sm:w-[380px] sm:h-[380px] pointer-events-none transition-transform duration-500 ease-linear"
          style={{ transform: `rotate(${secondsAngle}deg)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-7 bg-gradient-to-t from-transparent via-cyan-300 to-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee]" />
        </div>

        {/* ========================================================================= */}
        {/* CORE REACTOR HUD TYPOGRAPHY (Top Label, Big Digits, Bottom Label) */}
        {/* ========================================================================= */}
        
        {/* 1. TOP LABEL */}
        <div className="text-[11px] sm:text-xs font-mono font-bold text-cyan-400 uppercase tracking-[0.4em] mb-2 flex items-center gap-2 relative z-10 bg-cyan-950/70 px-4 py-1.5 rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AI TIME REACTOR</span>
        </div>

        {/* 2. PROMINENT TIME DIGITS: HH : MM : SS */}
        <div 
          className={`text-6xl sm:text-8xl md:text-8xl font-black font-mono tabular-nums tracking-widest text-white drop-shadow-[0_0_50px_rgba(34,211,238,0.7)] transition-transform duration-300 relative z-10 flex items-center justify-center my-2 ${
            pulseSecond ? 'scale-[1.025]' : 'scale-100'
          }`}
        >
          <span className="text-white">{formattedHours}</span>
          <span className="text-cyan-400/80 mx-1 sm:mx-2 animate-pulse">:</span>
          <span className="text-white">{formattedMinutes}</span>
          <span className="text-cyan-400/80 mx-1 sm:mx-2 animate-pulse">:</span>
          <span className="text-cyan-300 drop-shadow-[0_0_20px_#22d3ee]">{formattedSeconds}</span>
        </div>

        {/* 3. BOTTOM LABEL */}
        <div className="text-xs sm:text-sm font-mono font-extrabold text-slate-300 uppercase tracking-[0.3em] mt-1 relative z-10 flex items-center gap-2">
          <span>HACKATHON COUNTDOWN</span>
          <span className="text-cyan-400 font-bold">• {remainingPercent}% POWER</span>
        </div>

        {/* 8-Hour Event Energy Meter Bar */}
        <div className="w-full max-w-md mt-7 relative z-10">
          <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>EVENT REMAINING (8-HOUR CYCLE)</span>
            </span>
            <span className="text-cyan-300 font-bold font-mono">
              {remainingPercent}% CAPACITY
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950/90 rounded-full overflow-hidden border border-cyan-500/30 p-0.5 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-600 rounded-full shadow-[0_0_18px_#22d3ee]"
              initial={false}
              animate={{ width: `${remainingPercentNum}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4-PHASE TIMELINE PIPELINE INTEGRATION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-cyan-500/25 relative z-10">
        {[
          { id: 'DISCOVER', name: '01. DISCOVER', time: '9:40 AM – 10:30 AM', desc: 'Problem Reveal' },
          { id: 'BUILD', name: '02. BUILD', time: '10:30 AM – 2:45 PM', desc: 'Core Dev Sprint' },
          { id: 'TEST', name: '03. TEST', time: '2:45 PM – 3:30 PM', desc: 'Benchmarking & QA' },
          { id: 'PITCH', name: '04. PITCH', time: '3:30 PM – 5:40 PM', desc: 'Demos & Jury' },
        ].map((phase) => {
          const isCurrent = currentPhase === phase.id;
          return (
            <div
              key={phase.id}
              className={`p-3.5 sm:p-4 rounded-2xl border font-mono transition-all relative overflow-hidden ${
                isCurrent
                  ? 'border-cyan-400/80 bg-gradient-to-b from-cyan-950/80 to-[#0c1a38]/90 text-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
                  : 'border-slate-800/80 bg-slate-900/40 text-slate-500 hover:border-slate-700'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs sm:text-sm font-bold font-display ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {phase.name}
                </div>
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <div className="text-[11px] text-cyan-300 font-bold tabular-nums">
                {phase.time}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {phase.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
};
