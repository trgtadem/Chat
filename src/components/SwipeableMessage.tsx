import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, CheckCheck, Play, Download } from 'lucide-react-native';
import { Audio } from 'expo-av';

import { Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { formatTime } from '../utils';

export const SwipeableMessage = ({
  item,
  isMe,
  onReply,
  onDelete,
  onForward,
  onImagePress,
}: {
  item: Message;
  isMe: boolean;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
  onForward?: (message: Message) => void;
  onImagePress: (imageUrl: string) => void;
}) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<Audio.Sound | null>(null);

  const playAudio = async () => {
    try {
      if (audioPlayer) {
        await audioPlayer.pauseAsync();
        setAudioPlaying(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: item.audioUrl! });
      setAudioPlayer(sound);
      setAudioPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setAudioPlaying(false);
          setAudioPlayer(null);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const renderRightActions = () => (
    <View style={styles.actionContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onReply(item)}
      >
        <Text style={styles.actionText}>Reply</Text>
      </TouchableOpacity>
      {onForward && (
        <TouchableOpacity
          style={[styles.actionButton, styles.forwardButton]}
          onPress={() => onForward(item)}
        >
          <Text style={styles.actionText}>Forward</Text>
        </TouchableOpacity>
      )}
      {isMe && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // If message is deleted, show minimal content
  if (item.isDeleted) {
    return (
      <View
        style={{
          alignItems: isMe ? 'flex-end' : 'flex-start',
          marginBottom: 8,
        }}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? styles.myMessageBubble
              : styles.theirMessageBubble,
          ]}
        >
          <Text style={styles.deletedText}>This message was deleted</Text>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <TouchableOpacity onPress={() => onImagePress(item.imageUrl!)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.imageMessage}
            />
          </TouchableOpacity>
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={playAudio}
              disabled={audioPlaying}
            >
              {audioPlaying ? (
                <ActivityIndicator
                  size="small"
                  color={isMe ? '#FFFFFF' : '#FFFFFF'}
                />
              ) : (
                <Play
                  size={20}
                  color={isMe ? '#FFFFFF' : '#FFFFFF'}
                  fill={isMe ? '#FFFFFF' : '#FFFFFF'}
                />
              )}
            </TouchableOpacity>
            <Text style={styles.audioLabel}>Voice Message</Text>
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Download size={24} color={isMe ? '#FFFFFF' : '#FFFFFF'} />
            <View style={{ flex: 1 }}>
              <Text
                style={styles.fileName}
                numberOfLines={1}
              >
                {item.fileName || 'File'}
              </Text>
              <Text style={styles.fileSize}>File</Text>
            </View>
          </View>
        );

      case 'text':
      default:
        return <Text style={styles.messageText}>{item.text ?? 'No content'}</Text>;
    }
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View
        style={{
          alignItems: isMe ? 'flex-end' : 'flex-start',
          marginBottom: 8,
          paddingHorizontal: 8,
        }}
      >
        {/* Reply Quote */}
        {item.replyTo && (
          <View style={styles.quotedMessage}>
            <View style={styles.quoteBar} />
            <View>
              <Text style={styles.quoteAuthor}>
                {item.replyTo.senderId === item.senderId ? 'You' : 'Them'}
              </Text>
              <Text
                style={styles.quoteText}
                numberOfLines={1}
              >
                {item.replyTo.type === 'text'
                  ? (item.replyTo.text ?? '')
                  : `[${(item.replyTo.type ?? 'file').toUpperCase()}]`}
              </Text>
            </View>
          </View>
        )}

        {/* Main Message */}
        <View
          style={[
            styles.messageBubble,
            isMe
              ? styles.myMessageBubble
              : styles.theirMessageBubble,
            item.type !== 'text' && {
              padding: 0,
              backgroundColor:
                item.type === 'image'
                  ? 'transparent'
                  : isMe
                  ? COLORS.myMessageBubble
                  : COLORS.theirMessageBubble,
            },
          ]}
        >
          {renderContent()}
          {item.type !== 'image' && (
            <View style={styles.messageFooter}>
              <Text style={styles.timeText}>
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <View style={{ marginLeft: 4 }}>
                  {item.status === 'read' ? (
                    <CheckCheck size={14} color={COLORS.read} />
                  ) : (
                    <Check size={14} color="#AAA" />
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Image Footer */}
        {item.type === 'image' && (
          <View style={styles.imageFooter}>
            <Text style={styles.timeText}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <View style={{ marginLeft: 4 }}>
                {item.status === 'read' ? (
                  <CheckCheck size={14} color={COLORS.read} />
                ) : (
                  <Check size={14} color="#AAA" />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
  },
  forwardButton: {
    backgroundColor: COLORS.accent,
  },
  deleteButton: {
    backgroundColor: '#CF6679',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quotedMessage: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
    maxWidth: '80%',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  quoteBar: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: '80%',
  },
  myMessageBubble: {
    backgroundColor: COLORS.myMessageBubble,
    borderBottomRightRadius: 0,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.theirMessageBubble,
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
  },
  deletedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 6,
    justifyContent: 'flex-end',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  fileName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
