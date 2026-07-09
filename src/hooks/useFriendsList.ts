import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { Friend, User } from '../types';
import { useAppContext } from '../context/AppContext';

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

export function useFriendsList() {
  const { currentUser, friends, isUserBlocked, friendsHydrated } = useAppContext();
  const [chats, setChats] = useState<any[]>([]);
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
    if (!friendsHydrated) {
      setDisplayList([]);
      return;
    }

    const chatUsers: HomeListItem[] = chats
      .map((chat) => {
        const friendUser: User = {
          id: chat.id ?? '',
          email: chat.email ?? '',
          name: chat.name ?? 'Unknown',
          surname: chat.surname ?? '',
          avatar: chat.avatar ?? 'https://via.placeholder.com/50',
          about: chat.about ?? '',
          lastSeen: chat.lastSeen,
          online: chat.online ?? false,
          pushToken: chat.pushToken ?? null,
        };
        return { ...chat, isChat: true, friendUser };
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
        const u = friendToUser(f);
        return { ...u, isChat: false, friendUser: u, id: f.id };
      });

    const combined: HomeListItem[] = [
      ...chatUsers,
      ...friendsWithoutChat.sort((a, b) =>
        `${a.friendUser.name ?? ''} ${a.friendUser.surname ?? ''}`.localeCompare(
          `${b.friendUser.name ?? ''} ${b.friendUser.surname ?? ''}`
        )
      ),
    ];

    setDisplayList(combined);
  }, [friends, chats, isUserBlocked, friendsHydrated]);

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
  };
}
