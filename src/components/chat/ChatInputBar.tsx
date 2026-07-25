import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Send, Plus, Mic, Image as ImageIcon } from 'lucide-react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Theme } from '../../theme';
import { Message } from '../../types';
import { getDraft, setDraft } from '../../services/chatList';

type ChatInputBarProps = {
  chatId: string;
  editingMessage: Message | null;
  onCancelEdit?: () => void;
  /** Parent'a metin gonderme — state parent'ta tutulmaz */
  onSendText: (text: string) => Promise<void> | void;
  /** Yazma aktivitesi (typing indicator) — metin degil boolean */
  onTypingActivity: (hasText: boolean) => void;
  onPickImage: () => void;
  onPickFile: () => void;
  onPickVideo?: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isUploading: boolean;
  isRecording: boolean;
  recordingDuration: number;
  isSending: boolean;
  disabled: boolean;
};

/**
 * Metin state'i burada — ChatScreen her tus vurusunda yeniden cizilmez.
 */
export function ChatInputBar({
  chatId,
  editingMessage,
  onCancelEdit,
  onSendText,
  onTypingActivity,
  onPickImage,
  onPickFile,
  onPickVideo,
  onStartRecording,
  onStopRecording,
  isUploading,
  isRecording,
  recordingDuration,
  isSending,
  disabled,
}: ChatInputBarProps) {
  const styles = useThemedStyles(makeStyles);
  const theme = styles.theme;
  const [text, setText] = useState('');
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editing = !!editingMessage;

  // Taslak yukle (edit degilken)
  useEffect(() => {
    if (!chatId || editingMessage) return;
    let cancelled = false;
    getDraft(chatId).then((d) => {
      if (!cancelled && d) setText(d);
    });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Duzenleme modu
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text ?? '');
    }
  }, [editingMessage?.id]);

  // Taslak kaydet
  useEffect(() => {
    if (!chatId || editing) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      void setDraft(chatId, text);
    }, 400);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [text, chatId, editing]);

  const handleChange = useCallback(
    (next: string) => {
      setText(next);
      onTypingActivity(Boolean(next.trim()));
    },
    [onTypingActivity]
  );

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;
    try {
      await onSendText(trimmed);
      setText('');
      onTypingActivity(false);
      if (chatId && !editing) void setDraft(chatId, '');
      if (editing) onCancelEdit?.();
    } catch {
      /* parent toast */
    }
  }, [text, isSending, disabled, onSendText, onTypingActivity, chatId, editing, onCancelEdit]);

  return (
    <View style={styles.outer}>
      {editing ? (
        <View style={styles.editingRow}>
          <Text style={styles.editingHint}>Mesajı düzenliyorsun</Text>
          <TouchableOpacity onPress={onCancelEdit}>
            <Text style={styles.editingCancel}>İptal</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onPickImage}
            disabled={disabled || isUploading || isRecording || editing}
            accessibilityLabel="Fotoğraf gönder"
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
            ) : (
              <ImageIcon size={22} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            placeholder={editing ? 'Düzenlenen mesaj...' : 'Bir mesaj yaz...'}
            placeholderTextColor={theme.colors.textSecondary}
            value={text}
            onChangeText={handleChange}
            multiline
            editable={!isRecording && !disabled}
          />

          <TouchableOpacity
            style={styles.attachButton}
            onPress={onPickFile}
            onLongPress={onPickVideo}
            delayLongPress={400}
            disabled={disabled || isUploading || isRecording || editing}
            accessibilityLabel="Dosya veya video"
          >
            <Plus size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isRecording ? (
          <>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>{recordingDuration}s</Text>
            </View>
            <TouchableOpacity style={[styles.sendButton, styles.stopButton]} onPress={onStopRecording}>
              <Text style={styles.stopLabel}>Stop</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={onStartRecording}
              disabled={disabled || editing}
            >
              <Mic size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                (isSending || !text.trim() || disabled) && { opacity: 0.5 },
              ]}
              disabled={isSending || !text.trim() || disabled}
            >
              <Send size={24} color={theme.colors.onAccent} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    theme: { colors: theme.colors } as any,
    outer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    editingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    editingHint: {
      fontSize: 12 * theme.fontScale,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    editingCancel: {
      fontSize: 13 * theme.fontScale,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.xl,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    attachButton: { padding: 8 },
    chatInput: {
      flex: 1,
      maxHeight: 100,
      fontSize: 16 * theme.fontScale,
      color: theme.colors.textPrimary,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    recordButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    stopButton: { backgroundColor: theme.colors.error },
    stopLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.error,
    },
    recordingText: { color: theme.colors.textSecondary, fontSize: 13 * theme.fontScale },
  });
