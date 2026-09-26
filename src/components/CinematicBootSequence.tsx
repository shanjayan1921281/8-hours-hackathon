import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Database, Radio, Sparkles, Cpu, CheckCircle2, Zap } from 'lucide-react';
import { playAnnouncementChime } from '../services/sound.js';

interface CinematicBootSequenceProps {
  onComplete: () => void;
}

export const CinematicBootSequence: React.FC<CinematicBootSequenceProps> = ({ onComplete }) => {
  const [bootStep, setBootStep] = useState(1);
  const [modulesLoaded, setModulesLoaded] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Timeline of boot steps (Total ~2.5s)
    const t1 = setTimeout(() => setBootStep(2), 600); // System Check
    const tMod1 = setTimeout(() => setModulesLoaded(1), 750);
    const tMod2 = setTimeout(() => setModulesLoaded(2), 900);
    const tMod3 = setTimeout(() => setModulesLoaded(3), 1050);
    const tMod4 = setTimeout(() => setModulesLoaded(4), 1200);
    const tMod5 = setTimeout(() => setModulesLoaded(5), 1350);

    const t2 = setTimeout(() => setBootStep(3), 1500); // AI Core Activation
    const t3 = setTimeout(() => {
      setBootStep(4);
      playAnnouncementChime();
    }, 2050); // Event Reveal
    const t4 = setTimeout(() => {
      setIsExiting(true);
    }, 2750); // Transition start
    const t5 = setTimeout(() => {
      onComplete();
    }, 3100); // Complete

    return () => {
      clearTimeout(t1);
      clearTimeout(tMod1);
      clearTimeout(tMod2);
      clearTimeout(tMod3);
      clearTimeout(tMod4);
      clearTimeout(tMod5);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onComplete, 300);
  };

  const modules = [
    { name: 'AUTHENTICATION', icon: Shield },
    { name: 'DATABASE', icon: Database },
    { name: 'REALTIME ENGINE', icon: Radio },
    { name: 'DISCOVERY ENGINE', icon: Sparkles },
    { name: 'AI INTERFACE', icon: Cpu }
  ];

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#03050a] text-slate-100 flex flex-col items-center justify-center p-6 overflow-hidden select-none bg-scanlines"
        >
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 font-mono text-xs text-slate-400 hover:text-cyan-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors z-50"
          >
            [ SKIP BOOT ]
          </button>

          {/* Atmospheric background glow */}
          <div className="absolute inset-0 bg-grid-cyber opacity-40 pointer-events-none" />
          <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />

          <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">

            {/* Stage 1: Initialization */}
            {bootStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="font-mono text-xs text-cyan-400 tracking-[0.3em] uppercase bg-cyan-950/40 border border-cyan-500/30 px-4 py-1.5 rounded-lg">
                  NEURAL MINDS CLUB × AI INNOVATION CLUB
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                  INITIALIZING HACKATHON SYSTEM...
                </div>
                <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-3">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                  />
                </div>
              </motion.div>
            )}

            {/* Stage 2: System Check */}
            {bootStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center w-full max-w-md gap-2.5"
              >
                <div className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-2">
                  // RUNNING SYSTEM DIAGNOSTICS
                </div>
                <div className="w-full space-y-2">
                  {modules.map((mod, idx) => {
                    const isOnline = idx < modulesLoaded;
                    const Icon = mod.icon;
                    return (
                      <motion.div
                        key={mod.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isOnline ? 1 : 0.3, x: 0 }}
                        className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs ${
                          isOnline
                            ? 'bg-slate-900/90 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-950/40 border-slate-800 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isOnline ? 'text-cyan-400' : 'text-slate-700'}`} />
                          <span className="font-bold tracking-wider">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isOnline ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <span>✓ ONLINE</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 animate-pulse">CHECKING...</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Stage 3: AI Core Activation */}
            {bootStep === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Glowing reactor core ring */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 animate-ping opacity-50" />
                  <div className="absolute inset-2 rounded-full border border-blue-500/60 animate-spin" style={{ animationDuration: '4s' }} />
                  <div className="absolute inset-4 rounded-full border border-cyan-400/80 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_#22d3ee]">
                    <Zap className="w-6 h-6 text-slate-950 animate-pulse" />
                  </div>
                </div>

                <div className="font-mono text-xs text-cyan-400 tracking-[0.25em] uppercase">
                  AI CORE ACTIVATION COMPLETE
                </div>
                <div className="font-display text-2xl font-extrabold text-white tracking-widest">
                  SYSTEM READY
                </div>
              </motion.div>
            )}

            {/* Stage 4: Event Reveal */}
            {bootStep >= 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="font-mono text-3xl sm:text-4xl font-black text-cyan-400 tracking-wider glow-cyan">
                  08 HOURS
                </div>
                <div className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  AI HACKATHON
                </div>
                <div className="font-mono text-xs text-slate-300 tracking-widest uppercase bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-full mt-2">
                  20 TEAMS • 05 CHALLENGES
                </div>
              </motion.div>
            )}

          </div>

          {/* Bottom telemetry line */}
          <div className="absolute bottom-6 inset-x-6 flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>SECURE_SESSION: INITIALIZED</span>
            <span>VSB_ENGINEERING_COLLEGE</span>
            <span>NODE_SYNC: 100%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
