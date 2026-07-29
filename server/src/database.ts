import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'demandas.db');

let db: SqlJsDatabase;

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS demands (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      cliente TEXT NOT NULL,
      responsavel TEXT NOT NULL,
      categoria TEXT NOT NULL,
      prioridade TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'novas',
      data_criacao TEXT NOT NULL,
      prazo TEXT,
      data_conclusao TEXT,
      observacoes TEXT DEFAULT '',
      criado_por TEXT DEFAULT 'Sistema',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      from_status TEXT,
      to_status TEXT,
      user TEXT DEFAULT 'Sistema',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#0066FF',
      icon TEXT DEFAULT 'folder',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL,
      color TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migrations for existing database schema compatibility
  try {
    const actCols = queryAll<{ name: string }>('PRAGMA table_info(activity_logs)').map(c => c.name);
    if (actCols.length > 0 && !actCols.includes('user')) {
      db.run("ALTER TABLE activity_logs ADD COLUMN user TEXT DEFAULT 'Sistema'");
    }
  } catch (e) {
    console.error('Error migrating activity_logs table:', e);
  }

  try {
    const demCols = queryAll<{ name: string }>('PRAGMA table_info(demands)').map(c => c.name);
    if (demCols.length > 0 && !demCols.includes('criado_por')) {
      db.run("ALTER TABLE demands ADD COLUMN criado_por TEXT DEFAULT 'Sistema'");
    }
  } catch (e) {
    console.error('Error migrating demands table:', e);
  }

  saveDatabase();
  return db;
}

export function getDb(): SqlJsDatabase {
  return db;
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function queryAll<T>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  const results = queryAll<T>(sql, params);
  return results[0];
}

export function run(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}

export default { initDatabase, getDb, saveDatabase, queryAll, queryOne, run };
