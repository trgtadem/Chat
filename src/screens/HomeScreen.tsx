import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut, Settings } from 'lucide-react-native';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { COLORS } from '../styles/baseStyles';

import { FriendItem } from '../components/FriendItem';

type RootStackParamList = {
  Home: undefined;
  Chat: { user: User; friend: User };
  Profile: { user: User };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({
  currentUser,
  onLogout,
  navigation,
}: {
  currentUser: User;
  onLogout: () => void;
  navigation: HomeScreenProps['navigation'];
}) {
  const [chats, setChats] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [displayList, setDisplayList] = useState<any[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', currentUser.id, 'userChats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatsList);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '!=', currentUser.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => doc.data() as User);
      setAllUsers(usersList);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  useEffect(() => {
    const chatUsers = chats.map((chat) => {
      const friendUser: User = {
        id: chat.id,
        email: chat.email,
        name: chat.name,
        surname: chat.surname,
        avatar: chat.avatar,
        about: chat.about,
        online: chat.online,
        lastSeen: chat.lastSeen,
        pushToken: chat.pushToken,
      };
      return { ...chat, isChat: true, friendUser };
    });

    const chattedUserIds = new Set(chats.map((chat) => chat.id));

    const otherUsers = allUsers
      .filter((user) => !chattedUserIds.has(user.id))
      .map((user) => ({ ...user, isChat: false }));

    const combinedList = [
      ...chatUsers,
      ...otherUsers.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    ];

    setDisplayList(combinedList);
  }, [chats, allUsers]);

  const handleSelectChat = (item: any) => {
    const friend: User = item.isChat ? item.friendUser : item;
    navigation.navigate('Chat', { user: currentUser, friend });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={{ uri: currentUser.avatar }}
            style={styles.headerAvatar}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>{currentUser.name}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              {currentUser.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { user: currentUser })}
            style={{ padding: 8 }}
          >
            <Settings size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={{ padding: 8 }}>
            <LogOut size={24} color="#FF5555" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Chats & People</Text>
      </View>
      <FlatList
        data={displayList}
        renderItem={({ item }) => (
          <FriendItem
            item={item}
            currentUser={currentUser}
            onSelect={() => handleSelectChat(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        ListEmptyComponent={
          <Text
            style={{
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            No users yet...
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  sectionTitleContainer: { padding: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  friendsList: { paddingHorizontal: 16 },
});
