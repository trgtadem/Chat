import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Friend, User } from '../types';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_PRIVACY, PrivacySettings } from './useUserPresence';
import { subscribeMutedChats } from '../services/mutedChats';
import { resolveFreshOnline } from '../utils/presence';

export type HomeListItem = {
  id: string;
  isChat: boolean;
  friendUser: User;
  lastMessage?: any;
  unreadCount?: number;
  updatedAt?: any;
  name?: string;
  surname?: string;
  avatar?: string;
  muted?: boolean;
  pinned?: boolean;
  archived?: boolean;
  draft?: string;
};

type PresenceEntry = {
  online: boolean;
  lastSeen: any;
  lastActive?: any;
  name?: string;
  surname?: string;
  avatar?: string;
  about?: string;
};

function friendToUser(f: Friend): User {
  return {
    id: f.id,
    email: '',
    name: f.name ?? 'Unknown',
    surname: f.surname ?? '',
    avatar: f.avatar ?? 'https://via.placeholder.com/50',
    online: false,
    lastSeen: null,
  };
}

function applyPresencePrivacy(
  online: boolean,
  lastSeen: any,
  lastActive: any,
  privacy: PrivacySettings
): { online: boolean; lastSeen: any } {
  if (!privacy.showOnline) {
    return { online: false, lastSeen: null };
  }
  return {
    online: resolveFreshOnline(online, lastActive),
    lastSeen,
  };
}

export function useFriendsList() {
  const { currentUser, friends, isUserBlocked, friendsHydrated } = useAppContext();
  const [chats, setChats] = useState<any[]>([]);
  const [presenceById, setPresenceById] = useState<Record<string, PresenceEntry>>({});
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [displayList, setDisplayList] = useState<HomeListItem[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(
      collection(db, 'users', currentUser.id, 'userChats'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        setChats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error('useFriendsList chats error:', error?.message || error)
    );
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setMutedIds(new Set());
      return;
    }
    return subscribeMutedChats(currentUser.id, setMutedIds);
  }, [currentUser?.id]);

  const friendIdsKey = useMemo(() => {
    const ids = new Set<string>();
    friends.forEach((f) => ids.add(f.id));
    chats.forEach((c) => {
      if (c.id) ids.add(c.id);
    });
    return [...ids].sort().join(',');
  }, [friends, chats]);

  useEffect(() => {
    if (!friendIdsKey) {
      setPresenceById({});
      return;
    }
    const ids = friendIdsKey.split(',');
    const unsubs = ids.map((uid) =>
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data() as User & {
            privacy?: PrivacySettings;
            lastActive?: unknown;
          };
          const privacy = {
            showOnline: data.privacy?.showOnline ?? DEFAULT_PRIVACY.showOnline,
            showReadReceipts:
              data.privacy?.showReadReceipts ?? DEFAULT_PRIVACY.showReadReceipts,
          };
          const visible = applyPresencePrivacy(
            Boolean(data.online),
            data.lastSeen ?? null,
            data.lastActive,
            privacy
          );
          setPresenceById((prev) => ({
            ...prev,
            [uid]: {
              online: visible.online,
              lastSeen: visible.lastSeen,
              lastActive: data.lastActive,
              name: data.name,
              surname: data.surname,
              avatar: data.avatar,
              about: data.about,
            },
          }));
        },
        (error) => console.error('presence snapshot error:', uid, error)
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [friendIdsKey]);

  // Stale heartbeat: snapshot beklemeden online bayragini dusur
  useEffect(() => {
    const id = setInterval(() => {
      setPresenceById((prev) => {
        let changed = false;
        const next: Record<string, PresenceEntry> = {};
        for (const [uid, entry] of Object.entries(prev)) {
          const fresh = resolveFreshOnline(entry.online, entry.lastActive);
          // entry.online burada zaten privacy uygulanmis "gorunen" online;
          // lastActive stale ise false'a cek
          if (entry.online && !fresh) {
            changed = true;
            next[uid] = { ...entry, online: false };
          } else {
            next[uid] = entry;
          }
        }
        return changed ? next : prev;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!friendsHydrated) {
      setDisplayList([]);
      return;
    }

    const mergePresence = (base: User): User => {
      const p = presenceById[base.id];
      if (!p) return base;
      return {
        ...base,
        online: p.online,
        lastSeen: p.lastSeen,
        name: p.name ?? base.name,
        surname: p.surname ?? base.surname,
        avatar: p.avatar ?? base.avatar,
        about: p.about ?? base.about,
      };
    };

    const chatUsers: HomeListItem[] = chats
      .map((chat) => {
        const friendUser = mergePresence({
          id: chat.id ?? '',
          email: chat.email ?? '',
          name: chat.name ?? 'Unknown',
          surname: chat.surname ?? '',
          avatar: chat.avatar ?? 'https://via.placeholder.com/50',
          about: chat.about ?? '',
          lastSeen: chat.lastSeen,
          online: chat.online ?? false,
          pushToken: chat.pushToken ?? null,
        });
        return {
          ...chat,
          isChat: true,
          friendUser,
          muted: mutedIds.has(friendUser.id),
          pinned: Boolean(chat.pinned),
          archived: Boolean(chat.archived),
        };
      })
      .filter(
        (chat) =>
          !isUserBlocked(chat.friendUser.id) &&
          friends.some((f) => f.id === chat.friendUser.id)
      );

    const chattedUserIds = new Set(chats.map((c) => c.id));

    const friendsWithoutChat: HomeListItem[] = friends
      .filter((f) => !chattedUserIds.has(f.id) && !isUserBlocked(f.id))
      .map((f) => {
        const u = mergePresence(friendToUser(f));
        return {
          ...u,
          isChat: false,
          friendUser: u,
          id: f.id,
          muted: mutedIds.has(f.id),
          pinned: false,
          archived: false,
        };
      });

    const combined: HomeListItem[] = [
      ...chatUsers,
      ...friendsWithoutChat.sort((a, b) =>
        `${a.friendUser.name ?? ''} ${a.friendUser.surname ?? ''}`.localeCompare(
          `${b.friendUser.name ?? ''} ${b.friendUser.surname ?? ''}`
        )
      ),
    ];

    combined.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ta = a.updatedAt?.toMillis?.() ?? 0;
      const tb = b.updatedAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

    setDisplayList(combined);
  }, [friends, chats, isUserBlocked, friendsHydrated, presenceById, mutedIds]);

  const filterBySearch = useCallback((items: HomeListItem[], queryText: string): HomeListItem[] => {
    const q = queryText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const friend = item.friendUser;
      const fullName = `${friend.name ?? ''} ${friend.surname ?? ''}`.trim().toLowerCase();
      const lastMessageText =
        item.isChat && item.lastMessage
          ? (item.lastMessage.text ?? '').toString().trim().toLowerCase()
          : '';
      return fullName.includes(q) || lastMessageText.includes(q);
    });
  }, []);

  return {
    displayList,
    friendsHydrated,
    filterBySearch,
    mutedIds,
  };
}
