-- Migration: Create categories and priorities tables
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#0066FF',
  icon TEXT DEFAULT 'folder',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  color TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default priorities
INSERT OR IGNORE INTO priorities (name, level, color) VALUES
  ('Baixa', 1, '#22C55E'),
  ('Média', 2, '#EAB308'),
  ('Alta', 3, '#F97316'),
  ('Urgente', 4, '#EF4444');

-- Seed default categories
INSERT OR IGNORE INTO categories (name, color, icon) VALUES
  ('Infraestrutura', '#0066FF', 'server'),
  ('Desenvolvimento', '#8B5CF6', 'code'),
  ('Suporte', '#22C55E', 'headset'),
  ('Manutenção', '#F59E0B', 'wrench'),
  ('Consultoria', '#06B6D4', 'lightbulb');

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('auto_assign', 'false'),
  ('require_deadline', 'false'),
  ('enable_notifications', 'true');
