/**
 * Dashboard-specific Lucide SVG icons.
 * Extracted from Figma Make (FarmDashboard.tsx, live DOM).
 * Scaled with strokeWidth={2 / (size / 24)}.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

function sw(size: number) {
  return 2 / (size / 24);
}

export function ChevronDownIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m6 9 6 6 6-6"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarIcon({
  size,
  color,
  fill = 'none',
}: {
  size: number;
  color: string;
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={sw(size)} />
      <Path
        d="m21 21-4.3-4.3"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckCheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6 7 17l-5-5"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 10-7.5 7.5L13 16"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 5v14"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Repeat2Icon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m2 9 3-3 3 3"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 18H7a2 2 0 0 1-2-2V6"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m22 15-3 3-3-3"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 6h6a2 2 0 0 1 2 2v10"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ListIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LayoutGridIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={3}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={14}
        y={3}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={14}
        y={14}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={3}
        y={14}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={sw(size)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
