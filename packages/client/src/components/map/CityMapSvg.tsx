import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  CITY_MAP,
  ClientGameState,
  Station,
  TransportType,
  getStationById,
  getNeighbors,
  getAvailableTransports,
  TRANSPORT_CONFIG,
  getConnectionsFrom,
  FUGITIVE_LOCATION_REVEAL_INTERVAL,
} from '@fuyardesque/shared';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Navigation, Info, LocateFixed } from 'lucide-react';
import { MapIllustration, StationDisc } from './MapIllustration';

interface CityMapSvgProps {
  gameState: ClientGameState | null;
  selectedTransport: TransportType;
  selectedDestination: string | null;
  onSelectStation: (stationId: string, transport?: TransportType) => void;
  onSelectTransport: (transport: TransportType) => void;
}

export const CityMapSvg: React.FC<CityMapSvgProps> = ({
  gameState,
  selectedTransport,
  selectedDestination,
  onSelectStation,
  onSelectTransport,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; stationId: string | null } | null>(null);
  const previousPointerRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const hasAutoCenteredRef = useRef(false);

  // Pan and Zoom State
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 850 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  const myStationId = gameState?.myCurrentStationId || '';
  const myRole = gameState?.myRole || 'pursuer';
  const isSetup = gameState?.phase === 'setup';
  // Once a move is locked (or outside the planning phase) the map must not
  // suggest a different destination than the one already submitted.
  const isMoveLocked =
    gameState?.myPendingMove?.locked === true ||
    (gameState?.phase !== 'setup' &&
      (gameState?.phase !== 'planning' || gameState.turnRole !== myRole));

  // Compute all directly accessible neighbors from the player's station
  const myNeighborData = useMemo(() => {
    if (!myStationId || isSetup) return new Map<string, TransportType[]>();
    const neighbors = getNeighbors(myStationId);
    const map = new Map<string, TransportType[]>();
    neighbors.forEach((nId) => {
      map.set(nId, getAvailableTransports(myStationId, nId));
    });
    return map;
  }, [myStationId, isSetup]);

  const setupTakenStations = useMemo(
    () =>
      new Set(
        (gameState?.players || [])
          .filter((player) => player.id !== gameState?.myPlayerId)
          .map((player) => player.currentStationId)
          .filter((stationId): stationId is string => !!stationId)
      ),
    [gameState?.players, gameState?.myPlayerId]
  );

  // Center on current player
  const centerOnPlayer = useCallback(() => {
    if (myStationId) {
      const myStation = getStationById(myStationId);
      if (myStation) {
        setViewBox({
          x: Math.max(0, Math.min(300, myStation.x - 450)),
          y: Math.max(0, Math.min(212.5, myStation.y - 318.75)),
          width: 900,
          height: 637.5,
        });
      }
    }
  }, [myStationId]);

  // Center only on entry; don't yank the map back after every round's move.
  useEffect(() => {
    if (myStationId && !hasAutoCenteredRef.current) {
      centerOnPlayer();
      hasAutoCenteredRef.current = true;
    }
  }, [myStationId, centerOnPlayer]);

  // Zoom around the pointer in SVG coordinates, including when the SVG has
  // letterboxing from a viewport whose aspect ratio differs from the map.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.82 : 1.22;
      const screenMatrix = svg.getScreenCTM();
      if (!screenMatrix) return;

      const pointer = svg.createSVGPoint();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      const mapPoint = pointer.matrixTransform(screenMatrix.inverse());

      setViewBox((prev) => {
        const newWidth = Math.max(160, Math.min(2600, prev.width * factor));
        const newHeight = newWidth * (prev.height / prev.width);
        const viewXRatio = (mapPoint.x - prev.x) / prev.width;
        const viewYRatio = (mapPoint.y - prev.y) / prev.height;

        return {
          x: mapPoint.x - viewXRatio * newWidth,
          y: mapPoint.y - viewYRatio * newHeight,
          width: newWidth,
          height: newHeight,
        };
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  // Pointer capture keeps a pan gesture stable when it reaches the edge of the SVG.
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target instanceof Element ? e.target.closest('[data-station-id]') : null;
    const stationId = target?.getAttribute('data-station-id') || null;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, stationId };
    previousPointerRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const start = pointerStartRef.current;
    const previous = previousPointerRef.current;
    if (!start || !previous) return;

    if (!hasDraggedRef.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) {
      hasDraggedRef.current = true;
      setIsDragging(true);
    }
    if (!hasDraggedRef.current) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - previous.x) * viewBox.width) / rect.width;
    const dy = ((e.clientY - previous.y) * viewBox.height) / rect.height;

    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));
    previousPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const start = pointerStartRef.current;
    if (start && !hasDraggedRef.current && start.stationId && !isMoveLocked) {
      if (isSetup) {
        if (!setupTakenStations.has(start.stationId)) onSelectStation(start.stationId);
      } else {
        const transports = myNeighborData.get(start.stationId);
        if (transports?.length) onSelectStation(start.stationId);
      }
    }
    pointerStartRef.current = null;
    previousPointerRef.current = null;
    hasDraggedRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    previousPointerRef.current = null;
    hasDraggedRef.current = false;
    setIsDragging(false);
  };

  // Zoom button helper
  const zoom = (factor: number) => {
    setViewBox((prev) => {
      const newWidth = Math.max(160, Math.min(2600, prev.width * factor));
      const newHeight = newWidth * (prev.height / prev.width);
      const dx = (newWidth - prev.width) / 2;
      const dy = (newHeight - prev.height) / 2;

      return {
        x: prev.x - dx,
        y: prev.y - dy,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 1200, height: 850 });
  };

  // Precompute each station's available transports across the entire map for authentic Scotland Yard discs
  const stationTransportsMap = useMemo(() => {
    const map = new Map<string, TransportType[]>();
    CITY_MAP.stations.forEach((st) => {
      const conns = getConnectionsFrom(st.id);
      const set = new Set<TransportType>(conns.map((c) => c.transport));
      map.set(st.id, Array.from(set));
    });
    return map;
  }, []);

  // Compute road corridors and parallel transport tracks
  const roadCorridors = useMemo(() => {
    const pairMap = new Map<string, { from: Station; to: Station; transports: TransportType[] }>();

    CITY_MAP.connections.forEach((conn) => {
      const pairKey = [conn.from, conn.to].sort().join('--');
      if (!pairMap.has(pairKey)) {
        const fromSt = getStationById(conn.from);
        const toSt = getStationById(conn.to);
        if (fromSt && toSt) {
          pairMap.set(pairKey, { from: fromSt, to: toSt, transports: [] });
        }
      }
      const item = pairMap.get(pairKey);
      if (item && !item.transports.includes(conn.transport)) {
        item.transports.push(conn.transport);
      }
    });

    // Generate road corridors and offset tracks
    const roads: { from: Station; to: Station; isDirectExit: boolean }[] = [];
    const tracks: {
      from: Station;
      to: Station;
      transport: TransportType;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isDirectExit: boolean;
    }[] = [];

    pairMap.forEach(({ from, to, transports }) => {
      const isDirectExit = from.id === myStationId || to.id === myStationId;
      roads.push({ from, to, isDirectExit });

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      transports.forEach((transport) => {
        let offset = 0;
        if (transports.length === 2) {
          offset = transport === 'taxi' ? -3.5 : 3.5;
        } else if (transports.length >= 3) {
          if (transport === 'taxi') offset = -6;
          else if (transport === 'bus') offset = 0;
          else if (transport === 'metro') offset = 6;
        }

        tracks.push({
          from,
          to,
          transport,
          x1: from.x + nx * offset,
          y1: from.y + ny * offset,
          x2: to.x + nx * offset,
          y2: to.y + ny * offset,
          isDirectExit,
        });
      });
    });

    return { roads, tracks };
  }, [myStationId]);

  const inspectedStationId = selectedDestination || hoveredStationId;
  const inspectedStation = inspectedStationId ? getStationById(inspectedStationId) : null;
  const inspectedTransports = !isSetup && inspectedStationId && myStationId
    ? myNeighborData.get(inspectedStationId)
    : null;
  const myCurrentStation = myStationId ? getStationById(myStationId) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#1e293b] overflow-hidden select-none rounded-xl border border-slate-700/80 shadow-2xl flex flex-col"
    >
      {/* Zoom / Navigation Controls Bar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-dark-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
        <button
          onClick={() => zoom(0.75)}
          className="p-1.5 md:p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center justify-center cursor-pointer shadow-sm"
          title="Zoom In (Scroll Up)"
        >
          <ZoomIn className="w-5 h-5 text-cyan-400" />
        </button>
        <button
          onClick={() => zoom(1.33)}
          className="p-1.5 md:p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center justify-center cursor-pointer shadow-sm"
          title="Zoom Out (Scroll Down)"
        >
          <ZoomOut className="w-5 h-5 text-cyan-400" />
        </button>
        <button
          onClick={centerOnPlayer}
          className="p-1.5 md:p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center justify-center cursor-pointer shadow-sm"
          title="Center on My Location"
        >
          <LocateFixed className="w-5 h-5 text-emerald-400" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 md:p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center justify-center cursor-pointer shadow-sm"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Scotland Yard Style Authentic Board Game Key */}
      <div className="absolute top-3 left-3 right-14 md:right-auto z-20 w-fit max-w-[calc(100%-4.5rem)] bg-dark-900/95 backdrop-blur-md px-2 py-1.5 md:px-4 md:py-2.5 rounded-xl border border-slate-700/80 shadow-2xl text-[10px] md:text-xs font-mono flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-4">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-slate-900 shadow-sm inline-block"></span>
          <span className="text-yellow-300 font-black">Taxi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-sky-500 border-2 border-slate-900 shadow-sm inline-block"></span>
          <span className="text-sky-300 font-black">Bus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm inline-block"></span>
          <span className="text-emerald-300 font-black">Metro</span>
        </div>
      </div>

      {/* Floating Tactical Station Detail / Transport Selector Card */}
      {inspectedStation && inspectedStation.id !== myStationId && (
        <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 z-20 bg-dark-900/95 backdrop-blur-md border border-cyan-500/70 rounded-2xl p-3 md:p-4 shadow-2xl max-w-[calc(100%-4.5rem)] md:max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Target Station Inspection
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <span className="text-cyan-300">[{inspectedStation.id}]</span>
                <span>{inspectedStation.name}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              {inspectedStation.district}
            </span>
          </div>

          {isSetup ? (
            <div className="text-[11px] font-mono text-emerald-300">
              {setupTakenStations.has(inspectedStation.id)
                ? 'Already selected by another player.'
                : 'Click to choose this starting station.'}
            </div>
          ) : inspectedTransports && inspectedTransports.length > 0 ? (
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                <span>✓ Reachable from {myCurrentStation?.name || myStationId}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {inspectedTransports.map((t) => {
                  const conf = TRANSPORT_CONFIG[t];
                  const isEquipped = selectedTransport === t && selectedDestination === inspectedStation.id;
                  return (
                    <button
                      key={t}
                      disabled={isMoveLocked}
                      onClick={() => {
                        if (!isMoveLocked) onSelectStation(inspectedStation.id, t);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition ${
                        isMoveLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isEquipped
                          ? 'scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'opacity-85 hover:opacity-100 hover:scale-102'
                      }`}
                      style={{
                        backgroundColor: conf.bg,
                        color: conf.color,
                        borderColor: conf.borderColor,
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Take {conf.label}</span>
                      {isEquipped && <span className="text-[10px] text-white">✓ Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Not directly connected. Intermediate hop required.</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={`w-full h-full flex-1 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <defs>
          {/* Operative Token Drop Shadow */}
          <filter id="tokenShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.75" />
          </filter>
          <filter id="roadShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* 1. AUTHENTIC BOARD GAME ILLUSTRATED CITY BACKGROUND */}
        {/* ======================================================== */}
        <MapIllustration />

        {/* ======================================================== */}
        {/* 2. BOARD GAME ROAD CORRIDORS (Scotland Yard Style) */}
        {/* ======================================================== */}

        {/* Base Road Casings (Cream/Off-White Highway Corridors) */}
        {roadCorridors.roads.map((road, idx) => (
          <g key={`road_${idx}`}>
            {/* Outer dark casing border */}
            <line
              x1={road.from.x}
              y1={road.from.y}
              x2={road.to.x}
              y2={road.to.y}
              stroke="#475569"
              strokeWidth={road.isDirectExit ? 14 : 11}
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Inner cream roadbed */}
            <line
              x1={road.from.x}
              y1={road.from.y}
              x2={road.to.x}
              y2={road.to.y}
              stroke="#faf6ee"
              strokeWidth={road.isDirectExit ? 11 : 8}
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Transport Rails / Colored Inner Stripes */}
        {/* A. Taxi Lines (Yellow Center Stripe) */}
        {roadCorridors.tracks
          .filter((t) => t.transport === 'taxi')
          .map((line, idx) => (
            <line
              key={`taxi_${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#f59e0b"
              strokeWidth={line.isDirectExit ? 3.5 : 2.5}
              strokeLinecap="round"
              opacity={line.isDirectExit ? 1 : 0.85}
            />
          ))}

        {/* B. Bus Lines (Blue Dashed Route) */}
        {roadCorridors.tracks
          .filter((t) => t.transport === 'bus')
          .map((line, idx) => (
            <line
              key={`bus_${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#0284c7"
              strokeWidth={line.isDirectExit ? 4 : 3}
              strokeDasharray="6,4"
              strokeLinecap="round"
              opacity={line.isDirectExit ? 1 : 0.9}
            />
          ))}

        {/* C. Metro Express Lines (Green Solid Rail with Dark Trim) */}
        {roadCorridors.tracks
          .filter((t) => t.transport === 'metro')
          .map((line, idx) => (
            <g key={`metro_${idx}`}>
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#064e3b"
                strokeWidth={line.isDirectExit ? 7 : 5.5}
                strokeLinecap="round"
              />
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#10b981"
                strokeWidth={line.isDirectExit ? 4 : 3}
                strokeLinecap="round"
              />
            </g>
          ))}

        {/* Active Selected Route Glowing Highlight */}
        {selectedDestination && myStationId && (
          (() => {
            const fromSt = getStationById(myStationId);
            const toSt = getStationById(selectedDestination);
            if (!fromSt || !toSt) return null;
            const config = TRANSPORT_CONFIG[selectedTransport];
            return (
              <line
                x1={fromSt.x}
                y1={fromSt.y}
                x2={toSt.x}
                y2={toSt.y}
                stroke={config.color}
                strokeWidth="8"
                strokeDasharray="12,6"
                className="animate-pulse"
                strokeLinecap="round"
              />
            );
          })()
        )}

        {/* ======================================================== */}
        {/* 3. RADAR REVELATION BEACON */}
        {/* ======================================================== */}
        {gameState?.revelation.active && gameState.revelation.stationId && (
          (() => {
            const revSt = getStationById(gameState.revelation.stationId);
            if (!revSt) return null;
            return (
              <g>
                <circle
                  cx={revSt.x}
                  cy={revSt.y}
                  r="65"
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="3"
                  className="animate-ping"
                  opacity="0.85"
                />
                <circle
                  cx={revSt.x}
                  cy={revSt.y}
                  r="95"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  className="animate-spin"
                  style={{ transformOrigin: `${revSt.x}px ${revSt.y}px` }}
                />
                <circle
                  cx={revSt.x}
                  cy={revSt.y}
                  r="32"
                  fill="rgba(225, 29, 72, 0.4)"
                  stroke="#e11d48"
                  strokeWidth="4"
                />
                <text
                  x={revSt.x}
                  y={revSt.y - 40}
                  textAnchor="middle"
                  fill="#fecdd3"
                  fontSize="14"
                  fontWeight="900"
                  fontFamily="monospace"
                  className="animate-pulse"
                >
                  TARGET SPOTTED!
                </text>
              </g>
            );
          })()
        )}

        {/* Last Known Fugitive Station */}
        {!gameState?.revelation.active &&
          gameState?.lastKnownFugitiveStationId &&
          myRole === 'pursuer' && (
            (() => {
              const lastSt = getStationById(gameState.lastKnownFugitiveStationId);
              if (!lastSt) return null;
              return (
                <g opacity="0.9">
                  <circle
                    cx={lastSt.x}
                    cy={lastSt.y}
                    r="32"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="5,4"
                  />
                  <text
                    x={lastSt.x}
                    y={lastSt.y - 36}
                    textAnchor="middle"
                    fill="#b45309"
                    fontSize="11"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    LAST KNOWN
                  </text>
                </g>
              );
            })()
          )}

        {/* ======================================================== */}
        {/* 4. AUTHENTIC SCOTLAND YARD MULTI-COLOR STATION DISCS */}
        {/* ======================================================== */}
        {CITY_MAP.stations.map((st) => {
          const isMyStation = st.id === myStationId;
          const directTransports = myNeighborData.get(st.id);
          const isDirectNeighbor = !!directTransports && directTransports.length > 0;
          const isSelected = selectedDestination === st.id;
          const isHovered = hoveredStationId === st.id;
          const isSetupTaken = isSetup && setupTakenStations.has(st.id);
          const stationTransports = stationTransportsMap.get(st.id) || ['taxi'];

          return (
            <g
              key={st.id}
              data-station-id={st.id}
              className={isSetupTaken ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              onMouseEnter={() => setHoveredStationId(st.id)}
              onMouseLeave={() => setHoveredStationId(null)}
            >
              {/* Highlight Halo for Current Player */}
              {isMyStation && (
                <circle
                  cx={st.x}
                  cy={st.y}
                  r="28"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="4"
                  className="animate-pulse"
                />
              )}

              {/* Accessible Neighbor Highlight Halo */}
              {((isDirectNeighbor && !isSelected) || (isSetup && !isSetupTaken && !isSelected)) && (
                <circle
                  cx={st.x}
                  cy={st.y}
                  r="25"
                  fill="none"
                  stroke={
                    isSetup
                      ? '#34d399'
                      : directTransports?.includes(selectedTransport)
                      ? TRANSPORT_CONFIG[selectedTransport].color
                      : '#38bdf8'
                  }
                  strokeWidth="3.5"
                  strokeDasharray={isSetup ? '2,5' : '4,2'}
                  opacity="0.95"
                />
              )}

              {/* Selected Destination Halo */}
              {isSelected && (
                <g>
                  <circle
                    cx={st.x}
                    cy={st.y}
                    r="32"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    className="animate-ping"
                    opacity="0.7"
                  />
                  <circle
                    cx={st.x}
                    cy={st.y}
                    r="28"
                    fill="rgba(16, 185, 129, 0.3)"
                    stroke="#10b981"
                    strokeWidth="3.5"
                  />
                </g>
              )}

              {/* Authentic Segmented Multi-Color Station Disc */}
              <StationDisc
                cx={st.x}
                cy={st.y}
                radius={16}
                stationNumber={st.id.replace('st-', '')}
                transports={stationTransports}
                isMyStation={isMyStation}
                isSelected={isSelected}
                isDirectNeighbor={isDirectNeighbor}
                isHovered={isHovered}
              />

              {/* CLEAR DIRECT TRANSPORT BADGES FOR NEIGHBOR STATIONS */}
              {isDirectNeighbor && directTransports && (
                <g transform={`translate(${st.x}, ${st.y - 30})`} pointerEvents="none">
                  {directTransports.map((t, idx) => {
                    const badgeWidth = 26;
                    const totalWidth = directTransports.length * (badgeWidth + 4);
                    const startX = -totalWidth / 2 + idx * (badgeWidth + 4);
                    const conf = TRANSPORT_CONFIG[t];
                    const isSelectedT = selectedTransport === t;

                    return (
                      <g key={t} transform={`translate(${startX}, 0)`}>
                        <rect
                          x="0"
                          y="0"
                          width={badgeWidth}
                          height="16"
                          rx="4"
                          fill={isSelectedT ? conf.borderColor : '#ffffff'}
                          stroke={conf.borderColor}
                          strokeWidth="2"
                          opacity="0.95"
                        />
                        <text
                          x={badgeWidth / 2}
                          y="11.5"
                          textAnchor="middle"
                          fill={isSelectedT ? '#ffffff' : conf.borderColor}
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {t === 'taxi' ? 'TAXI' : t === 'bus' ? 'BUS' : 'METRO'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Station Name Label (on hover or selected) */}
              {(isHovered || isMyStation || isSelected) && (
                <g pointerEvents="none">
                  <rect
                    x={st.x - st.name.length * 4.5 - 10}
                    y={st.y + 24}
                    width={st.name.length * 9 + 20}
                    height="24"
                    rx="6"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                  <text
                    x={st.x}
                    y={st.y + 40}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {st.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ======================================================== */}
        {/* 5. PROMINENT OPERATIVE STANDEE TOKENS (Scotland Yard Style) */}
        {/* ======================================================== */}
        {CITY_MAP.stations.map((st) => {
          const occupyingPlayers = gameState?.players.filter(
            (p) => p.currentStationId === st.id
          ) || [];

          if (occupyingPlayers.length === 0) return null;

          const isDirectNeighbor = myNeighborData.has(st.id);
          const baseY = st.y - (isDirectNeighbor ? 58 : 40);

          return (
            <g key={`pawns_${st.id}`}>
              {occupyingPlayers.map((player, pIdx) => {
                const total = occupyingPlayers.length;
                const offsetX = (pIdx - (total - 1) / 2) * 38;
                const isFugitive = player.role === 'fugitive';
                const isMe = player.id === gameState?.myPlayerId;

                return (
                  <g
                    key={player.id}
                    transform={`translate(${st.x + offsetX}, ${baseY})`}
                    filter="url(#tokenShadow)"
                    className="cursor-pointer transition-transform hover:scale-115"
                  >
                    {/* Downward pointer needle */}
                    <path
                      d="M -5 15 L 0 26 L 5 15 Z"
                      fill={isFugitive ? '#e11d48' : player.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Outer Glow Ring for Current Player */}
                    {isMe && (
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3.5"
                        className="animate-ping"
                        opacity="0.75"
                      />
                    )}

                    {/* Main Token Circle (r=17, 34px diameter) */}
                    <circle
                      cx="0"
                      cy="0"
                      r="17"
                      fill={isFugitive ? '#e11d48' : player.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />

                    {/* Token Inner Glow Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r="14"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1"
                    />

                    {/* Operative Initial / Icon */}
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="900"
                      fontFamily="sans-serif"
                      pointerEvents="none"
                    >
                      {isFugitive ? '👻' : player.name.charAt(0).toUpperCase()}
                    </text>

                    {/* "YOU" Badge */}
                    {isMe && (
                      <g transform="translate(0, -24)">
                        <rect
                          x="-15"
                          y="-7"
                          width="30"
                          height="15"
                          rx="4"
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="sans-serif"
                        >
                          YOU
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Capture Notification Marker */}
        {gameState?.captureStationId && (
          (() => {
            const capSt = getStationById(gameState.captureStationId);
            if (!capSt) return null;
            return (
              <g>
                <circle
                  cx={capSt.x}
                  cy={capSt.y}
                  r="60"
                  fill="rgba(225, 29, 72, 0.4)"
                  stroke="#e11d48"
                  strokeWidth="4"
                  className="animate-ping"
                />
                <Crosshair
                  x={capSt.x - 24}
                  y={capSt.y - 24}
                  className="w-12 h-12 text-rose-500 animate-pulse"
                />
              </g>
            );
          })()
        )}
      </svg>
    </div>
  );
};
