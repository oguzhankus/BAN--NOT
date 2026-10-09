import * as webpush from 'web-push';
import type Database from 'better-sqlite3';

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string | null;
}

function getVapidDetails() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export function isValidPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password) return false;

    const host = url.hostname.toLowerCase();
    return host === 'fcm.googleapis.com'
      || host.endsWith('.fcm.googleapis.com')
      || host === 'push.services.mozilla.com'
      || host.endsWith('.push.services.mozilla.com')
      || host === 'web.push.apple.com'
      || host.endsWith('.notify.windows.com');
  } catch {
    return false;
  }
}

export async function sendPushNotification(
  db: Database.Database,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const vapidDetails = getVapidDetails();
  if (!vapidDetails) return;

  const subscriptions = db.prepare(`
    SELECT endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ?
  `).all(userId) as PushSubscriptionRow[];

  await Promise.all(subscriptions.map(async (subscription) => {
    if (!isValidPushEndpoint(subscription.endpoint)) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(subscription.endpoint);
      console.error('Removed invalid browser push endpoint');
      return;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
        { vapidDetails },
      );
    } catch (error) {
      const pushError = error as { statusCode?: number; message?: string };
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(subscription.endpoint);
        return;
      }
      console.error('Browser push delivery failed:', pushError.message || error);
    }
  }));
}
