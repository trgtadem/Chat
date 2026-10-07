import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { Avatar } from './Avatar';
import { PanelHeader } from './PanelHeader';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';

interface FriendsPanelProps {
  visible: boolean;
  onClose: () => void;
}

function formatLastSeen(lastSeen?: Date | null): string {
  if (!lastSeen) return 'Unknown';
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(lastSeen).toLocaleDateString();
}

function FriendItem({ user, onPress }: { user: User; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.friendItem} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        source={user.photoURL}
        name={user.displayName}
        size="medium"
        showOnlineIndicator
        isOnline={user.isOnline}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={styles.friendStatus} numberOfLines={1}>
          {user.isOnline ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function FriendsPanel({ visible, onClose }: FriendsPanelProps) {
  const { friends } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.displayName.toLowerCase().includes(query) ||
        friend.email?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const onlineFriends = useMemo(
    () => filteredFriends.filter((f) => f.isOnline),
    [filteredFriends]
  );
  const offlineFriends = useMemo(
    () => filteredFriends.filter((f) => !f.isOnline),
    [filteredFriends]
  );

  const handleFriendPress = (user: User) => {
    // TODO: Navigate to chat with this user or show user profile
    console.log('Friend pressed:', user.displayName);
  };

  const renderSection = (title: string, data: User[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title} ({data.length})
        </Text>
        {data.map((friend) => (
          <FriendItem
            key={friend.id}
            user={friend}
            onPress={() => handleFriendPress(friend)}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <PanelHeader title="Friends" onBack={onClose} />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends..."
        />

        {filteredFriends.length === 0 ? (
          <EmptyState
            icon={<Users size={48} color={colors.textTertiary} />}
            title={searchQuery ? 'No friends found' : 'No friends yet'}
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Start chatting with someone to add them as a friend'
            }
          />
        ) : (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <>
                {renderSection('Online', onlineFriends)}
                {renderSection('Offline', offlineFriends)}
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  friendStatus: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default FriendsPanel;
