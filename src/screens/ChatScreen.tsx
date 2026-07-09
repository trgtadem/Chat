import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as AudioModule from 'expo-audio';
import ImageViewing from 'react-native-image-viewing';

import { User, Message } from '../types';
import { getChatId } from '../utils';
import { SwipeableMessage } from '../components/SwipeableMessage';
import { ChatBackground } from '../components/ChatBackground';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { ChatMenu } from '../components/chat/ChatMenu';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useChatMessages } from '../hooks/useChatMessages';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/media';
import {
  sendTextMessage,
  sendMediaMessage as sendMediaMessageSvc,
  forwardMessage as forwardMessageSvc,
  deleteMessage,
} from '../services/messaging';
import { setTypingStatus, subscribeTyping } from '../services/typing';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({
  route,
  navigation,
}: {
  route: ChatScreenProps['route'];
  navigation: ChatScreenProps['navigation'];
}) {
  const { currentUser, blockUser, isUserBlocked, getChatSettings, themeSettings, isFriend } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { friend, forwardingMessage: routeForwardingMessage } = route.params;
  const me = currentUser;
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const forwardDoneRef = useRef<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  // Otomatik kaydirma kontrolu: ilk acilista en alta in; kullanici yukari
  // kaydirmadiysa yeni mesajda alta in; eski mesaj yuklerken alta zıplama.
  const initialScrollDoneRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const recorderRef = useRef<AudioModule.AudioRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordAutoStopRef = useRef<NodeJS.Timeout | null>(null);

  const chatId = me?.id && friend?.id ? getChatId(me.id, friend.id) : '';
  const isBlocked = friend?.id ? isUserBlocked(friend.id) : false;
  const canMessage = friend?.id ? isFriend(friend.id) && !isBlocked : false;
  const chatWallpaper = getChatSettings(chatId)?.wallpaper ?? themeSettings.globalWallpaper;

  const {
    messages,
    hasMoreMessages,
    messagesWithImages,
    loadOlderMessages,
    isLoadingOlderRef,
  } = useChatMessages(chatId, me?.id ?? '', friend?.id ?? '', canMessage);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((msg) =>
      msg.type === 'text' && msg.text && msg.text.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const handleForwardToCurrentChat = useCallback(
    async (message: Message) => {
      if (!me || !friend?.id) return;
      try {
        const label =
          message.senderId === me.id ? 'You' : (friend?.name ?? 'Unknown');
        await forwardMessageSvc(chatId, me, friend, message, label);
        Alert.alert('Success', 'Message forwarded successfully.');
      } catch (error) {
        console.error('Forward error:', error);
        Alert.alert('Error', 'Failed to forward message.');
      }
    },
    [chatId, me, friend]
  );

  useEffect(() => {
    if (!routeForwardingMessage || !chatId || !canMessage) return;
    const key = routeForwardingMessage.id ?? JSON.stringify(routeForwardingMessage);
    if (forwardDoneRef.current === key) return;
    forwardDoneRef.current = key;
    handleForwardToCurrentChat(routeForwardingMessage);
    navigation.setParams({ forwardingMessage: undefined });
  }, [routeForwardingMessage, chatId, canMessage, handleForwardToCurrentChat, navigation]);

  // Setup header with navigation
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const onLoadOlder = () => {
    isLoadingOlderRef.current = true;
    loadOlderMessages();
  };

  // Kullanicinin listenin en altina yakin olup olmadigini takip et
  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isNearBottomRef.current = distanceFromBottom < 120;
  }, []);

  // Icerik boyutu degisince (mesaj/gorsel yuklenince) en alta in
  const handleContentSizeChange = useCallback(() => {
    if (isLoadingOlderRef.current) {
      // Eski mesaj yukleniyor: konumu koru, alta zıplama
      isLoadingOlderRef.current = false;
      return;
    }
    if (!initialScrollDoneRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });
      initialScrollDoneRef.current = true;
    } else if (isNearBottomRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, []);

  // Listen to typing status (yalnizca mesajlasilabiliyorsa)
  useEffect(() => {
    if (!chatId || !friend?.id || !canMessage || !me?.id) return;
    return subscribeTyping(chatId, friend.id, setFriendIsTyping);
  }, [chatId, friend?.id, canMessage, me?.id]);

  // Ekrandan cikildiginda: typing durumunu sifirla ve tum zamanlayicilari temizle
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (recordAutoStopRef.current) clearTimeout(recordAutoStopRef.current);
      if (chatId && me?.id) {
        setTypingStatus(chatId, me.id, false).catch(() => {});
      }
    };
  }, [chatId, me?.id]);

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          'You need to grant camera roll permissions to send images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const imageUrl = await uploadToCloudinary(result.assets[0].uri);
        await sendMediaMessage('image', { imageUrl });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      if (result.assets && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const fileUrl = await uploadToCloudinary(
          asset.uri,
          asset.name,
          asset.mimeType || 'application/octet-stream',
          'auto'
        );
        await sendMediaMessage('file', {
          fileUrl,
          fileName: asset.name,
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('File picking error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'You need to grant microphone permissions to record audio.'
        );
        return;
      }

      await AudioModule.AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const recorder = AudioModule.AudioModule.createRecorder(
        AudioModule.RecordingPresets.HIGH_QUALITY
      );

      await recorder.record();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto stop after 60 seconds
      recordAutoStopRef.current = setTimeout(() => {
        if (recorderRef.current && recorderRef.current.isRecording) {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    // Kayit sayaci ve otomatik durdurma zamanlayicilarini temizle (sizinti onlenir)
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (recordAutoStopRef.current) {
      clearTimeout(recordAutoStopRef.current);
      recordAutoStopRef.current = null;
    }

    if (!recorderRef.current) return;

    try {
      setIsRecording(false);
      await recorderRef.current.stop();
      const uri = recorderRef.current.uri;
      recorderRef.current = null;
      setRecordingDuration(0);

      if (uri) {
        setIsUploading(true);
        const audioUrl = await uploadToCloudinary(
          uri,
          `audio_${Date.now()}.m4a`,
          'audio/m4a',
          'video'
        );
        await sendMediaMessage('audio', { audioUrl });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to save audio.');
      setIsUploading(false);
    }
  };

  const handleTyping = (text: string) => {
    if (!canMessage || !me?.id) {
      setInputText(text);
      return;
    }
    setInputText(text);

    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus(chatId, me.id, true).catch(console.error);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus(chatId, me.id, false).catch(console.error);
    }, 2000);
  };

  const sendMediaMessage = async (
    type: 'image' | 'audio' | 'file',
    payload: {
      imageUrl?: string | null;
      audioUrl?: string | null;
      fileUrl?: string | null;
      fileName?: string | null;
    }
  ) => {
    if (!me || !friend?.id) return;
    if (isBlocked || !canMessage) {
      Alert.alert('Mesaj gönderilemedi', 'Bu kişiyle mesajlaşmak için arkadaş olmalısınız.');
      return;
    }
    try {
      await sendMediaMessageSvc(chatId, me, friend, type, payload, replyingTo);
      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleSendMessage = async () => {
    if (!me || !friend?.id) return;
    if (isBlocked) {
      Alert.alert('Engellendi', 'Bu kullanıcıyı engellediğin için mesaj gönderemezsin.');
      return;
    }
    if (!canMessage) {
      Alert.alert('Arkadaş değil', 'Bu kişiyle mesajlaşmak için önce arkadaş olmalısınız.');
      return;
    }

    if (!inputText.trim()) return;

    setIsSending(true);
    const textToSend = inputText;
    setInputText('');

    try {
      await sendTextMessage(chatId, me, friend, textToSend, replyingTo);
      setReplyingTo(null);
    } catch (error: any) {
      console.error('Send message error:', error?.message || error?.code || error);
      setInputText(textToSend);
      Alert.alert('Hata', 'Mesaj gonderilemedi. Lutfen tekrar deneyin.');
    } finally {
      setIsSending(false);
    }
  };

  const handleForwardMessage = useCallback(
    (message: Message) => {
      navigation.navigate('Home', { forwardingMessage: message });
    },
    [navigation]
  );

  const handleDeleteMessage = useCallback(
    (message: Message) => {
      Alert.alert('Delete Message', 'Delete this message for everyone?', [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              if (message.imageUrl) await deleteFromCloudinary(message.imageUrl);
              if (message.audioUrl) await deleteFromCloudinary(message.audioUrl);
              if (message.fileUrl) await deleteFromCloudinary(message.fileUrl);
              await deleteMessage(chatId, message.id);
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete message: ' + (error.message || 'Unknown error'));
            }
          },
        },
      ]);
    },
    [chatId]
  );

  const handleImagePress = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <SwipeableMessage
        item={item}
        isMe={item.senderId === me!.id}
        onReply={setReplyingTo}
        onDelete={handleDeleteMessage}
        onForward={handleForwardMessage}
        onImagePress={handleImagePress}
        searchQuery={searchQuery}
      />
    ),
    [me?.id, handleDeleteMessage, handleForwardMessage, handleImagePress, searchQuery]
  );

  // 3 nokta menusu icin acilir liste (dropdown) kontrolu
  const closeMenu = () => setMenuVisible(false);

  const handleBlockUser = () => {
    closeMenu();
    Alert.alert('Kullanıcıyı Engelle', `${friend.name} kişisini engellemek istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: () => {
          blockUser(friend);
          Alert.alert('Tamam', 'Kullanıcı engellendi.');
          navigation.goBack();
        },
      },
    ]);
  };

  const handleGoStarred = () => {
    closeMenu();
    navigation.navigate('StarredMessages', { friend });
  };

  const handleGoWallpaper = () => {
    closeMenu();
    navigation.navigate('ChatWallpaper', { friend });
  };

  const handleViewProfile = () => {
    closeMenu();
    navigation.navigate('Profile', { user: friend });
  };

  // Erken return'ler: tum hook'lar cagrildiktan SONRA (Rules of Hooks)
  if (!currentUser) return null;

  if (!me?.id || !friend?.id) {
    console.error('User or friend ID is missing');
    return <Text style={{ color: 'red' }}>Error: Missing user information</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ChatHeader
          friend={friend}
          friendIsTyping={friendIsTyping}
          isSearching={isSearching}
          searchQuery={searchQuery}
          searchResultCount={filteredMessages.length}
          onBack={() => navigation.goBack()}
          onOpenSearch={() => setIsSearching(true)}
          onCloseSearch={() => {
            setIsSearching(false);
            setSearchQuery('');
          }}
          onSearchChange={setSearchQuery}
          onOpenMenu={() => setMenuVisible(true)}
          onOpenProfile={() => navigation.navigate('Profile', { user: friend })}
        />

        {/* Messages List (duvar kagidi arka planiyla) */}
        <ChatBackground wallpaper={chatWallpaper} theme={theme} style={{ flex: 1 }}>
          {isSearching && searchQuery.length > 0 && filteredMessages.length === 0 ? (
            <View style={styles.emptySearch}>
              <Search size={40} color={theme.colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={styles.emptySearchText}>Sonuç bulunamadı</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 * theme.fontScale }}>"{searchQuery}" için eşleşme yok</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredMessages}
              ListHeaderComponent={
                hasMoreMessages && !isSearching ? (
                  <TouchableOpacity
                    onPress={onLoadOlder}
                    style={styles.loadMoreButton}
                  >
                    <Text style={styles.loadMoreText}>↑ Daha eski mesajları yükle</Text>
                  </TouchableOpacity>
                ) : null
              }
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
              initialNumToRender={15}
              maxToRenderPerBatch={12}
              windowSize={11}
              removeClippedSubviews
            />
          )}
        </ChatBackground>

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyingTo.senderId === me.id ? 'yourself' : (friend?.name ?? 'Friend')}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.type === 'text'
                  ? (replyingTo.text ?? '')
                  : `[${replyingTo.type.toUpperCase()}]`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.replyClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        {isBlocked ? (
          <View style={styles.blockedInfoBar}>
            <Text style={styles.blockedInfoText}>Bu kullanıcıyı engelledin. Mesaj gönderimi kapalı.</Text>
          </View>
        ) : !canMessage ? (
          <View style={styles.notFriendBar}>
            <Text style={styles.notFriendText}>
              Bu kişiyle mesajlaşmak için arkadaş olmanız gerekir.
            </Text>
          </View>
        ) : null}
        <ChatInputBar
          inputText={inputText}
          onChangeText={handleTyping}
          onSend={handleSendMessage}
          onPickImage={handlePickImage}
          onPickFile={handlePickFile}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isUploading={isUploading}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isSending={isSending}
          disabled={isBlocked || !canMessage}
        />
      </KeyboardAvoidingView>

      <ChatMenu
        visible={menuVisible}
        onClose={closeMenu}
        onViewProfile={handleViewProfile}
        onGoStarred={handleGoStarred}
        onGoWallpaper={handleGoWallpaper}
        onBlockUser={handleBlockUser}
      />

      {/* Image Viewer Modal */}
      <ImageViewing
        images={messagesWithImages.map((url) => ({ uri: url }))}
        imageIndex={messagesWithImages.indexOf(selectedImageUrl)}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.background },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    chatProfileTapArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 46,
    },
    chatAvatar: { width: 40, height: 40, borderRadius: t.radius.pill, marginHorizontal: 12 },
    chatTitle: { fontSize: 18 * t.fontScale, fontWeight: 'bold', color: t.colors.textPrimary },
    blockedInfoBar: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    blockedInfoText: {
      color: '#fecaca',
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      textAlign: 'center',
    },
    notFriendBar: {
      backgroundColor: t.colors.surfaceAlt,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: t.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    notFriendText: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
      textAlign: 'center',
    },
    inputWrapper: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.colors.headerBackground,
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      gap: 8,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      paddingLeft: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    attachButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    chatInput: {
      flex: 1,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      maxHeight: 110,
    },
    sendButton: {
      backgroundColor: t.colors.primary,
      width: 46,
      height: 46,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordButton: {
      backgroundColor: 'transparent',
      width: 46,
      height: 46,
      borderRadius: t.radius.pill,
      borderWidth: 2,
      borderColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopButton: {
      backgroundColor: t.colors.error,
    },
    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.md,
      gap: 8,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.error,
    },
    recordingText: {
      color: t.colors.textPrimary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
    replyPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: t.colors.surface,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      justifyContent: 'space-between',
    },
    replyContent: {
      flex: 1,
    },
    replyLabel: {
      fontSize: 12 * t.fontScale,
      color: t.colors.textSecondary,
      marginBottom: 4,
    },
    replyText: {
      fontSize: 14 * t.fontScale,
      color: t.colors.textPrimary,
      fontWeight: '500',
    },
    replyClose: {
      fontSize: 20,
      color: t.colors.textSecondary,
      paddingHorizontal: 8,
    },
    loadMoreButton: {
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadMoreText: {
      color: t.colors.primary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
    // ─── Search ──────────────────────────────────────────────────────────────
    searchInput: {
      flex: 1,
      height: 40,
      paddingHorizontal: 14,
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.pill,
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      marginHorizontal: 4,
    },
    searchResultCount: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      minWidth: 48,
      textAlign: 'right',
      paddingRight: 4,
    },
    emptySearch: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptySearchText: {
      fontSize: 18 * t.fontScale,
      fontWeight: '600',
      color: t.colors.textPrimary,
      marginBottom: 6,
    },
    // ─── 3 nokta acilir menu ──────────────────────────────────────────────────
    menuOverlay: {
      flex: 1,
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? 96 : 56,
      paddingHorizontal: 10,
    },
    menuContainer: {
      minWidth: 210,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: t.colors.border,
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    menuItemText: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
      fontWeight: '500',
    },
    menuDivider: {
      height: 1,
      backgroundColor: t.colors.border,
      marginVertical: 4,
    },
  });
