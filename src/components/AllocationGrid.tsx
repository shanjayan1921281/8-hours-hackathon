import React from 'react';
import { Layers, CheckCircle2, Lock } from 'lucide-react';
import { SlotStat } from '../context/SocketContext.js';

interface AllocationGridProps {
  slots: SlotStat[];
  assignedTeams?: { [problemCode: string]: string[] };
  onSelectProblem?: (problemId: number) => void;
  canEdit?: boolean;
}

export const AllocationGrid: React.FC<AllocationGridProps> = ({
  slots,
  assignedTeams = {},
  onSelectProblem,
  canEdit = false
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {slots.map((item) => {
        const isFull = (item.consumed_slots || 0) >= item.total_slots;
        const remaining = item.total_slots - (item.consumed_slots || 0);
        const teamsForThis = assignedTeams[item.problem_code] || [];

        return (
          <div
            key={item.id}
            onClick={() => onSelectProblem && onSelectProblem(item.id)}
            className={`relative rounded-xl border p-4 transition-all ${
              canEdit ? 'cursor-pointer hover:border-cyan-500/60' : ''
            } ${
              isFull
                ? 'border-rose-500/40 bg-rose-950/10'
                : 'border-slate-800 bg-[#090d16]/90'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {item.problem_code}
              </span>
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                isFull
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isFull ? 'FULL' : `${item.consumed_slots || 0} / ${item.total_slots}`}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-xs font-semibold text-white line-clamp-2 mb-3 min-h-[32px]">
              {item.title}
            </h4>

            {/* Category */}
            <div className="text-[11px] text-slate-400 mb-3 truncate">
              {item.category}
            </div>

            {/* Visual Dot Indicators */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
              {Array.from({ length: item.total_slots }).map((_, idx) => {
                const isClaimed = idx < (item.consumed_slots || 0);
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isClaimed
                        ? isFull
                          ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'border border-slate-600 bg-slate-800/50'
                    }`}
                    title={isClaimed ? `Slot ${idx + 1}: Claimed` : `Slot ${idx + 1}: Available`}
                  />
                );
              })}
              <span className="text-[11px] font-mono text-slate-400 ml-auto tabular-nums">
                {item.consumed_slots || 0}/4
              </span>
            </div>

            {/* Assigned Teams Pills (if any) */}
            {teamsForThis.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">
                  ASSIGNED TEAMS:
                </span>
                <div className="flex flex-wrap gap-1">
                  {teamsForThis.map((tCode) => (
                    <span
                      key={tCode}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700/60"
                    >
                      {tCode}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
