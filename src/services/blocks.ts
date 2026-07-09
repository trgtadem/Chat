import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db } from '../../firebaseConfig';
import { BlockedUser, User } from '../types';

const LEGACY_BLOCKED_KEY = '@chat_blocked_users';

export type BlockRecord = {
  blockedUserId: string;
  blockedAt: any;
  name: string;
  surname: string;
  avatar: string;
};

function toBlockedUser(userId: string, record: BlockRecord): BlockedUser {
  return {
    id: `blocked-${record.blockedUserId}`,
    userId,
    blockedUserId: record.blockedUserId,
    blockedAt: record.blockedAt,
    user: {
      id: record.blockedUserId,
      email: '',
      name: record.name,
      surname: record.surname,
      avatar: record.avatar,
      online: false,
      lastSeen: null,
    },
  };
}

export async function blockUserInFirestore(me: User, target: User): Promise<void> {
  if (me.id === target.id) return;
  await setDoc(doc(db, 'users', me.id, 'blocks', target.id), {
    blockedUserId: target.id,
    blockedAt: serverTimestamp(),
    name: target.name ?? '',
    surname: target.surname ?? '',
    avatar: target.avatar ?? '',
  } satisfies BlockRecord);
}

export async function unblockUserInFirestore(meUid: string, blockedUid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', meUid, 'blocks', blockedUid));
}

export function subscribeBlockedUsers(
  uid: string,
  cb: (blocked: BlockedUser[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'blocks'),
    (snap) => {
      cb(snap.docs.map((d) => toBlockedUser(uid, d.data() as BlockRecord)));
    },
    (error) => console.error('subscribeBlockedUsers error:', error?.message || error)
  );
}

/** Eski AsyncStorage engel listesini Firestore'a bir kerelik tasirir. */
export async function migrateLegacyBlocks(uid: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_BLOCKED_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw) as BlockedUser[];
    if (!legacy.length) {
      await AsyncStorage.removeItem(LEGACY_BLOCKED_KEY);
      return;
    }
    const batch = writeBatch(db);
    for (const entry of legacy) {
      const u = entry.user;
      if (!u?.id) continue;
      batch.set(doc(db, 'users', uid, 'blocks', u.id), {
        blockedUserId: u.id,
        blockedAt: entry.blockedAt ?? serverTimestamp(),
        name: u.name ?? '',
        surname: u.surname ?? '',
        avatar: u.avatar ?? '',
      });
    }
    await batch.commit();
    await AsyncStorage.removeItem(LEGACY_BLOCKED_KEY);
  } catch (error) {
    console.warn('Legacy block migration failed:', error);
  }
}

/** Karsi tarafin beni engelleyip engellemedigini kontrol (mesaj gondermeden once). */
export async function isBlockedByOther(meUid: string, otherUid: string): Promise<boolean> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', otherUid, 'blocks', meUid));
  return snap.exists();
}
