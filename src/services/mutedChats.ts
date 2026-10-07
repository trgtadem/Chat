/**
 * users/{uid}/mutedChats/{friendId} — alici bu sohbeti sessize aldiysa push atlanir.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';

export async function muteChat(uid: string, friendId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'mutedChats', friendId), {
    friendId,
    mutedAt: serverTimestamp(),
  });
}

export async function unmuteChat(uid: string, friendId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'mutedChats', friendId));
}

export async function isChatMuted(uid: string, friendId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'mutedChats', friendId));
  return snap.exists();
}

/** Alici, gondereni sessize almis mi? (push oncesi) */
export async function isMutedByRecipient(
  recipientId: string,
  senderId: string
): Promise<boolean> {
  return isChatMuted(recipientId, senderId);
}

export function subscribeMutedChats(
  uid: string,
  cb: (mutedIds: Set<string>) => void
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'mutedChats'),
    (snap) => cb(new Set(snap.docs.map((d) => d.id))),
    (error) => console.error('subscribeMutedChats error:', error)
  );
}
