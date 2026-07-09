import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Settings, UserPlus } from 'lucide-react-native';

import { User } from '../types';
import { useAppContext, useTheme } from '../context/AppContext';
import { RootStackParamList } from '../types/navigation';
import { useFriendsList } from '../hooks/useFriendsList';
import { SearchBar } from '../components/SearchBar';
import { FriendItem } from '../components/FriendItem';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const { currentUser, incomingRequests } = useAppContext();
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const forwardingMessage = route.params?.forwardingMessage;
  const forwardHandledRef = useRef(false);

  const { displayList, friendsHydrated, filterBySearch } = useFriendsList();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filteredList, setFilteredList] = useState(displayList);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(text), 300);
  };

  useEffect(() => {
    setFilteredList(filterBySearch(displayList, debouncedSearch));
  }, [debouncedSearch, displayList, filterBySearch]);

  const clearForwarding = useCallback(() => {
    navigation.setParams({ forwardingMessage: undefined });
    forwardHandledRef.current = false;
  }, [navigation]);

  const handleSelectChat = useCallback(
    (item: any) => {
      const friend: User = item.isChat ? item.friendUser : item;

      if (forwardingMessage) {
        if (forwardHandledRef.current) return;
        forwardHandledRef.current = true;
        navigation.navigate('Chat', {
          user: currentUser!,
          friend,
          forwardingMessage,
        });
        clearForwarding();
        return;
      }

      navigation.navigate('Chat', { user: currentUser!, friend });
    },
    [forwardingMessage, navigation, currentUser, clearForwarding]
  );

  const renderFriend = useCallback(
    ({ item }: { item: any }) => (
      <FriendItem item={item} currentUser={currentUser!} onSelect={handleSelectChat} />
    ),
    [currentUser, handleSelectChat]
  );

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: currentUser.avatar }} style={styles.headerAvatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>{currentUser.name}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 * theme.fontScale }}>
              {currentUser.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddFriend')}
            style={styles.headerIconButton}
          >
            <UserPlus size={22} color={theme.colors.primary} />
            {incomingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconButton}
          >
            <Settings size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {forwardingMessage && (
        <View style={styles.forwardBanner}>
          <Text style={styles.forwardBannerText}>Bir sohbet seçerek mesajı iletin</Text>
          <TouchableOpacity onPress={clearForwarding}>
            <Text style={styles.forwardCancel}>İptal</Text>
          </TouchableOpacity>
        </View>
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Sohbet veya kişi ara..."
      />

      {!friendsHydrated ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz sohbet yok</Text>
              <Text style={styles.emptySubtext}>Arkadaş ekleyerek mesajlaşmaya başlayın</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: import('../theme').Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerAvatar: { width: 44, height: 44, borderRadius: 22 },
    headerTitle: {
      fontSize: 18 * theme.fontScale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    headerIconButton: { padding: 8, position: 'relative' },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: theme.colors.error,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    forwardBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.colors.surfaceAlt,
    },
    forwardBannerText: { color: theme.colors.textPrimary, fontSize: 14 * theme.fontScale },
    forwardCancel: { color: theme.colors.primary, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
    emptyText: {
      fontSize: 18 * theme.fontScale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14 * theme.fontScale,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
