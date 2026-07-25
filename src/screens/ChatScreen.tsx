import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import ImageViewing from 'react-native-image-viewing';

import * as Clipboard from 'expo-clipboard';

import { User, Message } from '../types';
import { getChatId } from '../utils';
import { SwipeableMessage } from '../components/SwipeableMessage';
import { ChatBackground } from '../components/ChatBackground';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { MediaPreviewBar, PendingMedia } from '../components/chat/MediaPreviewBar';
import { ChatMenu } from '../components/chat/ChatMenu';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useChatMessages } from '../hooks/useChatMessages';
import { useUserPresence } from '../hooks/useUserPresence';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/media';
import {
  sendTextMessage,
  sendMediaMessage as sendMediaMessageSvc,
  forwardMessage as forwardMessageSvc,
} from '../services/messaging';
import {
  setMessageReaction,
  editMessageText,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from '../services/messageActions';
import { setTypingStatus, subscribeTyping } from '../services/typing';
import { subscribeStarredIds, toggleStarMessage } from '../services/starred';
import { isChatMuted, muteChat, unmuteChat } from '../services/mutedChats';
import { useFeedback } from '../feedback/FeedbackContext';
import { ReactionPicker } from '../components/chat/ReactionPicker';
import { MessageInfoModal } from '../components/chat/MessageInfoModal';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({
  route,
  navigation,
}: {
  route: ChatScreenProps['route'];
  navigation: ChatScreenProps['navigation'];
}) {
  const { currentUser, blockUser, isUserBlocked, getChatSettings, themeSettings, isFriend } = useAppContext();
  const { toast, confirm } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {
    friend: routeFriend,
    forwardingMessage: routeForwardingMessage,
    focusMessageId,
  } = route.params;
  const me = currentUser;
  const { user: liveFriend } = useUserPresence(routeFriend?.id);
  const friend = useMemo(() => {
    if (!routeFriend) return routeFriend;
    if (!liveFriend) return routeFriend;
    return {
      ...routeFriend,
      ...liveFriend,
      id: routeFriend.id,
      name: liveFriend.name || routeFriend.name,
      surname: liveFriend.surname || routeFriend.surname,
      avatar: liveFriend.avatar || routeFriend.avatar,
      online: liveFriend.online,
      lastSeen: liveFriend.lastSeen,
    };
  }, [routeFriend, liveFriend]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [chatMuted, setChatMuted] = useState(false);
  const [reactionTarget, setReactionTarget] = useState<Message | null>(null);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const forwardDoneRef = useRef<string | null>(null);
  const focusDoneRef = useRef<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  // Otomatik kaydirma kontrolu: ilk acilista en alta in; kullanici yukari
  // kaydirmadiysa yeni mesajda alta in; eski mesaj yuklerken alta zıplama.
  const initialScrollDoneRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isRecordingSessionRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingWriteRef = useRef(0);
  const isTypingRef = useRef(false);
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

  const selectionMode = selectedIds.size > 0;

  const selectedMessages = useMemo(
    () => messages.filter((m) => selectedIds.has(m.id)),
    [messages, selectedIds]
  );

  useEffect(() => {
    if (!me?.id || !friend?.id) {
      setStarredIds(new Set());
      return;
    }
    return subscribeStarredIds(me.id, friend.id, setStarredIds);
  }, [me?.id, friend?.id]);

  useEffect(() => {
    if (!me?.id || !friend?.id) {
      setChatMuted(false);
      return;
    }
    isChatMuted(me.id, friend.id)
      .then(setChatMuted)
      .catch(() => setChatMuted(false));
  }, [me?.id, friend?.id]);

  // Yildizli mesaj / arama: hedef mesaja kaydir
  useEffect(() => {
    if (!focusMessageId || !messages.length) return;
    if (focusDoneRef.current === focusMessageId) return;
    const index = messages.findIndex((m) => m.id === focusMessageId);
    if (index < 0) return;
    focusDoneRef.current = focusMessageId;
    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
      } catch {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    });
    navigation.setParams({ focusMessageId: undefined });
  }, [focusMessageId, messages, navigation]);

  // Arama: filtreleme yok, ilk eslesmeye kaydir (vurgulama SwipeableMessage'da)
  useEffect(() => {
    if (!isSearching || !searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    const index = messages.findIndex(
      (msg) => msg.type === 'text' && msg.text && msg.text.toLowerCase().includes(q)
    );
    if (index < 0) return;
    try {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    } catch {
      /* ignore */
    }
  }, [searchQuery, isSearching, messages]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleSelect = useCallback((message: Message) => {
    if (message.isDeleted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) next.delete(message.id);
      else next.add(message.id);
      return next;
    });
  }, []);

  const handleReplyFromSwipe = useCallback((message: Message) => {
    setReplyingTo(message);
    setSelectedIds(new Set());
  }, []);

  const handleForwardToCurrentChat = useCallback(
    async (message: Message) => {
      if (!me || !friend?.id) return;
      try {
        const label =
          message.senderId === me.id ? 'Sen' : (friend?.name ?? 'Bilinmeyen');
        await forwardMessageSvc(chatId, me, friend, message, label);
        toast.success('Mesaj iletildi.');
      } catch (error) {
        console.error('Forward error:', error);
        toast.error('Mesaj iletilemedi.');
      }
    },
    [chatId, me, friend, toast]
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

  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isTypingRef.current = false;
    if (chatId && me?.id) {
      setTypingStatus(chatId, me.id, false).catch(() => {});
    }
  }, [chatId, me?.id]);

  const clearTypingRemoteOnly = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isTypingRef.current = false;
    if (chatId && me?.id) {
      setTypingStatus(chatId, me.id, false).catch(() => {});
    }
  }, [chatId, me?.id]);

  /** Kaydi iptal et — gonderme (arka plan / unmount) */
  const discardRecording = useCallback(async () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (recordAutoStopRef.current) {
      clearTimeout(recordAutoStopRef.current);
      recordAutoStopRef.current = null;
    }
    const wasRecording = isRecordingSessionRef.current || audioRecorder.isRecording;
    isRecordingSessionRef.current = false;
    setIsRecording(false);
    setRecordingDuration(0);
    if (!wasRecording) return;
    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch (e) {
      console.warn('discardRecording stop error:', e);
    }
  }, [audioRecorder]);

  // AppState: arka plana inince typing + kayit temizle
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') return;
      clearTyping();
      void discardRecording();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [clearTyping, discardRecording]);

  // Navigasyon blur (profil vb.): typing temizle
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      clearTyping();
    });
    return unsub;
  }, [navigation, clearTyping]);

  // Unmount / beforeRemove: typing + kayit (setState yok — remote only)
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      clearTypingRemoteOnly();
      void discardRecording();
    });
    return () => {
      unsub();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (recordAutoStopRef.current) clearTimeout(recordAutoStopRef.current);
      clearTypingRemoteOnly();
      void discardRecording();
    };
  }, [navigation, clearTypingRemoteOnly, discardRecording]);

  const handlePickImage = useCallback(async () => {
    if (!me || !friend?.id) return;
    if (isBlocked || !canMessage) {
      toast.warning('Bu kişiyle mesajlaşmak için arkadaş olmalısınız.', 'Mesaj gönderilemedi');
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.info('Görsel göndermek için galeri izni vermelisin.', 'İzin gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPendingMedia({
        uri: asset.uri,
        kind: 'image',
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (error) {
      console.error('Image picking error:', error);
      toast.error('Görsel seçilemedi.');
    }
  }, [me, friend, isBlocked, canMessage, toast]);

  const handlePickVideo = useCallback(async () => {
    if (!me || !friend?.id) return;
    if (isBlocked || !canMessage) {
      toast.warning('Bu kişiyle mesajlaşmak için arkadaş olmalısınız.', 'Mesaj gönderilemedi');
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.info('Video göndermek için galeri izni vermelisin.', 'İzin gerekli');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 120,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPendingMedia({
        uri: asset.uri,
        kind: 'video',
        fileName: `video_${Date.now()}.mp4`,
        mimeType: asset.mimeType || 'video/mp4',
      });
    } catch (error) {
      console.error('Video picking error:', error);
      toast.error('Video seçilemedi.');
    }
  }, [me, friend, isBlocked, canMessage, toast]);

  const handleSendPendingMedia = useCallback(
    async (caption: string) => {
      if (!pendingMedia || !me || !friend?.id || isUploading) return;
      setIsUploading(true);
      try {
        if (pendingMedia.kind === 'image') {
          const uploaded = await uploadToCloudinary(
            pendingMedia.uri,
            pendingMedia.fileName || `image_${Date.now()}.jpg`,
            pendingMedia.mimeType || 'image/jpeg',
            'image'
          );
          if (!uploaded?.url) throw new Error('Upload URL yok');
          await sendMediaMessageSvc(
            chatId,
            me,
            friend,
            'image',
            {
              imageUrl: uploaded.url,
              cloudinaryDeleteToken: uploaded.deleteToken ?? null,
              text: caption || null,
            },
            replyingTo
          );
        } else {
          const uploaded = await uploadToCloudinary(
            pendingMedia.uri,
            pendingMedia.fileName || `video_${Date.now()}.mp4`,
            pendingMedia.mimeType || 'video/mp4',
            'video'
          );
          if (!uploaded?.url) throw new Error('Upload URL yok');
          await sendMediaMessageSvc(
            chatId,
            me,
            friend,
            'video',
            {
              videoUrl: uploaded.url,
              cloudinaryDeleteToken: uploaded.deleteToken ?? null,
              text: caption || null,
            },
            replyingTo
          );
        }
        setReplyingTo(null);
        setPendingMedia(null);
      } catch (error) {
        console.error('Media send error:', error);
        toast.error('Medya gönderilemedi. Lütfen tekrar dene.');
      } finally {
        setIsUploading(false);
      }
    },
    [pendingMedia, me, friend, isUploading, chatId, replyingTo, toast]
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      if (result.assets && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const uploaded = await uploadToCloudinary(
          asset.uri,
          asset.name,
          asset.mimeType || 'application/octet-stream',
          'auto'
        );
        await sendMediaMessage('file', {
          fileUrl: uploaded.url,
          fileName: asset.name,
          cloudinaryDeleteToken: uploaded.deleteToken ?? null,
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('File picking error:', error);
      toast.error('Dosya yüklenemedi. Lütfen tekrar dene.');
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (isRecordingSessionRef.current || audioRecorder.isRecording) return;

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.info('Ses kaydı için mikrofon izni vermelisin.', 'İzin gerekli');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingSessionRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto stop after 60 seconds
      recordAutoStopRef.current = setTimeout(() => {
        if (isRecordingSessionRef.current) {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error('Recording error:', error);
      isRecordingSessionRef.current = false;
      setIsRecording(false);
      toast.error('Kayıt başlatılamadı.');
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

    if (!isRecordingSessionRef.current && !audioRecorder.isRecording) return;

    try {
      isRecordingSessionRef.current = false;
      setIsRecording(false);
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
      const uri = audioRecorder.uri;
      setRecordingDuration(0);

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (uri) {
        setIsUploading(true);
        const uploaded = await uploadToCloudinary(
          uri,
          `audio_${Date.now()}.m4a`,
          'audio/m4a',
          'video'
        );
        await sendMediaMessage('audio', {
          audioUrl: uploaded.url,
          cloudinaryDeleteToken: uploaded.deleteToken ?? null,
        });
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast.error('Ses kaydı kaydedilemedi.');
      setIsUploading(false);
      isRecordingSessionRef.current = false;
      setIsRecording(false);
    }
  };

  const handleTypingActivity = useCallback(
    (hasText: boolean) => {
      if (!canMessage || !me?.id || !chatId) {
        if (!hasText) clearTyping();
        return;
      }
      if (!hasText) {
        clearTyping();
        return;
      }
      const now = Date.now();
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        lastTypingWriteRef.current = now;
        setTypingStatus(chatId, me.id, true).catch(console.error);
      } else if (now - lastTypingWriteRef.current > 2000) {
        lastTypingWriteRef.current = now;
        setTypingStatus(chatId, me.id, true).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setTypingStatus(chatId, me.id, false).catch(console.error);
      }, 2000);
    },
    [canMessage, me?.id, chatId, clearTyping]
  );

  const sendMediaMessage = async (
    type: 'image' | 'audio' | 'file' | 'video',
    payload: {
      imageUrl?: string | null;
      audioUrl?: string | null;
      fileUrl?: string | null;
      videoUrl?: string | null;
      fileName?: string | null;
      cloudinaryDeleteToken?: string | null;
    }
  ) => {
    if (!me || !friend?.id) return;
    if (isBlocked || !canMessage) {
      toast.warning('Bu kişiyle mesajlaşmak için arkadaş olmalısınız.', 'Mesaj gönderilemedi');
      return;
    }
    try {
      await sendMediaMessageSvc(chatId, me, friend, type, payload, replyingTo);
      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Mesaj gönderilemedi.');
    }
  };

  const handleSendText = useCallback(
    async (textToSend: string) => {
      if (!me || !friend?.id) return;
      if (isBlocked) {
        toast.warning('Bu kullanıcıyı engellediğin için mesaj gönderemezsin.', 'Engellendi');
        throw new Error('blocked');
      }
      if (!canMessage) {
        toast.warning('Bu kişiyle mesajlaşmak için önce arkadaş olmalısınız.', 'Arkadaş değil');
        throw new Error('not_friend');
      }

      clearTyping();
      setIsSending(true);
      try {
        if (editingMessage) {
          await editMessageText(chatId, editingMessage.id, textToSend.trim());
          setEditingMessage(null);
          toast.success('Mesaj düzenlendi.');
        } else {
          await sendTextMessage(chatId, me, friend, textToSend, replyingTo);
          setReplyingTo(null);
        }
      } catch (error: any) {
        console.error('Send message error:', error?.message || error?.code || error);
        toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [
      me,
      friend,
      isBlocked,
      canMessage,
      clearTyping,
      editingMessage,
      chatId,
      replyingTo,
      toast,
    ]
  );

  const handleForwardMessage = useCallback(
    (message: Message) => {
      clearSelection();
      navigation.navigate('Home', { forwardingMessage: message });
    },
    [navigation, clearSelection]
  );

  const handleDeleteMessage = useCallback(
    async (message: Message) => {
      try {
        if (message.senderId === me?.id) {
          const everyone = await confirm({
            title: 'Mesajı Sil',
            message: 'Herkes için silmek ister misin? İptal edersen yalnızca senden silinir.',
            confirmLabel: 'Herkes için sil',
            cancelLabel: 'Benden sil',
            destructive: true,
          });
          if (everyone) {
            const token = message.cloudinaryDeleteToken;
            if (message.imageUrl) await deleteFromCloudinary(message.imageUrl, token);
            if (message.audioUrl) await deleteFromCloudinary(message.audioUrl, token);
            if (message.fileUrl) await deleteFromCloudinary(message.fileUrl, token);
            if (message.videoUrl) await deleteFromCloudinary(message.videoUrl, token);
            await deleteMessageForEveryone(chatId, message.id);
          } else if (me?.id) {
            await deleteMessageForMe(chatId, message.id, me.id);
          }
        } else if (me?.id) {
          const ok = await confirm({
            title: 'Mesajı Sil',
            message: 'Bu mesaj yalnızca senden silinecek.',
            confirmLabel: 'Sil',
            destructive: true,
          });
          if (!ok) return;
          await deleteMessageForMe(chatId, message.id, me.id);
        }
        clearSelection();
      } catch (error: any) {
        console.error('Delete error:', error);
        toast.error('Mesaj silinemedi: ' + (error.message || 'Bilinmeyen hata'));
      }
    },
    [chatId, clearSelection, confirm, toast, me?.id]
  );

  const handleSelectionReply = useCallback(() => {
    if (selectedMessages.length !== 1) return;
    setReplyingTo(selectedMessages[0]);
    clearSelection();
  }, [selectedMessages, clearSelection]);

  const handleSelectionStar = useCallback(async () => {
    if (!me?.id || !friend?.id) return;
    try {
      await Promise.all(
        selectedMessages.map((m) =>
          toggleStarMessage(me.id, friend.id, m, starredIds.has(m.id))
        )
      );
      clearSelection();
    } catch (error) {
      console.error('Star toggle error:', error);
      toast.error('Yıldız işlemi başarısız.');
    }
  }, [me?.id, friend?.id, selectedMessages, starredIds, clearSelection]);

  const handleSelectionCopy = useCallback(async () => {
    const texts = selectedMessages
      .filter((m) => m.type === 'text' && m.text)
      .map((m) => m.text!);
    if (!texts.length) {
      toast.info('Kopyalanacak metin mesajı yok.', 'Kopyala');
      return;
    }
    await Clipboard.setStringAsync(texts.join('\n'));
    clearSelection();
  }, [selectedMessages, clearSelection]);

  const handleSelectionForward = useCallback(() => {
    if (selectedMessages.length !== 1) return;
    handleForwardMessage(selectedMessages[0]);
  }, [selectedMessages, handleForwardMessage]);

  const handleSelectionDelete = useCallback(async () => {
    if (!selectedMessages.length) return;
    if (selectedMessages.length === 1) {
      await handleDeleteMessage(selectedMessages[0]);
      return;
    }
    const ok = await confirm({
      title: 'Mesajları Sil',
      message: `${selectedMessages.length} mesajı senden silmek istiyor musun?`,
      confirmLabel: 'Sil',
      destructive: true,
    });
    if (!ok || !me?.id) return;
    try {
      await Promise.all(
        selectedMessages.map((message) => deleteMessageForMe(chatId, message.id, me.id))
      );
      clearSelection();
    } catch (error: any) {
      toast.error('Mesajlar silinemedi.');
    }
  }, [selectedMessages, me?.id, handleDeleteMessage, chatId, clearSelection, confirm, toast]);

  const handleImagePress = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  }, []);

  const openReactionPicker = useCallback((message: Message) => {
    if (message.isDeleted) return;
    if (selectionMode) {
      toggleSelect(message);
      return;
    }
    setReactionTarget(message);
  }, [selectionMode, toggleSelect]);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const selectionModeRef = useRef(selectionMode);
  selectionModeRef.current = selectionMode;

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <SwipeableMessage
        item={item}
        isMe={item.senderId === me!.id}
        onReply={handleReplyFromSwipe}
        onImagePress={handleImagePress}
        onLongPress={openReactionPicker}
        onPress={toggleSelect}
        selected={selectedIdsRef.current.has(item.id)}
        selectionMode={selectionModeRef.current}
        searchQuery={searchQueryRef.current}
      />
    ),
    [me?.id, handleReplyFromSwipe, handleImagePress, openReactionPicker, toggleSelect]
  );

  const listData =
    isSearching && searchQuery.trim() ? filteredMessages : messages;

  // 3 nokta menusu icin acilir liste (dropdown) kontrolu
  const closeMenu = () => setMenuVisible(false);

  const handleBlockUser = async () => {
    closeMenu();
    const ok = await confirm({
      title: 'Kullanıcıyı Engelle',
      message: `${friend.name} kişisini engellemek istiyor musun?`,
      confirmLabel: 'Engelle',
      destructive: true,
    });
    if (!ok) return;
    blockUser(friend);
    toast.success('Kullanıcı engellendi.');
    navigation.goBack();
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

  const handleSharedMedia = () => {
    closeMenu();
    navigation.navigate('SharedMedia', { friend, messages });
  };

  const handleAudioCall = () => {
    closeMenu();
    navigation.navigate('Call', { friend, isVideo: false });
  };

  const handleVideoCall = () => {
    closeMenu();
    navigation.navigate('Call', { friend, isVideo: true });
  };

  const handleToggleMute = async () => {
    closeMenu();
    if (!me?.id || !friend?.id) return;
    try {
      if (chatMuted) {
        await unmuteChat(me.id, friend.id);
        setChatMuted(false);
        toast.success('Bu sohbet için bildirimler tekrar açık.', 'Sesi açıldı');
      } else {
        await muteChat(me.id, friend.id);
        setChatMuted(true);
        toast.success('Bu sohbet için bildirimler kapatıldı.', 'Sessize alındı');
      }
    } catch (error) {
      console.error('Mute toggle error:', error);
      toast.error('Sessize alma ayarı güncellenemedi.');
    }
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
          isSearching={isSearching && !selectionMode}
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
          onCall={handleAudioCall}
          selection={
            selectionMode
              ? {
                  selectedCount: selectedIds.size,
                  canReply: selectedMessages.length === 1,
                  canCopy: selectedMessages.some((m) => m.type === 'text' && !!m.text),
                  canForward: selectedMessages.length === 1,
                  canDelete: selectedMessages.length > 0,
                  isStarred:
                    selectedMessages.length > 0 &&
                    selectedMessages.every((m) => starredIds.has(m.id)),
                  onClearSelection: clearSelection,
                  onReply: handleSelectionReply,
                  onStar: handleSelectionStar,
                  onCopy: handleSelectionCopy,
                  onForward: handleSelectionForward,
                  onDelete: handleSelectionDelete,
                }
              : null
          }
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
              data={listData}
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
              extraData={`${selectedIds.size}-${searchQuery}-${selectionMode}`}
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.4,
                  });
                }, 250);
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={12}
              windowSize={11}
              removeClippedSubviews
            />
          )}
        </ChatBackground>

        {/* Reply Preview */}
        {replyingTo && !pendingMedia && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>
                Yanıtlanıyor:{' '}
                {replyingTo.senderId === me.id ? 'kendin' : (friend?.name ?? 'Arkadaş')}
              </Text>
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

        {pendingMedia ? (
          <MediaPreviewBar
            key={pendingMedia.uri}
            media={pendingMedia}
            sending={isUploading}
            onCancel={() => {
              if (isUploading) return;
              setPendingMedia(null);
            }}
            onSend={(caption) => {
              void handleSendPendingMedia(caption);
            }}
          />
        ) : (
          <ChatInputBar
            chatId={chatId}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
            onSendText={handleSendText}
            onTypingActivity={handleTypingActivity}
            onPickImage={handlePickImage}
            onPickFile={handlePickFile}
            onPickVideo={handlePickVideo}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isUploading={isUploading}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            isSending={isSending}
            disabled={isBlocked || !canMessage}
          />
        )}
      </KeyboardAvoidingView>

      <ChatMenu
        visible={menuVisible}
        muted={chatMuted}
        onClose={closeMenu}
        onViewProfile={handleViewProfile}
        onGoStarred={handleGoStarred}
        onGoWallpaper={handleGoWallpaper}
        onSharedMedia={handleSharedMedia}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
        onToggleMute={handleToggleMute}
        onBlockUser={handleBlockUser}
      />

      <ReactionPicker
        visible={!!reactionTarget}
        onClose={() => setReactionTarget(null)}
        onSelect={async (emoji) => {
          if (!reactionTarget || !me?.id) return;
          try {
            await setMessageReaction(chatId, reactionTarget.id, me.id, emoji);
          } catch (e) {
            toast.error('Tepki eklenemedi.');
          }
        }}
        onClear={
          reactionTarget?.reactions?.[me.id]
            ? async () => {
                try {
                  await setMessageReaction(chatId, reactionTarget.id, me.id, null);
                } catch {
                  toast.error('Tepki kaldırılamadı.');
                }
              }
            : undefined
        }
        onInfo={() => {
          if (reactionTarget) setInfoMessage(reactionTarget);
        }}
        canEdit={
          !!reactionTarget &&
          reactionTarget.senderId === me.id &&
          reactionTarget.type === 'text' &&
          !reactionTarget.isDeleted
        }
        onEdit={() => {
          if (!reactionTarget) return;
          setEditingMessage(reactionTarget);
          setReplyingTo(null);
        }}
      />

      <MessageInfoModal
        visible={!!infoMessage}
        message={infoMessage}
        onClose={() => setInfoMessage(null)}
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
