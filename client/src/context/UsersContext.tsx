import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Collaborator } from '../types';

// Mapa nome→usuário (para mostrar a foto onde aparece só o nome) + nome do
// usuário logado (para saber quem é o dono de cada demanda). Dados do banco.
interface UsersContextValue {
  byName: Map<string, Collaborator>;
  currentUserName?: string;
  currentUserRole?: string;
}

const UsersContext = createContext<UsersContextValue>({ byName: new Map() });

export function UsersProvider(
  { currentUserName, currentUserRole, children }:
  { currentUserName?: string; currentUserRole?: string; children: ReactNode }
) {
  const [byName, setByName] = useState<Map<string, Collaborator>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/users')
      .then(r => (r.ok ? r.json() : []))
      .then((users: Collaborator[]) => {
        if (!cancelled) setByName(new Map(users.map(u => [u.name, u])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return <UsersContext.Provider value={{ byName, currentUserName, currentUserRole }}>{children}</UsersContext.Provider>;
}

export function useUserByName(name?: string | null): Collaborator | undefined {
  const { byName } = useContext(UsersContext);
  return name ? byName.get(name) : undefined;
}

export function useCurrentUserName(): string | undefined {
  return useContext(UsersContext).currentUserName;
}

export function useIsAdmin(): boolean {
  return useContext(UsersContext).currentUserRole === 'admin';
}
