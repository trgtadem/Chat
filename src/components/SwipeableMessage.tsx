import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import { Check, CheckCheck, Play, Pause, Download, Reply, Film } from 'lucide-react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { Message } from '../types';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { formatTime } from '../utils';
import { useFeedback } from '../feedback/FeedbackContext';

/** Sag kaydirma mesafesi (px) */
const REPLY_TRAVEL = 64;
/** Bu esigi gecince yanit tetiklenir */
const REPLY_THRESHOLD = 40;

function bubbleShape(t: Theme, isMe: boolean) {
  if (t.bubbleStyle === 'rounded') {
    return { borderRadius: t.radius.lg };
  }
  if (t.bubbleStyle === 'minimal') {
    return { borderRadius: t.radius.sm };
  }
  return {
    borderRadius: t.radius.lg,
    ...(isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
  };
}

type Props = {
  item: Message;
  isMe: boolean;
  onReply: (message: Message) => void;
  onImagePress: (imageUrl: string) => void;
  onLongPress?: (message: Message) => void;
  onPress?: (message: Message) => void;
  selected?: boolean;
  selectionMode?: boolean;
  searchQuery?: string;
};

const SwipeableMessageComponent = ({
  item,
  isMe,
  onReply,
  onImagePress,
  onLongPress,
  onPress,
  selected = false,
  selectionMode = false,
  searchQuery = '',
}: Props) => {
  const theme = useTheme();
  const { toast } = useFeedback();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const dragX = useRef(new Animated.Value(0)).current;
  const dragOffsetRef = useRef(0);
  const repliedRef = useRef(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<AudioPlayer | null>(null);

  const bubbleTextColor = isMe ? theme.colors.myMessageText : theme.colors.theirMessageText;
  const shape = bubbleShape(theme, isMe);

  useEffect(() => {
    return () => {
      if (audioPlayer) {
        try {
          audioPlayer.pause();
          audioPlayer.release();
        } catch {
          /* ignore */
        }
      }
    };
  }, [audioPlayer]);

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
      const player = createAudioPlayer(item.audioUrl);
      setAudioPlayer(player);
      setAudioPlaying(true);
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setAudioPlaying(false);
          try {
            player.release();
          } catch {
            /* ignore */
          }
          setAudioPlayer(null);
        }
      });
      player.play();
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Ses oynatılamadı.');
    }
  };

  /** Kaydirma sirasinda ikon; birakinca 0'a animasyon → ikon aninda solar */
  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const x = Math.max(0, Math.min(REPLY_TRAVEL, event.nativeEvent.translationX));
      dragOffsetRef.current = x;
      dragX.setValue(x);
    },
    [dragX]
  );

  const snapBack = useCallback(() => {
    Animated.timing(dragX, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      dragOffsetRef.current = 0;
      repliedRef.current = false;
    });
  }, [dragX]);

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      const { state, translationX, velocityX } = event.nativeEvent;
      if (state !== State.END && state !== State.CANCELLED && state !== State.FAILED) {
        return;
      }

      const traveled = Math.max(translationX, dragOffsetRef.current);
      const shouldReply = traveled >= REPLY_THRESHOLD || velocityX > 600;

      if (shouldReply && !repliedRef.current) {
        repliedRef.current = true;
        onReply(item);
      }

      // Birakir birakmaz geri — ikon kaybolur (Swipeable open/close yok)
      snapBack();
    },
    [item, onReply, snapBack]
  );

  const rowTranslateX = dragX.interpolate({
    inputRange: [0, REPLY_TRAVEL],
    outputRange: [0, REPLY_TRAVEL],
    extrapolate: 'clamp',
  });

  const iconOpacity = dragX.interpolate({
    inputRange: [0, 12, REPLY_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const iconScale = dragX.interpolate({
    inputRange: [0, REPLY_THRESHOLD, REPLY_TRAVEL],
    outputRange: [0.5, 1, 1],
    extrapolate: 'clamp',
  });

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
          <TouchableOpacity
            onPress={() => {
              if (selectionMode) onPress?.(item);
              else onImagePress(item.imageUrl!);
            }}
            onLongPress={() => onLongPress?.(item)}
            delayLongPress={350}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.imageMessage} />
          </TouchableOpacity>
        );

      case 'audio':
        return (
          <View style={styles.audioContainer}>
            <TouchableOpacity style={styles.playButton} onPress={playAudio}>
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
              <Text style={[styles.fileName, { color: bubbleTextColor }]} numberOfLines={1}>
                {item.fileName || 'Dosya'}
              </Text>
              <Text style={[styles.fileSize, { color: bubbleTextColor, opacity: 0.7 }]}>Dosya</Text>
            </View>
          </View>
        );

      case 'video':
        return <VideoMessageBubble url={item.videoUrl} styles={styles} />;

      case 'text':
      default:
        return (
          <View>
            {renderHighlightedText(item.text ?? 'No content')}
            {item.editedAt ? (
              <Text style={[styles.editedLabel, { color: bubbleTextColor, opacity: 0.65 }]}>
                düzenlendi
              </Text>
            ) : null}
          </View>
        );
    }
  };

  const reactionEntries = Object.entries(item.reactions ?? {});

  const footerColor = isMe ? theme.colors.myMessageText : theme.colors.textSecondary;

  const bubble = (
    <Pressable
      onLongPress={() => onLongPress?.(item)}
      onPress={() => {
        if (selectionMode) onPress?.(item);
      }}
      delayLongPress={350}
      style={[
        styles.row,
        {
          alignItems: isMe ? 'flex-end' : 'flex-start',
          backgroundColor: selected ? `${theme.colors.primary}33` : 'transparent',
        },
      ]}
    >
      {item.replyTo && (
        <View style={styles.quotedMessage}>
          <View style={styles.quoteBar} />
          <View>
            <Text style={styles.quoteAuthor}>
              {item.replyTo.senderId === item.senderId ? 'Sen' : 'Karşı taraf'}
            </Text>
            <Text style={styles.quoteText} numberOfLines={1}>
              {item.replyTo.type === 'text'
                ? (item.replyTo.text ?? '')
                : `[${(item.replyTo.type ?? 'file').toUpperCase()}]`}
            </Text>
          </View>
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          shape,
          isMe ? styles.myMessageBubble : styles.theirMessageBubble,
          selected && styles.selectedBubble,
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
        {item.type !== 'image' && item.type !== 'video' && (
          <View style={styles.messageFooter}>
            <Text style={[styles.timeText, { color: footerColor, opacity: 0.8 }]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <View style={{ marginLeft: 4 }}>
                {item.status === 'read' ? (
                  <CheckCheck size={14} color={theme.colors.read} />
                ) : item.status === 'delivered' ? (
                  <CheckCheck size={14} color={theme.colors.textSecondary} />
                ) : (
                  <Check size={14} color={theme.colors.textSecondary} />
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {(item.type === 'image' || item.type === 'video') && (
        <View style={styles.imageFooter}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          {isMe && (
            <View style={{ marginLeft: 4 }}>
              {item.status === 'read' ? (
                <CheckCheck size={14} color={theme.colors.read} />
              ) : item.status === 'delivered' ? (
                <CheckCheck size={14} color={theme.colors.textSecondary} />
              ) : (
                <Check size={14} color={theme.colors.textSecondary} />
              )}
            </View>
          )}
        </View>
      )}

      {reactionEntries.length > 0 ? (
        <View style={[styles.reactionsRow, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
          {reactionEntries.map(([uid, emoji]) => (
            <View key={uid} style={styles.reactionChip}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );

  if (selectionMode) {
    return bubble;
  }

  return (
    <View style={styles.swipeContainer}>
      {/* Ikon sadece dragX > 0 iken gorunur; snapBack ile hemen solar */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.replyIconSlot,
          { opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
      >
        <View style={styles.replyIconCircle}>
          <Reply size={18} color={theme.colors.onAccent} />
        </View>
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={12}
        failOffsetY={[-16, 16]}
      >
        <Animated.View style={{ transform: [{ translateX: rowTranslateX }] }}>
          {bubble}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

function VideoMessageBubble({
  url,
  styles,
}: {
  url?: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const player = useVideoPlayer(url ?? null, (p) => {
    p.loop = false;
  });

  if (!url) {
    return (
      <View style={[styles.fileContainer, { padding: 12 }]}>
        <Film size={24} color="#888" />
        <Text style={styles.fileName}>Video yok</Text>
      </View>
    );
  }

  return (
    <View>
      <VideoView
        player={player}
        style={styles.videoMessage}
        nativeControls
        contentFit="cover"
      />
      <TouchableOpacity
        style={styles.videoOpenLink}
        onPress={() => Linking.openURL(url)}
      >
        <Text style={styles.videoOpenText}>Tarayıcıda aç</Text>
      </TouchableOpacity>
    </View>
  );
}

export const SwipeableMessage = React.memo(SwipeableMessageComponent);

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    swipeContainer: {
      width: '100%',
      justifyContent: 'center',
    },
    replyIconSlot: {
      position: 'absolute',
      left: 14,
      top: 0,
      bottom: 8,
      width: 34,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 0,
    },
    row: {
      width: '100%',
      marginBottom: 8,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    replyIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedBubble: {
      borderWidth: 2,
      borderColor: t.colors.primary,
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
    editedLabel: {
      fontSize: 11 * t.fontScale,
      marginTop: 2,
      fontStyle: 'italic',
    },
    videoMessage: {
      width: 220,
      height: 160,
      borderRadius: t.radius.md,
      backgroundColor: '#000',
    },
    videoOpenLink: { padding: 8, alignItems: 'center' },
    videoOpenText: {
      fontSize: 12 * t.fontScale,
      color: t.colors.primary,
      fontWeight: '600',
    },
    reactionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: -4,
      marginBottom: 4,
      paddingHorizontal: 8,
    },
    reactionChip: {
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      borderRadius: t.radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    reactionEmoji: { fontSize: 14 },
  });
