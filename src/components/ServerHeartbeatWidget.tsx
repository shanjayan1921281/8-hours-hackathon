import React, { useState, useEffect } from 'react';
import { Activity, Radio, Wifi, Server, Cpu } from 'lucide-react';

export function ServerHeartbeatWidget() {
  const [latency, setLatency] = useState<number>(18);
  const [packetRate, setPacketRate] = useState<number>(104.2);
  const [isBeating, setIsBeating] = useState<boolean>(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time fluctuating network telemetry
      setLatency(Math.floor(14 + Math.random() * 12));
      setPacketRate(Number((98 + Math.random() * 15).toFixed(1)));
      setIsBeating(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900/95 border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-md">
      {/* Heartbeat Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className={`absolute w-full h-full rounded-full bg-emerald-400 opacity-75 ${isBeating ? 'animate-ping' : ''}`} />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
          NODE-01 ONLINE
        </span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      {/* Latency Telemetry */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
        <span>LATENCY:</span>
        <span className="text-cyan-300 font-bold">{latency}ms</span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      {/* Packet Stream */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
        <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span>SYNC:</span>
        <span className="text-blue-300 font-bold">{packetRate} KB/s</span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      {/* Server CPU Load */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
        <span>CORE LOAD:</span>
        <span className="text-indigo-300 font-bold">14.2%</span>
      </div>
    </div>
  );
}
