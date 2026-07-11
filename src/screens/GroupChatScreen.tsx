import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Send } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { useFeedback } from '../feedback/FeedbackContext';
import { getGroup, sendGroupText, subscribeGroupMessages } from '../services/groups';
import { Message } from '../types';

type GroupChatScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupChat'>;

export function GroupChatScreen({ route, navigation }: GroupChatScreenProps) {
  const { groupId, groupName } = route.params;
  const { currentUser } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    return subscribeGroupMessages(groupId, setMessages);
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const group = await getGroup(groupId);
      if (!cancelled && group?.memberIds) {
        setMemberIds(group.memberIds);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !currentUser || sending) return;

    setSending(true);
    setInputText('');
    try {
      await sendGroupText(groupId, currentUser, text, memberIds);
    } catch (e) {
      console.error('sendGroupText', e);
      toast.error('Mesaj gönderilemedi.');
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, currentUser, sending, groupId, memberIds, toast]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.id;
    return (
      <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {item.text ?? ''}
          </Text>
        </View>
      </View>
    );
  };

  if (!currentUser) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {}}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={theme.colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      marginHorizontal: 8,
    },
    messageList: {
      padding: 16,
      paddingBottom: 8,
    },
    bubbleRow: {
      marginBottom: 8,
      flexDirection: 'row',
    },
    bubbleRowMe: {
      justifyContent: 'flex-end',
    },
    bubbleRowOther: {
      justifyContent: 'flex-start',
    },
    bubble: {
      maxWidth: '80%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: t.radius.lg,
    },
    bubbleMe: {
      backgroundColor: t.colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
      lineHeight: 20,
    },
    bubbleTextMe: {
      color: '#fff',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
      gap: 8,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
