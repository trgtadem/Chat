import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../../firebaseConfig';
import { User } from '../types';
import { ensureFriendCode } from '../services/friends';
import {
  registerForPushNotificationsAsync,
  syncPushTokenToUser,
} from '../services/notifications';
import { HEARTBEAT_INTERVAL_MS } from '../utils/presence';
import { getFeedback } from '../feedback/FeedbackContext';

export { registerForPushNotificationsAsync };

/**
 * Auth bootstrap: user doc geldikten hemen sonra UI acilir;
 * friendCode / push / online arka planda.
 */
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

          // Kritik yol: once UI
          setCurrentUser(userData);
          setLoading(false);

          // Arka plan: friendCode, push, online
          void (async () => {
            let next = { ...userData };
            let changed = false;
            if (!next.friendCode) {
              try {
                next.friendCode = await ensureFriendCode(next);
                changed = true;
              } catch (e) {
                console.warn('friendCode olusturulamadi:', e);
              }
            }
            try {
              const token = await syncPushTokenToUser(authUser.uid, next.pushToken);
              if (token && token !== next.pushToken) {
                next.pushToken = token;
                changed = true;
              }
            } catch (e) {
              console.warn('pushToken senkronize edilemedi:', e);
            }
            try {
              await updateDoc(doc(db, 'users', authUser.uid), {
                online: true,
                lastActive: serverTimestamp(),
              });
            } catch (e) {
              console.warn('online write:', e);
            }
            if (changed && auth.currentUser?.uid === authUser.uid) {
              setCurrentUser({ ...next });
            }
          })();
        } catch (error: any) {
          const isTimeout = error?.message === 'timeout';
          getFeedback()?.toast.error(
            isTimeout
              ? 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.'
              : error?.message ?? 'Bilinmeyen bir hata oluştu.',
            isTimeout ? 'Bağlantı Sorunu' : 'Veri Alınamadı'
          );
          try {
            await signOut(auth);
          } catch {
            /* ignore */
          }
          setCurrentUser(null);
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setCurrentUser]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (next !== 'active' || !auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const snap = await getDoc(doc(db, 'users', uid));
        const prev = snap.exists() ? (snap.data() as User).pushToken : null;
        await syncPushTokenToUser(uid, prev);
      } catch {
        /* ignore */
      }
    });
    return () => sub.remove();
  }, []);

  return loading;
}

export function useOnlinePresence() {
  useEffect(() => {
    let generation = 0;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const clearHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const writePresence = async (gen: number, payload: Record<string, unknown>) => {
      if (!auth.currentUser) return;
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), payload);
        if (gen !== generation) return;
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    const startHeartbeat = () => {
      clearHeartbeat();
      heartbeatTimer = setInterval(() => {
        if (!auth.currentUser || AppState.currentState !== 'active') return;
        const gen = generation;
        void writePresence(gen, {
          online: true,
          lastActive: serverTimestamp(),
        });
      }, HEARTBEAT_INTERVAL_MS);
    };

    if (AppState.currentState === 'active' && auth.currentUser) {
      const gen = ++generation;
      void writePresence(gen, { online: true, lastActive: serverTimestamp() });
      startHeartbeat();
    }

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (!auth.currentUser) return;
      const gen = ++generation;

      if (nextAppState === 'active') {
        await writePresence(gen, { online: true, lastActive: serverTimestamp() });
        if (gen === generation) startHeartbeat();
      } else if (nextAppState === 'background') {
        clearHeartbeat();
        await writePresence(gen, {
          online: false,
          lastSeen: serverTimestamp(),
          lastActive: serverTimestamp(),
        });
      }
    });

    return () => {
      clearHeartbeat();
      subscription.remove();
    };
  }, []);
}
