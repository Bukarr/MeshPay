export interface AppNotification {
  id: string;
  type: 'transaction_success' | 'transaction_failed' | 'offline_queue' | 'sync_complete' | 'security_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  txId?: string;
  amountDisplay?: string;
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  highValueApproval: boolean;
  highValueThresholdUsd: number;
  rateChangeAlerts: boolean;
}

const NOTIFICATIONS_KEY = 'meshpay_notifications';
const PREFERENCES_KEY = 'meshpay_notification_preferences';

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailAlerts: true,
  pushNotifications: true,
  smsAlerts: false,
  highValueApproval: true,
  highValueThresholdUsd: 100,
  rateChangeAlerts: true
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export function getStoredNotifications(): AppNotification[] {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse notifications', e);
  }
  saveNotifications(INITIAL_NOTIFICATIONS);
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifications: AppNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event('meshpay_notifications_updated'));
}

export function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): AppNotification {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: 'notif_' + Date.now(),
    timestamp: new Date().toISOString(),
    read: false
  };
  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

export function clearAllNotifications(): void {
  saveNotifications([]);
}

export function getStoredNotificationPreferences(): NotificationPreferences {
  try {
    const data = localStorage.getItem(PREFERENCES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse notification preferences', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event('meshpay_notification_prefs_updated'));
}
