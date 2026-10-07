/**
 * Hesap silme ve arkadasliktan cikarma.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { auth, db } from '../../firebaseConfig';

export async function removeFriend(meUid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', meUid, 'friends', friendUid));
  batch.delete(doc(db, 'users', friendUid, 'friends', meUid));
  batch.delete(doc(db, 'users', meUid, 'userChats', friendUid));
  batch.delete(doc(db, 'users', friendUid, 'userChats', meUid));
  await batch.commit();
}

async function deleteCollectionDocs(pathSegments: string[]): Promise<void> {
  const [root, ...rest] = pathSegments;
  let ref: any = collection(db, root);
  // users/{uid}/sub
  if (rest.length >= 2) {
    ref = collection(db, root, rest[0], rest[1]);
  }
  const snap = await getDocs(ref);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) await batch.commit();
}

/**
 * Hesabi sil: alt koleksiyonlari temizle, user doc, Auth user.
 * password ile reauth gerekir.
 */
export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email || !user.uid) throw new Error('Oturum yok');

  const cred = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, cred);

  const uid = user.uid;
  const subs = [
    'userChats',
    'friends',
    'friendRequests',
    'sentRequests',
    'blocks',
    'starredMessages',
    'mutedChats',
  ];
  for (const sub of subs) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, sub));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      if (!snap.empty) await batch.commit();
    } catch (e) {
      console.warn('deleteAccount sub clean', sub, e);
    }
  }

  // friendCodes — kullanicinin kodunu silmek icin doc okuma gerekir; atlanabilir
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (e) {
    console.warn('user doc delete', e);
  }

  await deleteUser(user);
}
