import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
import { ChevronLeft, Paperclip, Send, Plus, Mic, MoreVertical } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Audio from 'expo-av';
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
} from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User, Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { getChatId, formatTime, sendPushNotification } from '../utils';
import { SwipeableMessage } from '../components/SwipeableMessage';

type RootStackParamList = {
  Chat: { user: User; friend: User };
};

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({
  route,
  navigation,
  currentUser,
}: {
  route: ChatScreenProps['route'];
  navigation: ChatScreenProps['navigation'];
  currentUser: User;
}) {
  const { user, friend } = route.params;
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

  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatId = getChatId(user.id, friend.id);

  // Setup header with navigation
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Listen to messages
  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Message));
      setMessages(msgs);

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
    });

    return () => unsubscribe();
  }, [chatId, user.id]);

  // Listen to typing status
  useEffect(() => {
    const typingRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.typing && data.typing[friend.id]) {
        setFriendIsTyping(true);
      } else {
        setFriendIsTyping(false);
      }
    });

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'You need to grant microphone permissions to record audio.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto stop after 60 seconds
      setTimeout(() => {
        if (recordingRef.current) {
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
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
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

    // Update typing status
    if (!isTyping) {
      setIsTyping(true);
      updateDoc(doc(db, 'chats', chatId), {
        typing: {
          [user.id]: true,
        },
      }).catch(console.error);
    }

    // Debounce typing status update
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await updateDoc(doc(db, 'chats', chatId), {
        typing: {
          [user.id]: false,
        },
      }).catch(console.error);
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
      ...payload,
      ...(replyingTo && { replyTo: replyingTo }),
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
          lastMessage: messageData,
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
          lastMessage: messageData,
          unreadCount: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      if (friend.pushToken) {
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

    const textToSend = inputText;
    setInputText('');

    const messageData = {
      type: 'text',
      text: textToSend,
      senderId: user.id,
      createdAt: serverTimestamp(),
      status: 'sent',
      chatId,
      ...(replyingTo && { replyTo: replyingTo }),
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
          lastMessage: messageData,
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
          lastMessage: messageData,
          unreadCount: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      if (friend.pushToken) {
        await sendPushNotification(
          friend.pushToken,
          `${user.name} ${user.surname}`,
          textToSend
        );
      }

      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    Alert.alert('Delete Message', 'Delete this message for everyone?', [
      { text: 'Cancel', onPress: () => {} },
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
                : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { user: currentUser })}
            style={{ padding: 8 }}
          >
            <MoreVertical size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <SwipeableMessage
              item={item}
              isMe={item.senderId === user.id}
              onReply={setReplyingTo}
              onDelete={handleDeleteMessage}
              onImagePress={(imageUrl) => {
                setSelectedImageUrl(imageUrl);
                setImageViewerVisible(true);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        />

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyingTo.senderId === user.id ? 'yourself' : friend.name}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.type === 'text'
                  ? replyingTo.text
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
                style={styles.sendButton}
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
});
