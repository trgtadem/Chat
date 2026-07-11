/**
 * Mesaj tepkileri, duzenleme, silme (benim icin / herkes).
 */
import { arrayUnion, deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export async function setMessageReaction(
  chatId: string,
  messageId: string,
  uid: string,
  emoji: string | null
): Promise<void> {
  const ref = doc(db, 'chats', chatId, 'messages', messageId);
  if (emoji) {
    await updateDoc(ref, { [`reactions.${uid}`]: emoji });
  } else {
    await updateDoc(ref, { [`reactions.${uid}`]: deleteField() });
  }
}

export async function editMessageText(
  chatId: string,
  messageId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    text,
    editedAt: serverTimestamp(),
  });
}

/** Herkes icin soft-delete */
export async function deleteMessageForEveryone(
  chatId: string,
  messageId: string
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    isDeleted: true,
    text: null,
  });
}

/** Yalnizca benim listemde gizle */
export async function deleteMessageForMe(
  chatId: string,
  messageId: string,
  uid: string
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deletedFor: arrayUnion(uid),
  });
}
