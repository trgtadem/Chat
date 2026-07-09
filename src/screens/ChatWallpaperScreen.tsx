import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Check, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { WallpaperOption } from '../types';
import { getChatId } from '../utils';
import { uploadToCloudinary } from '../services/media';
import { ChatBackground } from '../components/ChatBackground';
import {
  SOLID_WALLPAPERS,
  GRADIENT_WALLPAPERS,
  PATTERN_WALLPAPERS,
} from '../theme/wallpapers';

type ChatWallpaperScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatWallpaper'>;

type Category = 'color' | 'gradient' | 'pattern' | 'image';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'color', label: 'Renkler' },
  { key: 'gradient', label: 'Gradyanlar' },
  { key: 'pattern', label: 'Desenler' },
  { key: 'image', label: 'Fotoğrafım' },
];

export function ChatWallpaperScreen({ navigation, route }: ChatWallpaperScreenProps) {
  const { friend } = route.params;
  const { currentUser, getChatSettings, updateChatSettings, updateThemeSettings } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const chatId = currentUser ? getChatId(currentUser.id, friend.id) : '';
  const currentWallpaper = getChatSettings(chatId)?.wallpaper;

  const [selected, setSelected] = useState<WallpaperOption | undefined>(currentWallpaper);
  const [category, setCategory] = useState<Category>(currentWallpaper?.type ?? 'color');
  const [applyGlobal, setApplyGlobal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (!currentUser) return null;

  const dataForCategory: WallpaperOption[] =
    category === 'color'
      ? SOLID_WALLPAPERS
      : category === 'gradient'
        ? GRADIENT_WALLPAPERS
        : category === 'pattern'
          ? PATTERN_WALLPAPERS
          : selected?.type === 'image'
            ? [selected]
            : [];

  const isSelected = (item: WallpaperOption) => selected?.id === item.id;

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin gerekli', 'Duvar kağıdı seçmek için galeri izni gerekli.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const url = await uploadToCloudinary(result.assets[0].uri, 'wallpaper.jpg', 'image/jpeg');
        setSelected({ id: `img-${Date.now()}`, type: 'image', value: url, name: 'Fotoğrafım' });
      }
    } catch (error) {
      console.error('Wallpaper upload error:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir sorun oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = () => {
    if (applyGlobal) {
      updateThemeSettings({ globalWallpaper: selected });
    }
    updateChatSettings(chatId, { wallpaper: selected });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duvar Kağıdı</Text>
        <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
          <Text style={styles.applyText}>Uygula</Text>
        </TouchableOpacity>
      </View>

      {/* Canli onizleme */}
      <View style={styles.previewWrap}>
        <ChatBackground wallpaper={selected} theme={theme} style={styles.preview}>
          <View style={styles.previewContent}>
            <View style={[styles.previewBubble, styles.previewTheir]}>
              <Text style={{ color: theme.colors.theirMessageText, fontSize: 13 * theme.fontScale }}>Merhaba!</Text>
            </View>
            <View style={[styles.previewBubble, styles.previewMine]}>
              <Text style={{ color: theme.colors.myMessageText, fontSize: 13 * theme.fontScale }}>Duvar kağıdı önizlemesi</Text>
            </View>
          </View>
        </ChatBackground>
      </View>

      {/* Kategori sekmeleri */}
      <View style={styles.tabs}>
        {CATEGORIES.map(({ key, label }) => {
          const active = category === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setCategory(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {category === 'image' ? (
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} disabled={uploading} activeOpacity={0.85}>
              {uploading ? (
                <ActivityIndicator color={theme.colors.onAccent} />
              ) : (
                <>
                  <ImagePlus size={20} color={theme.colors.onAccent} />
                  <Text style={styles.uploadText}>Galeriden Seç</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.grid}>
          {dataForCategory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridItem, isSelected(item) && styles.gridItemActive]}
              onPress={() => setSelected(item)}
              activeOpacity={0.85}
            >
              <ChatBackground wallpaper={item} theme={theme} style={styles.gridPreview} />
              {isSelected(item) ? (
                <View style={styles.gridCheck}>
                  <Check size={14} color={theme.colors.onAccent} />
                </View>
              ) : null}
              {item.name ? <Text style={styles.gridLabel} numberOfLines={1}>{item.name}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Global secenegi */}
        <TouchableOpacity style={styles.globalRow} onPress={() => setApplyGlobal((v) => !v)} activeOpacity={0.85}>
          <View style={[styles.checkbox, applyGlobal && styles.checkboxActive]}>
            {applyGlobal ? <Check size={14} color={theme.colors.onAccent} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.globalTitle}>Tüm sohbetlere uygula</Text>
            <Text style={styles.globalSubtitle}>Bu duvar kağıdı varsayılan olarak tüm sohbetlerde kullanılır.</Text>
          </View>
        </TouchableOpacity>
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
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
    },
    applyButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primary,
    },
    applyText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 14 * t.fontScale,
    },
    previewWrap: {
      padding: 16,
    },
    preview: {
      height: 150,
      borderRadius: t.radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    previewContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 14,
      gap: 8,
    },
    previewBubble: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: t.radius.lg,
      maxWidth: '75%',
    },
    previewMine: {
      backgroundColor: t.colors.myMessageBubble,
      alignSelf: 'flex-end',
    },
    previewTheir: {
      backgroundColor: t.colors.theirMessageBubble,
      alignSelf: 'flex-start',
    },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: t.radius.pill,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: t.colors.primary,
    },
    tabText: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
    },
    tabTextActive: {
      color: t.colors.onAccent,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    imageSection: {
      marginBottom: 4,
    },
    uploadButton: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      paddingVertical: 14,
    },
    uploadText: {
      color: t.colors.onAccent,
      fontWeight: '700',
      fontSize: 15 * t.fontScale,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridItem: {
      width: '30%',
      flexGrow: 1,
      borderRadius: t.radius.lg,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: t.colors.surface,
    },
    gridItemActive: {
      borderColor: t.colors.primary,
    },
    gridPreview: {
      height: 90,
    },
    gridCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gridLabel: {
      color: t.colors.textSecondary,
      fontSize: 11 * t.fontScale,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    globalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 14,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: t.radius.sm,
      borderWidth: 2,
      borderColor: t.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    globalTitle: {
      color: t.colors.textPrimary,
      fontSize: 15 * t.fontScale,
      fontWeight: '700',
    },
    globalSubtitle: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
      marginTop: 3,
    },
  });
