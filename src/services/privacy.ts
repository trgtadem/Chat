/**
 * users/{uid}.privacy Firestore okuma/yazma.
 */
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { DEFAULT_PRIVACY, PrivacySettings } from '../hooks/useUserPresence';

export async function getPrivacySettings(uid: string): Promise<PrivacySettings> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { ...DEFAULT_PRIVACY };
  const p = (snap.data() as { privacy?: PrivacySettings }).privacy;
  return {
    showOnline: p?.showOnline ?? true,
    showReadReceipts: p?.showReadReceipts ?? true,
  };
}

export async function updatePrivacySettings(
  uid: string,
  privacy: Partial<PrivacySettings>
): Promise<void> {
  const current = await getPrivacySettings(uid);
  await updateDoc(doc(db, 'users', uid), {
    privacy: { ...current, ...privacy },
  });
}

/** Karsi taraf okundu bilgisi paylasiyor mu? */
export async function allowsReadReceipts(uid: string): Promise<boolean> {
  const p = await getPrivacySettings(uid);
  return p.showReadReceipts;
}
