import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { Stats, StatsFilter } from '../types';

export function useStats(filter?: StatsFilter) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats(filter);
      setStats(data);
    } catch {
      /* keep previous stats */
    } finally {
      setLoading(false);
    }
  }, [filter?.period, filter?.responsavel, filter?.categoria, filter?.prioridade]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
