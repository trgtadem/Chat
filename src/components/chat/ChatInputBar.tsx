import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Paperclip, Send, Plus, Mic } from 'lucide-react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Theme } from '../../theme';

type ChatInputBarProps = {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onPickFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isUploading: boolean;
  isRecording: boolean;
  recordingDuration: number;
  isSending: boolean;
  disabled: boolean;
};

export function ChatInputBar({
  inputText,
  onChangeText,
  onSend,
  onPickImage,
  onPickFile,
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

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={onPickImage}
          disabled={disabled || isUploading || isRecording}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          ) : (
            <Paperclip size={22} color={theme.colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.chatInput}
          placeholder="Bir mesaj yaz..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={onChangeText}
          multiline
          editable={!isRecording && !disabled}
        />

        <TouchableOpacity
          style={styles.attachButton}
          onPress={onPickFile}
          disabled={disabled || isUploading || isRecording}
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
            disabled={disabled}
          >
            <Mic size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSend}
            style={[styles.sendButton, (isSending || !inputText.trim() || disabled) && { opacity: 0.5 }]}
            disabled={isSending || !inputText.trim() || disabled}
          >
            <Send size={24} color={theme.colors.onAccent} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    theme: { colors: theme.colors } as any,
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
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
