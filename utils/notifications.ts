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

export async function scheduleGameNightReminder(enabled: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return false;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎲 Tambola Game Night!",
      body: "Gather the family! It's time for your weekly Tambola game. Grab your tickets and let's play!",
      sound: true,
    },
    trigger: {
      weekday: 7, // Saturday
      hour: 19,
      minute: 0,
      repeats: true,
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    } as any,
  });

  return true;
}
