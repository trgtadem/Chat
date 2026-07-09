import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { User } from '../types';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { formatTime, formatLastSeen } from '../utils';

// OR a User object (for users without existing chats).
const FriendItemComponent = ({ item, currentUser, onSelect }: { item: any; currentUser: User; onSelect: (u: any) => void }) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Conditionally access lastMessage and unreadCount
  const lastMessage = item.isChat ? item.lastMessage : undefined;
  const unreadCount = item.isChat ? (item.unreadCount || 0) : 0;
  const friend = item.isChat ? item.friendUser : item; // The actual friend User object

  return (
    <TouchableOpacity style={styles.friendItem} onPress={() => onSelect(item)} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: friend?.avatar ?? 'https://via.placeholder.com/50' }} style={styles.avatar} />
        {friend?.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.friendNameContainer}>
          <Text style={styles.friendName}>{(friend?.name ?? 'Unknown')} {(friend?.surname ?? '')}</Text>
          {lastMessage && lastMessage.createdAt ? (
            <Text style={styles.timestamp}>{formatTime(lastMessage.createdAt)}</Text>
          ) : friend?.lastSeen && !friend?.online ? (
            <Text style={styles.timestamp}>{formatLastSeen(friend.lastSeen)}</Text>
          ) : null}
        </View>
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage ? (lastMessage.senderId === currentUser.id ? 'Siz: ' + (lastMessage.text ?? 'Resim/Dosya') : (lastMessage.text ?? 'Resim/Dosya')) : 'Sohbet başlatın'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FriendItem = React.memo(FriendItemComponent);

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: t.radius.pill },
    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: t.colors.success,
      borderWidth: 2,
      borderColor: t.colors.surface,
    },
    friendInfo: { flex: 1, justifyContent: 'center' },
    friendNameContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    friendName: { fontSize: 16 * t.fontScale, fontWeight: 'bold', color: t.colors.textPrimary },
    timestamp: { fontSize: 12 * t.fontScale, color: t.colors.textSecondary },
    lastMessageContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14 * t.fontScale, color: t.colors.textSecondary, flex: 1, marginRight: 8 },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: { color: '#FFFFFF', fontSize: 10 * t.fontScale, fontWeight: 'bold' },
  });
