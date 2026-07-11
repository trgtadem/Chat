/**
 * Grup sohbetleri MVP.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  orderBy,
  limitToLast,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { GroupMember, GroupSummary, Message, User } from '../types';
import { notifyUser } from './notifications';

export async function createGroup(
  me: User,
  name: string,
  memberUsers: User[]
): Promise<string> {
  const memberIds = [me.id, ...memberUsers.map((u) => u.id)];
  const unique = [...new Set(memberIds)];
  const groupRef = doc(collection(db, 'groups'));
  const batch = writeBatch(db);

  batch.set(groupRef, {
    name: name.trim() || 'Grup',
    avatar: null,
    memberIds: unique,
    createdBy: me.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  });

  const allMembers: { user: User; role: 'admin' | 'member' }[] = [
    { user: me, role: 'admin' },
    ...memberUsers.map((u) => ({ user: u, role: 'member' as const })),
  ];

  for (const { user, role } of allMembers) {
    batch.set(doc(db, 'groups', groupRef.id, 'members', user.id), {
      uid: user.id,
      role,
      name: user.name,
      surname: user.surname,
      avatar: user.avatar,
      joinedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return groupRef.id;
}

export function subscribeMyGroups(
  uid: string,
  cb: (groups: GroupSummary[]) => void
): () => void {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupSummary));
      list.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      cb(list);
    },
    (e) => console.error('subscribeMyGroups', e)
  );
}

export async function sendGroupText(
  groupId: string,
  sender: User,
  text: string,
  memberIds: string[]
): Promise<void> {
  const messageData = {
    type: 'text' as const,
    text,
    senderId: sender.id,
    createdAt: serverTimestamp(),
    status: 'sent',
    chatId: groupId,
  };
  const msgRef = doc(collection(db, 'groups', groupId, 'messages'));
  const batch = writeBatch(db);
  batch.set(msgRef, messageData);
  batch.update(doc(db, 'groups', groupId), {
    lastMessage: messageData,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  for (const mid of memberIds) {
    if (mid === sender.id) continue;
    void notifyUser(
      mid,
      `${sender.name} (grup)`,
      text,
      { chatId: groupId, senderId: sender.id, groupId },
      sender.pushToken
    );
  }
}

export function subscribeGroupMessages(
  groupId: string,
  cb: (msgs: Message[]) => void
): () => void {
  const q = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('createdAt', 'asc'),
    limitToLast(80)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
  });
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'));
  return snap.docs.map((d) => d.data() as GroupMember);
}

export async function getGroup(groupId: string): Promise<GroupSummary | null> {
  const snap = await getDoc(doc(db, 'groups', groupId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as GroupSummary;
}
