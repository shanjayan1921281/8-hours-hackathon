import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { playAnnouncementChime } from '../services/sound.js';

export interface HackathonState {
  id: number;
  status: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  start_time: number | null;
  end_time: number | null;
  paused_at: number | null;
  paused_duration: number;
  current_phase: 'DISCOVER' | 'BUILD' | 'TEST' | 'PITCH' | 'COMPLETED';
  problems_revealed: number;
  updated_at: string;
}

export interface Announcement {
  id: number;
  message: string;
  created_at: string;
}

export interface SlotStat {
  id: number;
  problem_code: string;
  title: string;
  category: string;
  total_slots: number;
  consumed_slots: number;
  is_revealed?: number;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  hackathon: HackathonState | null;
  announcements: Announcement[];
  slotStats: SlotStat[];
  serverTimeOffset: number; // local - server
  activeAnnouncement: Announcement | null;
  dismissAnnouncement: () => void;
  requestSync: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [hackathon, setHackathon] = useState<HackathonState | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [slotStats, setSlotStats] = useState<SlotStat[]>([]);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      s.emit('request:sync');
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('sync:state', (data) => {
      if (data.hackathon) setHackathon(data.hackathon);
      if (data.announcements) setAnnouncements(data.announcements);
      if (data.slotsSummary) setSlotStats(data.slotsSummary);
      if (data.serverTime) {
        setServerTimeOffset(Date.now() - data.serverTime);
      }
    });

    s.on('state:updated', (data) => {
      if (data.hackathon) setHackathon(data.hackathon);
      if (data.serverTime) {
        setServerTimeOffset(Date.now() - data.serverTime);
      }
    });

    s.on('announcement:new', (announcement: Announcement) => {
      setAnnouncements((prev) => [announcement, ...prev]);
      setActiveAnnouncement(announcement);
      playAnnouncementChime();
    });

    s.on('problems:revealed', () => {
      setHackathon((prev) => prev ? { ...prev, problems_revealed: 1 } : null);
    });

    s.on('problems:reset', () => {
      setHackathon((prev) => prev ? { ...prev, problems_revealed: 0 } : null);
    });

    s.on('allocation:updated', (data) => {
      if (data.slotStats) {
        setSlotStats(data.slotStats);
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const requestSync = () => {
    if (socketRef.current) {
      socketRef.current.emit('request:sync');
    }
  };

  const dismissAnnouncement = () => {
    setActiveAnnouncement(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        hackathon,
        announcements,
        slotStats,
        serverTimeOffset,
        activeAnnouncement,
        dismissAnnouncement,
        requestSync
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
