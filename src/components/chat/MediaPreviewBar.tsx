import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Send, X, Film } from 'lucide-react-native';

import { useTheme } from '../../context/AppContext';
import { Theme } from '../../theme';

export type PendingMedia = {
  uri: string;
  kind: 'image' | 'video';
  fileName?: string | null;
  mimeType?: string | null;
};

type Props = {
  media: PendingMedia;
  sending: boolean;
  onCancel: () => void;
  onSend: (caption: string) => void;
};

/** WhatsApp benzeri: secilen medya + yazi, sonra gonder */
export function MediaPreviewBar({ media, sending, onCancel, onSend }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [caption, setCaption] = useState('');

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.thumbWrap}>
          {media.kind === 'image' ? (
            <Image
              source={{ uri: media.uri }}
              style={styles.thumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.videoThumb]}>
              <Film size={28} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.right}>
          <Text style={styles.label}>
            {media.kind === 'image' ? 'Fotoğraf' : 'Video'}
          </Text>
          <TextInput
            style={styles.caption}
            placeholder="Bir yazı ekle..."
            placeholderTextColor={theme.colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            editable={!sending}
            multiline
            maxLength={2000}
          />
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onCancel}
          disabled={sending}
          accessibilityLabel="İptal"
        >
          <X size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.sendBtn, sending && { opacity: 0.7 }]}
        onPress={() => onSend(caption.trim())}
        disabled={sending}
        activeOpacity={0.85}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Send size={18} color="#fff" />
            <Text style={styles.sendText}>Gönder</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: t.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 8,
      gap: 10,
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    thumbWrap: {
      borderRadius: t.radius.md,
      overflow: 'hidden',
    },
    thumb: {
      width: 72,
      height: 72,
      backgroundColor: t.colors.surfaceAlt,
    },
    videoThumb: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111',
    },
    right: { flex: 1, minHeight: 72 },
    label: {
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
      color: t.colors.textSecondary,
      marginBottom: 4,
    },
    caption: {
      flex: 1,
      minHeight: 40,
      maxHeight: 80,
      fontSize: 15 * t.fontScale,
      color: t.colors.textPrimary,
      padding: 0,
    },
    iconBtn: { padding: 4 },
    sendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      paddingVertical: 12,
    },
    sendText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
  });
