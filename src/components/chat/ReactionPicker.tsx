import React, { useMemo } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { REACTION_EMOJIS } from '../../services/messageActions';
import { useTheme } from '../../context/AppContext';
import { Theme } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  onClear?: () => void;
  onInfo?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
};

export function ReactionPicker({
  visible,
  onClose,
  onSelect,
  onClear,
  onInfo,
  onEdit,
  canEdit,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.row}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => {
                  onSelect(emoji);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            {onInfo ? (
              <TouchableOpacity
                style={styles.action}
                onPress={() => {
                  onInfo();
                  onClose();
                }}
              >
                <Text style={styles.actionText}>Bilgi</Text>
              </TouchableOpacity>
            ) : null}
            {canEdit && onEdit ? (
              <TouchableOpacity
                style={styles.action}
                onPress={() => {
                  onEdit();
                  onClose();
                }}
              >
                <Text style={styles.actionText}>Düzenle</Text>
              </TouchableOpacity>
            ) : null}
            {onClear ? (
              <TouchableOpacity
                style={styles.action}
                onPress={() => {
                  onClear();
                  onClose();
                }}
              >
                <Text style={[styles.actionText, { color: theme.colors.error }]}>Tepkiyi kaldır</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: t.colors.surface,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      padding: 16,
      paddingBottom: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    emojiBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    emoji: { fontSize: 24 },
    actions: { gap: 4 },
    action: { paddingVertical: 12, alignItems: 'center' },
    actionText: {
      fontSize: 16 * t.fontScale,
      fontWeight: '600',
      color: t.colors.textPrimary,
    },
  });
