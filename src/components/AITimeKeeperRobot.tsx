import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Radio, Laptop, Activity, Trophy, Zap, 
  Terminal, ShieldCheck, Heart, AlertCircle, Compass
} from 'lucide-react';
import { playRobotChirp } from '../services/sound.js';

interface AITimeKeeperRobotProps {
  phase: string;
  timeLeftMs: number;
  isPaused: boolean;
  isMissionComplete: boolean;
  pulseSecond?: boolean;
}

export const AITimeKeeperRobot: React.FC<AITimeKeeperRobotProps> = ({
  phase,
  timeLeftMs,
  isPaused,
  isMissionComplete,
  pulseSecond = false
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isCheckingTimer, setIsCheckingTimer] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Time calculations
  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const isFinalTenMins = !isMissionComplete && timeLeftMs <= 10 * 60 * 1000 && timeLeftMs > 0;
  const isFinalHour = !isMissionComplete && timeLeftMs <= 60 * 60 * 1000 && !isFinalTenMins;
  const isCriticalPhase = !isMissionComplete && timeLeftMs <= 3 * 60 * 60 * 1000 && !isFinalHour && !isFinalTenMins;

  // Eye blinking cycle: blinks naturally every 3.5 to 5.5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic Timer-Checking Behavior: every 18 seconds, the robot checks the countdown below
  useEffect(() => {
    if (isMissionComplete || isPaused) return;

    const timerCheckInterval = setInterval(() => {
      setIsCheckingTimer(true);
      // Display a micro-thought when inspecting the timer
      const timeString = `${hours}h ${minutes}m`;
      if (isFinalTenMins) {
        setSpeechBubble(`⚠️ Final ${minutes} mins! Code sprint!`);
      } else if (isFinalHour) {
        setSpeechBubble(`⚡ Final Hour (${timeString})! Finalizing builds!`);
      } else if (Math.random() > 0.4) {
        setSpeechBubble(`⏱️ Chrono check: ${timeString} on track.`);
      }
      
      setTimeout(() => {
        setIsCheckingTimer(false);
        setTimeout(() => setSpeechBubble(null), 3500);
      }, 2500);
    }, 20000);

    return () => clearInterval(timerCheckInterval);
  }, [hours, minutes, isMissionComplete, isPaused, isFinalTenMins, isFinalHour]);

  // Phase change speech reactions
  useEffect(() => {
    if (isMissionComplete) {
      setSpeechBubble('🎉 Mission Accomplished! Amazing work!');
      return;
    }
    if (isPaused) {
      setSpeechBubble('⏸️ Chrono reactor paused. Standby mode.');
      return;
    }

    const phaseQuotes: Record<string, string[]> = {
      DISCOVER: [
        '🔍 Scanning problem matrix...',
        '🧠 Quantum Discovery active!',
        '✨ Exploring challenge briefs.'
      ],
      BUILD: [
        '💻 Core dev sprint in progress!',
        '⚡ Neural pipelines active.',
        '🛠️ Keep building the future!'
      ],
      TEST: [
        '🧪 Running benchmark verification...',
        '🛡️ Validating security & performance.',
        '⚙️ Polishing build stability.'
      ],
      PITCH: [
        '🎤 Showcase time! Shine bright!',
        '🌟 Pitch decks online.',
        '🏆 Present your innovation!'
      ]
    };

    const quotes = phaseQuotes[phase] || ['🚀 Reactor guardian active!'];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeechBubble(randomQuote);
    const timeout = setTimeout(() => setSpeechBubble(null), 4500);
    return () => clearTimeout(timeout);
  }, [phase, isMissionComplete, isPaused]);

  // Interactive Click on Robot
  const handleRobotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playRobotChirp();
    setClickCount(prev => prev + 1);

    const friendlyGreetings = [
      '🤖 AI Time Keeper Online & Guarding!',
      '⚡ All 8-Hour chronometer systems nominal.',
      '✨ Chrono guardian watching your progress!',
      '❤️ Keep going, developers! You got this!',
      '🛡️ Quantum time synchronization 100% stable.'
    ];

    setSpeechBubble(friendlyGreetings[clickCount % friendlyGreetings.length]);
    setTimeout(() => setSpeechBubble(null), 4000);
  };

  // Render dynamic eye expression
  const renderEyes = () => {
    if (isBlinking) {
      return (
        <div className="flex items-center justify-between w-10 px-1">
          <div className="w-3.5 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
          <div className="w-3.5 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
        </div>
      );
    }

    if (isPaused) {
      return (
        <div className="flex items-center justify-between w-10 px-1">
          <div className="w-3.5 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
          <div className="w-3.5 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
        </div>
      );
    }

    if (isMissionComplete) {
      return (
        <div className="flex items-center justify-between w-10 px-1 text-emerald-300 font-mono font-black text-xs">
          <span className="drop-shadow-[0_0_6px_#34d399]">^</span>
          <span className="drop-shadow-[0_0_6px_#34d399]">^</span>
        </div>
      );
    }

    if (isCheckingTimer) {
      return (
        <div className="flex flex-col items-center justify-center w-10">
          <div className="flex items-center justify-between w-full px-1">
            <div className="w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee] translate-y-0.5" />
            <div className="w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee] translate-y-0.5" />
          </div>
        </div>
      );
    }

    if (isFinalTenMins) {
      return (
        <div className="flex items-center justify-between w-10 px-1 text-rose-300 font-bold text-xs">
          <span className="animate-pulse">⚡</span>
          <span className="animate-pulse">⚡</span>
        </div>
      );
    }

    switch (phase) {
      case 'DISCOVER':
        return (
          <div className="flex items-center justify-between w-10 px-1">
            <div className="w-3 h-3 rounded-full border border-cyan-300 flex items-center justify-center bg-cyan-950/80 shadow-[0_0_8px_#22d3ee]">
              <div className="w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping" />
            </div>
            <div className="w-3 h-3 rounded-full border border-cyan-300 flex items-center justify-center bg-cyan-950/80 shadow-[0_0_8px_#22d3ee]">
              <div className="w-1.5 h-1.5 bg-cyan-200 rounded-full animate-ping" />
            </div>
          </div>
        );
      case 'BUILD':
        return (
          <div className="flex items-center justify-between w-10 px-1">
            <div className="w-3.5 h-2 bg-gradient-to-b from-cyan-300 to-sky-400 rounded-sm shadow-[0_0_8px_#22d3ee]" />
            <div className="w-3.5 h-2 bg-gradient-to-b from-cyan-300 to-sky-400 rounded-sm shadow-[0_0_8px_#22d3ee]" />
          </div>
        );
      case 'TEST':
        return (
          <div className="flex items-center justify-between w-10 px-1">
            <div className="w-3 h-3 rounded-full border-t-2 border-r-2 border-sky-300 flex items-center justify-center animate-spin">
              <div className="w-1 h-1 bg-sky-200 rounded-full" />
            </div>
            <div className="w-3 h-3 rounded-full border-t-2 border-r-2 border-sky-300 flex items-center justify-center animate-spin">
              <div className="w-1 h-1 bg-sky-200 rounded-full" />
            </div>
          </div>
        );
      case 'PITCH':
        return (
          <div className="flex items-center justify-between w-10 px-1 text-purple-300 text-xs">
            <span className="drop-shadow-[0_0_6px_#c084fc]">★</span>
            <span className="drop-shadow-[0_0_6px_#c084fc]">★</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between w-10 px-1">
            <div className="w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee]" />
            <div className="w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_10px_#22d3ee]" />
          </div>
        );
    }
  };

  // Render Phase-Specific Gear / Hologram
  const renderPhaseAccessory = () => {
    switch (phase) {
      case 'DISCOVER':
        return (
          <motion.div 
            className="absolute -right-7 top-10 flex flex-col items-center pointer-events-none"
            animate={{ rotate: isCheckingTimer ? 20 : [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Holographic Quantum Scanner */}
            <div className="w-6 h-6 rounded-lg bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] backdrop-blur-sm">
              <Radio className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            </div>
            {/* Soft scan cone */}
            <div className="w-8 h-8 bg-gradient-to-b from-cyan-400/30 to-transparent clip-triangle blur-[1px] -mt-1" />
          </motion.div>
        );

      case 'BUILD':
        return (
          <motion.div 
            className="absolute -left-7 top-10 flex flex-col items-center pointer-events-none"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Futuristic Holographic Cyber Tablet */}
            <div className="w-7 h-5 rounded bg-slate-900/90 border border-cyan-400/80 p-0.5 flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-full h-0.5 bg-cyan-400/70 rounded" />
              <div className="flex gap-0.5">
                <div className="w-2 h-0.5 bg-purple-400/80 rounded" />
                <div className="w-3 h-0.5 bg-sky-400/80 rounded" />
              </div>
              <div className="w-3 h-0.5 bg-cyan-300/70 rounded" />
            </div>
          </motion.div>
        );

      case 'TEST':
        return (
          <motion.div 
            className="absolute -right-8 top-9 flex flex-col items-center pointer-events-none"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {/* Floating Diagnostic Hologram */}
            <div className="w-6 h-6 rounded-full bg-sky-950/90 border border-sky-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.6)]">
              <Activity className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            </div>
          </motion.div>
        );

      case 'PITCH':
        return (
          <motion.div 
            className="absolute -right-7 top-9 flex flex-col items-center pointer-events-none"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Holographic Presentation Badge */}
            <div className="w-6 h-6 rounded-lg bg-purple-950/90 border border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin" />
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mb-1 relative z-20 select-none">
      
      {/* Speech / Thought Bubble (Always positioned high above robot) */}
      <div className="h-9 flex items-center justify-center mb-1">
        <AnimatePresence>
          {speechBubble && (
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              className="px-3.5 py-1 bg-slate-950/95 border border-cyan-400/80 rounded-2xl text-cyan-200 font-mono text-[11px] sm:text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{speechBubble}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Robot Character & Hovering Platform */}
      <motion.div
        onClick={handleRobotClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex flex-col items-center cursor-pointer group"
        animate={{ 
          y: isCheckingTimer ? 3 : [0, -6, 0],
        }}
        transition={{ 
          duration: 3.8, 
          repeat: isCheckingTimer ? 0 : Infinity, 
          ease: 'easeInOut' 
        }}
      >
        {/* Soft Ambient Character Glow */}
        <div className="absolute -inset-4 bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Phase Accessory / Prop */}
        {renderPhaseAccessory()}

        {/* ========================================================================= */}
        {/* 1. ROBOT HEAD */}
        {/* ========================================================================= */}
        <motion.div 
          className="relative z-10 flex flex-col items-center"
          animate={{ 
            rotateX: isCheckingTimer ? 18 : 0,
            rotateZ: isHovered ? [0, -3, 3, 0] : 0,
            y: isCheckingTimer ? 2 : 0
          }}
          transition={{ duration: 0.4 }}
        >
          {/* Top Antenna / Quantum Chrono Sensor */}
          <div className="flex flex-col items-center -mb-0.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            <div className="w-0.5 h-2.5 bg-gradient-to-t from-slate-700 to-cyan-400" />
          </div>

          {/* Head Chassis Structure */}
          <div className="relative w-16 h-12 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-[#080d1a] border border-cyan-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
            {/* Cyber Visor Bevel Highlight */}
            <div className="absolute top-0 inset-x-2 h-0.5 bg-cyan-300/40 rounded-full" />

            {/* Side Cyber Headphones / Audio Pods */}
            <div className="absolute -left-1.5 w-2 h-6 rounded-r bg-gradient-to-r from-slate-950 to-cyan-900 border-r border-cyan-400/70" />
            <div className="absolute -right-1.5 w-2 h-6 rounded-l bg-gradient-to-l from-slate-950 to-cyan-900 border-l border-cyan-400/70" />

            {/* Glossy Black Faceplate Glass Visor */}
            <div className="relative w-13 h-8.5 rounded-xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center shadow-inner overflow-hidden">
              {/* Glass Reflection Arc */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/15 to-transparent rounded-t-lg pointer-events-none" />
              
              {/* LED Digital Eyes */}
              {renderEyes()}
            </div>
          </div>
        </motion.div>

        {/* Neck Articulation Joint */}
        <div className="w-4 h-1.5 bg-slate-950 border-x border-cyan-500/50 -my-0.5 z-0" />

        {/* ========================================================================= */}
        {/* 2. ROBOT TORSO & CHRONO CORE */}
        {/* ========================================================================= */}
        <div className="relative z-10 w-14 h-11 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-[#060a14] border border-cyan-400/50 shadow-lg flex items-center justify-center">
          {/* Seam Neon Lighting Lines */}
          <div className="absolute inset-x-1 top-1 h-px bg-cyan-400/40" />
          <div className="absolute left-1.5 inset-y-2 w-px bg-cyan-500/30" />
          <div className="absolute right-1.5 inset-y-2 w-px bg-cyan-500/30" />

          {/* Mini Chest Chronometer Reactor Core */}
          <div className="relative w-5 h-5 rounded-full bg-slate-950 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.6)]">
            <motion.div
              className="absolute inset-0.5 rounded-full border border-dashed border-cyan-300/60"
              animate={{ rotate: isPaused ? 0 : 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <div 
              className={`w-2 h-2 rounded-full ${
                isMissionComplete 
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                  : isPaused 
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' 
                  : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              } ${pulseSecond ? 'scale-125' : 'scale-100'} transition-transform duration-200`} 
            />
          </div>

          {/* Left Cyber Arm */}
          <motion.div 
            className="absolute -left-2.5 top-1.5 w-2 h-7 rounded-full bg-slate-800 border border-cyan-500/40 origin-top"
            animate={{ 
              rotate: isHovered ? [-10, -25, -10] : [-5, 5, -5] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Arm hand */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-900 border border-cyan-400/60" />
          </motion.div>

          {/* Right Cyber Arm */}
          <motion.div 
            className="absolute -right-2.5 top-1.5 w-2 h-7 rounded-full bg-slate-800 border border-cyan-500/40 origin-top"
            animate={{ 
              rotate: isCheckingTimer ? [20, 35, 20] : isHovered ? [10, 30, 10] : [5, -5, 5] 
            }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            {/* Arm hand with wrist chrono */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-900 border border-cyan-400/60">
              {isCheckingTimer && (
                <div className="absolute -inset-1 bg-cyan-400/60 rounded-full animate-ping" />
              )}
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* 3. COMPACT ROBOTIC LEGS */}
        {/* ========================================================================= */}
        <div className="flex gap-2.5 -mt-0.5 z-0">
          <div className="w-2.5 h-3 rounded-b-md bg-gradient-to-b from-slate-800 to-slate-950 border-x border-b border-cyan-500/40" />
          <div className="w-2.5 h-3 rounded-b-md bg-gradient-to-b from-slate-800 to-slate-950 border-x border-b border-cyan-500/40" />
        </div>

        {/* ========================================================================= */}
        {/* 4. HOVERING THRUSTER & HOLOGRAPHIC PEDESTAL */}
        {/* ========================================================================= */}
        <div className="relative flex flex-col items-center mt-1">
          {/* Subtle Thruster Particle Glow */}
          <div className="w-5 h-1.5 bg-cyan-400 rounded-full blur-xs shadow-[0_0_12px_#22d3ee] animate-pulse" />
          
          {/* Holographic Hover Pad Disc */}
          <div className="relative w-20 h-4 rounded-[100%] bg-gradient-to-r from-cyan-500/20 via-sky-400/40 to-purple-600/20 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-sm -mt-0.5">
            {/* Inner Rotating Glyphs */}
            <motion.div
              className="absolute inset-1 rounded-[100%] border border-dashed border-cyan-300/50"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
            <div className="w-2 h-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
          </div>

          {/* Character Label Badge */}
          <div className="mt-1.5 px-2.5 py-0.5 bg-slate-950/95 border border-cyan-400/50 rounded-full text-[10px] font-mono text-cyan-300 font-bold tracking-wider shadow-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>AI TIME KEEPER</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
