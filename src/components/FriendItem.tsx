import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { User } from '../types';
import { COLORS } from '../styles/baseStyles';
import { formatTime, formatLastSeen } from '../utils';

// OR a User object (for users without existing chats).
export const FriendItem = ({ item, currentUser, onSelect }: { item: any; currentUser: User; onSelect: (u: any) => void }) => {
  // Conditionally access lastMessage and unreadCount
  const lastMessage = item.isChat ? item.lastMessage : undefined;
  const unreadCount = item.isChat ? (item.unreadCount || 0) : 0;
  const friend = item.isChat ? item.friendUser : item; // The actual friend User object

  return (
    <TouchableOpacity style={styles.friendItem} onPress={() => onSelect(item)}>
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

const styles = StyleSheet.create({
    friendItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.inputBackground },
    avatarContainer: { position: "relative", marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    onlineIndicator: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.background },
    friendInfo: { flex: 1, justifyContent: 'center' },
    friendNameContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    friendName: { fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
    timestamp: { fontSize: 12, color: COLORS.textSecondary },
    lastMessageContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14, color: COLORS.textSecondary, flex: 1, marginRight: 8 },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },
    unreadText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
});
