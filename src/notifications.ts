import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Farm } from './types';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Web/unsupported environments can skip the native handler.
}

let permissionAsked = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (permissionAsked && !current.canAskAgain) return false;
    permissionAsked = true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('farm-ready', {
    name: 'Farm harvest ready',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3DDC84',
  });
}

function farmId(farm: Farm): string {
  return `farm-${farm.id}`;
}

export async function cancelFarmNotification(farm: Farm): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(farmId(farm));
  } catch {
    // Identifier may not exist.
  }
}

export async function syncFarmNotification(farm: Farm): Promise<void> {
  await cancelFarmNotification(farm);
  if (!farm.notificationsEnabled) return;

  const ready = new Date(farm.readyAt).getTime();
  if (ready <= Date.now()) return;
  if (farm.lastNotifiedReadyAt === farm.readyAt) return;

  const allowed = await ensureNotificationPermission();
  if (!allowed) return;

  if (Platform.OS === 'web') {
    scheduleWebNotification(farm, ready);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: farmId(farm),
      content: {
        title: 'Farm ready to harvest',
        body: `${farm.name} (${farm.seedName}) is ready.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(farm.readyAt),
        channelId: 'farm-ready',
      },
    });
  } catch {
    scheduleWebNotification(farm, ready);
  }
}

const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleWebNotification(farm: Farm, readyMs: number): void {
  const existing = webTimers.get(farm.id);
  if (existing) clearTimeout(existing);
  const delay = Math.max(0, readyMs - Date.now());
  const timer = setTimeout(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    new Notification('Farm ready to harvest', {
      body: `${farm.name} (${farm.seedName}) is ready.`,
    });
  }, Math.min(delay, 2_147_000_000));
  webTimers.set(farm.id, timer);
}

export async function fireDueNotification(farm: Farm): Promise<boolean> {
  if (!farm.notificationsEnabled) return false;
  if (new Date(farm.readyAt).getTime() > Date.now()) return false;
  if (farm.lastNotifiedReadyAt === farm.readyAt) return false;

  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;

  if (Platform.OS === 'web') {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Farm ready to harvest', {
        body: `${farm.name} (${farm.seedName}) is ready.`,
      });
    }
  } else {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Farm ready to harvest',
        body: `${farm.name} (${farm.seedName}) is ready.`,
        sound: true,
      },
      trigger: null,
    });
  }
  return true;
}

export async function syncAllNotifications(farms: Farm[]): Promise<void> {
  await setupNotificationChannel();
  await Promise.all(farms.map((farm) => syncFarmNotification(farm)));
}
