/**
 * Settings-specific Lucide SVG icons.
 * All paths extracted from Figma Make live DOM (/settings route, figma.site preview).
 * strokeWidth scales: strokeWidth={2 / (size/24)}.
 */
import Svg, { Circle, Path } from 'react-native-svg';

function sw(size: number) {
  return 2 / (size / 24);
}

// ─── Moon ─────────────────────────────────────────────────────────────────────
export function MoonIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
        stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bell ─────────────────────────────────────────────────────────────────────
export function BellIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Clock3 ───────────────────────────────────────────────────────────────────
export function Clock3Icon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={sw(size)} />
      <Path d="M12 6v6h4" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Sun ──────────────────────────────────────────────────────────────────────
export function SunIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={sw(size)} />
      <Path d="M12 2v2" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="M12 20v2" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="m4.93 4.93 1.41 1.41" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="m17.66 17.66 1.41 1.41" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="M2 12h2" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="M20 12h2" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="m6.34 17.66-1.41 1.41" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="m19.07 4.93-1.41 1.41" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
    </Svg>
  );
}

// ─── RotateCcw ────────────────────────────────────────────────────────────────
export function RotateCcwIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Trash2 ───────────────────────────────────────────────────────────────────
export function Trash2Icon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 11v6" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 11v6" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── CircleHelp ───────────────────────────────────────────────────────────────
export function CircleHelpIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={sw(size)} />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 17h.01" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Info ─────────────────────────────────────────────────────────────────────
export function InfoIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={sw(size)} />
      <Path d="M12 16v-4" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="M12 8h.01" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
    </Svg>
  );
}

// ─── LogIn ────────────────────────────────────────────────────────────────────
export function LogInIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m10 17 5-5-5-5" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 12H3" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" />
      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Settings/Gear ────────────────────────────────────────────────────────────
export function SettingsGearIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
        stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw(size)} />
    </Svg>
  );
}

// ─── ChevronRight ─────────────────────────────────────────────────────────────
export function ChevronRightIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── X ────────────────────────────────────────────────────────────────────────
export function XIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m6 6 12 12" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Check ────────────────────────────────────────────────────────────────────
export function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── ShieldCheck ──────────────────────────────────────────────────────────────
export function ShieldCheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Leaf ─────────────────────────────────────────────────────────────────────
export function LeafIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13" stroke={color} strokeWidth={sw(size)} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
