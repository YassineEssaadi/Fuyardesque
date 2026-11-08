import React, { useState, useMemo } from 'react';
import {
  ClientGameState,
  TransportType,
  TRANSPORT_CONFIG,
  getConnectionsFrom,
  getStationById,
  getNeighbors,
  getAvailableTransports,
} from '@fuyardesque/shared';
import { Lock, Navigation, Sparkles, Layers } from 'lucide-react';

interface BottomMoveBarProps {
  gameState: ClientGameState | null;
  selectedTransport: TransportType;
  selectedDestination: string | null;
  onSelectTransport: (transport: TransportType) => void;
  onSelectDestination: (stationId: string, transport?: TransportType) => void;
  onConfirmMove: () => void;
}

export const BottomMoveBar: React.FC<BottomMoveBarProps> = ({
  gameState,
  selectedTransport,
  selectedDestination,
  onSelectTransport,
  onSelectDestination,
  onConfirmMove,
}) => {
  // Hooks must run unconditionally; the early return lives below them.
  const [filterMode, setFilterMode] = useState<'all' | TransportType>('all');
  const myStationId = gameState?.myCurrentStationId || '';
  const isLocked = gameState?.myPendingMove?.locked || false;
  const isMyTurn =
    gameState?.phase === 'planning' && gameState.turnRole === gameState.myRole;
  const pendingDest = gameState?.myPendingMove?.toStationId;

  // Compute all directly accessible stations and their available transport methods
  const accessibleStations = useMemo(() => {
    if (!myStationId) return [];
    const neighbors = getNeighbors(myStationId);
    return neighbors.map((nId) => {
      const station = getStationById(nId);
      const transports = getAvailableTransports(myStationId, nId);
      return {
        station,
        transports,
      };
    }).filter((item) => item.station !== undefined);
  }, [myStationId]);

  // Filter based on selected tab ('all' or specific transport)
  const filteredList = useMemo(() => {
    if (filterMode === 'all') return accessibleStations;
    return accessibleStations.filter((item) => item.transports.includes(filterMode));
  }, [accessibleStations, filterMode]);

  if (!gameState) return null;

  const targetStation = selectedDestination ? getStationById(selectedDestination) : null;
  const pendingStation = pendingDest ? getStationById(pendingDest) : null;

  if (gameState.phase === 'setup') {
    const selectedCount = gameState.players.filter((player) => player.currentStationId).length;
    return (
      <footer className="w-full bg-dark-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none z-30 shadow-2xl">
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold text-emerald-300">
            CHOOSE YOUR STARTING STATION · {selectedCount}/{gameState.players.length} SELECTED
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Each player must choose a different station before the 30-second setup timer ends.
          </div>
        </div>
        <button
          disabled={!pendingDest || isLocked}
          onClick={onConfirmMove}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Lock className="w-4 h-4" />
          {isLocked ? 'STARTING STATION LOCKED' : 'CONFIRM STARTING STATION'}
        </button>
      </footer>
    );
  }

  if (gameState.phase === 'planning' && !isMyTurn) {
    return (
      <footer className="w-full bg-dark-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex items-center justify-center select-none z-30 shadow-2xl">
        <div className="text-xs font-mono font-bold text-amber-300">
          {gameState.turnRole === 'fugitive'
            ? 'WAITING FOR THE FUGITIVE TO CHOOSE AND MOVE…'
            : 'DETECTIVES: DISCUSS THE FUGITIVE’S MOVE, THEN CHOOSE YOUR STATIONS…'}
        </div>
      </footer>
    );
  }

  const handleDestinationClick = (stationId: string, availableTransports: TransportType[]) => {
    if (isLocked) return;

    // If current selectedTransport is valid for this destination, keep it.
    // Otherwise auto-switch to the first valid transport!
    let nextTransport = selectedTransport;
    if (!availableTransports.includes(selectedTransport)) {
      nextTransport = availableTransports[0];
      onSelectTransport(nextTransport);
    }
    onSelectDestination(stationId, nextTransport);
  };

  return (
    <footer className="w-full bg-dark-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 select-none z-30 shadow-2xl">
      {/* Transport Filter Tabs */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Filter:
        </span>

        {/* ALL Tab */}
        <button
          disabled={isLocked}
          onClick={() => setFilterMode('all')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
            filterMode === 'all'
              ? 'bg-slate-700 border-slate-500 text-white shadow-md'
              : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
          } ${isLocked ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>ALL ({accessibleStations.length})</span>
        </button>

        {/* Taxi / Bus / Metro Tabs */}
        {(['taxi', 'bus', 'metro'] as TransportType[]).map((t) => {
          const config = TRANSPORT_CONFIG[t];
          const isFilterActive = filterMode === t;
          const count = accessibleStations.filter((s) => s.transports.includes(t)).length;

          return (
            <button
              key={t}
              disabled={isLocked}
              onClick={() => {
                setFilterMode(t);
                onSelectTransport(t);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isFilterActive
                  ? 'shadow-lg scale-102 font-black'
                  : 'opacity-70 hover:opacity-100 hover:bg-slate-800/60'
              } ${isLocked ? 'cursor-not-allowed opacity-40' : ''}`}
              style={{
                backgroundColor: isFilterActive ? config.bg : 'rgba(15, 23, 42, 0.6)',
                color: isFilterActive ? config.color : '#94a3b8',
                borderColor: isFilterActive ? config.borderColor : '#334155',
              }}
            >
              <span>{config.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isFilterActive ? 'bg-black/50 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Destination Stations Carousel / Horizontal List with Multi-Transport Badges */}
      <div className="flex-1 max-w-xl flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {filteredList.length === 0 ? (
          <span className="text-xs font-mono text-slate-500 italic">
            No connections available with this filter.
          </span>
        ) : (
          filteredList.map(({ station, transports }) => {
            if (!station) return null;
            const isSelected = selectedDestination === station.id;

            return (
              <button
                key={station.id}
                disabled={isLocked}
                onClick={() => handleDestinationClick(station.id, transports)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono whitespace-nowrap transition flex flex-col items-start gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-102'
                    : 'bg-dark-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600'
                } ${isLocked ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <span className="font-bold text-cyan-300">[{station.id}]</span>
                  <span className="text-[11px] truncate max-w-[95px] font-semibold">{station.name}</span>
                </div>

                {/* Transport Indicator Pills */}
                <div className="flex items-center gap-1">
                  {transports.map((t) => {
                    const c = TRANSPORT_CONFIG[t];
                    const isCurrentT = selectedTransport === t && isSelected;
                    return (
                      <span
                        key={t}
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                          isCurrentT ? 'ring-1 ring-white' : ''
                        }`}
                        style={{
                          backgroundColor: c.bg,
                          color: c.color,
                          borderColor: c.borderColor,
                        }}
                      >
                        {t === 'taxi' ? 'TAXI' : t === 'bus' ? 'BUS' : 'METRO'}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Confirm Movement Button */}
      <div className="flex items-center gap-3">
        {isLocked ? (
          <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/80 px-4 py-2.5 rounded-xl text-emerald-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>
              LOCKED IN TO {pendingStation ? `${pendingStation.name} (${pendingDest})` : 'TARGET'}
            </span>
          </div>
        ) : (
          <button
            disabled={!selectedDestination || isLocked}
            onClick={onConfirmMove}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition ${
              selectedDestination && !isLocked
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-102 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>
              {targetStation
                ? `LOCK MOVE TO ${targetStation.name} via ${TRANSPORT_CONFIG[selectedTransport].label.toUpperCase()}`
                : 'SELECT ANY HIGHLIGHTED DESTINATION'}
            </span>
          </button>
        )}
      </div>
    </footer>
  );
};
