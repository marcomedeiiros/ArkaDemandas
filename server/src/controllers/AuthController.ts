import type { Request, Response } from 'express';
import crypto from 'crypto';
import {
  createLocalUser, findUserByEmail, verifyPassword, createSession,
  getUserByToken, deleteSession, toPublicUser, upsertOAuthUser,
  updateUserProfile, setUserPassword, deleteUser, countUsers, updateUserRole,
  type UserRow,
} from '../services/authService.js';
import { queryAll } from '../database.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

// fetch é global no Node 18+, mas o tipo pode não estar nas libs do TS.
const httpFetch: (url: string, init?: any) => Promise<any> = (globalThis as any).fetch;

interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'openid email profile User.Read',
  },
};

// state anti-CSRF de curta duração (em memória)
const oauthStates = new Map<string, number>();

function redirectUri(provider: string): string {
  return `${SERVER_URL}/api/auth/oauth/${provider}/callback`;
}

// Cookie de sessão (httpOnly). O valor é o token; a sessão fica no banco.
const COOKIE_NAME = 'arka_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias
const cookieOptions = { 
  httpOnly: true, 
  sameSite: 'lax' as const, 
  secure: false, // Permite cookies em HTTP no desenvolvimento
  path: '/', 
  maxAge: COOKIE_MAX_AGE 
};

// Lê o token da sessão do header Authorization OU do cookie httpOnly.
function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const cookie = req.headers.cookie;
  if (cookie) {
    for (const part of cookie.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      if (key === COOKIE_NAME) return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

function isConfigured(cfg: ProviderConfig): boolean {
  return Boolean(cfg.clientId && cfg.clientSecret);
}

export class AuthController {
  register = (req: Request, res: Response) => {
    try {
      const { name, email, password, cargo } = req.body as { name?: string; email?: string; password?: string; cargo?: string };
      if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'E-mail inválido' });
      if (!password || password.length < 6) return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres' });

      if (findUserByEmail(email)) {
        return res.status(409).json({ error: 'Já existe uma conta com este e-mail' });
      }

      // O primeiro usuário do sistema vira admin (dono); os demais são membros.
      const role = countUsers() === 0 ? 'admin' : 'member';
      const user = createLocalUser(name, email, password, cargo, role);
      // Não autentica automaticamente: o usuário é enviado para a tela de login.
      res.status(201).json({ user: toPublicUser(user) });
    } catch (error) {
      console.error('Error on register:', error);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  };

  // Lista de colaboradores (usuários) para supervisão protegido por login.
  listUsers = (req: Request, res: Response) => {
    try {
      const current = getUserByToken(bearerToken(req));
      if (!current) return res.status(401).json({ error: 'Não autenticado' });

      const users = queryAll<UserRow>('SELECT * FROM users ORDER BY created_at ASC');
      const counts = queryAll<{ user: string; count: number }>(
        'SELECT user, COUNT(*) as count FROM activity_logs GROUP BY user'
      );
      const countMap = new Map(counts.map(c => [c.user, c.count]));

      res.json(
        users.map(u => ({
          ...toPublicUser(u),
          created_at: u.created_at,
          actionCount: countMap.get(u.name) || 0,
        }))
      );
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ error: 'Erro ao listar colaboradores' });
    }
  };

  // Atualiza perfil (nome, e-mail, cargo, foto) do usuário autenticado
  updateMe = (req: Request, res: Response) => {
    try {
      const current = getUserByToken(bearerToken(req));
      if (!current) return res.status(401).json({ error: 'Não autenticado' });

      const { name, email, cargo, avatar_url } = req.body as {
        name?: string; email?: string; cargo?: string | null; avatar_url?: string | null;
      };

      if (name !== undefined && !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
      if (email !== undefined) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'E-mail inválido' });
        const other = findUserByEmail(email);
        if (other && other.id !== current.id) return res.status(409).json({ error: 'E-mail já usado por outra conta' });
      }

      const updated = updateUserProfile(current.id, { name, email, cargo, avatar_url });
      res.json({ user: toPublicUser(updated!) });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  };

  changePassword = (req: Request, res: Response) => {
    try {
      const current = getUserByToken(bearerToken(req));
      if (!current) return res.status(401).json({ error: 'Não autenticado' });

      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres' });
      }
      // Se a conta já tem senha local, exige a senha atual correta.
      if (current.password_hash) {
        if (!currentPassword || !verifyPassword(currentPassword, current.password_hash)) {
          return res.status(401).json({ error: 'Senha atual incorreta' });
        }
      }
      setUserPassword(current.id, newPassword);
      res.json({ success: true });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  };

  // Admin altera o papel de um colaborador (supervisor/admin ou membro)
  setUserRole = (req: Request, res: Response) => {
    try {
      const current = getUserByToken(bearerToken(req));
      if (!current) return res.status(401).json({ error: 'Não autenticado' });
      if (current.role !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores podem alterar papéis' });
      }
      const targetId = String(req.params.id);
      const { role } = req.body as { role?: string };
      if (role !== 'admin' && role !== 'member') {
        return res.status(400).json({ error: 'Papel inválido' });
      }
      const updated = updateUserRole(targetId, role);
      if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json({ user: toPublicUser(updated) });
    } catch (error) {
      console.error('Error setting user role:', error);
      res.status(500).json({ error: 'Erro ao alterar papel' });
    }
  };

  deleteMe = (req: Request, res: Response) => {
    try {
      const current = getUserByToken(bearerToken(req));
      if (!current) return res.status(401).json({ error: 'Não autenticado' });
      deleteUser(current.id);
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Erro ao deletar conta' });
    }
  };

  login = (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha' });

      const user = findUserByEmail(email);
      if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos' });
      }

      const token = createSession(user.id);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      res.json({ user: toPublicUser(user) });
    } catch (error) {
      console.error('Error on login:', error);
      res.status(500).json({ error: 'Erro ao entrar' });
    }
  };

  me = (req: Request, res: Response) => {
    const user = getUserByToken(bearerToken(req));
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    res.json({ user: toPublicUser(user) });
  };

  logout = (req: Request, res: Response) => {
    deleteSession(bearerToken(req));
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  };

  // Quais provedores sociais estão configurados (para o front habilitar botões)
  providers = (_req: Request, res: Response) => {
    res.json({
      google: isConfigured(PROVIDERS.google),
      microsoft: isConfigured(PROVIDERS.microsoft),
    });
  };

  oauthStart = (req: Request, res: Response) => {
    const provider = String(req.params.provider);
    const cfg = PROVIDERS[provider];
    if (!cfg) return res.redirect(`${CLIENT_URL}/#auth_error=provedor_invalido`);
    if (!isConfigured(cfg)) return res.redirect(`${CLIENT_URL}/#auth_error=${provider}_nao_configurado`);

    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, Date.now() + 10 * 60 * 1000);

    const params = new URLSearchParams({
      client_id: cfg.clientId!,
      redirect_uri: redirectUri(provider),
      response_type: 'code',
      scope: cfg.scope,
      state,
      prompt: 'select_account',
    });
    res.redirect(`${cfg.authorizeUrl}?${params.toString()}`);
  };

  oauthCallback = async (req: Request, res: Response) => {
    const provider = String(req.params.provider);
    const cfg = PROVIDERS[provider];
    const { code, state } = req.query as { code?: string; state?: string };

    if (!cfg || !isConfigured(cfg)) return res.redirect(`${CLIENT_URL}/#auth_error=${provider}_nao_configurado`);
    if (!code) return res.redirect(`${CLIENT_URL}/#auth_error=sem_codigo`);
    if (!state || !oauthStates.has(state)) return res.redirect(`${CLIENT_URL}/#auth_error=state_invalido`);
    oauthStates.delete(state);

    try {
      const tokenRes = await httpFetch(cfg.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: cfg.clientId!,
          client_secret: cfg.clientSecret!,
          code,
          redirect_uri: redirectUri(provider),
          grant_type: 'authorization_code',
        }).toString(),
      });
      const tokenJson: any = await tokenRes.json();
      if (!tokenJson.access_token) return res.redirect(`${CLIENT_URL}/#auth_error=token_falhou`);

      const infoRes = await httpFetch(cfg.userInfoUrl, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const info: any = await infoRes.json();

      let email: string | undefined;
      let name = '';
      let avatar: string | null = null;
      if (provider === 'google') {
        email = info.email;
        name = info.name || info.given_name || email || '';
        avatar = info.picture || null;
      } else {
        email = info.mail || info.userPrincipalName;
        name = info.displayName || email || '';
      }
      if (!email) return res.redirect(`${CLIENT_URL}/#auth_error=sem_email`);

      const role = countUsers() === 0 ? 'admin' : 'member';
      const user = upsertOAuthUser(provider, email, name, avatar, role);
      const token = createSession(user.id);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      // Sem token na URL: a sessão vai no cookie httpOnly. #novo sinaliza boas-vindas.
      return res.redirect(`${CLIENT_URL}/#novo=1`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(`${CLIENT_URL}/#auth_error=erro_interno`);
    }
  };
}
