/**
 * Kullaniciya ozel yildizli mesajlar (users/{uid}/starredMessages/{messageId}).
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Message } from '../types';

export type StarredMessage = {
  messageId: string;
  chatId: string;
  friendId: string;
  text?: string | null;
  type: Message['type'];
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  senderId: string;
  createdAt: any;
  starredAt: any;
};

export async function starMessage(
  uid: string,
  friendId: string,
  message: Message
): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'starredMessages', message.id), {
    messageId: message.id,
    chatId: message.chatId,
    friendId,
    text: message.text ?? null,
    type: message.type,
    imageUrl: message.imageUrl ?? null,
    audioUrl: message.audioUrl ?? null,
    fileUrl: message.fileUrl ?? null,
    fileName: message.fileName ?? null,
    senderId: message.senderId,
    createdAt: message.createdAt ?? null,
    starredAt: serverTimestamp(),
  });
}

export async function unstarMessage(uid: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'starredMessages', messageId));
}

export async function toggleStarMessage(
  uid: string,
  friendId: string,
  message: Message,
  currentlyStarred: boolean
): Promise<void> {
  if (currentlyStarred) {
    await unstarMessage(uid, message.id);
  } else {
    await starMessage(uid, friendId, message);
  }
}

export function subscribeStarredIds(
  uid: string,
  friendId: string,
  cb: (ids: Set<string>) => void
): () => void {
  const q = query(
    collection(db, 'users', uid, 'starredMessages'),
    where('friendId', '==', friendId)
  );
  return onSnapshot(
    q,
    (snap) => cb(new Set(snap.docs.map((d) => d.id))),
    (error) => console.error('subscribeStarredIds error:', error)
  );
}

export function subscribeStarredForFriend(
  uid: string,
  friendId: string,
  cb: (items: StarredMessage[]) => void
): () => void {
  const q = query(
    collection(db, 'users', uid, 'starredMessages'),
    where('friendId', '==', friendId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as StarredMessage);
      items.sort((a, b) => {
        const ta = a.starredAt?.toMillis?.() ?? 0;
        const tb = b.starredAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      cb(items);
    },
    (error) => console.error('subscribeStarredForFriend error:', error)
  );
}
