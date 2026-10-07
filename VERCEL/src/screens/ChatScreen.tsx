import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Camera,
  Mic,
  MoreVertical,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { User, Message, WallpaperOption } from '../types';
import { Avatar } from '../components/Avatar';
import { ChatDetailsPanel } from '../components/ChatDetailsPanel';

interface ChatScreenProps {
  navigation?: any;
  route?: {
    params?: {
      chatId?: string;
      user?: User;
    };
  };
}

// Mock data for development
const mockUser: User = {
  id: 'user1',
  displayName: 'John Doe',
  email: 'john@example.com',
  photoURL: null,
  about: 'Software developer and coffee enthusiast',
  isOnline: true,
  lastSeen: new Date(),
};

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'user1',
    receiverId: 'current',
    text: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 3600000 * 2),
    read: true,
  },
  {
    id: '2',
    senderId: 'current',
    receiverId: 'user1',
    text: 'I am good, thanks! Working on this new chat app.',
    timestamp: new Date(Date.now() - 3600000),
    read: true,
  },
  {
    id: '3',
    senderId: 'user1',
    receiverId: 'current',
    text: 'That sounds interesting! Can you tell me more about it?',
    timestamp: new Date(Date.now() - 1800000),
    read: true,
  },
  {
    id: '4',
    senderId: 'current',
    receiverId: 'user1',
    text: 'Sure! It is a real-time messaging app built with React Native and Firebase.',
    timestamp: new Date(Date.now() - 900000),
    read: true,
  },
  {
    id: '5',
    senderId: 'user1',
    receiverId: 'current',
    imageUrl: 'https://picsum.photos/400/300',
    timestamp: new Date(Date.now() - 600000),
    read: true,
  },
  {
    id: '6',
    senderId: 'current',
    receiverId: 'user1',
    text: 'Looks great! Let me check the documentation.',
    timestamp: new Date(Date.now() - 300000),
    read: true,
  },
];

function formatMessageTime(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLastSeen(lastSeen?: Date | null, isOnline?: boolean): string {
  if (isOnline) return 'Online';
  if (!lastSeen) return '';
  
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Last seen just now';
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  if (hours < 24) return `Last seen ${hours} hours ago`;
  return `Last seen ${new Date(lastSeen).toLocaleDateString()}`;
}

function MessageBubble({
  message,
  isSent,
  showTimestamp = true,
}: {
  message: Message;
  isSent: boolean;
  showTimestamp?: boolean;
}) {
  const { themeSettings } = useAppContext();
  
  const bubbleStyles = useMemo(() => {
    const styleMap = {
      default: {
        sent: { borderBottomRightRadius: 4 },
        received: { borderBottomLeftRadius: 4 },
      },
      minimal: {
        sent: { borderRadius: 4 },
        received: { borderRadius: 4 },
      },
      rounded: {
        sent: { borderRadius: 24 },
        received: { borderRadius: 24 },
      },
    };
    return styleMap[themeSettings.chatBubbleStyle] || styleMap.default;
  }, [themeSettings.chatBubbleStyle]);

  const fontSizeMap = {
    small: 14,
    medium: 16,
    large: 18,
  };

  const messageFontSize = fontSizeMap[themeSettings.fontSize] || fontSizeMap.medium;

  return (
    <View style={[styles.messageBubbleContainer, isSent && styles.messageBubbleContainerSent]}>
      <View
        style={[
          styles.messageBubble,
          isSent ? styles.messageBubbleSent : styles.messageBubbleReceived,
          isSent ? bubbleStyles.sent : bubbleStyles.received,
        ]}
      >
        {message.imageUrl && (
          <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
        )}
        {message.text && (
          <Text style={[styles.messageText, { fontSize: messageFontSize }]}>{message.text}</Text>
        )}
        {showTimestamp && (
          <Text style={styles.messageTime}>{formatMessageTime(message.timestamp)}</Text>
        )}
      </View>
    </View>
  );
}

function ChatHeader({
  user,
  onBack,
  onUserPress,
  onMorePress,
}: {
  user: User;
  onBack: () => void;
  onUserPress: () => void;
  onMorePress: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerBackButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerUser} onPress={onUserPress} activeOpacity={0.7}>
        <Avatar
          source={user.photoURL}
          name={user.displayName}
          size="small"
          showOnlineIndicator
          isOnline={user.isOnline}
        />
        <View style={styles.headerUserInfo}>
          <Text style={styles.headerUserName} numberOfLines={1}>
            {user.displayName}
          </Text>
          <Text style={styles.headerUserStatus} numberOfLines={1}>
            {formatLastSeen(user.lastSeen, user.isOnline)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onMorePress}
        style={styles.headerMoreButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreVertical size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

function MessageInput({
  value,
  onChangeText,
  onSend,
  onAttachment,
  onCamera,
  onVoice,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachment: () => void;
  onCamera: () => void;
  onVoice: () => void;
}) {
  const hasText = value.trim().length > 0;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TouchableOpacity onPress={onAttachment} style={styles.inputAction}>
          <Paperclip size={22} color={colors.textTertiary} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
        />

        {!hasText && (
          <TouchableOpacity onPress={onCamera} style={styles.inputAction}>
            <Camera size={22} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={hasText ? onSend : onVoice}
        style={[styles.sendButton, hasText && styles.sendButtonActive]}
      >
        {hasText ? (
          <Send size={20} color={colors.textPrimary} />
        ) : (
          <Mic size={22} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

export function ChatScreen({ navigation, route }: ChatScreenProps) {
  const { currentUser, getChatSettings, themeSettings } = useAppContext();
  const flatListRef = useRef<FlatList>(null);

  // Get user and chat ID from route params or use mock data
  const chatId = route?.params?.chatId || 'mock-chat';
  const otherUser = route?.params?.user || mockUser;

  // State
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [showChatDetails, setShowChatDetails] = useState(false);

  // Get chat-specific settings
  const chatSettings = getChatSettings(chatId);
  const wallpaper = chatSettings?.wallpaper || themeSettings.globalWallpaper;

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleUserPress = useCallback(() => {
    setShowChatDetails(true);
  }, []);

  const handleMorePress = useCallback(() => {
    setShowChatDetails(true);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser?.id || 'current',
      receiverId: otherUser.id,
      text: inputText.trim(),
      timestamp: new Date(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // TODO: Send message to Firebase
  }, [inputText, currentUser, otherUser]);

  const handleAttachment = useCallback(() => {
    // TODO: Open attachment picker
    console.log('Open attachment picker');
  }, []);

  const handleCamera = useCallback(() => {
    // TODO: Open camera
    console.log('Open camera');
  }, []);

  const handleVoice = useCallback(() => {
    // TODO: Start voice recording
    console.log('Start voice recording');
  }, []);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isSent = item.senderId === (currentUser?.id || 'current');
      return <MessageBubble message={item} isSent={isSent} />;
    },
    [currentUser]
  );

  const getWallpaperStyle = () => {
    if (!wallpaper) return {};
    
    if (wallpaper.type === 'color') {
      return { backgroundColor: wallpaper.value };
    }
    
    // For gradients and images, we would need additional handling
    // For now, return a fallback color
    return { backgroundColor: colors.background };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatHeader
        user={otherUser}
        onBack={handleBack}
        onUserPress={handleUserPress}
        onMorePress={handleMorePress}
      />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.messagesContainer, getWallpaperStyle()]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />
        </View>

        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onAttachment={handleAttachment}
          onCamera={handleCamera}
          onVoice={handleVoice}
        />
      </KeyboardAvoidingView>

      {/* Chat Details Panel */}
      <ChatDetailsPanel
        visible={showChatDetails}
        onClose={() => setShowChatDetails(false)}
        user={otherUser}
        chatId={chatId}
        messages={messages}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUserInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  headerUserName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerUserStatus: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerMoreButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  messageBubbleContainerSent: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  messageBubbleSent: {
    backgroundColor: colors.messageSent,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: colors.messageReceived,
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 240,
    height: 180,
    borderRadius: borderRadius.md,
  },
  messageText: {
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xs,
    minHeight: 44,
  },
  inputAction: {
    padding: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});

export default ChatScreen;
