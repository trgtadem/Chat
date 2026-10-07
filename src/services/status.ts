/**
 * 24 saatlik durum / hikaye.
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  arrayUnion,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { StatusItem, User } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function postStatus(
  me: User,
  payload: { type: 'text' | 'image'; text?: string; imageUrl?: string }
): Promise<void> {
  const now = Date.now();
  await addDoc(collection(db, 'statuses'), {
    uid: me.id,
    type: payload.type,
    text: payload.text ?? null,
    imageUrl: payload.imageUrl ?? null,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(now + DAY_MS),
    viewedBy: [],
    authorName: `${me.name} ${me.surname}`.trim(),
    authorAvatar: me.avatar,
  });
}

export function subscribeActiveStatuses(
  friendIds: string[],
  myUid: string,
  cb: (items: StatusItem[]) => void
): () => void {
  const ids = [...new Set([myUid, ...friendIds])];
  if (!ids.length) {
    cb([]);
    return () => {};
  }
  // Firestore 'in' max 10 — chunk
  const chunk = ids.slice(0, 10);
  const q = query(collection(db, 'statuses'), where('uid', 'in', chunk));
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as StatusItem))
        .filter((s) => {
          const exp = s.expiresAt?.toMillis?.() ?? 0;
          return exp > now;
        })
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      cb(items);
    },
    (e) => console.error('subscribeActiveStatuses', e)
  );
}

export async function markStatusViewed(statusId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'statuses', statusId), {
    viewedBy: arrayUnion(uid),
  });
}
