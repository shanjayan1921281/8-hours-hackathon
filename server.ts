import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { seedDatabase } from './server/database/seed.js';
import { initSocketIO } from './server/socket/index.js';
import authRoutes from './server/routes/auth.js';
import adminRoutes from './server/routes/admin.js';
import teamRoutes from './server/routes/team.js';
import { authenticateToken } from './server/middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(cookieParser());
app.use(authenticateToken);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: '8-Hour AI Hackathon',
    club: 'Neural Minds Club × AI Innovation Club',
    college: 'VSB Engineering College',
    time: Date.now()
  });
});

// Initialize Socket.IO
initSocketIO(server);

async function startServer() {
  // Seed Database on startup
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Failed to seed database:', err);
  }

  // In development, hook up Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 8-Hour AI Hackathon Server running at http://localhost:${PORT}`);
    console.log(`⚡ Neural Minds Club × AI Innovation Club (AIML Dept, VSB Engineering College)`);
  });
}

startServer();
