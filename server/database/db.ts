import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

// Types for data models
export interface AdminRecord {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface ProblemRecord {
  id: number;
  problem_code: string;
  title: string;
  category: string;
  description: string;
  requirements: string;
  expected_output: string;
  evaluation_focus: string;
  is_revealed: number;
  created_at: string;
}

export interface TeamRecord {
  id: number;
  team_code: string;
  team_name: string;
  password_hash: string;
  selected_problem_id: number | null;
  selected_at: string | null;
  created_at: string;
}

export interface AllocationSlotRecord {
  id: number;
  problem_id: number;
  slot_number: number;
  consumed: number;
  assigned_team_id: number | null;
  assigned_at: string | null;
}

export interface HackathonStateRecord {
  id: number;
  status: string;
  start_time: number | null;
  end_time: number | null;
  paused_at: number | null;
  paused_duration: number;
  current_phase: string;
  problems_revealed: number;
  updated_at: string;
}

export interface AnnouncementRecord {
  id: number;
  message: string;
  created_at: string;
}

export interface SelectionLogRecord {
  id: number;
  team_id: number;
  problem_id: number;
  selected_at: string;
}

export interface DatabaseState {
  admins: AdminRecord[];
  problem_statements: ProblemRecord[];
  teams: TeamRecord[];
  allocation_slots: AllocationSlotRecord[];
  hackathon_state: HackathonStateRecord[];
  announcements: AnnouncementRecord[];
  selection_logs: SelectionLogRecord[];
  auto_increment: {
    admins: number;
    problem_statements: number;
    teams: number;
    allocation_slots: number;
    announcements: number;
    selection_logs: number;
  };
}

// Global in-memory instance
let memoryDb: DatabaseState | null = null;
let lastModifiedRows = 0;

// Resolve safe persistent file paths
function getStoragePaths(): string[] {
  const paths: string[] = [];
  
  if (process.env.DATABASE_PATH) {
    paths.push(path.resolve(process.cwd(), process.env.DATABASE_PATH));
  }
  
  // Safe /tmp path for serverless (AWS Lambda / Vercel)
  paths.push(path.join(os.tmpdir(), 'hackathon_v2.json'));
  
  // Local project data directory
  try {
    paths.push(path.resolve(process.cwd(), 'data', 'hackathon_v2.json'));
  } catch {
    // Ignore path resolution errors
  }
  
  return paths;
}

function createInitialState(): DatabaseState {
  return {
    admins: [],
    problem_statements: [],
    teams: [],
    allocation_slots: [],
    hackathon_state: [
      {
        id: 1,
        status: 'SETUP',
        start_time: null,
        end_time: null,
        paused_at: null,
        paused_duration: 0,
        current_phase: 'DISCOVER',
        problems_revealed: 0,
        updated_at: new Date().toISOString()
      }
    ],
    announcements: [
      {
        id: 1,
        message: 'Welcome to the 8-Hour AI Hackathon organized by Neural Minds Club × AI Innovation Club! Get ready for challenge discovery.',
        created_at: new Date().toISOString()
      }
    ],
    selection_logs: [],
    auto_increment: {
      admins: 1,
      problem_statements: 1,
      teams: 1,
      allocation_slots: 1,
      announcements: 2,
      selection_logs: 1
    }
  };
}

// Load database state safely
export function loadState(): DatabaseState {
  if (memoryDb) return memoryDb;

  const storagePaths = getStoragePaths();
  for (const filePath of storagePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.admins && parsed.hackathon_state) {
          memoryDb = parsed;
          return memoryDb!;
        }
      }
    } catch {
      // Continue to next path or default state
    }
  }

  memoryDb = createInitialState();
  return memoryDb;
}

// Save database state safely without throwing
export function saveDb(): void {
  if (!memoryDb) return;

  const storagePaths = getStoragePaths();
  const serialized = JSON.stringify(memoryDb, null, 2);

  for (const filePath of storagePaths) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch {
          // If cannot create dir (e.g. read-only fs on /var/task), skip to next path
          continue;
        }
      }
      fs.writeFileSync(filePath, serialized, 'utf-8');
      break; // Successfully saved to primary available path
    } catch {
      // Ignore write failures on read-only environments
    }
  }
}

// Get the DB instance
export async function getDb(): Promise<any> {
  const state = loadState();
  return {
    run: (sql: string, params: any[] = []) => {
      return executeRun(sql, params);
    },
    exec: (sql: string) => {
      const results = executeQuery(sql, []);
      if (results.length === 0) return [];
      const columns = Object.keys(results[0]);
      const values = results.map(row => columns.map(c => (row as any)[c]));
      return [{ columns, values }];
    },
    prepare: (sql: string) => {
      let boundParams: any[] = [];
      let resultsCache: any[] | null = null;
      let cursor = 0;

      return {
        bind: (params: any[]) => {
          boundParams = params;
          resultsCache = executeQuery(sql, boundParams);
          cursor = 0;
        },
        step: () => {
          if (resultsCache === null) {
            resultsCache = executeQuery(sql, boundParams);
          }
          if (cursor < resultsCache.length) {
            cursor++;
            return true;
          }
          return false;
        },
        getAsObject: () => {
          if (resultsCache && cursor > 0 && cursor <= resultsCache.length) {
            return resultsCache[cursor - 1];
          }
          return {};
        },
        free: () => {
          resultsCache = null;
          boundParams = [];
        }
      };
    },
    getRowsModified: () => lastModifiedRows
  };
}

// Execute Run statements (INSERT, UPDATE, DELETE)
function executeRun(sql: string, params: any[] = []): { changes: number } {
  const state = loadState();
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');
  lastModifiedRows = 0;

  // 1. UPDATE hackathon_state
  if (/^UPDATE hackathon_state/i.test(normalizedSql)) {
    const hs = state.hackathon_state[0] || (state.hackathon_state[0] = {
      id: 1,
      status: 'SETUP',
      start_time: null,
      end_time: null,
      paused_at: null,
      paused_duration: 0,
      current_phase: 'DISCOVER',
      problems_revealed: 0,
      updated_at: new Date().toISOString()
    });

    if (/status = 'ACTIVE'.*start_time = \?.*end_time = \?/i.test(normalizedSql)) {
      hs.status = 'ACTIVE';
      hs.start_time = Number(params[0]);
      hs.end_time = Number(params[1]);
      hs.paused_at = null;
      hs.paused_duration = 0;
      hs.current_phase = 'DISCOVER';
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/status = 'PAUSED'.*paused_at = \?/i.test(normalizedSql)) {
      hs.status = 'PAUSED';
      hs.paused_at = Number(params[0]);
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/status = 'ACTIVE'.*end_time = \?.*paused_duration = \?/i.test(normalizedSql)) {
      hs.status = 'ACTIVE';
      hs.end_time = Number(params[0]);
      hs.paused_at = null;
      hs.paused_duration = Number(params[1]);
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/status = 'SETUP'/i.test(normalizedSql)) {
      hs.status = 'SETUP';
      hs.start_time = null;
      hs.end_time = null;
      hs.paused_at = null;
      hs.paused_duration = 0;
      hs.current_phase = 'DISCOVER';
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/current_phase = \?/i.test(normalizedSql)) {
      hs.current_phase = String(params[0]);
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/problems_revealed = 1/i.test(normalizedSql)) {
      hs.problems_revealed = 1;
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    } else if (/problems_revealed = 0/i.test(normalizedSql)) {
      hs.problems_revealed = 0;
      hs.updated_at = new Date().toISOString();
      lastModifiedRows = 1;
    }
  }

  // 2. UPDATE problem_statements
  else if (/^UPDATE problem_statements/i.test(normalizedSql)) {
    if (/is_revealed = 1/i.test(normalizedSql)) {
      state.problem_statements.forEach(p => { p.is_revealed = 1; });
      lastModifiedRows = state.problem_statements.length;
    } else if (/is_revealed = 0/i.test(normalizedSql)) {
      state.problem_statements.forEach(p => { p.is_revealed = 0; });
      lastModifiedRows = state.problem_statements.length;
    } else if (/title = \?.*WHERE id = \?/i.test(normalizedSql)) {
      const id = Number(params[6]);
      const prob = state.problem_statements.find(p => p.id === id);
      if (prob) {
        prob.title = String(params[0]);
        prob.category = String(params[1]);
        prob.description = String(params[2]);
        prob.requirements = String(params[3]);
        prob.expected_output = String(params[4]);
        prob.evaluation_focus = String(params[5]);
        lastModifiedRows = 1;
      }
    }
  }

  // 3. INSERT INTO announcements
  else if (/^INSERT INTO announcements/i.test(normalizedSql)) {
    const id = state.auto_increment.announcements++;
    const message = String(params[0]);
    state.announcements.unshift({
      id,
      message,
      created_at: new Date().toISOString()
    });
    lastModifiedRows = 1;
  }

  // 4. INSERT INTO problem_statements
  else if (/^INSERT INTO problem_statements/i.test(normalizedSql)) {
    const id = state.auto_increment.problem_statements++;
    state.problem_statements.push({
      id,
      problem_code: String(params[0]),
      title: String(params[1]),
      category: String(params[2]),
      description: String(params[3]),
      requirements: String(params[4] || ''),
      expected_output: String(params[5] || ''),
      evaluation_focus: String(params[6] || ''),
      is_revealed: Number(params[7] || 0),
      created_at: new Date().toISOString()
    });
    lastModifiedRows = 1;
  }

  // 5. INSERT INTO allocation_slots
  else if (/^INSERT INTO allocation_slots/i.test(normalizedSql)) {
    const id = state.auto_increment.allocation_slots++;
    state.allocation_slots.push({
      id,
      problem_id: Number(params[0]),
      slot_number: Number(params[1]),
      consumed: 0,
      assigned_team_id: null,
      assigned_at: null
    });
    lastModifiedRows = 1;
  }

  // 6. UPDATE allocation_slots
  else if (/^UPDATE allocation_slots/i.test(normalizedSql)) {
    if (/consumed = 1.*WHERE id = \? AND consumed = 0/i.test(normalizedSql)) {
      const assignedTeamId = Number(params[0]);
      const assignedAt = String(params[1]);
      const slotId = Number(params[2]);
      const slot = state.allocation_slots.find(s => s.id === slotId && s.consumed === 0);
      if (slot) {
        slot.consumed = 1;
        slot.assigned_team_id = assignedTeamId;
        slot.assigned_at = assignedAt;
        lastModifiedRows = 1;
      }
    } else if (/assigned_team_id = \?/i.test(normalizedSql)) {
      const teamId = Number(params[0]);
      let updated = 0;
      state.allocation_slots.forEach(s => {
        if (s.assigned_team_id === teamId) {
          s.consumed = 0;
          s.assigned_team_id = null;
          s.assigned_at = null;
          updated++;
        }
      });
      lastModifiedRows = updated;
    }
  }

  // 7. INSERT INTO teams
  else if (/^INSERT INTO teams/i.test(normalizedSql)) {
    const id = state.auto_increment.teams++;
    state.teams.push({
      id,
      team_code: String(params[0]).toUpperCase(),
      team_name: String(params[1]),
      password_hash: String(params[2]),
      selected_problem_id: null,
      selected_at: null,
      created_at: new Date().toISOString()
    });
    lastModifiedRows = 1;
  }

  // 8. UPDATE teams
  else if (/^UPDATE teams/i.test(normalizedSql)) {
    if (/selected_problem_id = \?.*WHERE id = \?/i.test(normalizedSql)) {
      const probId = Number(params[0]);
      const selectedAt = String(params[1]);
      const teamId = Number(params[2]);
      const team = state.teams.find(t => t.id === teamId);
      if (team) {
        team.selected_problem_id = probId;
        team.selected_at = selectedAt;
        lastModifiedRows = 1;
      }
    } else if (/team_name = \?.*password_hash = \?.*WHERE id = \?/i.test(normalizedSql)) {
      const teamName = String(params[0]);
      const hash = String(params[1]);
      const id = Number(params[2]);
      const team = state.teams.find(t => t.id === id);
      if (team) {
        team.team_name = teamName;
        team.password_hash = hash;
        lastModifiedRows = 1;
      }
    } else if (/team_name = \?.*WHERE id = \?/i.test(normalizedSql)) {
      const teamName = String(params[0]);
      const id = Number(params[1]);
      const team = state.teams.find(t => t.id === id);
      if (team) {
        team.team_name = teamName;
        lastModifiedRows = 1;
      }
    }
  }

  // 9. DELETE FROM teams
  else if (/^DELETE FROM teams WHERE id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const initialLen = state.teams.length;
    state.teams = state.teams.filter(t => t.id !== id);
    lastModifiedRows = initialLen - state.teams.length;
  }

  // 10. INSERT INTO selection_logs
  else if (/^INSERT INTO selection_logs/i.test(normalizedSql)) {
    const id = state.auto_increment.selection_logs++;
    state.selection_logs.push({
      id,
      team_id: Number(params[0]),
      problem_id: Number(params[1]),
      selected_at: String(params[2] || new Date().toISOString())
    });
    lastModifiedRows = 1;
  }

  // 11. DELETE FROM selection_logs
  else if (/^DELETE FROM selection_logs WHERE team_id = \?/i.test(normalizedSql)) {
    const teamId = Number(params[0]);
    const initialLen = state.selection_logs.length;
    state.selection_logs = state.selection_logs.filter(l => l.team_id !== teamId);
    lastModifiedRows = initialLen - state.selection_logs.length;
  }

  // 12. INSERT INTO admins
  else if (/^INSERT INTO admins/i.test(normalizedSql)) {
    const id = state.auto_increment.admins++;
    state.admins.push({
      id,
      username: String(params[0]),
      password_hash: String(params[1]),
      created_at: new Date().toISOString()
    });
    lastModifiedRows = 1;
  }

  // 13. INSERT INTO hackathon_state
  else if (/^INSERT INTO hackathon_state/i.test(normalizedSql)) {
    state.hackathon_state = [{
      id: 1,
      status: 'SETUP',
      start_time: null,
      end_time: null,
      paused_at: null,
      paused_duration: 0,
      current_phase: 'DISCOVER',
      problems_revealed: 0,
      updated_at: new Date().toISOString()
    }];
    lastModifiedRows = 1;
  }

  saveDb();
  return { changes: lastModifiedRows };
}

// Execute Query statements (SELECT)
function executeQuery(sql: string, params: any[] = []): any[] {
  const state = loadState();
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT * FROM admins WHERE username = ?
  if (/^SELECT .* FROM admins WHERE username = \?/i.test(normalizedSql)) {
    const username = String(params[0]);
    const admin = state.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
    return admin ? [{ ...admin }] : [];
  }

  // 2. SELECT id FROM admins WHERE username = ?
  if (/^SELECT id FROM admins WHERE username = \?/i.test(normalizedSql)) {
    const username = String(params[0]);
    const admin = state.admins.find(a => a.username.toLowerCase() === username.toLowerCase());
    return admin ? [{ id: admin.id }] : [];
  }

  // 3. SELECT * FROM hackathon_state WHERE id = 1
  if (/^SELECT .* FROM hackathon_state/i.test(normalizedSql)) {
    const hs = state.hackathon_state[0] || {
      id: 1,
      status: 'SETUP',
      start_time: null,
      end_time: null,
      paused_at: null,
      paused_duration: 0,
      current_phase: 'DISCOVER',
      problems_revealed: 0,
      updated_at: new Date().toISOString()
    };
    return [{ ...hs }];
  }

  // 4. SELECT count(*) as count FROM problem_statements
  if (/^SELECT count\(\*\) as count FROM problem_statements/i.test(normalizedSql)) {
    return [{ count: state.problem_statements.length }];
  }

  // 5. SELECT count(*) as count FROM teams
  if (/^SELECT count\(\*\) as count FROM teams/i.test(normalizedSql)) {
    return [{ count: state.teams.length }];
  }

  // 6. SELECT count(*) as count FROM announcements
  if (/^SELECT count\(\*\) as count FROM announcements/i.test(normalizedSql)) {
    return [{ count: state.announcements.length }];
  }

  // 7. SELECT * FROM announcements ORDER BY id DESC LIMIT N
  if (/^SELECT \* FROM announcements ORDER BY id DESC/i.test(normalizedSql)) {
    const limitMatch = normalizedSql.match(/LIMIT (\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 20;
    return state.announcements
      .slice()
      .sort((a, b) => b.id - a.id)
      .slice(0, limit)
      .map(a => ({ ...a }));
  }

  // 8. Problems with slot aggregation (Admin / System / Team)
  if (/FROM problem_statements p\s+LEFT JOIN allocation_slots s ON p\.id = s\.problem_id/i.test(normalizedSql)) {
    return state.problem_statements.map(p => {
      const pSlots = state.allocation_slots.filter(s => s.problem_id === p.id);
      const totalSlots = pSlots.length;
      const consumedSlots = pSlots.filter(s => s.consumed === 1).length;
      return {
        ...p,
        total_slots: totalSlots,
        consumed_slots: consumedSlots
      };
    });
  }

  // 9. Problem statements queries
  if (/^SELECT id, problem_code FROM problem_statements/i.test(normalizedSql)) {
    return state.problem_statements.map(p => ({ id: p.id, problem_code: p.problem_code }));
  }

  if (/^SELECT \* FROM problem_statements WHERE UPPER\(problem_code\) = \?/i.test(normalizedSql)) {
    const code = String(params[0]).toUpperCase();
    const prob = state.problem_statements.find(p => p.problem_code.toUpperCase() === code);
    return prob ? [{ ...prob }] : [];
  }

  if (/^SELECT id FROM problem_statements WHERE UPPER\(problem_code\) = \?/i.test(normalizedSql)) {
    const code = String(params[0]).toUpperCase();
    const prob = state.problem_statements.find(p => p.problem_code.toUpperCase() === code);
    return prob ? [{ id: prob.id }] : [];
  }

  if (/^SELECT \* FROM problem_statements WHERE id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const prob = state.problem_statements.find(p => p.id === id);
    return prob ? [{ ...prob }] : [];
  }

  if (/^SELECT \* FROM problem_statements ORDER BY id ASC/i.test(normalizedSql)) {
    return state.problem_statements.slice().sort((a, b) => a.id - b.id).map(p => ({ ...p }));
  }

  // 10. Available unconsumed slots query for Team Discovery Shuffle
  if (/FROM allocation_slots s\s+JOIN problem_statements p ON s\.problem_id = p\.id\s+WHERE s\.consumed = 0/i.test(normalizedSql)) {
    const available: any[] = [];
    state.allocation_slots.forEach(s => {
      if (s.consumed === 0) {
        const prob = state.problem_statements.find(p => p.id === s.problem_id);
        if (prob) {
          available.push({
            slot_id: s.id,
            problem_id: s.problem_id,
            slot_number: s.slot_number,
            p_id: prob.id,
            problem_code: prob.problem_code,
            title: prob.title,
            category: prob.category,
            description: prob.description,
            requirements: prob.requirements,
            expected_output: prob.expected_output,
            evaluation_focus: prob.evaluation_focus
          });
        }
      }
    });
    return available;
  }

  // 11. Allocation slots detailed list for Admin
  if (/FROM allocation_slots s\s+LEFT JOIN teams t ON s\.assigned_team_id = t\.id\s+LEFT JOIN problem_statements p ON s\.problem_id = p\.id/i.test(normalizedSql)) {
    return state.allocation_slots
      .slice()
      .sort((a, b) => a.problem_id === b.problem_id ? a.slot_number - b.slot_number : a.problem_id - b.problem_id)
      .map(s => {
        const team = s.assigned_team_id ? state.teams.find(t => t.id === s.assigned_team_id) : null;
        const prob = state.problem_statements.find(p => p.id === s.problem_id);
        return {
          id: s.id,
          problem_id: s.problem_id,
          slot_number: s.slot_number,
          consumed: s.consumed,
          assigned_team_id: s.assigned_team_id,
          assigned_at: s.assigned_at,
          team_code: team ? team.team_code : null,
          team_name: team ? team.team_name : null,
          problem_code: prob ? prob.problem_code : null
        };
      });
  }

  // 12. Teams queries
  if (/FROM teams t\s+LEFT JOIN problem_statements p ON t\.selected_problem_id = p\.id\s+WHERE t\.id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const team = state.teams.find(t => t.id === id);
    if (!team) return [];
    const prob = team.selected_problem_id ? state.problem_statements.find(p => p.id === team.selected_problem_id) : null;
    return [{
      id: team.id,
      team_code: team.team_code,
      team_name: team.team_name,
      selected_problem_id: team.selected_problem_id,
      selected_at: team.selected_at,
      problem_code: prob ? prob.problem_code : null,
      problem_title: prob ? prob.title : null,
      problem_category: prob ? prob.category : null,
      problem_description: prob ? prob.description : null,
      problem_requirements: prob ? prob.requirements : null,
      problem_expected_output: prob ? prob.expected_output : null,
      problem_evaluation_focus: prob ? prob.evaluation_focus : null
    }];
  }

  if (/FROM teams t\s+LEFT JOIN problem_statements p ON t\.selected_problem_id = p\.id\s+ORDER BY t\.id ASC/i.test(normalizedSql)) {
    return state.teams
      .slice()
      .sort((a, b) => a.id - b.id)
      .map(team => {
        const prob = team.selected_problem_id ? state.problem_statements.find(p => p.id === team.selected_problem_id) : null;
        return {
          id: team.id,
          team_code: team.team_code,
          team_name: team.team_name,
          selected_problem_id: team.selected_problem_id,
          selected_at: team.selected_at,
          problem_code: prob ? prob.problem_code : null,
          problem_title: prob ? prob.title : null,
          problem_category: prob ? prob.category : null
        };
      });
  }

  if (/^SELECT \* FROM teams WHERE UPPER\(team_code\) = \?/i.test(normalizedSql)) {
    const code = String(params[0]).toUpperCase();
    const team = state.teams.find(t => t.team_code.toUpperCase() === code);
    return team ? [{ ...team }] : [];
  }

  if (/^SELECT id FROM teams WHERE UPPER\(team_code\) = \?/i.test(normalizedSql)) {
    const code = String(params[0]).toUpperCase();
    const team = state.teams.find(t => t.team_code.toUpperCase() === code);
    return team ? [{ id: team.id }] : [];
  }

  if (/^SELECT id, team_code, team_name, created_at FROM teams WHERE UPPER\(team_code\) = \?/i.test(normalizedSql)) {
    const code = String(params[0]).toUpperCase();
    const team = state.teams.find(t => t.team_code.toUpperCase() === code);
    return team ? [{ id: team.id, team_code: team.team_code, team_name: team.team_name, created_at: team.created_at }] : [];
  }

  if (/^SELECT id, team_code, team_name FROM teams WHERE id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const team = state.teams.find(t => t.id === id);
    return team ? [{ id: team.id, team_code: team.team_code, team_name: team.team_name }] : [];
  }

  if (/^SELECT id, team_code, team_name, selected_problem_id FROM teams WHERE id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const team = state.teams.find(t => t.id === id);
    return team ? [{ id: team.id, team_code: team.team_code, team_name: team.team_name, selected_problem_id: team.selected_problem_id }] : [];
  }

  if (/^SELECT selected_problem_id, selected_at FROM teams WHERE id = \?/i.test(normalizedSql)) {
    const id = Number(params[0]);
    const team = state.teams.find(t => t.id === id);
    return team ? [{ selected_problem_id: team.selected_problem_id, selected_at: team.selected_at }] : [];
  }

  return [];
}

// Database helper utilities matching previous API signatures
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  loadState();
  return executeQuery(sql, params) as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  loadState();
  return executeRun(sql, params);
}

export async function transaction<T>(fn: (db: any) => Promise<T> | T): Promise<T> {
  const db = await getDb();
  const state = loadState();
  // Clone backup for rollback support
  const backup = JSON.parse(JSON.stringify(state));
  try {
    const result = await fn(db);
    saveDb();
    return result;
  } catch (err) {
    // Rollback state
    memoryDb = backup;
    throw err;
  }
}
