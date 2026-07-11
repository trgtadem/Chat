import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Settings,
  UserPlus,
  MessageCircle,
  Users,
  Archive,
} from 'lucide-react-native';

import { GroupSummary, StatusItem, User } from '../types';
import { useAppContext, useTheme } from '../context/AppContext';
import { RootStackParamList } from '../types/navigation';
import { HomeListItem, useFriendsList } from '../hooks/useFriendsList';
import { SearchBar } from '../components/SearchBar';
import { FriendItem } from '../components/FriendItem';
import { EmptyState } from '../components/EmptyState';
import { setChatArchived, setChatPinned } from '../services/chatList';
import { subscribeMyGroups } from '../services/groups';
import { subscribeActiveStatuses } from '../services/status';
import { subscribeIncomingCalls } from '../services/calls';
import { useFeedback } from '../feedback/FeedbackContext';
import { muteChat, unmuteChat } from '../services/mutedChats';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

type TabKey = 'chats' | 'archived';

export function HomeScreen({ navigation, route }: HomeScreenProps) {
  const { currentUser, incomingRequests, friends } = useAppContext();
  const { toast, confirm } = useFeedback();
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const forwardingMessage = route.params?.forwardingMessage;
  const forwardHandledRef = useRef(false);

  const { displayList, friendsHydrated, filterBySearch } = useFriendsList();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('chats');
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser?.id) return;
    return subscribeMyGroups(currentUser.id, setGroups);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const friendIds = friends.map((f) => f.id);
    return subscribeActiveStatuses(friendIds, currentUser.id, setStatuses);
  }, [currentUser?.id, friends]);

  useEffect(() => {
    if (!currentUser?.id) return;
    return subscribeIncomingCalls(currentUser.id, (calls) => {
      const call = calls[0];
      if (!call) return;
      const friend = friends.find((f) => f.id === call.callerId);
      if (!friend) return;
      navigation.navigate('Call', {
        friend: {
          id: friend.id,
          email: '',
          name: friend.name,
          surname: friend.surname,
          avatar: friend.avatar,
          online: false,
          lastSeen: null,
        },
        isVideo: call.type === 'video',
        isIncoming: true,
        callId: call.id,
      });
    });
  }, [currentUser?.id, friends, navigation]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(text), 300);
  };

  const tabFiltered = useMemo(() => {
    const base = displayList.filter((item) =>
      tab === 'archived' ? Boolean(item.archived) : !item.archived
    );
    return filterBySearch(base, debouncedSearch);
  }, [displayList, tab, debouncedSearch, filterBySearch]);

  const statusByUid = useMemo(() => {
    const map = new Map<string, StatusItem[]>();
    for (const s of statuses) {
      const list = map.get(s.uid) ?? [];
      list.push(s);
      map.set(s.uid, list);
    }
    return map;
  }, [statuses]);

  const clearForwarding = useCallback(() => {
    navigation.setParams({ forwardingMessage: undefined });
    forwardHandledRef.current = false;
  }, [navigation]);

  const handleSelectChat = useCallback(
    (item: HomeListItem) => {
      const friend: User = item.isChat ? item.friendUser : item.friendUser;

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

  const handleChatLongPress = useCallback(
    async (item: HomeListItem) => {
      if (!currentUser?.id) return;
      const friendId = item.friendUser.id;
      const pinned = Boolean(item.pinned);
      const archived = Boolean(item.archived);
      const muted = Boolean(item.muted);

      const choice = await confirm({
        title: item.friendUser.name,
        message: 'Sohbet işlemi seç',
        confirmLabel: pinned ? 'Sabiti kaldır' : 'Sabitle',
        cancelLabel: archived ? 'Arşivden çıkar' : 'Arşivle',
      });

      try {
        if (choice) {
          await setChatPinned(currentUser.id, friendId, !pinned);
          toast.success(pinned ? 'Sabit kaldırıldı' : 'Sohbet sabitlendi');
        } else {
          await setChatArchived(currentUser.id, friendId, !archived);
          toast.success(archived ? 'Arşivden çıkarıldı' : 'Sohbet arşivlendi');
        }
      } catch {
        toast.error('İşlem başarısız');
      }

      // Mute shortcut via second confirm optional — skip for simplicity
      void muted;
      void unmuteChat;
      void muteChat;
    },
    [currentUser?.id, confirm, toast]
  );

  const renderFriend = useCallback(
    ({ item }: { item: HomeListItem }) => (
      <FriendItem
        item={item}
        currentUser={currentUser!}
        onSelect={handleSelectChat}
        onLongPress={handleChatLongPress}
      />
    ),
    [currentUser, handleSelectChat, handleChatLongPress]
  );

  if (!currentUser) return null;

  const myStatuses = statusByUid.get(currentUser.id) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: currentUser.avatar }} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>Sohbetler</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {currentUser.name}
              {currentUser.online ? ' · Çevrimiçi' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            style={styles.headerIconButton}
          >
            <Users size={22} color={theme.colors.primary} />
          </TouchableOpacity>
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

      {/* Durum şeridi — flexGrow:0 yoksa yatay ScrollView dikeyde şişer */}
      <View style={styles.statusSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusScroll}
          contentContainerStyle={styles.statusStrip}
        >
          <TouchableOpacity
            style={styles.statusItem}
            onPress={() => navigation.navigate('StatusCompose')}
          >
            <View style={[styles.statusAvatarWrap, styles.statusAdd]}>
              <Image source={{ uri: currentUser.avatar }} style={styles.statusAvatar} />
              <View style={styles.statusPlus}>
                <Text style={styles.statusPlusText}>+</Text>
              </View>
            </View>
            <Text style={styles.statusName} numberOfLines={1}>
              Durumum
            </Text>
          </TouchableOpacity>
          {myStatuses.length > 0 ? (
            <TouchableOpacity
              style={styles.statusItem}
              onPress={() =>
                navigation.navigate('StatusViewer', { statuses: myStatuses, startIndex: 0 })
              }
            >
              <View style={[styles.statusAvatarWrap, styles.statusRing]}>
                <Image source={{ uri: currentUser.avatar }} style={styles.statusAvatar} />
              </View>
              <Text style={styles.statusName} numberOfLines={1}>
                Senin
              </Text>
            </TouchableOpacity>
          ) : null}
          {[...statusByUid.entries()]
            .filter(([uid]) => uid !== currentUser.id)
            .map(([uid, list]) => {
              const first = list[0];
              return (
                <TouchableOpacity
                  key={uid}
                  style={styles.statusItem}
                  onPress={() =>
                    navigation.navigate('StatusViewer', { statuses: list, startIndex: 0 })
                  }
                >
                  <View style={[styles.statusAvatarWrap, styles.statusRing]}>
                    <Image
                      source={{
                        uri: first.authorAvatar || 'https://via.placeholder.com/50',
                      }}
                      style={styles.statusAvatar}
                    />
                  </View>
                  <Text style={styles.statusName} numberOfLines={1}>
                    {first.authorName?.split(' ')[0] || 'Durum'}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Sohbet veya kişi ara..."
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'chats' && styles.tabActive]}
          onPress={() => setTab('chats')}
        >
          <Text style={[styles.tabText, tab === 'chats' && styles.tabTextActive]}>Sohbetler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'archived' && styles.tabActive]}
          onPress={() => setTab('archived')}
        >
          <Archive size={14} color={tab === 'archived' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>Arşiv</Text>
        </TouchableOpacity>
      </View>

      {/* Gruplar */}
      {tab === 'chats' && groups.length > 0 && !debouncedSearch ? (
        <View style={styles.groupsBlock}>
          <Text style={styles.sectionLabel}>Gruplar</Text>
          {groups.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={styles.groupRow}
              onPress={() =>
                navigation.navigate('GroupChat', { groupId: g.id, groupName: g.name })
              }
            >
              <View style={styles.groupAvatar}>
                <Users size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{g.name}</Text>
                <Text style={styles.groupPreview} numberOfLines={1}>
                  {g.lastMessage?.text || 'Grup sohbeti'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!friendsHydrated ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tabFiltered}
          keyExtractor={(item) => item.id}
          renderItem={renderFriend}
          contentContainerStyle={
            tabFiltered.length === 0
              ? styles.emptyList
              : { paddingBottom: 20, paddingHorizontal: 12 }
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'archived' ? Archive : MessageCircle}
              title={
                debouncedSearch
                  ? 'Sonuç bulunamadı'
                  : tab === 'archived'
                    ? 'Arşiv boş'
                    : 'Henüz sohbet yok'
              }
              subtitle={
                debouncedSearch
                  ? 'Farklı bir arama dene'
                  : tab === 'archived'
                    ? 'Uzun basarak sohbetleri arşivleyebilirsin'
                    : 'Arkadaş ekleyerek mesajlaşmaya başla'
              }
            />
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
      backgroundColor: theme.colors.headerBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22 },
    brandTitle: {
      fontSize: 20 * theme.fontScale,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 12 * theme.fontScale,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    headerActions: { flexDirection: 'row', gap: 4 },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    forwardBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.colors.surfaceAlt,
    },
    forwardBannerText: { color: theme.colors.textPrimary, fontSize: 13 * theme.fontScale },
    forwardCancel: { color: theme.colors.primary, fontWeight: '700' },
    statusSection: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    statusScroll: {
      flexGrow: 0,
    },
    statusStrip: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
      gap: 10,
      alignItems: 'flex-start',
    },
    statusItem: { width: 58, alignItems: 'center' },
    statusAvatarWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusAdd: { position: 'relative' },
    statusRing: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      padding: 2,
    },
    statusAvatar: { width: 44, height: 44, borderRadius: 22 },
    statusPlus: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusPlusText: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 12 },
    statusName: {
      marginTop: 3,
      fontSize: 11 * theme.fontScale,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      gap: 8,
      marginTop: 4,
      marginBottom: 6,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceAlt,
    },
    tabActive: {
      backgroundColor: `${theme.colors.primary}22`,
    },
    tabText: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 13 * theme.fontScale,
    },
    tabTextActive: { color: theme.colors.primary },
    groupsBlock: { paddingHorizontal: 12, marginBottom: 8 },
    sectionLabel: {
      fontSize: 12 * theme.fontScale,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 6,
    },
    groupAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupName: {
      fontSize: 15 * theme.fontScale,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    groupPreview: {
      fontSize: 13 * theme.fontScale,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyList: { flexGrow: 1, justifyContent: 'center' },
  });
