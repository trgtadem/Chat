import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limitToLast,
  getDocs,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Message } from '../types';
import { markMessagesRead } from '../services/messaging';

const PAGE_SIZE = 30;

export function useChatMessages(
  chatId: string,
  myUid: string,
  friendUid: string,
  canMessage: boolean
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLimit, setMsgLimit] = useState(PAGE_SIZE);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesWithImages, setMessagesWithImages] = useState<string[]>([]);
  const isLoadingOlderRef = useRef(false);

  useEffect(() => {
    if (!chatId || !myUid || !friendUid || !canMessage) {
      setMessages([]);
      setHasMoreMessages(false);
      setMessagesWithImages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(msgLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Message)
        );
        setMessages(msgs);
        setHasMoreMessages(snapshot.docs.length >= msgLimit);

        const imageUrls = msgs
          .filter((m) => m.type === 'image' && m.imageUrl)
          .map((m) => m.imageUrl!);
        setMessagesWithImages(imageUrls);

        const unread = snapshot.docs.filter(
          (d) => d.data().senderId !== myUid && d.data().status === 'sent'
        );
        if (unread.length > 0) {
          markMessagesRead(chatId, myUid, friendUid, unread);
        }
      },
      (error) => console.error('useChatMessages error:', error?.message || error)
    );

    return unsubscribe;
  }, [chatId, myUid, friendUid, canMessage, msgLimit]);

  const loadOlderMessages = async () => {
    if (!canMessage || !chatId || isLoadingOlderRef.current) return;
    isLoadingOlderRef.current = true;
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(msgLimit + PAGE_SIZE));
      const snap = await getDocs(q);
      if (snap.docs.length > msgLimit) {
        setMsgLimit((prev) => prev + PAGE_SIZE);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('loadOlderMessages error:', error);
    } finally {
      isLoadingOlderRef.current = false;
    }
  };

  return {
    messages,
    hasMoreMessages,
    messagesWithImages,
    loadOlderMessages,
    isLoadingOlderRef,
  };
}
