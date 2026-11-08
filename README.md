# FUYARDESQUE — Urban Pursuit & Hidden Movement Strategy

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-128%20Passed-emerald.svg)]()

> **FUYARDESQUE** is a real-time, browser-based multiplayer hidden-movement pursuit game. One player takes the role of the elusive **Fugitive**, surviving for 8 minutes and 30 seconds across the fictional metropolis of **Neo-Lutèce**. The remaining players become the **Pursuers**, collaborating to track, predict, and capture the Fugitive using three distinct transportation networks.

---

## 🎮 Key Features

- **Authoritative Server Architecture**: All game state, collision captures, movement legality, timers, and revelations are validated on the backend.
- **Zero-Information Leakage**: The server generates role-filtered state views. Pursuer browser sessions and AI bots receive `null` for the Fugitive's location outside authorized radar sweeps, milestone reveals, or game end.
- **Interactive SVG City Map**: 50 interconnected stations across 6 districts with real-time zooming, panning, station highlighting, and connection glows.
- **3 Transportation Networks**:
  - 🚖 **Taxi (Yellow)**: Dense local transit between neighboring neighborhood stations.
  - 🚌 **Bus (Blue)**: Arterial routes connecting adjacent districts.
  - 🚇 **Metro Express (Green)**: Rapid transit linking major hubs across long distances.
- **Sequential Turns**: Each player chooses a unique starting station during a 30-second setup. The Fugitive moves first, then detectives plan together based on the latest movement intel, with 30 seconds for each side's turn.
- **Configurable Match Rules**: Hosts can select solo, humans-only multiplayer, or mixed rosters and choose supported survival, extension, and radar durations.
- **Location Revelations**: Every third actual Fugitive move permanently reveals that destination in the Mission Log. The timed radar sweep remains active as a separate feature (default: every 90 seconds for 5 seconds).
- **Survival Clock & 5-Minute Extension**:
  - Initial survival clock: **8 minutes 30 seconds**.
  - Upon clock expiration, the Fugitive chooses between **Claiming Victory** or granting the Pursuers an optional **5-minute extension**.
- **AI Opponents with 3 Difficulty Levels**:
  - Easy, Normal, and Hard.
  - **Zero-Cheating Guarantee**: AI Pursuers operate exclusively on the same filtered information available to human pursuers.
- **Team-Isolated Comms**: Real-time text chat is routed only to players on the same team.
- **Solo, Private Multiplayer & Mixed Modes**: Play solo vs AI bots or create private lobbies with 6-character room codes.

---

## 📂 Project Architecture

```
Fuyardesque/
├── package.json             # Root monorepo workspace configuration
├── packages/
│   ├── shared/              # Shared types, map graph (50 stations), constants & algorithms
│   │   ├── src/
│   │   │   ├── types.ts     # Station, Connection, Player, Role, ClientGameState
│   │   │   ├── constants.ts # Timers, color palettes, socket event keys
│   │   │   └── mapData.ts   # 50 Neo-Lutèce stations, 362 directed routes, BFS pathfinding
│   ├── server/              # Node.js + Express + Socket.IO game server
│   │   ├── src/
│   │   │   ├── game/        # GameEngine (phases, timers, captures, role serialization)
│   │   │   ├── rooms/       # Room & RoomManager (lobby, host controls, isolated chat)
│   │   │   ├── ai/          # BotAgent (Easy, Normal, Hard pursuit/evasion algorithms)
│   │   │   └── server.ts    # Express & HTTP WebSocket server
│   │   └── tests/           # Unit & end-to-end WebSocket integration tests
│   └── client/              # React 18 + Vite + Tailwind CSS tactical web client
│       ├── src/
│       │   ├── components/  # SVG map, TopNav HUD, Roster, Team Chat, Move Bar, Modals
│       │   ├── hooks/       # useGameSocket client socket controller
│       │   └── services/    # Web Audio API procedural sound synthesizer
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ (tested on Node.js v20 & v26 LTS)
- **npm** v9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Game
Run both the backend server and frontend client concurrently:
```bash
npm run dev
```

Or run them individually in separate terminals:
- **Backend Server (port 4000)**:
  ```bash
  npm run dev:server
  ```
- **Frontend Client (port 3000)**:
  ```bash
  npm run dev:client
  ```

Open your browser at **`http://localhost:3000`** to play!

---

## 🧪 Running Automated Tests

Run the complete test suite (unit tests + live WebSocket integration tests):

```bash
npm run test:all
```

### Test Coverage Highlights:
- ✅ Map connectivity (50 stations, 362 connections, fully reachable graph).
- ✅ Valid and illegal movement validation.
- ✅ Server-authoritative Fugitive-first turn order followed by team-based detective turns.
- ✅ Zero-leakage role-based state security filter.
- ✅ Capture detection when the Fugitive and a detective occupy the same station.
- ✅ 8:30 timer and optional 5-minute extension rules.
- ✅ AFK/disconnected Fugitive decision timeout (match never stalls).
- ✅ AI Fugitive answers the survival decision automatically.
- ✅ Zero-cheating AI bot pathfinding and evasion logic.
- ✅ Live multi-client WebSocket room creation, joining, and team chat isolation.
- ✅ Stable-token reconnection that restores a player's live match state.
- ✅ Lobby mutation phase guards and safe mid-match restart rejection.
- ✅ Host migration when the host disconnects during a match.
- ✅ Accurate Fugitive movement history (origin and destination per round).
- ✅ Intel reports that distinguish real movement from a stationary round.
- ✅ Team chat cleared between matches to prevent cross-match leakage.
- ✅ Every third actual Fugitive move permanently reveals its destination to all players.
- ✅ Unique player-selected starting stations with a 30-second setup timer.
- ✅ 30-second decision windows for the Fugitive and detective team.
- ✅ Lobby ready status broadcast, and locked-map selection after a move is locked.
- ✅ Match mode restrictions, supported timer/radar values, and room-switch channel isolation.

---

## 🌐 Production Deployment

The project is structured so frontend and backend can be hosted together or deployed independently.

### Option A: Unified Full-Stack Deployment (Render / Railway / Fly.io / VPS)
The Express backend is configured to automatically serve the built static client from `packages/client/dist`:

1. Build all packages:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   NODE_ENV=production npm run start
   ```
   The game will be served on port `4000` (or the port defined by `process.env.PORT`).

### Option B: Separate Frontend & Backend
- **Frontend** (Vercel, Netlify, Cloudflare Pages):
  - Use the repository root so the shared workspace package is available.
  - Build command: `npm run build -w packages/shared && npm run build -w packages/client`
  - Output directory: `packages/client/dist`
  - Environment variable: `VITE_SERVER_URL=https://your-backend.railway.app`
- **Backend** (Railway, Render, Fly.io):
  - Use the repository root so the shared workspace package is available.
  - Build command: `npm run build -w packages/shared && npm run build -w packages/server`
  - Start command: `npm run start -w packages/server`
  - Environment variables:
    ```env
    PORT=4000
    CLIENT_URL=https://your-frontend.vercel.app
    NODE_ENV=production
    ```
  - `CLIENT_URL` accepts a comma-separated list of allowed frontend origins when more than one is needed.

---

## 📜 Game Rules Summary

1. **Objective**:
   - **The Fugitive**: Evade capture for 8m 30s.
   - **The Pursuers**: Coordinate and reach the Fugitive's station.
2. **Setup and Turns**:
   - Every player chooses a different starting station during a 30-second setup phase.
   - The Fugitive chooses and locks a move first, with 30 seconds to decide.
   - The detective team then chooses moves together within its own 30-second turn, using the Fugitive's movement intel.
   - Each turn resolves when the acting player/team locks in or the timer expires. Players who do not lock a move stay in place.
3. **Information**:
   - Pursuers see each other at all times.
   - Fugitive's location is hidden from pursuers.
   - The destination of every third Fugitive move is permanently revealed in the Mission Log.
   - Every 90 seconds, a 5-second radar sweep illuminates the Fugitive.
   - Pursuers see the transportation method used in the Mission Log.
4. **Endgame**:
   - If captured -> Pursuers win.
   - At 8m 30s -> Fugitive can claim victory or challenge pursuers to a 5-minute extension!
