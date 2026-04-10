import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Image as ImageIcon,
  FileText,
  Link,
  Bell,
  BellOff,
  Wallpaper,
  UserX,
  Trash2,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { User, Message, SharedMedia, WallpaperOption, ChatSettings } from '../types';
import { Avatar } from './Avatar';
import { PanelHeader } from './PanelHeader';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { WallpaperPicker } from './WallpaperPicker';
import { EmptyState } from './EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_ITEM_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 3;

interface ChatDetailsPanelProps {
  visible: boolean;
  onClose: () => void;
  user: User;
  chatId: string;
  messages: Message[];
}

type MediaTab = 'images' | 'files' | 'links';

function formatLastSeen(lastSeen?: Date | null): string {
  if (!lastSeen) return 'Unknown';
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `Active ${minutes} min ago`;
  if (hours < 24) return `Active ${hours} hours ago`;
  if (days === 1) return 'Active yesterday';
  if (days < 7) return `Active ${days} days ago`;
  return `Last seen ${new Date(lastSeen).toLocaleDateString()}`;
}

function MediaGrid({ images, onImagePress }: { images: Message[]; onImagePress: (msg: Message) => void }) {
  if (images.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon size={40} color={colors.textTertiary} />}
        title="No images"
        description="Images shared in this chat will appear here"
      />
    );
  }

  return (
    <View style={styles.mediaGrid}>
      {images.map((msg) => (
        <TouchableOpacity
          key={msg.id}
          style={styles.mediaGridItem}
          onPress={() => onImagePress(msg)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: msg.imageUrl }} style={styles.mediaImage} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FilesList({ files }: { files: Message[] }) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={40} color={colors.textTertiary} />}
        title="No files"
        description="Files shared in this chat will appear here"
      />
    );
  }

  return (
    <View style={styles.filesList}>
      {files.map((msg) => (
        <TouchableOpacity key={msg.id} style={styles.fileItem} activeOpacity={0.7}>
          <View style={styles.fileIconContainer}>
            <FileText size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {msg.fileName || 'Untitled File'}
            </Text>
            <Text style={styles.fileType}>{msg.fileType || 'Unknown type'}</Text>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function LinksList({ links }: { links: Message[] }) {
  if (links.length === 0) {
    return (
      <EmptyState
        icon={<Link size={40} color={colors.textTertiary} />}
        title="No links"
        description="Links shared in this chat will appear here"
      />
    );
  }

  // Extract URLs from messages
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return (
    <View style={styles.linksList}>
      {links.map((msg) => {
        const urls = msg.text?.match(urlRegex) || [];
        return urls.map((url, index) => (
          <TouchableOpacity
            key={`${msg.id}-${index}`}
            style={styles.linkItem}
            activeOpacity={0.7}
          >
            <View style={styles.linkIconContainer}>
              <Link size={18} color={colors.primary} />
            </View>
            <Text style={styles.linkUrl} numberOfLines={2}>
              {url}
            </Text>
          </TouchableOpacity>
        ));
      })}
    </View>
  );
}

export function ChatDetailsPanel({
  visible,
  onClose,
  user,
  chatId,
  messages,
}: ChatDetailsPanelProps) {
  const { getChatSettings, updateChatSettings, blockUser, isUserBlocked } = useAppContext();
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('images');
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);

  const chatSettings = getChatSettings(chatId) || { chatId, muted: false };
  const isBlocked = isUserBlocked(user.id);

  // Derive shared media from messages
  const sharedMedia = useMemo<SharedMedia>(() => {
    const images: Message[] = [];
    const files: Message[] = [];
    const links: Message[] = [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    messages.forEach((msg) => {
      if (msg.imageUrl) {
        images.push(msg);
      }
      if (msg.fileUrl) {
        files.push(msg);
      }
      if (msg.text && urlRegex.test(msg.text)) {
        links.push(msg);
      }
    });

    return {
      images: images.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      files: files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      links: links.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    };
  }, [messages]);

  const handleMuteToggle = () => {
    updateChatSettings(chatId, { muted: !chatSettings.muted });
  };

  const handleWallpaperSelect = (wallpaper: WallpaperOption | undefined) => {
    updateChatSettings(chatId, { wallpaper });
    setShowWallpaperPicker(false);
  };

  const handleBlockUser = () => {
    if (isBlocked) {
      // TODO: Implement unblock
      return;
    }

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${user.displayName}? They won't be able to message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => blockUser(user.id),
        },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement chat deletion
            console.log('Delete chat:', chatId);
            onClose();
          },
        },
      ]
    );
  };

  const handleImagePress = (msg: Message) => {
    // TODO: Open image viewer
    console.log('Open image:', msg.imageUrl);
  };

  const renderMediaContent = () => {
    switch (activeMediaTab) {
      case 'images':
        return <MediaGrid images={sharedMedia.images} onImagePress={handleImagePress} />;
      case 'files':
        return <FilesList files={sharedMedia.files} />;
      case 'links':
        return <LinksList links={sharedMedia.links} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <PanelHeader
          title="Contact Info"
          onBack={onClose}
          rightElement={
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MoreHorizontal size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Profile Header */}
          <View style={styles.profileHeader}>
            <Avatar
              source={user.photoURL}
              name={user.displayName}
              size="xlarge"
              showOnlineIndicator
              isOnline={user.isOnline}
            />
            <Text style={styles.userName}>{user.displayName}</Text>
            <Text style={styles.userStatus}>
              {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
            </Text>
            {user.about && <Text style={styles.userAbout}>{user.about}</Text>}
          </View>

          {/* Shared Media Section */}
          <SettingsSection title="Shared Media">
            <View style={styles.mediaSection}>
              {/* Media Tabs */}
              <View style={styles.mediaTabs}>
                <TouchableOpacity
                  style={[styles.mediaTab, activeMediaTab === 'images' && styles.mediaTabActive]}
                  onPress={() => setActiveMediaTab('images')}
                >
                  <ImageIcon
                    size={18}
                    color={activeMediaTab === 'images' ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.mediaTabText,
                      activeMediaTab === 'images' && styles.mediaTabTextActive,
                    ]}
                  >
                    Images ({sharedMedia.images.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaTab, activeMediaTab === 'files' && styles.mediaTabActive]}
                  onPress={() => setActiveMediaTab('files')}
                >
                  <FileText
                    size={18}
                    color={activeMediaTab === 'files' ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.mediaTabText,
                      activeMediaTab === 'files' && styles.mediaTabTextActive,
                    ]}
                  >
                    Files ({sharedMedia.files.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaTab, activeMediaTab === 'links' && styles.mediaTabActive]}
                  onPress={() => setActiveMediaTab('links')}
                >
                  <Link
                    size={18}
                    color={activeMediaTab === 'links' ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.mediaTabText,
                      activeMediaTab === 'links' && styles.mediaTabTextActive,
                    ]}
                  >
                    Links ({sharedMedia.links.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Media Content */}
              <View style={styles.mediaContent}>{renderMediaContent()}</View>
            </View>
          </SettingsSection>

          {/* Chat Settings */}
          <SettingsSection title="Chat Settings">
            <SettingsRow
              icon={
                chatSettings.muted ? (
                  <BellOff size={18} color={colors.textSecondary} />
                ) : (
                  <Bell size={18} color={colors.textSecondary} />
                )
              }
              title="Mute Notifications"
              subtitle={chatSettings.muted ? 'Notifications are muted' : 'Notifications are on'}
              isSwitch
              switchValue={chatSettings.muted}
              onSwitchChange={handleMuteToggle}
              showChevron={false}
              isFirst
            />
            <SettingsRow
              icon={<Wallpaper size={18} color={colors.textSecondary} />}
              title="Chat Wallpaper"
              subtitle={chatSettings.wallpaper?.name || 'Default'}
              onPress={() => setShowWallpaperPicker(true)}
              isLast
            />
          </SettingsSection>

          {/* Wallpaper Picker */}
          {showWallpaperPicker && (
            <View style={styles.wallpaperPickerContainer}>
              <WallpaperPicker
                selectedWallpaper={chatSettings.wallpaper}
                onSelect={handleWallpaperSelect}
                title="Select Wallpaper"
              />
            </View>
          )}

          {/* Danger Zone */}
          <SettingsSection>
            <SettingsRow
              icon={<UserX size={18} color={colors.danger} />}
              title={isBlocked ? 'Unblock User' : 'Block User'}
              isDestructive
              showChevron={false}
              onPress={handleBlockUser}
              isFirst
            />
            <SettingsRow
              icon={<Trash2 size={18} color={colors.danger} />}
              title="Delete Chat"
              isDestructive
              showChevron={false}
              onPress={handleDeleteChat}
              isLast
            />
          </SettingsSection>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  userStatus: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  userAbout: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  mediaSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  mediaTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mediaTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  mediaTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  mediaTabText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  mediaTabTextActive: {
    color: colors.primary,
  },
  mediaContent: {
    minHeight: 200,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  mediaGridItem: {
    width: MEDIA_ITEM_SIZE,
    height: MEDIA_ITEM_SIZE,
    padding: spacing.xs / 2,
  },
  mediaImage: {
    flex: 1,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  filesList: {
    padding: spacing.sm,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.sm,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  fileType: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  linksList: {
    padding: spacing.sm,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.sm,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  linkUrl: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  wallpaperPickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

export default ChatDetailsPanel;
