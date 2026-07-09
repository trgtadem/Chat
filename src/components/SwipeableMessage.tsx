import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, CheckCheck, Play, Pause, Download } from 'lucide-react-native';
import * as AudioModule from 'expo-audio';

import { Message } from '../types';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { formatTime } from '../utils';

// Balon kose yaricapini secili balon stiline gore hesaplar
function bubbleShape(t: Theme, isMe: boolean) {
  if (t.bubbleStyle === 'rounded') {
    return { borderRadius: t.radius.lg };
  }
  if (t.bubbleStyle === 'minimal') {
    return { borderRadius: t.radius.sm };
  }
  // default: kuyruklu klasik balon
  return {
    borderRadius: t.radius.lg,
    ...(isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
  };
}

const SwipeableMessageComponent = ({
  item,
  isMe,
  onReply,
  onDelete,
  onForward,
  onImagePress,
  searchQuery = '',
}: {
  item: Message;
  isMe: boolean;
  onReply: (message: Message) => void;
  onDelete: (message: Message) => void;
  onForward?: (message: Message) => void;
  onImagePress: (imageUrl: string) => void;
  searchQuery?: string;
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<AudioModule.AudioPlayer | null>(null);

  // Balon uzerindeki metin rengi (gonderen vs alan)
  const bubbleTextColor = isMe ? theme.colors.myMessageText : theme.colors.theirMessageText;
  const shape = bubbleShape(theme, isMe);

  // Ses oynaticiyi bilesen kaldirilirken (veya oynatici degisince) serbest birak
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        try {
          audioPlayer.remove();
        } catch {
          // yok say
        }
      }
    };
  }, [audioPlayer]);

  // Render text with highlighted search matches
  const renderHighlightedText = (text: string) => {
    const baseTextStyle = [styles.messageText, { color: bubbleTextColor }];
    if (!searchQuery.trim()) {
      return <Text style={baseTextStyle}>{text}</Text>;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);
    while (index !== -1) {
      if (index > lastIndex) {
        parts.push(
          <Text key={`t-${lastIndex}`} style={baseTextStyle}>
            {text.slice(lastIndex, index)}
          </Text>
        );
      }
      parts.push(
        <Text key={`h-${index}`} style={[baseTextStyle, styles.highlightedText]}>
          {text.slice(index, index + searchQuery.length)}
        </Text>
      );
      lastIndex = index + searchQuery.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`t-${lastIndex}`} style={baseTextStyle}>
          {text.slice(lastIndex)}
        </Text>
      );
    }
    return <Text>{parts}</Text>;
  };

  const playAudio = async () => {
    try {
      if (audioPlayer) {
        if (audioPlaying) {
          audioPlayer.pause();
          setAudioPlaying(false);
        } else {
          audioPlayer.play();
          setAudioPlaying(true);
        }
        return;
      }

      if (!item.audioUrl) return;

      const player = AudioModule.AudioModule.createPlayer(item.audioUrl);
      setAudioPlayer(player);
      setAudioPlaying(true);

      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          setAudioPlaying(false);
          setAudioPlayer(null);
        }
      });

      player.play();
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
          paddingHorizontal: 8,
        }}
      >
        <View
          style={[
            styles.messageBubble,
            shape,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text style={styles.deletedText}>Bu mesaj silindi</Text>
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
            >
              {audioPlaying ? (
                <Pause size={20} color={bubbleTextColor} fill={bubbleTextColor} />
              ) : (
                <Play size={20} color={bubbleTextColor} fill={bubbleTextColor} />
              )}
            </TouchableOpacity>
            <Text style={[styles.audioLabel, { color: bubbleTextColor }]}>Sesli Mesaj</Text>
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <Download size={24} color={bubbleTextColor} />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.fileName, { color: bubbleTextColor }]}
                numberOfLines={1}
              >
                {item.fileName || 'Dosya'}
              </Text>
              <Text style={[styles.fileSize, { color: bubbleTextColor, opacity: 0.7 }]}>Dosya</Text>
            </View>
          </View>
        );

      case 'text':
      default:
        return renderHighlightedText(item.text ?? 'No content');
    }
  };

  const footerColor = isMe ? theme.colors.myMessageText : theme.colors.textSecondary;

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
                {item.replyTo.senderId === item.senderId ? 'Sen' : 'Karşı taraf'}
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
            shape,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble,
            item.type !== 'text' && {
              padding: 0,
              overflow: 'hidden',
              backgroundColor:
                item.type === 'image'
                  ? 'transparent'
                  : isMe
                    ? theme.colors.myMessageBubble
                    : theme.colors.theirMessageBubble,
            },
          ]}
        >
          {renderContent()}
          {item.type !== 'image' && (
            <View style={styles.messageFooter}>
              <Text style={[styles.timeText, { color: footerColor, opacity: 0.8 }]}>
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <View style={{ marginLeft: 4 }}>
                  {item.status === 'read' ? (
                    <CheckCheck size={14} color={theme.colors.myMessageText} />
                  ) : (
                    <Check size={14} color={theme.colors.myMessageText} />
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
                  <CheckCheck size={14} color={theme.colors.read} />
                ) : (
                  <Check size={14} color={theme.colors.textSecondary} />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </Swipeable>
  );
};

// React.memo: yalnizca prop'lari degisince yeniden render edilir.
export const SwipeableMessage = React.memo(SwipeableMessageComponent);

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    actionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      gap: 4,
    },
    actionButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.md,
      justifyContent: 'center',
    },
    forwardButton: {
      backgroundColor: t.colors.accent,
    },
    deleteButton: {
      backgroundColor: t.colors.error,
    },
    actionText: {
      color: '#FFFFFF',
      fontSize: 12 * t.fontScale,
      fontWeight: '600',
    },
    quotedMessage: {
      flexDirection: 'row',
      marginBottom: 8,
      paddingLeft: 8,
      maxWidth: '80%',
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.md,
      padding: 8,
      gap: 8,
    },
    quoteBar: {
      width: 3,
      backgroundColor: t.colors.primary,
      borderRadius: 2,
    },
    quoteAuthor: {
      fontSize: 12 * t.fontScale,
      fontWeight: '600',
      color: t.colors.primary,
    },
    quoteText: {
      fontSize: 13 * t.fontScale,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    messageBubble: {
      padding: 10,
      maxWidth: '80%',
    },
    myMessageBubble: {
      backgroundColor: t.colors.myMessageBubble,
    },
    theirMessageBubble: {
      backgroundColor: t.colors.theirMessageBubble,
      borderWidth: t.colors.isDark ? 0 : 1,
      borderColor: t.colors.border,
    },
    messageText: {
      fontSize: 16 * t.fontScale,
    },
    highlightedText: {
      backgroundColor: 'rgba(255, 220, 0, 0.5)',
      color: '#000',
      borderRadius: 3,
    },
    deletedText: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      fontStyle: 'italic',
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      justifyContent: 'flex-end',
    },
    timeText: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
    },
    imageMessage: {
      width: 200,
      height: 200,
      borderRadius: t.radius.md,
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
      paddingVertical: 10,
      gap: 8,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    audioLabel: {
      fontSize: 14 * t.fontScale,
      fontWeight: '500',
    },
    fileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    fileName: {
      fontSize: 14 * t.fontScale,
      fontWeight: '500',
    },
    fileSize: {
      fontSize: 12 * t.fontScale,
    },
  });
