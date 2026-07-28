import { useState, useCallback, useEffect } from 'react';
import { useClock } from './hooks/useClock';
import SplashScreen from './components/splash/SplashScreen';
import Header from './components/layout/Header';
import KanbanBoard from './components/kanban/KanbanBoard';
import Dashboard from './components/dashboard/Dashboard';
import History from './components/history/History';
import DemandModal from './components/modals/DemandModal';
import { useDemands } from './hooks/useDemands';
import { useStats } from './hooks/useStats';
import { useWebSocket } from './hooks/useWebSocket';
import type { Demand } from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeView, setActiveView] = useState('kanban');
  const [tvMode, setTvMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);

  const { demands, loading, createDemand, updateDemand, deleteDemand, moveDemand, handleWsMessage } = useDemands();
  const { stats } = useStats();

  useWebSocket(handleWsMessage);

  useEffect(() => {
    if (tvMode) {
      document.documentElement.classList.add('tv-mode');
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.documentElement.classList.remove('tv-mode');
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [tvMode]);

  const handleEdit = useCallback((demand: Demand) => {
    setEditingDemand(demand);
    setModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingDemand(null);
    setModalOpen(true);
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await fetch(`/api/demands/${id}/duplicate`, {
        method: 'POST',
        headers: { 'X-User': 'Sistema' },
      });
      // WebSocket will update the list
    } catch (error) {
      console.error('Error duplicating demand:', error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDemand(id);
    } catch (error) {
      console.error('Error deleting demand:', error);
    }
  }, [deleteDemand]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingDemand(null);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className={`h-screen flex flex-col bg-arka-dark ${tvMode ? 'tv-mode' : ''}`}>
      {!tvMode && (
        <Header
          stats={stats}
          tvMode={tvMode}
          onToggleTv={() => setTvMode(prev => !prev)}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      )}

      {tvMode && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-3"
          style={{
            background: 'rgba(12,15,20,0.97)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <img
            src="/logo.png"
            alt="ARKA"
            style={{ height: '36px', filter: 'brightness(0) invert(1)' }}
          />
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-3">
                <div className="text-center px-3">
                  <div className="text-2xl font-bold text-glow-blue">{stats.abertas}</div>
                  <div className="text-xs text-white/40">Abertas</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center px-3">
                  <div className="text-2xl font-bold text-glow-green">{stats.concluidasHoje}</div>
                  <div className="text-xs text-white/40">Hoje</div>
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums text-white">{useClock().time}</div>
              <div className="text-xs text-white/30 capitalize">{useClock().date}</div>
            </div>
            <button
              onClick={() => setTvMode(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {loading && demands.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white/70 font-medium text-lg">Carregando demandas...</p>
                <p className="text-white/30 text-sm mt-1">Conectando ao servidor ARKA</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {(activeView === 'kanban' || tvMode) && (
              <KanbanBoard
                demands={demands}
                onMove={moveDemand}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onCreate={handleCreate}
                tvMode={tvMode}
              />
            )}
            {!tvMode && activeView === 'dashboard' && (
              <Dashboard stats={stats} tvMode={tvMode} />
            )}
            {!tvMode && activeView === 'historico' && (
              <History stats={stats} tvMode={tvMode} />
            )}
          </>
        )}
      </main>

      <DemandModal
        open={modalOpen}
        onClose={handleCloseModal}
        demand={editingDemand}
        onSave={createDemand}
        onUpdate={updateDemand}
        onDelete={deleteDemand}
      />

      {/* Mobile nav */}
      <nav
        className="md:hidden flex items-center justify-around py-2 shrink-0"
        style={{
          background: 'rgba(15,17,21,0.95)',
          borderTop: '1px solid rgba(35,45,63,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {[
          { id: 'kanban', label: 'Kanban', emoji: '📋' },
          { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
          { id: 'historico', label: 'Histórico', emoji: '🕒' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeView === item.id ? 'text-arka-blue' : 'text-white/40'
            }`}
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
