/**
 * Chat listesi: pin / arsiv + taslak (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';

const DRAFTS_KEY = '@chat_drafts_v1';

export async function setChatPinned(
  uid: string,
  friendId: string,
  pinned: boolean
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'userChats', friendId),
    {
      pinned,
      pinnedAt: pinned ? Date.now() : null,
    },
    { merge: true }
  );
}

export async function setChatArchived(
  uid: string,
  friendId: string,
  archived: boolean
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'userChats', friendId),
    { archived },
    { merge: true }
  );
}

export async function getDrafts(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function setDraft(chatId: string, text: string): Promise<void> {
  const drafts = await getDrafts();
  if (!text.trim()) {
    delete drafts[chatId];
  } else {
    drafts[chatId] = text;
  }
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export async function getDraft(chatId: string): Promise<string> {
  const drafts = await getDrafts();
  return drafts[chatId] ?? '';
}
