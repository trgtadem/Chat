import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
  await setDoc(
    doc(db, 'chats', chatId),
    { typing: { [userId]: isTyping } },
    { merge: true }
  );
}

export function subscribeTyping(
  chatId: string,
  friendId: string,
  onChange: (isTyping: boolean) => void
): () => void {
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snapshot) => {
      const data = snapshot.data();
      onChange(Boolean(data?.typing?.[friendId]));
    },
    (error) => console.error('subscribeTyping error:', error?.message || error)
  );
}
