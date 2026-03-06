import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Paperclip, Send, Plus, Mic, MoreVertical, Search, X as XIcon } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as AudioModule from 'expo-audio';
import ImageViewing from 'react-native-image-viewing';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  updateDoc,
  setDoc,
  limit,
  limitToLast,
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User, Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { getChatId, formatTime, formatLastSeen, sendPushNotification } from '../utils';
import { SwipeableMessage } from '../components/SwipeableMessage';
import { useAppContext } from '../context/AppContext';

type RootStackParamList = {
  Home: undefined;
  Chat: { user: User; friend: User; forwardingMessage?: Message };
  Profile: { user: User };
};

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({
  route,
  navigation,
}: {
  route: ChatScreenProps['route'];
  navigation: ChatScreenProps['navigation'];
}) {
  const { currentUser } = useAppContext();
  const { user, friend, forwardingMessage: routeForwardingMessage } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [friendIsTyping, setFriendIsTyping] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [messagesWithImages, setMessagesWithImages] = useState<string[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);
  // Search
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Pagination
  const [msgLimit, setMsgLimit] = useState(30);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const recorderRef = useRef<AudioModule.AudioRecorder | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((msg) =>
      msg.type === 'text' && msg.text && msg.text.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  if (!currentUser) return null;

  if (!user?.id || !friend?.id) {
    console.error('User or friend ID is missing');
    return <Text style={{ color: 'red' }}>Error: Missing user information</Text>;
  }

  const chatId = getChatId(user.id, friend.id);

  // Handle forwarding message from route params
  useEffect(() => {
    if (routeForwardingMessage) {
      handleForwardToCurrentChat(routeForwardingMessage);
    }
  }, [routeForwardingMessage]);

  const handleForwardToCurrentChat = async (message: Message) => {
    try {
      const forwardedMessageData = {
        type: message.type,
        text: message.text || null,
        senderId: user.id,
        createdAt: serverTimestamp(),
        status: 'sent',
        chatId,
        imageUrl: message.imageUrl || null,
        audioUrl: message.audioUrl || null,
        fileUrl: message.fileUrl || null,
        fileName: message.fileName || null,
        forwarded: true,
        forwardedFrom: message.senderId === user.id ? 'You' : (friend?.name ?? 'Unknown'),
      };

      const batch = writeBatch(db);
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageRef, forwardedMessageData);

      const senderChatRef = doc(
        db,
        'users',
        user.id,
        'userChats',
        friend.id
      );
      batch.set(
        senderChatRef,
        {
          id: friend.id,
          name: friend?.name ?? 'Unknown',
          surname: friend?.surname ?? '',
          avatar: friend?.avatar ?? 'https://via.placeholder.com/50',
          email: friend?.email ?? '',
          online: friend?.online ?? false,
          lastSeen: friend?.lastSeen,
          lastMessage: forwardedMessageData,
          pushToken: friend?.pushToken ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const friendChatRef = doc(
        db,
        'users',
        friend.id,
        'userChats',
        user.id
      );
      batch.set(
        friendChatRef,
        {
          id: user.id,
          name: user?.name ?? 'Unknown',
          surname: user?.surname ?? '',
          avatar: user?.avatar ?? 'https://via.placeholder.com/50',
          email: user?.email ?? '',
          online: user?.online ?? false,
          lastSeen: user?.lastSeen,
          lastMessage: forwardedMessageData,
          unreadCount: increment(1),
          pushToken: user?.pushToken ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      if (friend.pushToken && friend.pushToken !== currentUser.pushToken) {
        await sendPushNotification(
          friend.pushToken,
          `${user.name} ${user.surname}`,
          'Forwarded a message'
        );
      }

      Alert.alert('Success', 'Message forwarded successfully.');
    } catch (error) {
      console.error('Forward error:', error);
      Alert.alert('Error', 'Failed to forward message.');
    }
  };

  // Setup header with navigation
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Listen to messages with pagination
  useEffect(() => {
    if (!user?.id || !friend?.id) return;
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(msgLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Message));
        setMessages(msgs);
        // hasMore: ilk yükleme boyuna eşit mesaj geldiyse daha eski mesaj vardır
        setHasMoreMessages(snapshot.docs.length >= msgLimit);

        // Extract image URLs for image viewer
        const imageUrls = msgs
          .filter((msg) => msg.type === 'image' && msg.imageUrl)
          .map((msg) => msg.imageUrl!);
        setMessagesWithImages(imageUrls);

        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );

        // Mark messages as read
        const unreadMessages = snapshot.docs.filter(
          (doc) => doc.data().senderId !== user.id && doc.data().status === 'sent'
        );

        if (unreadMessages.length > 0) {
          const batch = writeBatch(db);
          unreadMessages.forEach((docSnap) => {
            batch.update(
              doc(db, 'chats', chatId, 'messages', docSnap.id),
              { status: 'read' }
            );
          });

          const userChatRef = doc(db, 'users', user.id, 'userChats', friend.id);
          batch.update(userChatRef, { unreadCount: 0 });

          batch.commit();
        }
      },
      (error) => {
        console.error('Error fetching messages:', error?.message || error?.code || error);
      }
    );

    return () => unsubscribe();
  }, [chatId, user.id, msgLimit]);   // msgLimit değişince yeniden abone ol

  const loadOlderMessages = () => {
    setMsgLimit((prev) => prev + 30);
  };

  // Listen to typing status
  useEffect(() => {
    const typingRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(
      typingRef,
      (snapshot) => {
        const data = snapshot.data();
        if (data?.typing && data.typing[friend.id]) {
          setFriendIsTyping(true);
        } else {
          setFriendIsTyping(false);
        }
      },
      (error) => {
        console.error('Error fetching typing status:', error?.message || error?.code || error);
      }
    );

    return () => unsubscribe();
  }, [chatId, friend.id]);

  const uploadToCloudinary = async (
    uri: string,
    fileName: string = 'upload.jpg',
    fileType: string = 'image/jpeg',
    resourceType: 'image' | 'video' | 'auto' = 'image'
  ): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: fileType,
        name: fileName,
      } as any);
      formData.append('upload_preset', 'my_app');
      formData.append('resource_type', resourceType);

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dhrtxb1ou/auto/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

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

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto stop after 60 seconds
      setTimeout(() => {
        if (recorderRef.current && recorderRef.current.isRecording) {
          stopRecording();
        }
        clearInterval(interval);
      }, 60000);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
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
    setInputText(text);

    // Update typing status - use setDoc with merge to create if doesn't exist
    if (!isTyping) {
      setIsTyping(true);
      setDoc(
        doc(db, 'chats', chatId),
        {
          typing: {
            [user.id]: true,
          },
        },
        { merge: true }
      ).catch(console.error);
    }

    // Debounce typing status update
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await setDoc(
        doc(db, 'chats', chatId),
        {
          typing: {
            [user.id]: false,
          },
        },
        { merge: true }
      ).catch(console.error);
    }, 2000);
  };

  const sendMediaMessage = async (
    type: 'image' | 'audio' | 'file',
    payload: any
  ) => {
    const messageData = {
      type,
      senderId: user.id,
      createdAt: serverTimestamp(),
      status: 'sent',
      chatId,
      text: null,
      imageUrl: payload.imageUrl || null,
      audioUrl: payload.audioUrl || null,
      fileUrl: payload.fileUrl || null,
      fileName: payload.fileName || null,
      replyTo: replyingTo || null,
    };

    try {
      const batch = writeBatch(db);
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageRef, messageData);

      const senderChatRef = doc(
        db,
        'users',
        user.id,
        'userChats',
        friend.id
      );
      batch.set(
        senderChatRef,
        {
          id: friend.id,
          name: friend?.name ?? 'Unknown',
          surname: friend?.surname ?? '',
          avatar: friend?.avatar ?? 'https://via.placeholder.com/50',
          email: friend?.email ?? '',
          online: friend?.online ?? false,
          lastSeen: friend?.lastSeen,
          lastMessage: messageData,
          pushToken: friend?.pushToken ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const friendChatRef = doc(
        db,
        'users',
        friend.id,
        'userChats',
        user.id
      );
      batch.set(
        friendChatRef,
        {
          id: user.id,
          name: user?.name ?? 'Unknown',
          surname: user?.surname ?? '',
          avatar: user?.avatar ?? 'https://via.placeholder.com/50',
          email: user?.email ?? '',
          online: user?.online ?? false,
          lastSeen: user?.lastSeen,
          lastMessage: messageData,
          unreadCount: increment(1),
          pushToken: user?.pushToken ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      if (friend.pushToken && friend.pushToken !== currentUser.pushToken) {
        const typeEmojis = {
          image: '📸',
          audio: '🎙️',
          file: '📎',
        };
        await sendPushNotification(
          friend.pushToken,
          `${user.name} ${user.surname}`,
          `${typeEmojis[type]} Message`
        );
      }

      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setIsSending(true);
    const textToSend = inputText;
    setInputText('');

    const messageData = {
      type: 'text',
      text: textToSend || null,
      senderId: user.id,
      createdAt: serverTimestamp(),
      status: 'sent',
      chatId,
      replyTo: replyingTo || null,
    };

    try {
      const batch = writeBatch(db);
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageRef, messageData);

      const senderChatRef = doc(
        db,
        'users',
        user.id,
        'userChats',
        friend.id
      );
      batch.set(
        senderChatRef,
        {
          id: friend.id,
          name: friend?.name ?? 'Unknown',
          surname: friend?.surname ?? '',
          avatar: friend?.avatar ?? 'https://via.placeholder.com/50',
          email: friend?.email ?? '',
          online: friend?.online ?? false,
          lastSeen: friend?.lastSeen,
          lastMessage: messageData,
          pushToken: friend?.pushToken ?? null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const friendChatRef = doc(
        db,
        'users',
        friend.id,
        'userChats',
        user.id
      );
      batch.set(
        friendChatRef,
        {
          id: user.id,
          name: user?.name ?? 'Unknown',
          surname: user?.surname ?? '',
          avatar: user?.avatar ?? 'https://via.placeholder.com/50',
          email: user?.email ?? '',
          online: user?.online ?? false,
          lastSeen: user?.lastSeen,
          lastMessage: messageData,
          unreadCount: increment(1),
          pushToken: user?.pushToken,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      if (friend.pushToken && friend.pushToken !== currentUser.pushToken) {
        await sendPushNotification(
          friend.pushToken,
          `${user.name} ${user.surname}`,
          textToSend
        );
      }

      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleForwardMessage = (message: Message) => {
    setForwardingMessage(message);
    navigation.navigate('Home');
  };

  const handleDeleteMessage = (message: Message) => {
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', onPress: () => { } },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await updateDoc(
              doc(db, 'chats', chatId, 'messages', message.id),
              { isDeleted: true }
            );
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete message.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          {isSearching ? (
            /* Search Mode Header */
            <>
              <TouchableOpacity
                onPress={() => { setIsSearching(false); setSearchQuery(''); }}
                style={{ padding: 8 }}
              >
                <XIcon size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Mesajlarda ara..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Text style={styles.searchResultCount}>
                  {filteredMessages.length} sonuç
                </Text>
              )}
            </>
          ) : (
            /* Normal Header */
            <>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 8 }}
              >
                <ChevronLeft size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Image source={{ uri: friend.avatar }} style={styles.chatAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.chatTitle}>
                  {friend.name} {friend.surname}
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                  {friendIsTyping
                    ? 'typing...'
                    : friend.online
                      ? 'Online'
                      : friend.lastSeen
                        ? formatLastSeen(friend.lastSeen)
                        : 'Offline'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSearching(true)}
                style={{ padding: 8 }}
              >
                <Search size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile', { user: currentUser })}
                style={{ padding: 8 }}
              >
                <MoreVertical size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Messages List */}
        {isSearching && searchQuery.length > 0 && filteredMessages.length === 0 ? (
          <View style={styles.emptySearch}>
            <Search size={40} color={COLORS.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptySearchText}>Sonuç bulunamadı</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>"{searchQuery}" için eşleşme yok</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredMessages}
            ListHeaderComponent={
              hasMoreMessages && !isSearching ? (
                <TouchableOpacity
                  onPress={loadOlderMessages}
                  style={styles.loadMoreButton}
                >
                  <Text style={styles.loadMoreText}>↑ Daha eski mesajları yükle</Text>
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => (
              <SwipeableMessage
                item={item}
                isMe={item.senderId === user.id}
                onReply={setReplyingTo}
                onDelete={handleDeleteMessage}
                onForward={handleForwardMessage}
                onImagePress={(imageUrl) => {
                  setSelectedImageUrl(imageUrl);
                  setImageViewerVisible(true);
                }}
                searchQuery={searchQuery}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          />
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyingTo.senderId === user.id ? 'yourself' : (friend?.name ?? 'Friend')}</Text>
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
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => handlePickImage()}
              disabled={isUploading || isRecording}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <Paperclip size={22} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={handleTyping}
              multiline
              editable={!isRecording}
            />

            <TouchableOpacity
              style={styles.attachButton}
              onPress={handlePickFile}
              disabled={isUploading || isRecording}
            >
              <Plus size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {isRecording ? (
            <>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>{recordingDuration}s</Text>
              </View>
              <TouchableOpacity
                style={[styles.sendButton, styles.stopButton]}
                onPress={stopRecording}
              >
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                  Stop
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
              >
                <Mic size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendMessage}
                style={[styles.sendButton, (isSending || !inputText.trim()) && { opacity: 0.5 }]}
                disabled={isSending || !inputText.trim()}
              >
                <Send size={24} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    backgroundColor: COLORS.surface,
  },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 12 },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 24,
    alignItems: 'center',
    paddingLeft: 12,
  },
  attachButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: COLORS.textPrimary,
    fontSize: 16,
    maxHeight: 110,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: 'transparent',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#CF6679',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CF6679',
  },
  recordingText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBackground,
    justifyContent: 'space-between',
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  replyClose: {
    fontSize: 20,
    color: COLORS.textSecondary,
    paddingHorizontal: 8,
  },
  loadMoreButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // ─── Search ──────────────────────────────────────────────────────────────
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 20,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginHorizontal: 4,
  },
  searchResultCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
});
