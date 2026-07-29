import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { Demand, CreateDemandDTO, ColumnStatus } from '../types';

export function useDemands(search?: string) {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemands = useCallback(async () => {
    try {
      const data = await api.getDemands(search);
      setDemands(data);
      setError(null);
    } catch (err) {
      setError(String(err));
      // Garante que o loading para mesmo em caso de erro,
      // senão o spinner fica preso para sempre
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDemands();
    const interval = setInterval(fetchDemands, 10000);
    return () => clearInterval(interval);
  }, [fetchDemands]);

  const createDemand = async (data: CreateDemandDTO) => {
    const demand = await api.createDemand(data);
    setDemands(prev => [demand, ...prev]);
    return demand;
  };

  const updateDemand = async (id: string, data: Partial<CreateDemandDTO>) => {
    const demand = await api.updateDemand(id, data);
    setDemands(prev => prev.map(d => d.id === id ? demand : d));
    return demand;
  };

  const deleteDemand = async (id: string) => {
    await api.deleteDemand(id);
    setDemands(prev => prev.filter(d => d.id !== id));
  };

  const moveDemand = async (id: string, status: ColumnStatus) => {
    const demand = await api.moveDemand(id, status);
    setDemands(prev => prev.map(d => d.id === id ? demand : d));
    return demand;
  };

  const handleWsMessage = useCallback((message: { type: string; data: unknown }) => {
    switch (message.type) {
      case 'demand_created':
        setDemands(prev => {
          const exists = prev.some(d => d.id === (message.data as Demand).id);
          return exists ? prev : [message.data as Demand, ...prev];
        });
        break;
      case 'demand_updated':
      case 'demand_moved':
        setDemands(prev => prev.map(d => d.id === (message.data as Demand).id ? message.data as Demand : d));
        break;
      case 'demand_deleted':
        setDemands(prev => prev.filter(d => d.id !== (message.data as { id: string }).id));
        break;
    }
  }, []);

  return { demands, loading, error, fetchDemands, createDemand, updateDemand, deleteDemand, moveDemand, handleWsMessage };
}
