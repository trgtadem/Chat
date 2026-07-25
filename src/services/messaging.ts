import {
  collection,
  doc,
  increment,
  serverTimestamp,
  writeBatch,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Message, User } from '../types';
import { notifyUser } from './notifications';
import { getPrivacySettings } from './privacy';

export type OutgoingMessageData = {
  type: Message['type'];
  text?: string | null;
  senderId: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  status: string;
  chatId: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  videoUrl?: string | null;
  fileName?: string | null;
  replyTo?: Message | null;
  forwarded?: boolean;
  forwardedFrom?: string | null;
  cloudinaryDeleteToken?: string | null;
};

type ChatSyncParams = {
  chatId: string;
  sender: User;
  recipient: User;
  lastMessage: OutgoingMessageData;
  incrementRecipientUnread?: boolean;
};

/** Gonderici ve alici userChats dokumanlarini tek batch ile gunceller. */
export function addChatSyncToBatch(batch: ReturnType<typeof writeBatch>, params: ChatSyncParams): void {
  const { chatId, sender, recipient, lastMessage, incrementRecipientUnread = true } = params;

  const senderChatRef = doc(db, 'users', sender.id, 'userChats', recipient.id);
  batch.set(
    senderChatRef,
    {
      id: recipient.id,
      name: recipient.name ?? 'Unknown',
      surname: recipient.surname ?? '',
      avatar: recipient.avatar ?? 'https://via.placeholder.com/50',
      email: recipient.email ?? '',
      online: recipient.online ?? false,
      lastSeen: recipient.lastSeen ?? null,
      lastMessage,
      pushToken: recipient.pushToken ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const recipientChatRef = doc(db, 'users', recipient.id, 'userChats', sender.id);
  batch.set(
    recipientChatRef,
    {
      id: sender.id,
      name: sender.name ?? 'Unknown',
      surname: sender.surname ?? '',
      avatar: sender.avatar ?? 'https://via.placeholder.com/50',
      email: sender.email ?? '',
      online: sender.online ?? false,
      lastSeen: sender.lastSeen ?? null,
      lastMessage,
      ...(incrementRecipientUnread ? { unreadCount: increment(1) } : {}),
      pushToken: sender.pushToken ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function sendMessageWithSync(
  chatId: string,
  sender: User,
  recipient: User,
  messageData: OutgoingMessageData
): Promise<void> {
  const batch = writeBatch(db);
  const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
  batch.set(messageRef, messageData);
  addChatSyncToBatch(batch, { chatId, sender, recipient, lastMessage: messageData });
  await batch.commit();
}

export async function sendTextMessage(
  chatId: string,
  sender: User,
  recipient: User,
  text: string,
  replyTo: Message | null = null
): Promise<void> {
  const messageData: OutgoingMessageData = {
    type: 'text',
    text,
    senderId: sender.id,
    createdAt: serverTimestamp(),
    status: 'sent',
    chatId,
    replyTo,
  };
  await sendMessageWithSync(chatId, sender, recipient, messageData);

  // PRIMARY (Spark): istemci Expo push. Blaze'de onMessageCreated deploy edilmeden kullanilmaz.
  await notifyUser(
    recipient.id,
    `${sender.name} ${sender.surname}`,
    text,
    { chatId, senderId: sender.id, friendId: recipient.id },
    sender.pushToken
  );
}

export async function sendMediaMessage(
  chatId: string,
  sender: User,
  recipient: User,
  type: 'image' | 'audio' | 'file' | 'video',
  payload: {
    imageUrl?: string | null;
    audioUrl?: string | null;
    fileUrl?: string | null;
    videoUrl?: string | null;
    fileName?: string | null;
    cloudinaryDeleteToken?: string | null;
    /** Opsiyonel aciklama / caption */
    text?: string | null;
  },
  replyTo: Message | null = null
): Promise<void> {
  const caption = payload.text?.trim() || null;
  const messageData: OutgoingMessageData = {
    type,
    senderId: sender.id,
    createdAt: serverTimestamp(),
    status: 'sent',
    chatId,
    text: caption,
    imageUrl: payload.imageUrl ?? null,
    audioUrl: payload.audioUrl ?? null,
    fileUrl: payload.fileUrl ?? null,
    videoUrl: payload.videoUrl ?? null,
    fileName: payload.fileName ?? null,
    cloudinaryDeleteToken: payload.cloudinaryDeleteToken ?? null,
    replyTo,
  };
  await sendMessageWithSync(chatId, sender, recipient, messageData);

  const typeLabels = {
    image: '📸 Fotoğraf',
    audio: '🎙️ Sesli mesaj',
    file: '📎 Dosya',
    video: '🎬 Video',
  };
  await notifyUser(
    recipient.id,
    `${sender.name} ${sender.surname}`,
    caption || typeLabels[type],
    { chatId, senderId: sender.id, friendId: recipient.id },
    sender.pushToken
  );
}

export async function forwardMessage(
  chatId: string,
  sender: User,
  recipient: User,
  sourceMessage: Message,
  forwardedFromLabel: string
): Promise<void> {
  const messageData: OutgoingMessageData = {
    type: sourceMessage.type,
    text: sourceMessage.text || null,
    senderId: sender.id,
    createdAt: serverTimestamp(),
    status: 'sent',
    chatId,
    imageUrl: sourceMessage.imageUrl || null,
    audioUrl: sourceMessage.audioUrl || null,
    fileUrl: sourceMessage.fileUrl || null,
    videoUrl: sourceMessage.videoUrl || null,
    fileName: sourceMessage.fileName || null,
    forwarded: true,
    forwardedFrom: forwardedFromLabel,
  };
  await sendMessageWithSync(chatId, sender, recipient, messageData);

  await notifyUser(
    recipient.id,
    `${sender.name} ${sender.surname}`,
    'Bir mesaj iletildi',
    { chatId, senderId: sender.id, friendId: recipient.id },
    sender.pushToken
  );
}

/**
 * Alici sohbeti acinca: unread sifirla.
 * showReadReceipts aciksa status=read, kapaliysa delivered.
 */
export async function markMessagesRead(
  chatId: string,
  myUid: string,
  friendUid: string,
  unreadDocs: QueryDocumentSnapshot<DocumentData>[]
): Promise<void> {
  if (!unreadDocs.length) return;
  try {
    const privacy = await getPrivacySettings(myUid);
    const nextStatus = privacy.showReadReceipts ? 'read' : 'delivered';
    const batch = writeBatch(db);
    unreadDocs.forEach((docSnap) => {
      const current = docSnap.data().status as string | undefined;
      if (current === 'read') return;
      if (current === 'delivered' && nextStatus === 'delivered') return;
      const patch: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === 'delivered') patch.deliveredAt = serverTimestamp();
      if (nextStatus === 'read') {
        patch.readAt = serverTimestamp();
        if (current !== 'delivered') patch.deliveredAt = serverTimestamp();
      }
      batch.update(doc(db, 'chats', chatId, 'messages', docSnap.id), patch);
    });
    batch.update(doc(db, 'users', myUid, 'userChats', friendUid), { unreadCount: 0 });
    await batch.commit();
  } catch (error) {
    console.error('markMessagesRead error:', error);
  }
}

export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    isDeleted: true,
    text: null,
  });
}
