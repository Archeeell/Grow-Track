export type HarvestStatus = "growing" | "ready" | "overdue" | "harvested";

export type Seed = {
  id: string;
  name: string;
  /** Minutes until first harvest. */
  growTimeMinutes: number;
  /** Minutes until the next harvest after a reset. Null = one-time / replant using grow time. */
  reharvestIntervalMinutes: number | null;
  builtIn: boolean;
};

export type Farm = {
  id: string;
  name: string;
  seedId: string | null;
  seedName: string;
  plantedAt: string;
  readyAt: string;
  manualOverride: boolean;
  notificationsEnabled: boolean;
  lastNotifiedReadyAt: string | null;
  createdAt: string;
  /** Set when the user taps "Harvested" — clears when replanted. */
  harvestedAt: string | null;
};

export type AppData = {
  seeds: Seed[];
  farms: Farm[];
};

export type Route =
  | { name: "dashboard" }
  | { name: "farm-form"; farmId?: string }
  | { name: "seeds" }
  | { name: "seed-form"; seedId?: string };
