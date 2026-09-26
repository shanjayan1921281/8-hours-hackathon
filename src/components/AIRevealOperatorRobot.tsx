import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Radio, ShieldCheck, Activity, Cpu, CheckCircle2 } from 'lucide-react';
import { playRobotChirp, playRobotAlert } from '../services/sound.js';

export type RobotState = 'idle' | 'hover' | 'wake' | 'authorizing' | 'activating' | 'success' | 'error';

interface AIRevealOperatorRobotProps {
  robotState: RobotState;
  isRevealed: boolean;
  onHoverStateChange?: (hovered: boolean) => void;
}

export const AIRevealOperatorRobot: React.FC<AIRevealOperatorRobotProps> = ({
  robotState,
  isRevealed,
}) => {
  const [blink, setBlink] = useState(false);
  const [idleGaze, setIdleGaze] = useState<'forward' | 'down' | 'slight_right'>('forward');

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle idle glances
  useEffect(() => {
    if (robotState !== 'idle') return;
    const gazeInterval = setInterval(() => {
      const gazes: Array<'forward' | 'down' | 'slight_right'> = ['forward', 'forward', 'down', 'slight_right'];
      const nextGaze = gazes[Math.floor(Math.random() * gazes.length)];
      setIdleGaze(nextGaze);
    }, 4500);

    return () => clearInterval(gazeInterval);
  }, [robotState]);

  // Sound effects on state change
  useEffect(() => {
    if (robotState === 'hover') {
      playRobotChirp();
    } else if (robotState === 'authorizing' || robotState === 'activating') {
      playRobotAlert();
    }
  }, [robotState]);

  // Determine active display mode
  const effectiveState = isRevealed && robotState === 'idle' ? 'success' : robotState;

  // Eye expression rendering
  const renderEyes = () => {
    if (blink && effectiveState === 'idle') {
      return (
        <div className="flex items-center justify-center gap-5 w-full">
          <div className="w-4 h-0.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee]" />
          <div className="w-4 h-0.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#22d3ee]" />
        </div>
      );
    }

    switch (effectiveState) {
      case 'hover':
        return (
          <div className="flex items-center justify-center gap-4 w-full">
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-cyan-300 bg-cyan-400 flex items-center justify-center shadow-[0_0_14px_#22d3ee]"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </motion.div>
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-cyan-300 bg-cyan-400 flex items-center justify-center shadow-[0_0_14px_#22d3ee]"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.1 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </motion.div>
          </div>
        );

      case 'wake':
      case 'authorizing':
      case 'activating':
        return (
          <div className="flex items-center justify-center gap-4 w-full">
            <motion.div
              className="w-5 h-3.5 rounded-md bg-gradient-to-r from-cyan-400 to-sky-300 flex items-center justify-center shadow-[0_0_18px_#38bdf8]"
              animate={{ width: [18, 22, 18], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              <div className="w-1 h-2.5 bg-slate-950/80 rounded-sm" />
            </motion.div>
            <motion.div
              className="w-5 h-3.5 rounded-md bg-gradient-to-r from-sky-300 to-cyan-400 flex items-center justify-center shadow-[0_0_18px_#38bdf8]"
              animate={{ width: [18, 22, 18], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              <div className="w-1 h-2.5 bg-slate-950/80 rounded-sm" />
            </motion.div>
          </div>
        );

      case 'success':
        return (
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Cute happy curved eyes: ^ ^ */}
            <motion.div
              className="text-emerald-300 font-black text-xl leading-none drop-shadow-[0_0_10px_#34d399] select-none"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ^
            </motion.div>
            <motion.div
              className="text-emerald-300 font-black text-xl leading-none drop-shadow-[0_0_10px_#34d399] select-none"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
            >
              ^
            </motion.div>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="text-rose-400 font-black text-base drop-shadow-[0_0_10px_#f43f5e]">✕</div>
            <div className="text-rose-400 font-black text-base drop-shadow-[0_0_10px_#f43f5e]">✕</div>
          </div>
        );

      case 'idle':
      default:
        return (
          <div className="flex items-center justify-center gap-4 w-full">
            <motion.div
              className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] flex items-center justify-center"
              animate={
                idleGaze === 'down'
                  ? { y: 2, scale: 0.95 }
                  : idleGaze === 'slight_right'
                  ? { x: 2, y: 1 }
                  : { x: 0, y: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              <div className="w-1 h-1 rounded-full bg-white/90" />
            </motion.div>
            <motion.div
              className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] flex items-center justify-center"
              animate={
                idleGaze === 'down'
                  ? { y: 2, scale: 0.95 }
                  : idleGaze === 'slight_right'
                  ? { x: 2, y: 1 }
                  : { x: 0, y: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              <div className="w-1 h-1 rounded-full bg-white/90" />
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 1. HOLOGRAPHIC OPERATOR BADGE & STATUS */}
      <div className="flex items-center gap-2 mb-2 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-300 uppercase">
            AI REVEAL OPERATOR // V.05
          </span>
        </div>
      </div>

      {/* 2. ROBOT HOVERING STAGE & PLATFORM */}
      <div className="relative w-72 h-64 sm:w-80 sm:h-72 flex items-center justify-center">
        {/* Holographic Pedestal / Base */}
        <div className="absolute bottom-2 w-52 h-14 sm:w-60 sm:h-16 flex items-center justify-center pointer-events-none">
          {/* Base outer tech ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-500/30 border-dashed"
            style={{ transform: 'rotateX(70deg)' }}
            animate={{ rotateZ: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          />

          {/* Base inner cyan glow floor */}
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-b from-cyan-500/15 via-purple-600/10 to-transparent border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.35)]"
            style={{ transform: 'rotateX(70deg)' }}
            animate={{
              boxShadow: effectiveState === 'success'
                ? ['0 0 20px rgba(16,185,129,0.3)', '0 0 45px rgba(16,185,129,0.6)', '0 0 20px rgba(16,185,129,0.3)']
                : ['0 0 20px rgba(6,182,212,0.3)', '0 0 40px rgba(168,85,247,0.5)', '0 0 20px rgba(6,182,212,0.3)']
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Floating light motes upward */}
          <motion.div
            className="absolute -top-3 left-1/4 w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]"
            animate={{ y: [-15, -45], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute -top-2 right-1/4 w-1 h-1 rounded-full bg-purple-300 shadow-[0_0_6px_#c084fc]"
            animate={{ y: [-10, -40], opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
          />
        </div>

        {/* 3. ROBOT BODY COMPOSITION (Smooth Framer Motion Floating) */}
        <motion.div
          className="relative z-10 flex flex-col items-center"
          animate={
            effectiveState === 'success'
              ? { y: [0, -10, 0, -6, 0], rotate: [0, -2, 2, 0] }
              : effectiveState === 'activating'
              ? { y: -6, scale: 1.04 }
              : effectiveState === 'hover'
              ? { y: -4, rotate: 1 }
              : { y: [0, -7, 0] }
          }
          transition={
            effectiveState === 'success'
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* A. ROBOT HEAD */}
          <motion.div
            className="relative w-24 h-20 sm:w-28 sm:h-22 rounded-[28px] bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center p-2"
            animate={
              effectiveState === 'hover'
                ? { rotate: 3, y: 1 }
                : effectiveState === 'activating'
                ? { rotate: 0, y: -2 }
                : effectiveState === 'success'
                ? { rotate: [0, -3, 3, 0] }
                : idleGaze === 'down'
                ? { rotateX: 6, y: 1 }
                : { rotate: 0, y: 0 }
            }
            transition={{ duration: 0.3 }}
          >
            {/* Top Head Antenna & Sensor Beacon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${
                  effectiveState === 'success'
                    ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                    : effectiveState === 'activating'
                    ? 'bg-purple-400 shadow-[0_0_12px_#c084fc]'
                    : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                }`}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="w-1 h-2 bg-slate-600 rounded-b" />
            </div>

            {/* Left & Right Cyber Ear Sensor Pods */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-6 rounded-l-md bg-gradient-to-b from-cyan-500 to-slate-800 border border-cyan-400/40" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-6 rounded-r-md bg-gradient-to-b from-cyan-500 to-slate-800 border border-cyan-400/40" />

            {/* Glossy Black Faceplate Visor */}
            <div className="relative w-full h-full rounded-[20px] bg-slate-950 border border-cyan-500/40 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Visor specular reflection sheen */}
              <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-cyan-400/15 to-transparent rounded-t-[20px] pointer-events-none" />

              {/* Expressive LED Digital Eyes */}
              {renderEyes()}
            </div>
          </motion.div>

          {/* Neck Joint */}
          <div className="w-5 h-2 bg-gradient-to-b from-slate-700 to-slate-900 border-x border-cyan-400/30" />

          {/* B. ROBOT TORSO & ARMS */}
          <div className="relative flex items-center justify-center">
            {/* Left Arm */}
            <motion.div
              className="absolute -left-8 top-1 origin-top-right flex flex-col items-center"
              animate={
                effectiveState === 'success'
                  ? { rotate: [0, -35, -20, -35], y: [-2, -8, -4] }
                  : effectiveState === 'activating'
                  ? { rotate: -15, y: -2 }
                  : { rotate: [0, 4, 0] }
              }
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Shoulder & Arm segment */}
              <div className="w-3.5 h-8 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-cyan-400/40 shadow-sm" />
              {/* Left Hand */}
              <div className="w-3 h-3 rounded-full bg-cyan-900/80 border border-cyan-400/50 mt-0.5" />
            </motion.div>

            {/* Torso Chassis */}
            <div className="relative w-20 h-16 sm:w-22 sm:h-18 rounded-2xl bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#030712] border-2 border-cyan-400/50 p-2 flex flex-col items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              {/* Collar Accent */}
              <div className="w-8 h-1 bg-cyan-400/60 rounded-full" />

              {/* Central AI Miniature Reactor Core (Chest Glow) */}
              <motion.div
                className={`w-6 h-6 rounded-full ${
                  effectiveState === 'success'
                    ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_0_15px_#34d399]'
                    : effectiveState === 'activating'
                    ? 'bg-gradient-to-br from-purple-400 to-sky-400 shadow-[0_0_18px_#c084fc]'
                    : 'bg-gradient-to-br from-cyan-400 to-purple-600 shadow-[0_0_12px_#22d3ee]'
                } border border-cyan-200/60 flex items-center justify-center`}
                animate={{
                  scale: effectiveState === 'activating' ? [1, 1.3, 1] : [1, 1.15, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <div className="w-2 h-2 rounded-full bg-white/90" />
              </motion.div>

              {/* Lower Vent Grid */}
              <div className="flex gap-1">
                <div className="w-1.5 h-0.5 bg-cyan-400/50 rounded" />
                <div className="w-1.5 h-0.5 bg-cyan-400/50 rounded" />
                <div className="w-1.5 h-0.5 bg-cyan-400/50 rounded" />
              </div>
            </div>

            {/* Right Arm (Interactive gesturing arm) */}
            <motion.div
              className="absolute -right-8 top-1 origin-top-left flex flex-col items-center"
              animate={
                effectiveState === 'activating'
                  ? { rotate: -45, x: 4, y: -8, scale: 1.08 }
                  : effectiveState === 'hover' || effectiveState === 'authorizing'
                  ? { rotate: -35, x: 2, y: -6 }
                  : effectiveState === 'success'
                  ? { rotate: [0, 35, 20, 35], y: [-2, -8, -4] }
                  : { rotate: [0, -6, 0] }
              }
              transition={{ duration: 0.4 }}
            >
              {/* Shoulder & Arm segment */}
              <div className="w-3.5 h-8 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-cyan-400/40 shadow-sm" />
              {/* Right Hand with Cyber Palm Projector */}
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-900 border border-cyan-300 flex items-center justify-center shadow-[0_0_8px_#22d3ee]">
                <div className="w-1 h-1 rounded-full bg-cyan-300" />
              </div>
            </motion.div>
          </div>

          {/* C. ROBOT LEGS / HOVER PODS */}
          <div className="flex items-center gap-4 mt-1">
            {/* Left Leg */}
            <div className="w-3.5 h-7 rounded-b-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-cyan-400/40 flex flex-col items-center justify-end pb-0.5">
              <div className="w-2 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            </div>
            {/* Right Leg */}
            <div className="w-3.5 h-7 rounded-b-lg bg-gradient-to-b from-slate-800 to-slate-950 border border-cyan-400/40 flex flex-col items-center justify-end pb-0.5">
              <div className="w-2 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            </div>
          </div>
        </motion.div>

        {/* 4. ENERGY STREAM / ACTIVATION BEAM (Firing down to Reveal button when activating) */}
        <AnimatePresence>
          {effectiveState === 'activating' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 70 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-[-10px] right-14 w-1 bg-gradient-to-b from-cyan-300 via-sky-400 to-purple-500 shadow-[0_0_15px_#22d3ee] rounded-full z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* 3. DYNAMIC STATUS LABEL */}
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
          {effectiveState === 'success' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">REVEAL AUTHORIZED • 20 TEAMS LIVE</span>
            </>
          ) : effectiveState === 'activating' ? (
            <>
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="text-cyan-300 font-bold">TRANSMITTING MASTER REVEAL...</span>
            </>
          ) : effectiveState === 'hover' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span className="text-cyan-300">ADMINISTRATOR FOCUS DETECTED</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYSTEM READY FOR AUTHORIZATION</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
