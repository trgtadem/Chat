import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { ChevronLeft, Paperclip, Send, Check, CheckCheck } from 'lucide-react-native';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User, Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { getChatId, formatTime, formatLastSeen, sendPushNotification } from '../utils';

import { SwipeableMessage } from '../components/SwipeableMessage';

export function ChatScreen({ user, friend, onBack }: { user: User; friend: User; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const chatId = getChatId(user.id, friend.id);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const unreadMessages = snapshot.docs.filter(
        (doc) => doc.data().senderId !== user.id && doc.data().status === 'sent'
      );

      if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach((docSnap) => {
          batch.update(doc(db, 'chats', chatId, 'messages', docSnap.id), { status: 'read' });
        });
        
        // Also reset the unread count in the user's chat list
        const userChatRef = doc(db, 'users', user.id, 'userChats', friend.id);
        batch.update(userChatRef, { unreadCount: 0 });

        batch.commit();
      }
    });
    return () => unsubscribe();
  }, [chatId, user.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    
    const messageData = {
      text: textToSend,
      senderId: user.id,
      createdAt: serverTimestamp(),
      status: 'sent',
      chatId: chatId,
    };

    try {
      const batch = writeBatch(db);

      // 1. Add new message to the chat
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageRef, messageData);

      // 2. Update sender's userChats
      const senderChatRef = doc(db, 'users', user.id, 'userChats', friend.id);
              batch.set(senderChatRef, {
                lastMessage: messageData,
                updatedAt: serverTimestamp(), // Add this line
              }, { merge: true });
      
              // 3. Update friend's userChats
              const friendChatRef = doc(db, 'users', friend.id, 'userChats', user.id);
              batch.set(friendChatRef, {
                lastMessage: messageData,
                unreadCount: increment(1),
                updatedAt: serverTimestamp(), // Add this line
              }, { merge: true });      
      await batch.commit();

      if (friend.pushToken) {
        // This should be awaited as well, though it's separate from the db transaction
        await sendPushNotification(friend.pushToken, `${user.name} ${user.surname}`, textToSend);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Image source={{ uri: friend.avatar }} style={styles.chatAvatar} />
          <View>
            <Text style={styles.chatTitle}>{friend.name} {friend.surname}</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              {friend.online ? 'Çevrimiçi' : friend.lastSeen ? `Son görülme: ${formatLastSeen(friend.lastSeen)}` : 'Çevrimdışı'}
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <SwipeableMessage item={item} isMe={item.senderId === user.id} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        />

        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Paperclip size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Mesaj yaz..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <Send size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.surface, backgroundColor: COLORS.surface },
    chatAvatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 16, marginRight: 12 },
    chatTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    inputWrapper: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.background, // Match the main background
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderTopColor: COLORS.surface,
        borderTopLeftRadius: 20, // Rounded top-left corner
        borderTopRightRadius: 20, // Rounded top-right corner
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: COLORS.inputBackground,
        borderRadius: 24,
        alignItems: "center",
        paddingLeft: 12,
        marginRight: 10,
    },
    attachButton: {
        paddingRight: 8,
        paddingVertical: 8,
    },
    chatInput: {
        flex: 1,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        color: "#FFF",
        fontSize: 16,
        maxHeight: 110,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Platform.OS === 'ios' ? 0 : 2,
    },
});
