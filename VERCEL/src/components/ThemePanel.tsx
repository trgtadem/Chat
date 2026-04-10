import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  Moon,
  Sun,
  Smartphone,
  MessageSquare,
  Type,
  Check,
} from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { ThemeSettings, WallpaperOption } from '../types';
import { PanelHeader } from './PanelHeader';
import { SettingsSection } from './SettingsSection';
import { WallpaperPicker } from './WallpaperPicker';

interface ThemePanelProps {
  visible: boolean;
  onClose: () => void;
}

type AppearanceOption = ThemeSettings['appearance'];
type BubbleStyleOption = ThemeSettings['chatBubbleStyle'];
type FontSizeOption = ThemeSettings['fontSize'];

function OptionButton({
  label,
  icon,
  isSelected,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionIcon}>{icon}</View>
      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
      {isSelected && (
        <View style={styles.optionCheck}>
          <Check size={16} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChatBubblePreview({ style }: { style: BubbleStyleOption }) {
  const bubbleStyles: Record<BubbleStyleOption, { sent: object; received: object }> = {
    default: {
      sent: { borderRadius: 18, borderBottomRightRadius: 4 },
      received: { borderRadius: 18, borderBottomLeftRadius: 4 },
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

  return (
    <View style={styles.bubblePreview}>
      <View style={[styles.bubbleReceived, bubbleStyles[style].received]}>
        <Text style={styles.bubbleText}>Hi there!</Text>
      </View>
      <View style={[styles.bubbleSent, bubbleStyles[style].sent]}>
        <Text style={styles.bubbleText}>Hello!</Text>
      </View>
    </View>
  );
}

export function ThemePanel({ visible, onClose }: ThemePanelProps) {
  const { themeSettings, updateThemeSettings } = useAppContext();

  const handleAppearanceChange = (appearance: AppearanceOption) => {
    updateThemeSettings({ appearance });
  };

  const handleBubbleStyleChange = (chatBubbleStyle: BubbleStyleOption) => {
    updateThemeSettings({ chatBubbleStyle });
  };

  const handleFontSizeChange = (newFontSize: FontSizeOption) => {
    updateThemeSettings({ fontSize: newFontSize });
  };

  const handleWallpaperChange = (wallpaper: WallpaperOption | undefined) => {
    updateThemeSettings({ globalWallpaper: wallpaper });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <PanelHeader title="Theme & Appearance" onBack={onClose} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* App Appearance */}
          <SettingsSection title="App Appearance">
            <View style={styles.optionsContainer}>
              <OptionButton
                label="Dark"
                icon={<Moon size={20} color={themeSettings.appearance === 'dark' ? colors.primary : colors.textSecondary} />}
                isSelected={themeSettings.appearance === 'dark'}
                onPress={() => handleAppearanceChange('dark')}
              />
              <OptionButton
                label="Light"
                icon={<Sun size={20} color={themeSettings.appearance === 'light' ? colors.primary : colors.textSecondary} />}
                isSelected={themeSettings.appearance === 'light'}
                onPress={() => handleAppearanceChange('light')}
              />
              <OptionButton
                label="System"
                icon={<Smartphone size={20} color={themeSettings.appearance === 'system' ? colors.primary : colors.textSecondary} />}
                isSelected={themeSettings.appearance === 'system'}
                onPress={() => handleAppearanceChange('system')}
              />
            </View>
          </SettingsSection>

          {/* Chat Bubble Style */}
          <SettingsSection title="Chat Bubble Style">
            <View style={styles.bubbleSection}>
              <View style={styles.bubbleOptions}>
                {(['default', 'minimal', 'rounded'] as BubbleStyleOption[]).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.bubbleOption,
                      themeSettings.chatBubbleStyle === style && styles.bubbleOptionSelected,
                    ]}
                    onPress={() => handleBubbleStyleChange(style)}
                  >
                    <ChatBubblePreview style={style} />
                    <Text
                      style={[
                        styles.bubbleOptionLabel,
                        themeSettings.chatBubbleStyle === style && styles.bubbleOptionLabelSelected,
                      ]}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SettingsSection>

          {/* Font Size */}
          <SettingsSection title="Message Font Size">
            <View style={styles.fontSizeContainer}>
              {(['small', 'medium', 'large'] as FontSizeOption[]).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeOption,
                    themeSettings.fontSize === size && styles.fontSizeOptionSelected,
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                >
                  <Type
                    size={size === 'small' ? 14 : size === 'medium' ? 18 : 22}
                    color={themeSettings.fontSize === size ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.fontSizeLabel,
                      themeSettings.fontSize === size && styles.fontSizeLabelSelected,
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsSection>

          {/* Global Wallpaper */}
          <SettingsSection
            title="Default Chat Wallpaper"
            footer="This wallpaper will be used for all chats unless you set a custom wallpaper for a specific conversation."
          >
            <View style={styles.wallpaperContainer}>
              <WallpaperPicker
                selectedWallpaper={themeSettings.globalWallpaper}
                onSelect={handleWallpaperChange}
              />
            </View>
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
  optionsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
  },
  optionIcon: {
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  bubbleSection: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bubbleOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bubbleOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bubbleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  bubbleOptionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  bubbleOptionLabelSelected: {
    color: colors.primary,
  },
  bubblePreview: {
    width: 80,
    height: 60,
    gap: spacing.xs,
    padding: spacing.xs,
  },
  bubbleReceived: {
    backgroundColor: colors.messageReceived,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  bubbleSent: {
    backgroundColor: colors.messageSent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 8,
    color: colors.textPrimary,
  },
  fontSizeContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  fontSizeOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  fontSizeOptionSelected: {
    borderColor: colors.primary,
  },
  fontSizeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fontSizeLabelSelected: {
    color: colors.primary,
  },
  wallpaperContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
});

export default ThemePanel;
