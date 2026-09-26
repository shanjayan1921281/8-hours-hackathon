import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, Terminal, Zap } from 'lucide-react';

interface DataStreamOverlayProps {
  scrollYProgress: any;
}

export const DataStreamOverlay: React.FC<DataStreamOverlayProps> = ({ scrollYProgress }) => {
  const [flickerIndex, setFlickerIndex] = useState(0);
  const [crosshairPos, setCrosshairPos] = useState({ top: '20%', left: '15%' });

  useEffect(() => {
    const interval = setInterval(() => {
      setFlickerIndex(Math.floor(Math.random() * 5));
      setCrosshairPos({
        top: `${15 + Math.random() * 60}%`,
        left: `${10 + Math.random() * 80}%`
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const streams = [
    'HEX: 0x7F3A_SYS_LOCK // QUANTUM_AI_VECTOR',
    'PARALLEL_NODE_01: SYNC_ESTABLISHED',
    'MODEL_WEIGHTS_VERIFIED [SHA-256]',
    'NEURAL_DEEP_SCAN // 20_TEAMS_ACTIVE',
    'TARGET_LOCKED: 8H_MASTER_CLOCK'
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Randomly Flickering Crosshair Icon */}
      <motion.div
        animate={{
          opacity: [0.2, 0.8, 0.3, 0.9, 0.4],
          scale: [0.95, 1.05, 1]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ top: crosshairPos.top, left: crosshairPos.left }}
        className="absolute flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]"
      >
        <Target className="w-3 h-3 text-cyan-400 animate-spin" />
        <span>LOCK_#{flickerIndex + 10}</span>
      </motion.div>

      {/* High-Contrast Data Stream Text Block */}
      <motion.div
        animate={{
          opacity: [0.3, 0.9, 0.5, 1, 0.4]
        }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="absolute bottom-12 left-8 hidden sm:block font-mono text-[10px] text-cyan-300 tracking-widest bg-cyan-950/90 border-l-2 border-cyan-400 px-3 py-1.5 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
          <span>{streams[flickerIndex]}</span>
        </div>
      </motion.div>

      {/* Top Right System Stream */}
      <motion.div
        animate={{
          opacity: [0.4, 0.8, 0.2, 0.9]
        }}
        transition={{ duration: 1.1, repeat: Infinity }}
        className="absolute top-16 right-8 hidden sm:block font-mono text-[10px] text-blue-300 tracking-widest bg-blue-950/90 border-r-2 border-blue-400 px-3 py-1.5 backdrop-blur-md text-right"
      >
        <div className="flex items-center justify-end gap-2">
          <span>SECURE_CHANNEL_ACTIVE</span>
          <Shield className="w-3 h-3 text-emerald-400" />
        </div>
      </motion.div>
    </div>
  );
};
