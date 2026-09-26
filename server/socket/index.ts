import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { query, queryOne } from '../database/db.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  ioInstance.on('connection', async (socket) => {
    // Send full system snapshot on initial connect
    try {
      const state = await getSystemState();
      socket.emit('sync:state', state);
    } catch (err) {
      console.error('Socket connect state sync error:', err);
    }

    socket.on('request:sync', async () => {
      try {
        const state = await getSystemState();
        socket.emit('sync:state', state);
      } catch (err) {
        console.error('Socket manual sync error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export async function getSystemState() {
  const hackathon = await queryOne('SELECT * FROM hackathon_state WHERE id = 1');
  const announcements = await query('SELECT * FROM announcements ORDER BY id DESC LIMIT 15');
  
  // Get slot summary
  const slotsSummary = await query(`
    SELECT 
      p.id, 
      p.problem_code, 
      p.title, 
      p.category, 
      p.is_revealed,
      COUNT(s.id) as total_slots,
      SUM(CASE WHEN s.consumed = 1 THEN 1 ELSE 0 END) as consumed_slots
    FROM problem_statements p
    LEFT JOIN allocation_slots s ON p.id = s.problem_id
    GROUP BY p.id
  `);

  return {
    hackathon,
    announcements,
    slotsSummary,
    serverTime: Date.now()
  };
}

export function broadcastStateUpdate(data: any): void {
  if (ioInstance) {
    ioInstance.emit('state:updated', { ...data, serverTime: Date.now() });
  }
}

export function broadcastAnnouncement(announcement: any): void {
  if (ioInstance) {
    ioInstance.emit('announcement:new', announcement);
  }
}

export function broadcastAllocationUpdate(data: any): void {
  if (ioInstance) {
    ioInstance.emit('allocation:updated', data);
  }
}

export function broadcastProblemsRevealed(): void {
  if (ioInstance) {
    ioInstance.emit('problems:revealed', { revealed: true, timestamp: Date.now() });
  }
}

export function broadcastProblemsReset(): void {
  if (ioInstance) {
    ioInstance.emit('problems:reset', { revealed: false, timestamp: Date.now() });
  }
}
