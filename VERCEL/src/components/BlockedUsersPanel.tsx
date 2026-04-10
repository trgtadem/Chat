import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { UserX } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { BlockedUser, User } from '../types';
import { Avatar } from './Avatar';
import { PanelHeader } from './PanelHeader';
import { EmptyState } from './EmptyState';

interface BlockedUsersPanelProps {
  visible: boolean;
  onClose: () => void;
}

// Mock blocked users data - TODO: Replace with real data from backend
const mockBlockedUsers: (BlockedUser & { user: User })[] = [
  {
    id: '1',
    userId: 'current',
    blockedUserId: 'user1',
    blockedAt: new Date(Date.now() - 86400000 * 7),
    user: {
      id: 'user1',
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: null,
    },
  },
  {
    id: '2',
    userId: 'current',
    blockedUserId: 'user2',
    blockedAt: new Date(Date.now() - 86400000 * 30),
    user: {
      id: 'user2',
      displayName: 'Jane Smith',
      email: 'jane@example.com',
      photoURL: null,
    },
  },
];

function formatBlockedDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Blocked today';
  if (days === 1) return 'Blocked yesterday';
  if (days < 7) return `Blocked ${days} days ago`;
  if (days < 30) return `Blocked ${Math.floor(days / 7)} weeks ago`;
  return `Blocked on ${date.toLocaleDateString()}`;
}

function BlockedUserItem({
  blockedUser,
  onUnblock,
}: {
  blockedUser: BlockedUser & { user: User };
  onUnblock: () => void;
}) {
  return (
    <View style={styles.blockedUserItem}>
      <Avatar source={blockedUser.user.photoURL} name={blockedUser.user.displayName} size="medium" />
      <View style={styles.blockedUserInfo}>
        <Text style={styles.blockedUserName}>{blockedUser.user.displayName}</Text>
        <Text style={styles.blockedUserDate}>{formatBlockedDate(blockedUser.blockedAt)}</Text>
      </View>
      <TouchableOpacity style={styles.unblockButton} onPress={onUnblock}>
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );
}

export function BlockedUsersPanel({ visible, onClose }: BlockedUsersPanelProps) {
  const { blockedUsers, unblockUser } = useAppContext();

  // Use mock data if no real blocked users - TODO: Remove mock data when backend is ready
  const displayBlockedUsers = blockedUsers.length > 0 ? [] : mockBlockedUsers;

  const handleUnblock = (user: User) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.displayName}? They will be able to message you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            unblockUser(user.id);
          },
        },
      ]
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
        <PanelHeader title="Blocked Users" onBack={onClose} />

        {displayBlockedUsers.length === 0 ? (
          <EmptyState
            icon={<UserX size={48} color={colors.textTertiary} />}
            title="No blocked users"
            description="Users you block won't be able to message you or see your online status"
          />
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Blocked users cannot send you messages or see when you are online. You can unblock
                them at any time.
              </Text>
            </View>

            <FlatList
              data={displayBlockedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BlockedUserItem
                  blockedUser={item}
                  onUnblock={() => handleUnblock(item.user)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
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
  infoBox: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  blockedUserName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  blockedUserDate: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unblockText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default BlockedUsersPanel;
