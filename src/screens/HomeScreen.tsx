import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogOut, Settings, Search, X } from 'lucide-react-native';
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
  forwardingMessage,
  onForwardComplete,
}: {
  currentUser: User;
  onLogout: () => void;
  navigation: HomeScreenProps['navigation'];
  forwardingMessage?: any;
  onForwardComplete?: () => void;
}) {
  const [chats, setChats] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [displayList, setDisplayList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredList, setFilteredList] = useState<any[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser?.id) {
      console.warn('Current user ID is not available');
      return;
    }

    const q = query(
      collection(db, 'users', currentUser.id, 'userChats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(chatsList);
      },
      (error) => {
        console.error('Error fetching user chats:', error?.message || error?.code || error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      console.warn('Current user ID is not available');
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', '!=', currentUser.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => doc.data() as User);
        setAllUsers(usersList);
      },
      (error) => {
        console.error('Error fetching users:', error?.message || error?.code || error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  useEffect(() => {
    const chatUsers = chats.map((chat) => {
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
    });

    const chattedUserIds = new Set(chats.map((chat) => chat.id));

    const otherUsers = allUsers
      .filter((user) => !chattedUserIds.has(user.id))
      .map((user) => ({ ...user, isChat: false }));

    const combinedList = [
      ...chatUsers,
      ...otherUsers.sort((a, b) => ((a.name ?? '') || '').localeCompare((b.name ?? '') || '')),
    ];

    setDisplayList(combinedList);
  }, [chats, allUsers]);

  // Filter list based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredList(displayList);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = displayList.filter((item) => {
      try {
        const friend = item?.isChat ? item?.friendUser : item;
        
        // Güvenli isimler - undefined, null veya olmayan özellikler için varsayılan değer kullan
        const firstName = (friend?.name ?? '').toString().trim().toLowerCase();
        const lastName = (friend?.surname ?? '').toString().trim().toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Güvenli son mesaj - lastMessage null/undefined olabilir
        let lastMessageText = '';
        if (item?.isChat && item?.lastMessage) {
          lastMessageText = (item.lastMessage.text ?? '').toString().trim().toLowerCase();
        }
        
        // Arama yapıldığında her iki alanda da kontrol et
        return fullName.includes(query) || lastMessageText.includes(query);
      } catch (error) {
        console.warn('Filter error:', error);
        return false;
      }
    });

    setFilteredList(filtered);
  }, [searchQuery, displayList]);

  const handleSelectChat = (item: any) => {
    const friend: User = item.isChat ? item.friendUser : item;
    
    // If forwarding a message, navigate with forwardingMessage param
    if (forwardingMessage) {
      navigation.navigate('Chat', { 
        user: currentUser, 
        friend, 
        forwardingMessage 
      });
      if (onForwardComplete) {
        onForwardComplete();
      }
      return;
    }
    
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
        </View>
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Chats & People</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats and people..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredList}
        renderItem={({ item }) => (
          <FriendItem
            item={item}
            currentUser={currentUser}
            onSelect={() => handleSelectChat(item)}
          />
        )}
        keyExtractor={(item, index) => item?.id || `friend-${index}`}
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
  sectionTitleContainer: { 
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  friendsList: { paddingHorizontal: 16 },
});
