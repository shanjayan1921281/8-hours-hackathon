import React, { useState } from 'react';
import { Check, Copy, ShieldCheck, Tag, Target, FileText, Cpu, Award } from 'lucide-react';

export interface ProblemData {
  id?: number;
  problem_code: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  expected_output: string;
  evaluation_focus: string;
  selected_at?: string | null;
  team_code?: string;
  team_name?: string;
}

interface ProblemCardProps {
  problem: ProblemData;
  teamCode?: string;
  teamName?: string;
  selectedAt?: string | null;
  highlight?: boolean;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  teamCode,
  teamName,
  selectedAt,
  highlight = false
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `[${problem.problem_code}] ${problem.title}\nCategory: ${problem.category}\n\nDescription:\n${problem.description}\n\nRequirements:\n${problem.requirements}\n\nExpected Output:\n${problem.expected_output}\n\nEvaluation Focus:\n${problem.evaluation_focus}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all ${
      highlight
        ? 'border-cyan-500/50 bg-gradient-to-b from-[#0a1526]/95 via-[#070e1b]/95 to-[#050811]/95 shadow-[0_0_35px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
        : 'border-slate-800 bg-[#090d16]/90'
    } p-6 sm:p-8 backdrop-blur-md`}>
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 font-mono text-xs font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-lg">
            {problem.problem_code}
          </span>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            {problem.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {teamCode && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Assigned to {teamName ? `${teamName} (${teamCode})` : teamCode}</span>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors"
            title="Copy Problem Statement Brief"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight leading-snug mb-4">
        {problem.title}
      </h2>

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Challenge Description</span>
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {problem.description}
        </p>
      </div>

      {/* Grid of specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/80 pt-6">
        {/* Requirements */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>Key Requirements</span>
          </h4>
          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-normal">
            {problem.requirements}
          </p>
        </div>

        {/* Expected Output */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Expected Output</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {problem.expected_output}
          </p>
        </div>

        {/* Evaluation Focus */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evaluation Focus</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {problem.evaluation_focus}
          </p>
        </div>
      </div>

      {selectedAt && (
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>STATUS: CHALLENGE CLAIMED & LOCKED</span>
          <span>TIMESTAMP: {new Date(selectedAt).toLocaleTimeString()} ({new Date(selectedAt).toLocaleDateString()})</span>
        </div>
      )}
    </div>
  );
};
