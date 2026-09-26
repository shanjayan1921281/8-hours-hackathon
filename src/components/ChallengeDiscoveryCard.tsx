'use client';
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react';

interface ChallengeDiscoveryCardProps {
  teamName: string;
  teamCode: string;
  isRevealed: boolean;
  isClaimed: boolean;
  assignedProblem?: {
    problem_code: string;
    title: string;
    category: string;
    description: string;
  } | null;
}

export const ChallengeDiscoveryCard: React.FC<ChallengeDiscoveryCardProps> = ({
  teamName,
  teamCode,
  isRevealed,
  isClaimed,
  assignedProblem
}) => {
  // 3D card tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [6, -6]);
  const rotateY = useTransform(mouseX, [-300, 300], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="w-full flex items-center justify-center relative py-4">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-xl relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            {/* Card ambient glow */}
            <motion.div 
              className="absolute -inset-[1px] rounded-3xl opacity-70 transition-opacity duration-700"
              animate={{
                boxShadow: [
                  "0 0 20px 2px rgba(6,182,212,0.15)",
                  "0 0 35px 8px rgba(139,92,246,0.25)",
                  "0 0 20px 2px rgba(6,182,212,0.15)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Traveling Light Beams */}
            <div className="absolute -inset-[1px] rounded-3xl overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                animate={{ left: ["-50%", "100%"] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80"
                animate={{ right: ["-50%", "100%"] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, delay: 1.25 }}
              />
            </div>

            {/* Glass Card Container */}
            <div className="relative bg-slate-950/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-cyan-500/30 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-cyber opacity-30 pointer-events-none" />

              {/* Header */}
              <div className="text-center space-y-2 mb-5 relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50"
                >
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 animate-pulse" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                  {isClaimed ? 'Problem Statement Locked' : 'Challenge Discovery Chamber'}
                </h2>
                
                <p className="text-slate-400 text-xs sm:text-sm font-mono tracking-wider">
                  TEAM: <span className="text-cyan-300 font-bold">{teamName}</span> ({teamCode})
                </p>
              </div>

              {/* Status / State Display */}
              <div className="relative z-10 my-4">
                {isClaimed && assignedProblem ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900/80 border border-cyan-500/40 p-5 sm:p-6 text-left space-y-3.5 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-md border border-cyan-500/30">
                        {assignedProblem.problem_code}
                      </span>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>PERMANENTLY LOCKED</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block mb-1">
                        {assignedProblem.category}
                      </span>
                      <h3 className="text-lg font-bold font-display text-white">
                        {assignedProblem.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                        {assignedProblem.description}
                      </p>
                    </div>
                  </motion.div>
                ) : isRevealed ? (
                  <div className="text-center py-2">
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 font-mono text-xs text-cyan-300 leading-relaxed shadow-inner">
                      <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold mb-1 tracking-wider uppercase text-xs sm:text-sm">
                        <Sparkles className="w-4 h-4 animate-pulse text-cyan-400" />
                        <span>DISCOVERY CHAMBER UNLOCKED</span>
                      </div>
                      <p className="text-slate-300 text-[11px] sm:text-xs mt-1">
                        Engage the 3D Quantum Discovery Bowl below to extract and lock your designated problem statement.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                      <Lock className="w-5 h-5 text-slate-400 animate-pulse" />
                    </div>
                    <div className="font-mono text-xs text-slate-400 leading-relaxed">
                      CHALLENGE POOL SEALED <br />
                      <span className="text-cyan-400 font-semibold">Waiting for Master Reveal Signal from Command Center</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>ATOMIC_TRANSACTION: READY</span>
                <span>VSB_AIML</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
