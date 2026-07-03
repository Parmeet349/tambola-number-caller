import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
  return false;
}

export interface ReminderConfig {
  enabled: boolean;
  type: 'weekly' | 'once';
  weekday: number; // 1 = Sunday, 7 = Saturday
  hour: number; // 0-23
  minute: number; // 0-59
  onceDate?: string; // YYYY-MM-DD
}

export async function scheduleGameNightReminder(config: ReminderConfig) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!config.enabled) return false;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  let trigger: any;

  if (config.type === 'weekly') {
    trigger = {
      weekday: config.weekday,
      hour: config.hour,
      minute: config.minute,
      repeats: true,
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    };
  } else if (config.onceDate) {
    // One-time reminder
    // Parse target date and time in local timezone
    const [year, month, day] = config.onceDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, config.hour, config.minute, 0);

    // If the target date/time has already passed, we cannot schedule it
    if (dateObj.getTime() <= Date.now()) {
      return false;
    }

    trigger = dateObj;
  } else {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎲 Tambola Game Night!",
      body: "Gather the family! It's time for your Tambola game. Grab your tickets and let's play!",
      sound: true,
    },
    trigger,
  });

  return true;
}
