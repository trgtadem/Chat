import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Friend, FriendRequest, User } from '../types';
import { generateFriendCode } from '../utils';

/**
 * Kullanicinin bir arkadas koduna sahip oldugundan emin olur.
 * Kod yoksa benzersiz bir tane uretir, `friendCodes/{CODE}` esleme dokumanini
 * olusturur ve kullanici dokumanina yazar. Mevcut kodu dondurur.
 */
export async function ensureFriendCode(user: User): Promise<string> {
  if (user.friendCode) return user.friendCode;

  // Benzersiz kod bulana kadar dene (carpisma cok nadir)
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateFriendCode();
    const codeRef = doc(db, 'friendCodes', code);
    const existing = await getDoc(codeRef);
    if (existing.exists()) continue;

    await setDoc(codeRef, { uid: user.id, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', user.id), { friendCode: code });
    return code;
  }
  throw new Error('Arkadas kodu uretilemedi, lutfen tekrar deneyin.');
}

/** Kodu cozer ve sahibinin uid'ini dondurur (yoksa null). */
async function resolveFriendCode(code: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'friendCodes', code.trim().toUpperCase()));
  if (!snap.exists()) return null;
  return (snap.data() as { uid: string }).uid ?? null;
}

export type SendRequestResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'not_found'
        | 'self'
        | 'already_friend'
        | 'already_sent'
        | 'incoming_pending'
        | 'error';
    };

/**
 * Verilen koda sahip kullaniciya arkadaslik istegi gonderir.
 * users/{toUid}/friendRequests/{me} ve users/{me}/sentRequests/{toUid} olusturur.
 */
export async function sendFriendRequest(me: User, code: string): Promise<SendRequestResult> {
  try {
    const toUid = await resolveFriendCode(code);
    if (!toUid) return { ok: false, reason: 'not_found' };
    if (toUid === me.id) return { ok: false, reason: 'self' };

    // Zaten arkadas mi?
    const friendSnap = await getDoc(doc(db, 'users', me.id, 'friends', toUid));
    if (friendSnap.exists()) return { ok: false, reason: 'already_friend' };

    // Zaten istek gonderilmis mi?
    const sentSnap = await getDoc(doc(db, 'users', me.id, 'sentRequests', toUid));
    if (sentSnap.exists()) return { ok: false, reason: 'already_sent' };

    // Karsi taraf zaten bana istek gondermis mi?
    const incomingSnap = await getDoc(doc(db, 'users', me.id, 'friendRequests', toUid));
    if (incomingSnap.exists()) return { ok: false, reason: 'incoming_pending' };

    const targetSnap = await getDoc(doc(db, 'users', toUid));
    const target = targetSnap.data() as User | undefined;

    const requestData: FriendRequest = {
      fromUid: me.id,
      toUid,
      fromUser: {
        name: me.name ?? '',
        surname: me.surname ?? '',
        avatar: me.avatar ?? '',
        friendCode: me.friendCode,
      },
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', toUid, 'friendRequests', me.id), requestData);
    batch.set(doc(db, 'users', me.id, 'sentRequests', toUid), {
      toUid,
      status: 'pending',
      createdAt: serverTimestamp(),
      toUser: {
        name: target?.name ?? '',
        surname: target?.surname ?? '',
        avatar: target?.avatar ?? '',
      },
    });
    await batch.commit();

    return { ok: true };
  } catch (error) {
    console.error('sendFriendRequest error:', error);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Gelen istegi kabul eder: iki tarafli `friends` kaydi olusturur ve istegi siler.
 */
export async function acceptRequest(me: User, request: FriendRequest): Promise<void> {
  const fromUid = request.fromUid;

  const myFriendDoc: Friend = {
    id: fromUid,
    name: request.fromUser?.name ?? '',
    surname: request.fromUser?.surname ?? '',
    avatar: request.fromUser?.avatar ?? '',
    since: serverTimestamp(),
  };

  const theirFriendDoc: Friend = {
    id: me.id,
    name: me.name ?? '',
    surname: me.surname ?? '',
    avatar: me.avatar ?? '',
    since: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', me.id, 'friends', fromUid), myFriendDoc);
  batch.set(doc(db, 'users', fromUid, 'friends', me.id), theirFriendDoc);
  batch.delete(doc(db, 'users', me.id, 'friendRequests', fromUid));
  batch.delete(doc(db, 'users', fromUid, 'sentRequests', me.id));
  await batch.commit();
}

/** Gelen istegi reddeder (istek dokumanlarini siler). */
export async function declineRequest(meUid: string, fromUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', meUid, 'friendRequests', fromUid));
  batch.delete(doc(db, 'users', fromUid, 'sentRequests', meUid));
  await batch.commit();
}

/** Gonderilen istegi geri ceker. */
export async function cancelRequest(meUid: string, toUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', meUid, 'sentRequests', toUid));
  batch.delete(doc(db, 'users', toUid, 'friendRequests', meUid));
  await batch.commit();
}

/** Arkadasligi karsilikli kaldirir. */
export async function removeFriend(meUid: string, friendUid: string): Promise<void> {
  const { removeFriend: rm } = await import('./account');
  return rm(meUid, friendUid);
}

/** Arkadas listesine abone olur. */
export function subscribeFriends(uid: string, cb: (friends: Friend[]) => void): () => void {
  const ref = collection(db, 'users', uid, 'friends');
  return onSnapshot(
    ref,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Friend))),
    (error) => console.error('subscribeFriends error:', error?.message || error)
  );
}

/** Bekleyen gelen isteklere abone olur. */
export function subscribeIncomingRequests(
  uid: string,
  cb: (requests: FriendRequest[]) => void
): () => void {
  const ref = query(
    collection(db, 'users', uid, 'friendRequests'),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    ref,
    (snap) => cb(snap.docs.map((d) => d.data() as FriendRequest)),
    (error) => console.error('subscribeIncomingRequests error:', error?.message || error)
  );
}

/** Gonderilen bekleyen isteklere abone olur. */
export function subscribeSentRequests(
  uid: string,
  cb: (requests: FriendRequest[]) => void
): () => void {
  const ref = collection(db, 'users', uid, 'sentRequests');
  return onSnapshot(
    ref,
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          const toUser = data.toUser ?? { name: '', surname: '', avatar: '' };
          return {
            fromUid: uid,
            toUid: d.id,
            fromUser: toUser,
            toUser,
            status: data.status ?? 'pending',
            createdAt: data.createdAt,
          } as FriendRequest & { toUser?: typeof toUser };
        })
      ),
    (error) => console.error('subscribeSentRequests error:', error?.message || error)
  );
}
