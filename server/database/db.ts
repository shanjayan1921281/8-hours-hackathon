import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: SqlJsDatabase | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'hackathon.db');

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing database file, creating new database.', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize schema if not present
  initializeSchema(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initializeSchema(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS problem_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      evaluation_focus TEXT NOT NULL,
      is_revealed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_code TEXT UNIQUE NOT NULL,
      team_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      selected_problem_id INTEGER,
      selected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (selected_problem_id) REFERENCES problem_statements(id)
    );

    CREATE TABLE IF NOT EXISTS allocation_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      consumed INTEGER DEFAULT 0,
      assigned_team_id INTEGER,
      assigned_at DATETIME,
      FOREIGN KEY (problem_id) REFERENCES problem_statements(id),
      FOREIGN KEY (assigned_team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS hackathon_state (
      id INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'SETUP',
      start_time INTEGER,
      end_time INTEGER,
      paused_at INTEGER,
      paused_duration INTEGER DEFAULT 0,
      current_phase TEXT NOT NULL DEFAULT 'DISCOVER',
      problems_revealed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS selection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (problem_id) REFERENCES problem_statements(id)
    );
  `);
}

// Database helper utilities
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

export async function transaction<T>(fn: (db: SqlJsDatabase) => Promise<T> | T): Promise<T> {
  const db = await getDb();
  db.run('BEGIN TRANSACTION;');
  try {
    const result = await fn(db);
    db.run('COMMIT;');
    saveDb();
    return result;
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
}
