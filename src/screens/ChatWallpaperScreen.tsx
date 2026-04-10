import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Check } from 'lucide-react-native';

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';
import { useAppContext } from '../context/AppContext';
import { WallpaperOption } from '../types';
import { getChatId } from '../utils';

type ChatWallpaperScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatWallpaper'>;

const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: 'default', type: 'color', value: COLORS.background, name: 'Varsayılan' },
  { id: 'midnight', type: 'color', value: '#0A1628', name: 'Gece Mavisi' },
  { id: 'ocean', type: 'color', value: '#112A46', name: 'Okyanus' },
  { id: 'forest', type: 'color', value: '#102A22', name: 'Orman' },
  { id: 'graphite', type: 'color', value: '#1E2432', name: 'Grafit' },
];

export function ChatWallpaperScreen({ navigation, route }: ChatWallpaperScreenProps) {
  const { friend } = route.params;
  const { currentUser, getChatSettings, updateChatSettings } = useAppContext();

  if (!currentUser) return null;

  const chatId = getChatId(currentUser.id, friend.id);
  const currentWallpaperId = getChatSettings(chatId)?.wallpaper?.id ?? 'default';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSelect = (wallpaper: WallpaperOption) => {
    updateChatSettings(chatId, {
      wallpaper,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duvar Kağıdı</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={WALLPAPER_OPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const active = currentWallpaperId === item.id;
          return (
            <TouchableOpacity
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.86}
            >
              <View style={[styles.preview, { backgroundColor: item.value }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{item.name}</Text>
                <Text style={styles.optionSubtitle}>{item.value}</Text>
              </View>
              {active ? <Check size={20} color={COLORS.primary} /> : null}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
  },
  preview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
});
