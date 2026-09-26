import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { seedDatabase } from '../server/database/seed.js';
import authRoutes from '../server/routes/auth.js';
import adminRoutes from '../server/routes/admin.js';
import teamRoutes from '../server/routes/team.js';
import { authenticateToken } from '../server/middleware/auth.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(authenticateToken);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: '8-Hour AI Hackathon',
    club: 'Neural Minds Club × AI Innovation Club',
    college: 'VSB Engineering College',
    time: Date.now()
  });
});

let isSeeded = false;
app.use(async (req, res, next) => {
  if (!isSeeded) {
    try {
      await seedDatabase();
      isSeeded = true;
    } catch (e) {
      console.error('Seeding error in serverless runtime:', e);
    }
  }
  next();
});

export default app;
