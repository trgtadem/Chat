import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limitToLast,
  QueryDocumentSnapshot,
  DocumentData,
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
  const pendingReadRef = useRef<QueryDocumentSnapshot<DocumentData>[] | null>(null);

  useEffect(() => {
    if (!chatId || !myUid || !friendUid || !canMessage) {
      setMessages([]);
      setHasMoreMessages(false);
      setMessagesWithImages([]);
      pendingReadRef.current = null;
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(msgLimit));

    const flushRead = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
      if (AppState.currentState !== 'active') {
        pendingReadRef.current = docs;
        return;
      }
      pendingReadRef.current = null;
      if (docs.length > 0) {
        markMessagesRead(chatId, myUid, friendUid, docs);
      }
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Message))
          .filter((m) => !(m.deletedFor ?? []).includes(myUid));
        setMessages(msgs);
        setHasMoreMessages(snapshot.docs.length >= msgLimit);
        isLoadingOlderRef.current = false;

        const imageUrls = msgs
          .filter((m) => m.type === 'image' && m.imageUrl)
          .map((m) => m.imageUrl!);
        setMessagesWithImages(imageUrls);

        const pending = snapshot.docs.filter((d) => {
          const data = d.data();
          if (data.senderId === myUid) return false;
          const st = data.status;
          return st === 'sent' || st === 'delivered' || !st;
        });
        flushRead(pending);
      },
      (error) => console.error('useChatMessages error:', error?.message || error)
    );

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pendingReadRef.current?.length) {
        flushRead(pendingReadRef.current);
      }
    });

    return () => {
      unsubscribe();
      appSub.remove();
    };
  }, [chatId, myUid, friendUid, canMessage, msgLimit]);

  const loadOlderMessages = async () => {
    if (!canMessage || !chatId || isLoadingOlderRef.current) return;
    isLoadingOlderRef.current = true;
    try {
      // Limit buyut; listener effect msgLimit ile yeniden baglanir.
      // Onceki getDocs + setMsgLimit cift fetch'i kaldirildi.
      setMsgLimit((prev) => prev + PAGE_SIZE);
    } catch (error) {
      console.error('loadOlderMessages error:', error);
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
