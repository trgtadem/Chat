import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';
import { ChevronLeft, Search, MoreVertical, X as XIcon } from 'lucide-react-native';
import { User } from '../../types';
import { formatLastSeen } from '../../utils';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Theme } from '../../theme';

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
}: ChatHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const theme = styles.theme;

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
  });
