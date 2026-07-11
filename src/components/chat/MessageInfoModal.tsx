import React, { useMemo } from 'react';
import { Modal, Pressable, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Message } from '../../types';
import { useTheme } from '../../context/AppContext';
import { Theme } from '../../theme';
import { formatTime } from '../../utils';

type Props = {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
};

function formatTs(ts: any): string {
  if (!ts) return '—';
  try {
    return formatTime(ts);
  } catch {
    return '—';
  }
}

export function MessageInfoModal({ visible, message, onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!message) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Mesaj bilgisi</Text>
          <Row label="Gönderildi" value={formatTs(message.createdAt)} styles={styles} />
          <Row label="İletildi" value={formatTs(message.deliveredAt)} styles={styles} />
          <Row label="Okundu" value={formatTs(message.readAt)} styles={styles} />
          <Row
            label="Durum"
            value={
              message.status === 'read'
                ? 'Okundu'
                : message.status === 'delivered'
                  ? 'İletildi'
                  : 'Gönderildi'
            }
            styles={styles}
          />
          {message.editedAt ? (
            <Row label="Düzenlendi" value={formatTs(message.editedAt)} styles={styles} />
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Tamam</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: t.colors.overlay ?? 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    title: {
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textPrimary,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    label: { color: t.colors.textSecondary, fontSize: 14 * t.fontScale },
    value: { color: t.colors.textPrimary, fontSize: 14 * t.fontScale, fontWeight: '600' },
    btn: {
      marginTop: 12,
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700' },
  });
