import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User, Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { getChatId, formatTime } from '../utils';

import { FriendItem } from '../components/FriendItem';

export function HomeScreen({ currentUser, onSelectChat, onLogout }: { currentUser: User; onSelectChat: (friend: User) => void; onLogout: () => void; }) {
  const [chats, setChats] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // New state for all users

  useEffect(() => {
    const q = query(
      collection(db, 'users', currentUser.id, 'userChats'),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatsList);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // New useEffect to fetch all users
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '!=', currentUser.id)); // Fetch all users except current user
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data() as User);
      setAllUsers(usersList);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const [displayList, setDisplayList] = useState<any[]>([]);

  useEffect(() => {
    // Map chats to include full user info and a flag
    const chatUsers = chats.map(chat => {
      const friendUser: User = {
        id: chat.id,
        name: chat.name,
        surname: chat.surname,
        avatar: chat.avatar,
        online: chat.online,
        lastSeen: chat.lastSeen,
        pushToken: chat.pushToken,
      };
      return { ...chat, isChat: true, friendUser: friendUser };
    });

    // Get IDs of users already in chats
    const chattedUserIds = new Set(chats.map(chat => chat.id));

    // Filter out users who are already in chats, then add them
    const otherUsers = allUsers
      .filter(user => !chattedUserIds.has(user.id))
      .map(user => ({ ...user, isChat: false })); // Add a flag for non-chat users

    // Combine existing chats and other users.
    // Existing chats are already sorted by updatedAt from Firestore query.
    // Other users are sorted alphabetically by name.
    const combinedList = [...chatUsers, ...otherUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))];
    
    setDisplayList(combinedList);

  }, [chats, allUsers]);

  // The 'item' here is a document from the 'userChats' subcollection
  const handleSelectChat = (item: any) => { // Changed chatItem to item
    // If it's an existing chat, it will have the isChat flag and friendUser
    // The friendUser property contains the full User object for the friend
    if (item.isChat) {
      onSelectChat(item.friendUser);
    } else {
      // If it's a new user, the item itself is the User object
      const friend: User = {
        id: item.id,
        name: item.name,
        surname: item.surname,
        avatar: item.avatar,
        online: item.online,
        lastSeen: item.lastSeen,
        pushToken: item.pushToken,
      };
      onSelectChat(friend);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: currentUser.avatar }} style={styles.headerAvatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>{currentUser.name}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{currentUser.online ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={{ padding: 8 }}>
          <LogOut size={24} color="#FF5555" />
        </TouchableOpacity>
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Sohbetler ve Kişiler</Text>
      </View>
      <FlatList
        data={displayList} // Use the combined displayList
        renderItem={({ item }) => (
          <FriendItem
            item={item} // Pass the combined item
            currentUser={currentUser}
            onSelect={() => handleSelectChat(item)} // Use the updated handler
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>Henüz kimse yok...</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary },
    headerAvatar: { width: 40, height: 40, borderRadius: 20 },
    sectionTitleContainer: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", color: COLORS.textPrimary },
    friendsList: { paddingHorizontal: 16 },
});
