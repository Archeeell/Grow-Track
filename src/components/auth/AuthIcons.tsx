/**
 * Auth-specific Lucide SVG icons.
 * All paths extracted from Figma Make live bundle (index-Dl027h-2.js).
 * strokeWidth scales with size: strokeWidth={2 / scale} where scale = size/24.
 */
import Svg, { Circle, Line, Path } from 'react-native-svg';

// ─── Sprout (reused from SplashScreen pattern) ────────────────────────────────
export function SproutIcon({
  size,
  color,
  strokeWidth,
}: {
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  const scale = size / 24;
  const sw = strokeWidth ?? 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 21h14"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── ArrowLeft ────────────────────────────────────────────────────────────────
export function ArrowLeftIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 19-7-7 7-7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 12H5"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── ArrowRight ───────────────────────────────────────────────────────────────
export function ArrowRightIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m12 5 7 7-7 7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Eye ──────────────────────────────────────────────────────────────────────
export function EyeIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={sw} />
    </Svg>
  );
}

// ─── EyeOff ───────────────────────────────────────────────────────────────────
export function EyeOffIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m2 2 20 20"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── CircleAlert ──────────────────────────────────────────────────────────────
export function CircleAlertIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={sw} />
      <Line
        x1={12}
        y1={8}
        x2={12}
        y2={12}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Line
        x1={12}
        y1={16}
        x2={12.01}
        y2={16}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Google G (not Lucide — exact SVG from Make source) ──────────────────────
export function GoogleIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92c-.26 1.28-1.04 2.37-2.21 3.1v2.58h3.57c2.08-1.92 3.28-4.75 3.28-7.55Z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.58c-.98.66-2.24 1.06-3.71 1.06-2.87 0-5.3-1.94-6.17-4.55H2.14v2.65A11 11 0 0 0 12 23Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.83 14.26A6.61 6.61 0 0 1 5.48 12c0-.78.13-1.53.35-2.26V7.09H2.14A11 11 0 0 0 1 12c0 1.77.42 3.44 1.14 4.91l3.69-2.65Z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.19c1.62 0 3.07.56 4.21 1.66l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.86 6.09l3.69 2.65C6.7 7.13 9.13 5.19 12 5.19Z"
      />
    </Svg>
  );
}

// ─── Mail ─────────────────────────────────────────────────────────────────────
export function MailIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  const sw = 2 / scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 6-10 7L2 6"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
