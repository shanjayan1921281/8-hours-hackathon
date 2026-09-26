import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert, Cpu, Activity } from 'lucide-react';

export function HudOverlays() {
  const [pulse, setPulse] = useState(false);
  const [glitchText, setGlitchText] = useState('SYS_INITIALIZED // 8H_ARENA');

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => !p);
      const statuses = [
        'NEURAL_SYNTHESIS_ACTIVE [OK]',
        'ORBITAL_TELEMETRY_LOCK [99.8%]',
        'QUANTUM_CLOCK_SYNC [SECURE]',
        '20_TEAMS_CHALLENGE_READY'
      ];
      setGlitchText(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-between px-6 sm:px-16">
      {/* Left HUD Matrix Box */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-col gap-2 font-mono text-[11px] text-cyan-400/80 bg-slate-950/60 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md shadow-lg shadow-cyan-950/50"
      >
        <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1.5 text-cyan-300 font-bold">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>NEURAL_CORE_V4.2</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">STATUS:</span>
          <span className="text-emerald-400 font-semibold animate-pulse">ACTIVE_SCAN</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">PACKET_FLOW:</span>
          <span className="text-cyan-300">142.8 KB/s</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">ENCRYPTION:</span>
          <span className="text-blue-400">AES-256-GCM</span>
        </div>
        {/* Animated Scanning SVG Line */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1 relative">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
        </div>
      </motion.div>

      {/* Right HUD Telemetry Box */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-col gap-2 font-mono text-[11px] text-cyan-400/80 bg-slate-950/60 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md shadow-lg shadow-cyan-950/50 text-right"
      >
        <div className="flex items-center justify-end gap-2 border-b border-cyan-500/20 pb-1.5 text-cyan-300 font-bold">
          <span>AI_COMMAND_NODE</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-cyan-300 font-semibold">{glitchText}</span>
          <span className="text-slate-400">LOG</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-cyan-300">VSB_AIML_DEPT</span>
          <span className="text-slate-400">HOST</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400 font-semibold">SERVER_SYNC</span>
          <span className="text-slate-400">HEARTBEAT</span>
        </div>
        {/* Pulsing Glitch Bar */}
        <div className={`w-full h-1 rounded-full transition-colors duration-500 ${pulse ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-slate-800'}`} />
      </motion.div>
    </div>
  );
}
