import webpush from 'web-push';
import { storage } from './storage';

// Configure web push with VAPID keys from environment
webpush.setVapidDetails(
  process.env.VAPID_MAILTO || 'mailto:admin@mckgrid.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export type NotificationType =
  | 'badge_unlocked'
  | 'icon_awarded'
  | 'tier_movement'
  | 'new_race'
  | 'race_cancelled'
  | 'race_rescheduled'
  | 'race_results'
  | 'race_day_reminder'
  | 'checkin_reminder'
  | 'position_gained'
  | 'position_lost'
  | 'leader_changed';

interface NotifyOptions {
  profileIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// Save to DB + send push to all specified profiles
export async function notify(options: NotifyOptions): Promise<void> {
  const { profileIds, type, title, message, data } = options;
  if (!profileIds.length) return;

  // Save to DB
  await storage.createNotificationsForAll(profileIds, type, title, message, data);

  // Send push notifications
  try {
    const subscriptions = await storage.getPushSubscriptions(profileIds);
    const payload = JSON.stringify({ title, message, type, data });

    await Promise.allSettled(
      subscriptions.map(({ subscription }) =>
        webpush.sendNotification(subscription as any, payload).catch((err: any) => {
          // 410 Gone = subscription expired, ignore silently
          if (err.statusCode !== 410) console.error('Push error:', err.message);
        })
      )
    );
  } catch (err) {
    console.error('Failed to send push notifications:', err);
  }
}

// Convenience: notify a single profile
export async function notifyOne(
  profileId: number,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  await notify({ profileIds: [profileId], type, title, message, data });
}

// Convenience: notify all racers
export async function notifyAllRacers(
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  const profileIds = await storage.getAllRacerProfileIds();
  await notify({ profileIds, type, title, message, data });
}
