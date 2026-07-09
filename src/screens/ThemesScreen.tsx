import React, { useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Check, Monitor, Sun, Moon, MoonStar } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme, ACCENT_SWATCHES } from '../theme';
import { ThemeMode } from '../types';

type ThemesScreenProps = NativeStackScreenProps<RootStackParamList, 'Themes'>;

const MODE_OPTIONS: { key: ThemeMode; label: string; Icon: any }[] = [
  { key: 'system', label: 'Sistem', Icon: Monitor },
  { key: 'light', label: 'Açık', Icon: Sun },
  { key: 'dark', label: 'Koyu', Icon: Moon },
  { key: 'amoled', label: 'AMOLED', Icon: MoonStar },
];

const BUBBLE_OPTIONS: { key: 'default' | 'minimal' | 'rounded'; label: string }[] = [
  { key: 'default', label: 'Klasik' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'rounded', label: 'Yuvarlak' },
];

const FONT_OPTIONS: { key: 'small' | 'medium' | 'large'; label: string }[] = [
  { key: 'small', label: 'Küçük' },
  { key: 'medium', label: 'Orta' },
  { key: 'large', label: 'Büyük' },
];

export function ThemesScreen({ navigation }: ThemesScreenProps) {
  const { themeSettings, updateThemeSettings } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const bubbleShape = (isMe: boolean) => {
    if (theme.bubbleStyle === 'rounded') return { borderRadius: theme.radius.lg };
    if (theme.bubbleStyle === 'minimal') return { borderRadius: theme.radius.sm };
    return {
      borderRadius: theme.radius.lg,
      ...(isMe ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Temalar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Canli onizleme */}
        <View style={styles.previewPanel}>
          <Text style={styles.previewLabel}>Önizleme</Text>
          <View style={[styles.bubble, styles.theirBubble, bubbleShape(false)]}>
            <Text style={[styles.bubbleText, { color: theme.colors.theirMessageText }]}>
              Selam! Yeni tema nasıl görünüyor?
            </Text>
          </View>
          <View style={[styles.bubble, styles.myBubble, bubbleShape(true)]}>
            <Text style={[styles.bubbleText, { color: theme.colors.myMessageText }]}>
              Harika olmuş, tam istediğim gibi.
            </Text>
          </View>
        </View>

        {/* Gorunum modu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          <View style={styles.modeGrid}>
            {MODE_OPTIONS.map(({ key, label, Icon }) => {
              const active = themeSettings.mode === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.modeCard, active && styles.modeCardActive]}
                  onPress={() => updateThemeSettings({ mode: key })}
                  activeOpacity={0.85}
                >
                  <Icon size={22} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                  <Text style={[styles.modeLabel, active && { color: theme.colors.textPrimary }]}>{label}</Text>
                  {active ? (
                    <View style={styles.modeCheck}>
                      <Check size={12} color={theme.colors.onAccent} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Vurgu rengi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vurgu Rengi</Text>
          <View style={styles.swatchRow}>
            {ACCENT_SWATCHES.map((color) => {
              const active = themeSettings.accentColor?.toLowerCase() === color.toLowerCase();
              return (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    active && { borderColor: theme.colors.textPrimary, borderWidth: 3 },
                  ]}
                  onPress={() => updateThemeSettings({ accentColor: color })}
                  activeOpacity={0.85}
                >
                  {active ? <Check size={18} color="#FFFFFF" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Balon stili */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesaj Balonu Stili</Text>
          <View style={styles.segment}>
            {BUBBLE_OPTIONS.map(({ key, label }) => {
              const active = themeSettings.chatBubbleStyle === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => updateThemeSettings({ chatBubbleStyle: key })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Yazi boyutu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yazı Boyutu</Text>
          <View style={styles.segment}>
            {FONT_OPTIONS.map(({ key, label }) => {
              const active = themeSettings.fontSize === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => updateThemeSettings({ fontSize: key })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    headerTitle: {
      color: t.colors.textPrimary,
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
    },
    content: {
      padding: 16,
      gap: 16,
    },
    previewPanel: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
    },
    previewLabel: {
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
      marginBottom: 12,
    },
    bubble: {
      padding: 12,
      maxWidth: '82%',
      marginBottom: 8,
    },
    myBubble: {
      backgroundColor: t.colors.myMessageBubble,
      alignSelf: 'flex-end',
    },
    theirBubble: {
      backgroundColor: t.colors.theirMessageBubble,
      alignSelf: 'flex-start',
      borderWidth: t.colors.isDark ? 0 : 1,
      borderColor: t.colors.border,
    },
    bubbleText: {
      fontSize: 15 * t.fontScale,
    },
    section: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 14,
    },
    sectionTitle: {
      color: t.colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: 12 * t.fontScale,
      fontWeight: '700',
      marginBottom: 12,
    },
    modeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    modeCard: {
      width: '47%',
      flexGrow: 1,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.colors.surfaceAlt,
    },
    modeCardActive: {
      borderColor: t.colors.primary,
      borderWidth: 2,
    },
    modeLabel: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
    modeCheck: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: t.radius.pill,
      alignItems: 'center',
    },
    segmentItemActive: {
      backgroundColor: t.colors.primary,
    },
    segmentText: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: t.colors.onAccent,
    },
  });
