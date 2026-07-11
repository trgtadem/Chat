import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { useAppContext } from '../context/AppContext';
import { navigate } from '../navigation/navigationRef';

type NotifData = {
  chatId?: string;
  senderId?: string;
  friendId?: string;
};

async function openChatFromData(currentUser: User, data: NotifData) {
  const friendId = data.senderId || data.friendId;
  if (!friendId || friendId === currentUser.id) return;

  try {
    const snap = await getDoc(doc(db, 'users', friendId));
    if (!snap.exists()) return;
    const friend = { id: snap.id, ...snap.data() } as User;
    navigate('Chat', { user: currentUser, friend });
  } catch (error) {
    console.error('openChatFromData error:', error);
  }
}

/**
 * Bildirim tiklaninca ilgili sohbete gider (foreground + cold start).
 */
export function useNotificationNavigation(enabled: boolean) {
  const { currentUser } = useAppContext();
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!enabled || !currentUser?.id) return;

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = (response.notification.request.content.data ?? {}) as NotifData;
      openChatFromData(currentUser, data);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    if (!handledColdStart.current) {
      handledColdStart.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then(handleResponse)
        .catch(() => {});
    }

    return () => sub.remove();
  }, [enabled, currentUser]);
}
