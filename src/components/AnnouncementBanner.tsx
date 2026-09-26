import React from 'react';
import { Megaphone, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext.js';

export const AnnouncementBanner: React.FC = () => {
  const { activeAnnouncement, dismissAnnouncement } = useSocket();

  if (!activeAnnouncement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-full px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-xl border border-cyan-500/40 bg-[#070e1b]/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
              <Megaphone className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-cyan-400">
                  SYSTEM ANNOUNCEMENT
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(activeAnnouncement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-100 leading-relaxed">
                {activeAnnouncement.message}
              </p>
            </div>
          </div>

          <button
            onClick={dismissAnnouncement}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
