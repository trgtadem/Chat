import { useEffect, useState } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../../firebaseConfig';
import { User } from '../types';
import { ensureFriendCode } from '../services/friends';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.log('Push notification token unavailable:', error);
    return null;
  }
}

export function useAuthBootstrap(
  setCurrentUser: (user: User | null) => void
): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser && authUser.emailVerified) {
        setLoading(true);
        try {
          const userDoc = await Promise.race([
            getDoc(doc(db, 'users', authUser.uid)),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 15000)
            ),
          ]);

          if (!userDoc.exists()) {
            await signOut(auth);
            setCurrentUser(null);
            setLoading(false);
            return;
          }

          const userData = userDoc.data() as User;
          if (!userData.id) userData.id = authUser.uid;

          if (!userData.friendCode) {
            try {
              userData.friendCode = await ensureFriendCode(userData);
            } catch (e) {
              console.warn('friendCode olusturulamadi:', e);
            }
          }

          const newToken = await registerForPushNotificationsAsync();
          if (newToken && newToken !== userData.pushToken) {
            await updateDoc(doc(db, 'users', authUser.uid), { pushToken: newToken });
            userData.pushToken = newToken;
          }

          await updateDoc(doc(db, 'users', authUser.uid), { online: true });
          setCurrentUser(userData);
        } catch (error: any) {
          const isTimeout = error?.message === 'timeout';
          Alert.alert(
            isTimeout ? 'Bağlantı Sorunu' : 'Veri Alınamadı',
            isTimeout
              ? 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.'
              : error?.message ?? 'Bilinmeyen bir hata oluştu.'
          );
          try {
            await signOut(auth);
          } catch {
            /* ignore */
          }
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setCurrentUser]);

  return loading;
}

export function useOnlinePresence() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (!auth.currentUser) return;
      try {
        if (nextAppState === 'active') {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), { online: true });
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            online: false,
            lastSeen: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    });

    return () => subscription.remove();
  }, []);
}
