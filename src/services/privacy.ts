/**
 * users/{uid}.privacy Firestore okuma/yazma + oturum ici cache.
 */
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { DEFAULT_PRIVACY, PrivacySettings } from '../hooks/useUserPresence';

const privacyCache = new Map<string, { value: PrivacySettings; at: number }>();
const CACHE_TTL_MS = 60_000;

export async function getPrivacySettings(uid: string): Promise<PrivacySettings> {
  const cached = privacyCache.get(uid);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    const fallback = { ...DEFAULT_PRIVACY };
    privacyCache.set(uid, { value: fallback, at: Date.now() });
    return fallback;
  }
  const p = (snap.data() as { privacy?: PrivacySettings }).privacy;
  const value = {
    showOnline: p?.showOnline ?? true,
    showReadReceipts: p?.showReadReceipts ?? true,
  };
  privacyCache.set(uid, { value, at: Date.now() });
  return value;
}

export async function updatePrivacySettings(
  uid: string,
  privacy: Partial<PrivacySettings>
): Promise<void> {
  const current = await getPrivacySettings(uid);
  const next = { ...current, ...privacy };
  await updateDoc(doc(db, 'users', uid), { privacy: next });
  privacyCache.set(uid, { value: next, at: Date.now() });
}

/** Karsi taraf okundu bilgisi paylasiyor mu? */
export async function allowsReadReceipts(uid: string): Promise<boolean> {
  const p = await getPrivacySettings(uid);
  return p.showReadReceipts;
}

export function invalidatePrivacyCache(uid?: string): void {
  if (uid) privacyCache.delete(uid);
  else privacyCache.clear();
}
