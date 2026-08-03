import crypto from 'crypto';
import { queryOne, run } from '../database.js';

export type UserRole = 'admin' | 'member';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  provider: string;
  avatar_url: string | null;
  cargo: string | null;
  role: string;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  avatar_url: string | null;
  cargo: string | null;
  role: string;
}

const SESSION_DAYS = 30;

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(5).toString('hex')}`;
}

export function toPublicUser(u: UserRow): PublicUser {
  return { id: u.id, name: u.name, email: u.email, provider: u.provider, avatar_url: u.avatar_url, cargo: u.cargo, role: u.role };
}

export function countUsers(): number {
  return queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM users')?.n ?? 0;
}

export function updateUserRole(id: string, role: UserRole): UserRow | undefined {
  run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  return findUserById(id);
}

// ── Senha (scrypt, sem dependência externa) ──────────────────────────────────
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  const keyBuf = Buffer.from(key, 'hex');
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuf, derived);
}

// ── Usuários ─────────────────────────────────────────────────────────────────
export function findUserByEmail(email: string): UserRow | undefined {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
}

export function findUserById(id: string): UserRow | undefined {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
}

export function createLocalUser(name: string, email: string, password: string, cargo?: string, role: UserRole = 'member'): UserRow {
  const id = genId('usr');
  run(
    'INSERT INTO users (id, name, email, password_hash, provider, cargo, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, name.trim(), email.toLowerCase().trim(), hashPassword(password), 'local', cargo?.trim() || null, role]
  );
  return findUserById(id)!;
}

/** Atualiza campos do perfil (nome, e-mail, cargo, foto). */
export function updateUserProfile(
  id: string,
  fields: { name?: string; email?: string; cargo?: string | null; avatar_url?: string | null }
): UserRow | undefined {
  const updates: string[] = [];
  const values: unknown[] = [];
  if (fields.name !== undefined) { updates.push('name = ?'); values.push(fields.name.trim()); }
  if (fields.email !== undefined) { updates.push('email = ?'); values.push(fields.email.toLowerCase().trim()); }
  if (fields.cargo !== undefined) { updates.push('cargo = ?'); values.push(fields.cargo ? String(fields.cargo).trim() : null); }
  if (fields.avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(fields.avatar_url || null); }
  if (updates.length === 0) return findUserById(id);
  values.push(id);
  run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  return findUserById(id);
}

export function setUserPassword(id: string, password: string): void {
  run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), id]);
}

export function deleteUser(id: string): void {
  run('DELETE FROM sessions WHERE user_id = ?', [id]);
  run('DELETE FROM users WHERE id = ?', [id]);
}

/** Cria (ou reaproveita) um usuário vindo de OAuth (Google/Microsoft). */
export function upsertOAuthUser(provider: string, email: string, name: string, avatarUrl: string | null, role: UserRole = 'member'): UserRow {
  const existing = findUserByEmail(email);
  if (existing) return existing;
  const id = genId('usr');
  run(
    'INSERT INTO users (id, name, email, provider, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)',
    [id, (name || email).trim(), email.toLowerCase().trim(), provider, avatarUrl, role]
  );
  return findUserById(id)!;
}

// ── Sessões (token opaco salvo no banco) ─────────────────────────────────────
export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expiresAt]);
  return token;
}

export function getUserByToken(token: string | undefined): UserRow | undefined {
  if (!token) return undefined;
  const session = queryOne<{ user_id: string; expires_at: string }>(
    'SELECT user_id, expires_at FROM sessions WHERE token = ?',
    [token]
  );
  if (!session) return undefined;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    run('DELETE FROM sessions WHERE token = ?', [token]);
    return undefined;
  }
  return findUserById(session.user_id);
}

export function deleteSession(token: string | undefined): void {
  if (!token) return;
  run('DELETE FROM sessions WHERE token = ?', [token]);
}
