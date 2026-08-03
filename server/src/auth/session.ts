import type { Request } from 'express';
import { getUserByToken, type UserRow } from '../services/authService.js';

const COOKIE_NAME = 'arka_session';

// Lê o token de sessão do header Authorization OU do cookie httpOnly.
export function getRequestToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const cookie = req.headers.cookie;
  if (cookie) {
    for (const part of cookie.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      if (part.slice(0, idx).trim() === COOKIE_NAME) return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

// Usuário autenticado da requisição (via sessão salva no banco).
export function getSessionUser(req: Request): UserRow | undefined {
  return getUserByToken(getRequestToken(req));
}
