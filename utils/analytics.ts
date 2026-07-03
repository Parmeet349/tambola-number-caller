import { logEvent as firebaseLogEvent, getAnalytics } from '@react-native-firebase/analytics';

/**
 * Log a custom event to Firebase Analytics
 * @param name Event name (e.g., 'game_start')
 * @param params Event parameters
 */
export async function logEvent(name: string, params: Record<string, any> = {}) {
    try {
        const analytics = getAnalytics();
        await firebaseLogEvent(analytics, name, params);
        console.log(`[Analytics] Logged event: ${name}`, params);
    } catch (error) {
        console.warn(`[Analytics] Failed to log event: ${name}`, error);
    }
}

/**
 * Log a screen view
 * @param screenName Name of the screen
 * @param screenClass Class of the screen (optional)
 */
export async function logScreenView(screenName: string, screenClass?: string) {
    try {
        const analytics = getAnalytics();
        await firebaseLogEvent(analytics, 'screen_view', {
            screen_name: screenName,
            screen_class: screenClass ?? screenName,
        });
        console.log(`[Analytics] Logged screen view: ${screenName}`);
    } catch (error) {
        console.warn(`[Analytics] Failed to log screen view: ${screenName}`, error);
    }
}
