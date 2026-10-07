import { deleteField, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';

/** Karsi tarafta "yaziyor" gosterim suresi (ms) */
export const TYPING_TTL_MS = 5000;
const EXPIRE_CHECK_MS = 2000;

function typingAtMillis(value: unknown): number {
  if (!value || value === false) return 0;
  // Eski boolean true: TTL yok → takili kalmasin diye suresi dolmus say
  if (value === true) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

export async function setTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  await setDoc(
    doc(db, 'chats', chatId),
    {
      typing: {
        [userId]: isTyping ? serverTimestamp() : deleteField(),
      },
    },
    { merge: true }
  );
}

/**
 * Arkadasin typing timestamp'ini dinler; TTL dolunca lokal olarak false yapar.
 */
export function subscribeTyping(
  chatId: string,
  friendId: string,
  onChange: (isTyping: boolean) => void
): () => void {
  let lastAt = 0;

  const evaluate = () => {
    onChange(lastAt > 0 && Date.now() - lastAt < TYPING_TTL_MS);
  };

  const unsub = onSnapshot(
    doc(db, 'chats', chatId),
    (snapshot) => {
      const data = snapshot.data();
      lastAt = typingAtMillis(data?.typing?.[friendId]);
      evaluate();
    },
    (error) => console.error('subscribeTyping error:', error?.message || error)
  );

  const interval = setInterval(evaluate, EXPIRE_CHECK_MS);

  return () => {
    unsub();
    clearInterval(interval);
  };
}
