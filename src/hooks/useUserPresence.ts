import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { resolveFreshOnline } from '../utils/presence';

export type PrivacySettings = {
  showOnline: boolean;
  showReadReceipts: boolean;
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  showOnline: true,
  showReadReceipts: true,
};

type RawUser = User & { privacy?: PrivacySettings; lastActive?: unknown };

function toVisibleUser(
  data: RawUser,
  uid: string,
  respectPrivacy: boolean
): { user: User; privacy: PrivacySettings } {
  const privacy = {
    showOnline: data.privacy?.showOnline ?? true,
    showReadReceipts: data.privacy?.showReadReceipts ?? true,
  };
  const freshOnline = resolveFreshOnline(Boolean(data.online), data.lastActive);
  const visibleOnline = respectPrivacy && !privacy.showOnline ? false : freshOnline;
  const visibleLastSeen =
    respectPrivacy && !privacy.showOnline ? null : (data.lastSeen ?? null);

  return {
    privacy,
    user: {
      ...data,
      id: data.id || uid,
      online: visibleOnline,
      lastSeen: visibleLastSeen,
      lastActive: data.lastActive as any,
    },
  };
}

/**
 * users/{uid} anlik online/lastSeen (+ privacy).
 * showOnline false ise disariya online=false, lastSeen=null yansitilir.
 * lastActive stale ise cevrimdisi gosterilir.
 */
export function useUserPresence(uid: string | undefined, respectPrivacy = true) {
  const [user, setUser] = useState<User | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [loading, setLoading] = useState(Boolean(uid));
  const rawRef = useRef<RawUser | null>(null);

  useEffect(() => {
    if (!uid) {
      rawRef.current = null;
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) {
          rawRef.current = null;
          setUser(null);
          setLoading(false);
          return;
        }
        const data = { ...(snap.data() as RawUser), id: snap.id };
        rawRef.current = data;
        const visible = toVisibleUser(data, uid, respectPrivacy);
        setPrivacy(visible.privacy);
        setUser(visible.user);
        setLoading(false);
      },
      (error) => {
        console.error('useUserPresence error:', error);
        setLoading(false);
      }
    );
  }, [uid, respectPrivacy]);

  // Stale heartbeat: abonelik olmadan UI'yi yenile
  useEffect(() => {
    const id = setInterval(() => {
      if (!uid || !rawRef.current) return;
      const visible = toVisibleUser(rawRef.current, uid, respectPrivacy);
      setUser(visible.user);
    }, 30_000);
    return () => clearInterval(id);
  }, [uid, respectPrivacy]);

  return { user, privacy, loading };
}
