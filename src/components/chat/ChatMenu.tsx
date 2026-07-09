import React from 'react';
import { Modal, Pressable, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ban, Star, Image as ImageIcon, UserRound } from 'lucide-react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Theme } from '../../theme';

type ChatMenuProps = {
  visible: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onGoStarred: () => void;
  onGoWallpaper: () => void;
  onBlockUser: () => void;
};

export function ChatMenu({
  visible,
  onClose,
  onViewProfile,
  onGoStarred,
  onGoWallpaper,
  onBlockUser,
}: ChatMenuProps) {
  const styles = useThemedStyles(makeStyles);
  const theme = styles.theme;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={onViewProfile}>
            <UserRound size={18} color={theme.colors.textPrimary} />
            <Text style={styles.menuItemText}>Profili Görüntüle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onGoStarred}>
            <Star size={18} color={theme.colors.textPrimary} />
            <Text style={styles.menuItemText}>Yıldızlı Mesajlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onGoWallpaper}>
            <ImageIcon size={18} color={theme.colors.textPrimary} />
            <Text style={styles.menuItemText}>Duvar Kağıdı</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={onBlockUser}>
            <Ban size={18} color={theme.colors.error} />
            <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Kullanıcıyı Engelle</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    theme: { colors: theme.colors } as any,
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 56,
      paddingRight: 12,
    },
    menuContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      minWidth: 220,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuItemText: {
      fontSize: 15 * theme.fontScale,
      color: theme.colors.textPrimary,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
  });
