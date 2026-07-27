import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

import { db } from '../../firebaseConfig';

export type PushNotificationData = {
  chatId?: string;
  senderId?: string;
  friendId?: string;
  messageId?: string;
  [key: string]: string | undefined;
};

/**
 * Fiziksel cihazda Expo push token alir (Spark / istemci push icin).
 * EAS'te FCM V1 yuklu olmali; aksi halde token alinsa bile Android'e dusmez.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mesajlar',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4a89d2ff',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (!Device.isDevice) {
      console.warn('Push: fiziksel cihaz gerekli');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Push: izin yok →', finalStatus);
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push: EAS projectId eksik (app.json extra.eas.projectId)');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!tokenData?.data) {
      console.warn('Push: bos token dondu');
      return null;
    }
    console.log('Push: token OK', tokenData.data.slice(0, 32) + '…');
    return tokenData.data;
  } catch (error) {
    console.warn('Push: token hatasi', error);
    return null;
  }
}

export async function resolveRecipientPushToken(recipientId: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'users', recipientId));
    if (!snap.exists()) return null;
    const token = (snap.data() as { pushToken?: string }).pushToken?.trim();
    return token || null;
  } catch (error) {
    console.error('resolveRecipientPushToken error:', error);
    return null;
  }
}

async function clearInvalidPushToken(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { pushToken: deleteField() });
    console.warn('Push: DeviceNotRegistered — token silindi', uid);
  } catch (e) {
    console.warn('Push: token silinemedi', e);
  }
}

export async function sendPushNotification(params: {
  to: string;
  title: string;
  body: string;
  data?: PushNotificationData;
  /** DeviceNotRegistered olursa temizlenecek uid */
  recipientId?: string;
}): Promise<boolean> {
  const { to, title, body, data, recipientId } = params;
  if (!to) return false;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        sound: 'default',
        title,
        body,
        data: data ?? {},
        channelId: 'default',
        priority: 'high',
        ttl: 86400,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('Push HTTP hata:', response.status, result);
      return false;
    }

    const tickets = Array.isArray(result?.data)
      ? result.data
      : result?.data
        ? [result.data]
        : [];

    let ok = true;
    for (const ticket of tickets) {
      if (ticket?.status === 'error') {
        ok = false;
        console.error('Expo ticket error:', ticket.message, ticket.details);
        if (ticket.details?.error === 'DeviceNotRegistered' && recipientId) {
          await clearInvalidPushToken(recipientId);
        }
      } else {
        console.log('Push: ticket OK', ticket?.id ?? ticket?.status);
      }
    }
    return ok;
  } catch (error) {
    console.error('Push network error:', error);
    return false;
  }
}

/**
 * PRIMARY push yolu (Spark): alicinin guncel Firestore pushToken'ina Expo bildirimi.
 * Alici sohbeti sessize almissa (mutedChats) gonderme.
 * Blaze'de Cloud Function (onMessageCreated) deploy edilmeden kullanilmaz;
 * Function acildiktan sonra bu istemci yolu kaldirilmalidir.
 */
export async function notifyUser(
  recipientId: string,
  title: string,
  body: string,
  data?: PushNotificationData,
  senderToken?: string | null
): Promise<void> {
  const senderId = data?.senderId;
  if (senderId) {
    const { isMutedByRecipient } = await import('./mutedChats');
    if (await isMutedByRecipient(recipientId, senderId)) {
      console.log('notifyUser: alici sohbeti sessize almis — push atlandi');
      return;
    }
  }

  const token = await resolveRecipientPushToken(recipientId);
  if (!token) {
    console.warn('notifyUser: alicida pushToken YOK →', recipientId);
    return;
  }
  if (senderToken && token === senderToken) {
    console.warn(
      'notifyUser: ayni Expo token (tek cihazda iki hesap) — bildirim atlandi'
    );
    return;
  }

  await sendPushNotification({
    to: token,
    title,
    body: body || 'Yeni mesaj',
    data,
    recipientId,
  });
}

/** Her basarili kayitta Firestore'a yazar (FCM sonrasi yeni token icin onemli). */
export async function syncPushTokenToUser(
  uid: string,
  previousToken?: string | null
): Promise<string | null> {
  const newToken = await registerForPushNotificationsAsync();
  if (!newToken) {
    console.warn('Push: token yok — bu cihaz bildirim alamaz. Dev build + izin + FCM kontrol et.');
    return previousToken ?? null;
  }
  // Her login'de yaz: eski/bos degeri duzeltir
  if (newToken !== previousToken) {
    await updateDoc(doc(db, 'users', uid), { pushToken: newToken });
    console.log('Push: Firestore pushToken guncellendi');
  } else {
    // Ayni token olsa bile dokun (bazi cihazlarda bos string vs)
    await updateDoc(doc(db, 'users', uid), { pushToken: newToken });
  }
  return newToken;
}

/** Cikis: bu cihaz artik o hesap icin bildirim almasin. */
export async function clearPushTokenOnLogout(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { pushToken: deleteField() });
  } catch (e) {
    console.warn('Push: logout token temizligi basarisiz', e);
  }
}
