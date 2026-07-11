/**
 * Sesli / görüntülü arama sinyalleşmesi (Firestore).
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { notifyUser } from './notifications';

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'accepted' | 'ended' | 'declined';

export type CallDoc = {
  id: string;
  callerId: string;
  calleeId: string;
  type: CallType;
  status: CallStatus;
  roomId: string;
  createdAt: any;
};

export async function createCall(
  me: User,
  friend: User,
  isVideo: boolean
): Promise<string> {
  const callRef = doc(collection(db, 'calls'));
  await setDoc(callRef, {
    callerId: me.id,
    calleeId: friend.id,
    type: isVideo ? 'video' : 'audio',
    status: 'ringing' as CallStatus,
    roomId: callRef.id,
    createdAt: serverTimestamp(),
  });

  const callerName = `${me.name} ${me.surname}`.trim();
  void notifyUser(
    friend.id,
    callerName,
    'Aranıyor',
    { callId: callRef.id, senderId: me.id, friendId: me.id },
    me.pushToken
  );

  return callRef.id;
}

export function subscribeIncomingCalls(
  uid: string,
  cb: (calls: CallDoc[]) => void
): () => void {
  const q = query(
    collection(db, 'calls'),
    where('calleeId', '==', uid),
    where('status', '==', 'ringing')
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CallDoc[]
      );
    },
    (e) => console.error('subscribeIncomingCalls', e)
  );
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus
): Promise<void> {
  await updateDoc(doc(db, 'calls', callId), { status });
}

export async function endCall(callId: string): Promise<void> {
  try {
    await updateCallStatus(callId, 'ended');
  } catch (e) {
    console.warn('endCall', e);
  }
}
