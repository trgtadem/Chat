import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';
import {
  // böyle zamanlarda akla tek bi sual geliyor sevdiğini söylerken aslında yalan mı söylüyordu
  ChevronLeft,
  Search,
  MoreVertical,
  X as XIcon,
  Reply,
  Star,
  Copy,
  Forward,
  Trash2,
  Phone,
} from 'lucide-react-native';
import { User } from '../../types';
import { formatLastSeen } from '../../utils';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Theme } from '../../theme';

type SelectionActions = {
  selectedCount: number;
  canReply: boolean;
  canCopy: boolean;
  canForward: boolean;
  canDelete: boolean;
  isStarred: boolean;
  onClearSelection: () => void;
  onReply: () => void;
  onStar: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
};

type ChatHeaderProps = {
  friend: User;
  friendIsTyping: boolean;
  isSearching: boolean;
  searchQuery: string;
  searchResultCount: number;
  onBack: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onSearchChange: (text: string) => void;
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onCall?: () => void;
  selection?: SelectionActions | null;
};

export function ChatHeader({
  friend,
  friendIsTyping,
  isSearching,
  searchQuery,
  searchResultCount,
  onBack,
  onOpenSearch,
  onCloseSearch,
  onSearchChange,
  onOpenMenu,
  onOpenProfile,
  onCall,
  selection,
}: ChatHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const theme = styles.theme;

  if (selection && selection.selectedCount > 0) {
    return (
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={selection.onClearSelection} style={styles.iconBtn}>
          <XIcon size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.selectionCount}>{selection.selectedCount}</Text>
        <View style={styles.selectionActions}>
          {selection.canReply && (
            <TouchableOpacity onPress={selection.onReply} style={styles.iconBtn}>
              <Reply size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={selection.onStar} style={styles.iconBtn}>
            <Star
              size={22}
              color={selection.isStarred ? theme.colors.primary : theme.colors.textPrimary}
              fill={selection.isStarred ? theme.colors.primary : 'transparent'}
            />
          </TouchableOpacity>
          {selection.canCopy && (
            <TouchableOpacity onPress={selection.onCopy} style={styles.iconBtn}>
              <Copy size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          {selection.canForward && (
            <TouchableOpacity onPress={selection.onForward} style={styles.iconBtn}>
              <Forward size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          {selection.canDelete && (
            <TouchableOpacity onPress={selection.onDelete} style={styles.iconBtn}>
              <Trash2 size={22} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (isSearching) {
    return (
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onCloseSearch} style={styles.iconBtn}>
          <XIcon size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Mesajlarda ara..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <Text style={styles.searchResultCount}>{searchResultCount} sonuç</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.chatHeader}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <ChevronLeft size={28} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.profileTap} onPress={onOpenProfile} activeOpacity={0.86}>
        <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {friend.name} {friend.surname}
          </Text>
          <Text style={styles.subtitle}>
            {friendIsTyping
              ? 'yazıyor...'
              : friend.online
                ? 'Online'
                : friend.lastSeen
                  ? formatLastSeen(friend.lastSeen)
                  : 'Offline'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenSearch} style={styles.iconBtn}>
        <Search size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      {onCall ? (
        <TouchableOpacity onPress={onCall} style={styles.iconBtn}>
          <Phone size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={onOpenMenu} style={styles.iconBtn}>
        <MoreVertical size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    theme: { colors: theme.colors, fontScale: theme.fontScale } as any,
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    iconBtn: { padding: 8 },
    profileTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    title: {
      fontSize: 16 * theme.fontScale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    subtitle: { color: theme.colors.textSecondary, fontSize: 12 * theme.fontScale },
    searchInput: {
      flex: 1,
      fontSize: 16 * theme.fontScale,
      color: theme.colors.textPrimary,
      paddingVertical: 8,
    },
    searchResultCount: {
      color: theme.colors.textSecondary,
      fontSize: 12 * theme.fontScale,
      marginRight: 8,
    },
    selectionCount: {
      fontSize: 18 * theme.fontScale,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginHorizontal: 8,
      minWidth: 28,
    },
    selectionActions: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
  });
