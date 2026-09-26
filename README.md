# 8-Hour AI Hackathon Challenge Discovery Platform

Organized by: **Neural Minds Club × AI Innovation Club**  
Department: **AIML Department, VSB Engineering College**  
Format: **8-Hour Real-Time Hackathon**  
Capacity: **20 Participating Teams • 5 Problem Statements (Exactly 4 Teams per Problem)**

---

## 1. Project Overview

The **8-Hour AI Hackathon Challenge Discovery Platform** is an enterprise-grade, server-authoritative event management and challenge allocation system. It is designed to orchestrate high-stakes college hackathons with complete fairness, tamper-proof allocation, synchronized timing, and a cinematic 3D discovery experience.

### Core Event Flow
$$\text{DISCOVER} \longrightarrow \text{BUILD} \longrightarrow \text{TEST} \longrightarrow \text{PITCH}$$

---

## 2. Key Features

- **3D Bowl Shuffle Experience**: Interactive WebGL/Three.js transparent glass chamber containing 20 floating virtual challenge tokens (4 tokens per problem statement). Teams shuffle and discover their challenge with cinematic 3-2-1 countdowns and confetti bursts.
- **Fair Server-Side Atomic Allocation**: Guaranteed fair slot distribution (5 problems × 4 slots = 20 teams total). Utilizes atomic database transactions to eliminate race conditions. Once claimed, challenges are permanently locked.
- **Synchronized Master Timer**: Server-controlled 8-hour countdown clock resilient to reloads, tab switches, and network reconnects.
- **Dynamic Phase Transitions**: Automatic and admin-controlled phases (Discover, Build, Test, Pitch).
- **Instant Live Announcements**: Socket.IO push messaging with synthesized Web Audio chimes and floating toasts.
- **Admin Command Center**: Real-time 20-team telemetry grid, visual dot allocation matrix (`● ● ● ○`), live announcement broadcaster, and editable problem briefs.
- **Zero-Dep Audio Synthesizer**: Uses Web Audio API to produce clicks, sweeps, countdown beeps, and chords without external audio file latency.
- **Accessibility & Reduced Motion**: Includes a 2D chamber view toggle for mobile devices or users preferring reduced motion.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express.js, Socket.IO, Cookie-Parser.
- **Database**: SQLite via `sql.js` (WebAssembly SQLite) with automated disk synchronization (`hackathon.db`).
- **Authentication**: Custom JWT authentication with bcrypt password hashing and HTTP-only cookies.
- **Real-Time**: Socket.IO supporting WebSocket with automatic HTTP long-polling fallback.

---

## 4. Development Credentials

> **Note**: For security, never display credentials on production landing pages.

### Root Admin Account
- **Username**: `admin`
- **Password**: `AdminSecureAI2026!`

### Participating Teams (20 Teams)
- **Team Codes**: `TEAM-01` through `TEAM-20`
- **Default Password Formula**: `team{01-20}pass`
  - Examples:
    - Team 01: Code `TEAM-01` | Password: `team01pass`
    - Team 02: Code `TEAM-02` | Password: `team02pass`
    - Team 05: Code `TEAM-05` | Password: `team05pass`
    - Team 20: Code `TEAM-20` | Password: `team20pass`

---

## 5. Folder Structure

```
├── api/
│   └── index.ts               # Vercel serverless function entry point
├── data/
│   └── hackathon.db           # SQLite database file
├── server/
│   ├── database/
│   │   ├── db.ts              # SQLite database abstraction & transactions
│   │   └── seed.ts            # Admin, teams, challenges & slot seeder
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication & role authorization
│   ├── routes/
│   │   ├── auth.ts            # Login, logout, session verification
│   │   ├── admin.ts           # Timer, reveal, announcements, problem editor
│   │   └── team.ts            # Atomic challenge discovery & state retrieval
│   └── socket/
│       └── index.ts           # Socket.IO event broadcaster
├── src/
│   ├── components/
│   │   ├── AllocationGrid.tsx # Visual dot-slot matrix (● ● ● ○)
│   │   ├── AnnouncementBanner.tsx # Real-time broadcast toasts
│   │   ├── ConfirmModal.tsx   # Critical action confirmation modal
│   │   ├── Navbar.tsx         # Top Bar Contract header
│   │   ├── ProblemCard.tsx    # Detailed problem brief viewer
│   │   ├── ThreeBowlScene.tsx # 3D Three.js Bowl Shuffle experience
│   │   └── TimerDisplay.tsx   # Synchronized master timer
│   ├── context/
│   │   ├── AuthContext.tsx    # User session management
│   │   └── SocketContext.tsx  # Real-time state synchronizer
│   ├── pages/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── TeamDiscoveryPage.tsx
│   │   └── TeamLoginPage.tsx
│   ├── services/
│   │   ├── api.ts             # Typed fetch client with credentials
│   │   └── sound.ts           # Web Audio API procedural synthesizer
│   ├── App.tsx                # App routing & lifecycle
│   ├── index.css              # Tailwind CSS styles & typography
│   └── main.tsx               # Client entry point
├── .env.example
├── package.json
├── server.ts                  # Express + Vite full-stack server
├── tsconfig.json
├── vercel.json                # Vercel deployment configuration
└── vite.config.ts
```

---

## 6. Installation & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the full-stack development server (Express + Vite + Socket.IO)
npm run dev

# 3. Open in browser
# Local URL: http://localhost:3000
```

The database is automatically initialized and seeded with the admin account, 20 teams, 5 problem statements, and 20 allocation slots on the first run.

---

## 7. Production Build & Deployment

### Build Command
```bash
npm run build
```

### Production Run
```bash
NODE_ENV=production npm start
```

---

## 8. Vercel Deployment & Database Persistence Notes

### Vercel Deployment Setup
The project includes a ready-to-deploy `vercel.json` configured for SPA client routing and `/api/*` serverless routes:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/((?!api/|assets/|favicon.ico|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Critical Architectural Note on Persistent Storage
Vercel serverless functions are stateless and ephemeral; the local filesystem is read-only or re-created between cold starts. Therefore:
1. **Local & Container Hosting**: SQLite (`data/hackathon.db`) persists reliably on local machines, virtual machines, Docker containers, Railway, Render, Fly.io, or AWS EC2.
2. **Serverless (Vercel)**: For permanent persistence in serverless environments, connect the clean repository layer in `server/database/db.ts` to a managed database (such as PostgreSQL or Turso SQLite over HTTP) by setting `DATABASE_URL`.
3. **WebSockets in Serverless**: Socket.IO in this application includes long-polling fallback, ensuring uninterrupted operation even when native WebSockets are constrained by serverless proxies.

---

## 9. API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/admin/login` | Public | Authenticates admin |
| `POST` | `/api/auth/team/login` | Public | Authenticates team |
| `POST` | `/api/auth/logout` | Public | Clears session cookie |
| `GET` | `/api/auth/me` | Authenticated | Returns current user profile |
| `GET` | `/api/admin/state` | Admin | Full event state, teams, problems |
| `POST` | `/api/admin/timer/start` | Admin | Starts 8-hour master timer |
| `POST` | `/api/admin/timer/pause` | Admin | Pauses master timer |
| `POST` | `/api/admin/timer/resume` | Admin | Resumes master timer |
| `POST` | `/api/admin/timer/reset` | Admin | Resets master timer |
| `POST` | `/api/admin/problems/reveal` | Admin | Unlocks challenges for teams |
| `PUT` | `/api/admin/problems/:id` | Admin | Updates problem specifications |
| `POST` | `/api/admin/announcements` | Admin | Broadcasts live announcement |
| `GET` | `/api/team/state` | Team | Returns team challenge & event state |
| `POST` | `/api/team/discover` | Team | Server-side fair atomic slot discovery |
| `GET` | `/api/team/problem` | Team | Returns assigned problem statement |
