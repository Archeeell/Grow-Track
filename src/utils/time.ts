import type { Farm, HarvestStatus, Seed } from '../types';

const READY_WINDOW_MS = 60 * 60 * 1000;

export function nowMs(clock = Date.now): number {
  return clock();
}

/** Growtopia wiki formula: rarity^3 + 30 * rarity seconds, rounded to minutes. */
export function rarityGrowMinutes(rarity: number): number {
  const seconds = rarity ** 3 + 30 * rarity;
  return Math.max(1, Math.round(seconds / 60));
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const totalMinutes = Math.floor(abs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((abs % 60_000) / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (days === 0) {
    parts.push(`${minutes}m`);
    if (hours === 0 && minutes < 5) parts.push(`${seconds}s`);
  }
  return parts.join(' ');
}

export function formatCountdown(readyAt: string, now = Date.now()): string {
  const diff = new Date(readyAt).getTime() - now;
  if (diff > 0) return `${formatDuration(diff)} left`;
  if (diff > -60_000) return 'Ready now';
  return `${formatDuration(diff)} overdue`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatus(readyAt: string, now = Date.now()): HarvestStatus {
  const ready = new Date(readyAt).getTime();
  if (now < ready) return 'growing';
  if (now < ready + READY_WINDOW_MS) return 'ready';
  return 'overdue';
}

export function cycleMinutes(seed: Seed | undefined, farm: Farm): number {
  if (seed) {
    return seed.reharvestIntervalMinutes ?? seed.growTimeMinutes;
  }
  const planted = new Date(farm.plantedAt).getTime();
  const ready = new Date(farm.readyAt).getTime();
  const mins = Math.round((ready - planted) / 60_000);
  return Math.max(1, mins);
}

export function parseDateTimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseNonNegInt(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function formatGrowTime(minutes: number): string {
  return formatDuration(minutes * 60_000);
}

/** Decompose total minutes into { days, hours, minutes } components. */
export function minutesToDHM(total: number): { days: number; hours: number; minutes: number } {
  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total % (60 * 24)) / 60);
  const minutes = total % 60;
  return { days, hours, minutes };
}
