import React from 'react';
import { TransportType, TRANSPORT_CONFIG } from '@fuyardesque/shared';

/**
 * Renders an authentic, richly illustrated urban city background
 * inspired directly by the Scotland Yard board game:
 * - Curving Blue River with bridges and water ripples
 * - Sprawling green parks with walking paths, ponds, and trees
 * - Urban city blocks, streets, and roofscapes
 * - Illustrated iconic landmarks (Cathedral, Ferris Wheel, Clocktower, Skybridge, Lighthouse, etc.)
 */
export const MapIllustration: React.FC = () => {
  return (
    <g id="map-illustration-layer" pointerEvents="none">
      {/* 1. Base City Ground (Warm urban parchment texture) */}
      <rect x="-400" y="-400" width="2000" height="1650" fill="#e8e2d4" />

      {/* Urban Street Grid Pattern & City Blocks */}
      <defs>
        {/* Repeating urban block texture */}
        <pattern id="urbanBlocks" width="70" height="70" patternUnits="userSpaceOnUse">
          <rect width="70" height="70" fill="#ded7c5" />
          {/* Blocks of buildings */}
          <rect x="6" y="6" width="26" height="26" rx="2" fill="#cbbfab" stroke="#b5a790" strokeWidth="1" />
          <rect x="38" y="6" width="26" height="12" rx="2" fill="#d4c8b6" stroke="#b5a790" strokeWidth="1" />
          <rect x="38" y="22" width="26" height="10" rx="2" fill="#c4b69f" stroke="#b5a790" strokeWidth="1" />
          <rect x="6" y="38" width="16" height="26" rx="2" fill="#c8bcab" stroke="#b5a790" strokeWidth="1" />
          <rect x="26" y="38" width="38" height="12" rx="2" fill="#d9cebc" stroke="#b5a790" strokeWidth="1" />
          <rect x="26" y="54" width="38" height="10" rx="2" fill="#bfb29c" stroke="#b5a790" strokeWidth="1" />
          {/* Roof details */}
          <line x1="6" y1="19" x2="32" y2="19" stroke="#9e8f77" strokeWidth="0.8" />
          <line x1="26" y1="44" x2="64" y2="44" stroke="#9e8f77" strokeWidth="0.8" />
        </pattern>

        {/* Industrial railyard pattern */}
        <pattern id="railyardPattern" width="30" height="15" patternUnits="userSpaceOnUse">
          <rect width="30" height="15" fill="#cfc7b4" />
          <line x1="0" y1="5" x2="30" y2="5" stroke="#71717a" strokeWidth="1.5" />
          <line x1="0" y1="10" x2="30" y2="10" stroke="#71717a" strokeWidth="1.5" />
          <line x1="5" y1="2" x2="5" y2="13" stroke="#a1a1aa" strokeWidth="1" />
          <line x1="15" y1="2" x2="15" y2="13" stroke="#a1a1aa" strokeWidth="1" />
          <line x1="25" y1="2" x2="25" y2="13" stroke="#a1a1aa" strokeWidth="1" />
        </pattern>

        {/* Trees & Park foliage pattern */}
        <pattern id="parkGrass" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#7ba36a" />
          <circle cx="10" cy="10" r="6" fill="#668e55" opacity="0.6" />
          <circle cx="28" cy="18" r="8" fill="#587c48" opacity="0.6" />
          <circle cx="16" cy="32" r="7" fill="#6c945b" opacity="0.6" />
        </pattern>
      </defs>

      {/* Urban Blocks Background Fill */}
      <rect x="-300" y="-300" width="1800" height="1450" fill="url(#urbanBlocks)" />

      {/* ============================================================ */}
      {/* 2. MAJOR PARKS & GREEN BELTS (North Parklands & West Hills) */}
      {/* ============================================================ */}

      {/* North Parklands (Botanical Gardens & Grand Lake) */}
      <path
        d="M 280,100 C 340,40 580,30 680,80 C 720,130 670,260 580,280 C 480,300 350,280 300,240 C 250,200 240,140 280,100 Z"
        fill="url(#parkGrass)"
        stroke="#4f6e3f"
        strokeWidth="3"
      />

      {/* Grand Lake Water body in Parklands */}
      <path
        d="M 450,220 C 480,200 550,210 570,230 C 580,255 540,270 490,265 C 440,260 420,240 450,220 Z"
        fill="#5ba8d9"
        stroke="#3979a3"
        strokeWidth="2.5"
      />
      {/* Pond ripples */}
      <path d="M 470,235 C 500,230 530,235 545,240" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      <path d="M 480,250 C 505,246 525,250 540,253" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

      {/* West Residential Greenery (Pine Hill & Valley Green) */}
      <path
        d="M 160,200 C 220,170 300,190 320,240 C 330,300 280,360 220,350 C 160,340 120,260 160,200 Z"
        fill="url(#parkGrass)"
        stroke="#4f6e3f"
        strokeWidth="2"
      />
      <path
        d="M 240,460 C 290,440 350,470 360,510 C 350,560 280,580 230,560 C 180,540 190,480 240,460 Z"
        fill="url(#parkGrass)"
        stroke="#4f6e3f"
        strokeWidth="2"
      />

      {/* Industrial Railyard zone */}
      <path
        d="M 390,600 L 590,590 L 610,750 L 370,760 Z"
        fill="url(#railyardPattern)"
        stroke="#52525b"
        strokeWidth="2"
      />

      {/* ============================================================ */}
      {/* 3. RIVER LUTÈCE (Curving River with Realistic Banks & Waves) */}
      {/* ============================================================ */}
      {/* River Bank Outer Shadow */}
      <path
        d="M 740,-50 C 720,150 780,260 760,360 C 730,470 820,550 880,630 C 940,710 1080,740 1250,770
           L 1250,830 C 1050,810 900,770 820,680 C 750,590 670,490 690,360 C 710,250 660,150 670,-50 Z"
        fill="#94a3b8"
        opacity="0.5"
      />

      {/* Main Blue Water Body */}
      <path
        d="M 735,-50 C 715,150 775,260 755,360 C 725,470 815,550 875,630 C 935,710 1075,740 1250,765
           L 1250,820 C 1055,800 905,760 825,670 C 755,580 675,480 695,360 C 715,250 665,150 675,-50 Z"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="3.5"
      />

      {/* Inner lighter water highlight stream */}
      <path
        d="M 705,-50 C 690,150 740,260 725,360 C 700,470 780,550 850,640 C 920,720 1050,760 1250,785"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="18"
        opacity="0.75"
        strokeLinecap="round"
      />
      <path
        d="M 715,-50 C 700,150 750,260 735,360 C 710,470 790,550 860,640 C 930,720 1060,760 1250,790"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="6"
        opacity="0.8"
      />

      {/* Water ripple details */}
      <g stroke="#ffffff" strokeWidth="1.2" opacity="0.6" fill="none">
        <path d="M 700,120 C 715,115 730,120 745,118" />
        <path d="M 720,240 C 735,235 755,240 765,238" />
        <path d="M 710,380 C 725,376 740,380 755,378" />
        <path d="M 780,530 C 800,525 820,530 840,528" />
        <path d="M 870,660 C 890,655 915,660 935,658" />
        <path d="M 1020,750 C 1045,745 1070,750 1095,748" />
      </g>

      {/* ============================================================ */}
      {/* 4. HISTORIC BRIDGES CROSSING THE RIVER */}
      {/* ============================================================ */}
      {/* Bridge 1: North River Bridge (near st-03 / st-11) */}
      <g id="bridge-north">
        <rect x="710" y="275" width="55" height="18" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" transform="rotate(25, 737, 284)" />
        <line x1="714" y1="284" x2="760" y2="284" stroke="#ffffff" strokeWidth="2" strokeDasharray="3,3" transform="rotate(25, 737, 284)" />
      </g>

      {/* Bridge 2: Central Grand Bridge (near st-05 / st-09 / st-18) */}
      <g id="bridge-central">
        <rect x="705" y="440" width="60" height="20" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" transform="rotate(35, 735, 450)" />
        <line x1="710" y1="450" x2="760" y2="450" stroke="#facc15" strokeWidth="3" transform="rotate(35, 735, 450)" />
      </g>

      {/* Bridge 3: Old Port Iron Bridge (near st-21 / st-36) */}
      <g id="bridge-south">
        <rect x="780" y="620" width="65" height="18" rx="3" fill="#475569" stroke="#1e293b" strokeWidth="2" transform="rotate(-30, 812, 629)" />
        <line x1="785" y1="629" x2="840" y2="629" stroke="#ffffff" strokeWidth="2" strokeDasharray="4,3" transform="rotate(-30, 812, 629)" />
      </g>

      {/* ============================================================ */}
      {/* 5. ICONIC CITY LANDMARKS (Isometric Board-Game Illustrations) */}
      {/* ============================================================ */}

      {/* A. Cathedral of Saint-Lutèce (Near st-06, x: 580, y: 490) */}
      <g transform="translate(560, 445)" id="landmark-cathedral">
        {/* Shadow */}
        <ellipse cx="25" cy="40" rx="30" ry="10" fill="#000000" opacity="0.18" />
        {/* Main Nave */}
        <polygon points="10,38 40,38 35,18 15,18" fill="#e2d9c8" stroke="#786c55" strokeWidth="1.5" />
        {/* Left Spire */}
        <polygon points="5,38 15,38 10,2" fill="#d1c4ae" stroke="#786c55" strokeWidth="1.5" />
        <line x1="10" y1="2" x2="10" y2="-4" stroke="#786c55" strokeWidth="2" />
        {/* Right Spire */}
        <polygon points="35,38 45,38 40,2" fill="#d1c4ae" stroke="#786c55" strokeWidth="1.5" />
        <line x1="40" y1="2" x2="40" y2="-4" stroke="#786c55" strokeWidth="2" />
        {/* Rose Window */}
        <circle cx="25" cy="26" r="5" fill="#38bdf8" stroke="#786c55" strokeWidth="1" />
      </g>

      {/* B. The Riverfront Observation Ferris Wheel (Near st-09, x: 780, y: 375) */}
      <g transform="translate(775, 365)" id="landmark-ferris-wheel">
        {/* Base legs */}
        <line x1="10" y1="42" x2="25" y2="20" stroke="#475569" strokeWidth="3" />
        <line x1="40" y1="42" x2="25" y2="20" stroke="#475569" strokeWidth="3" />
        {/* Wheel Rings */}
        <circle cx="25" cy="20" r="22" fill="none" stroke="#64748b" strokeWidth="2.5" />
        <circle cx="25" cy="20" r="16" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
        {/* Spokes */}
        <line x1="25" y1="-2" x2="25" y2="42" stroke="#64748b" strokeWidth="1" />
        <line x1="3" y1="20" x2="47" y2="20" stroke="#64748b" strokeWidth="1" />
        <line x1="9" y1="4" x2="41" y2="36" stroke="#64748b" strokeWidth="1" />
        <line x1="9" y1="36" x2="41" y2="4" stroke="#64748b" strokeWidth="1" />
        {/* Center hub */}
        <circle cx="25" cy="20" r="3" fill="#0284c7" />
      </g>

      {/* C. The Clocktower Gate (Big Ben inspired, Near st-08, x: 440, y: 350) */}
      <g transform="translate(425, 340)" id="landmark-clocktower">
        <ellipse cx="15" cy="45" rx="18" ry="6" fill="#000000" opacity="0.18" />
        {/* Tower shaft */}
        <rect x="7" y="10" width="16" height="35" fill="#d9cfbe" stroke="#786c55" strokeWidth="1.5" />
        {/* Clock chamber */}
        <rect x="5" y="0" width="20" height="12" fill="#ede5d5" stroke="#786c55" strokeWidth="1.5" />
        <circle cx="15" cy="6" r="3.5" fill="#ffffff" stroke="#786c55" strokeWidth="1" />
        <line x1="15" y1="6" x2="16.5" y2="4.5" stroke="#1e293b" strokeWidth="1" />
        {/* Roof Steeple */}
        <polygon points="5,0 25,0 15,-14" fill="#2d5a27" stroke="#786c55" strokeWidth="1.5" />
        <line x1="15" y1="-14" x2="15" y2="-18" stroke="#786c55" strokeWidth="1.5" />
      </g>

      {/* D. Financial Cyber Tower (Skyscraper cluster, Near st-10, x: 885, y: 220) */}
      <g transform="translate(865, 210)" id="landmark-cyber-tower">
        <ellipse cx="25" cy="55" rx="25" ry="8" fill="#000000" opacity="0.18" />
        {/* Tower 1 */}
        <rect x="5" y="15" width="16" height="40" fill="#93c5fd" stroke="#1e40af" strokeWidth="1.5" />
        <line x1="5" y1="25" x2="21" y2="25" stroke="#1e40af" strokeWidth="1" />
        <line x1="5" y1="35" x2="21" y2="35" stroke="#1e40af" strokeWidth="1" />
        <line x1="5" y1="45" x2="21" y2="45" stroke="#1e40af" strokeWidth="1" />
        {/* Tower 2 (Taller, Pinnacle) */}
        <polygon points="23,55 42,55 38,-15 27,-15" fill="#bfdbfe" stroke="#1e40af" strokeWidth="1.5" />
        <line x1="32.5" y1="-15" x2="32.5" y2="-28" stroke="#ef4444" strokeWidth="2" />
        <circle cx="32.5" cy="-28" r="2" fill="#ef4444" />
      </g>

      {/* E. Old Port Lighthouse (Near st-23, x: 1045, y: 560) */}
      <g transform="translate(1035, 550)" id="landmark-lighthouse">
        <ellipse cx="15" cy="45" rx="16" ry="6" fill="#000000" opacity="0.2" />
        {/* Base */}
        <polygon points="5,45 25,45 21,10 9,10" fill="#f1f5f9" stroke="#334155" strokeWidth="1.5" />
        {/* Red stripes */}
        <polygon points="8.2,35 21.8,35 20.8,25 9.2,25" fill="#ef4444" />
        <polygon points="9.5,18 20.5,18 20.2,12 9.8,12" fill="#ef4444" />
        {/* Lamp room */}
        <rect x="9" y="4" width="12" height="7" fill="#fef08a" stroke="#334155" strokeWidth="1" />
        {/* Dome cap */}
        <path d="M 8,4 C 8,-2 22,-2 22,4 Z" fill="#334155" />
      </g>

      {/* F. City Hall & Columns (Near st-03, x: 670, y: 315) */}
      <g transform="translate(650, 310)" id="landmark-city-hall">
        <ellipse cx="25" cy="35" rx="25" ry="7" fill="#000000" opacity="0.18" />
        <rect x="5" y="15" width="40" height="20" fill="#e2d9c8" stroke="#786c55" strokeWidth="1.5" />
        {/* Pediment triangle */}
        <polygon points="2,15 48,15 25,0" fill="#c4b69f" stroke="#786c55" strokeWidth="1.5" />
        {/* Classical Columns */}
        <line x1="12" y1="15" x2="12" y2="35" stroke="#786c55" strokeWidth="2" />
        <line x1="20" y1="15" x2="20" y2="35" stroke="#786c55" strokeWidth="2" />
        <line x1="30" y1="15" x2="30" y2="35" stroke="#786c55" strokeWidth="2" />
        <line x1="38" y1="15" x2="38" y2="35" stroke="#786c55" strokeWidth="2" />
      </g>

      {/* G. University Astronomical Observatory (Near st-33, x: 450, y: 40) */}
      <g transform="translate(435, 30)" id="landmark-observatory">
        <ellipse cx="15" cy="35" rx="18" ry="6" fill="#000000" opacity="0.18" />
        <rect x="5" y="15" width="20" height="20" fill="#ded7c5" stroke="#786c55" strokeWidth="1.5" />
        {/* Copper Dome */}
        <path d="M 3,15 C 3,0 27,0 27,15 Z" fill="#65a30d" stroke="#365314" strokeWidth="1.5" />
        {/* Telescope slit */}
        <line x1="12" y1="4" x2="22" y2="10" stroke="#1e293b" strokeWidth="2" />
      </g>
    </g>
  );
};

/**
 * Helper to render the authentic Scotland Yard segmented multi-colored station disc:
 * If station has Taxi only -> Solid Yellow rim
 * If station has Taxi + Bus -> Half Yellow, Half Blue rim
 * If station has Taxi + Bus + Metro -> 1/3 Yellow, 1/3 Blue, 1/3 Green rim!
 */
interface StationDiscProps {
  cx: number;
  cy: number;
  radius: number;
  stationNumber: string;
  transports: TransportType[];
  isMyStation: boolean;
  isSelected: boolean;
  isDirectNeighbor: boolean;
  isHovered: boolean;
}

export const StationDisc: React.FC<StationDiscProps> = ({
  cx,
  cy,
  radius,
  stationNumber,
  transports,
  isMyStation,
  isSelected,
  isDirectNeighbor,
  isHovered,
}) => {
  // Compute colored arc segments based on available transports
  const r = isSelected || isMyStation ? radius + 2 : isDirectNeighbor || isHovered ? radius + 1 : radius;
  const strokeW = 4.5;
  const count = Math.max(1, transports.length);

  // Circumference
  const circ = 2 * Math.PI * r;
  const segLen = circ / count;

  return (
    <g className="transition-transform duration-150">
      {/* Outer Glow / Halo for Board Game Station Disc */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 3}
        fill="#000000"
        opacity="0.3"
      />

      {/* White Base Ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#fdfbf7"
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Segmented Color Rims (Yellow for Taxi, Blue for Bus, Green for Metro) */}
      {transports.map((t, idx) => {
        const conf = TRANSPORT_CONFIG[t];
        const strokeDasharray = `${segLen - 2} ${circ - (segLen - 2)}`;
        const strokeDashoffset = -(idx * segLen);

        return (
          <circle
            key={t}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={conf.borderColor}
            strokeWidth={strokeW}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
          />
        );
      })}

      {/* Station Center Number Disc */}
      <circle
        cx={cx}
        cy={cy}
        r={r - strokeW / 2 - 1}
        fill={
          isSelected
            ? '#10b981'
            : isMyStation
            ? '#0284c7'
            : '#ffffff'
        }
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Station Number Text */}
      <text
        x={cx}
        y={cy + 4.5}
        textAnchor="middle"
        fill={isSelected || isMyStation ? '#ffffff' : '#0f172a'}
        fontSize={stationNumber.length > 2 ? 10 : 12}
        fontWeight="900"
        fontFamily="sans-serif"
        pointerEvents="none"
      >
        {stationNumber}
      </text>
    </g>
  );
};
