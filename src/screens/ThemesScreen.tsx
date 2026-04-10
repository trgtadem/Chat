import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Check } from 'lucide-react-native';

import { COLORS } from '../styles/baseStyles';
import { RootStackParamList } from '../types/navigation';
import { useAppContext } from '../context/AppContext';

type ThemesScreenProps = NativeStackScreenProps<RootStackParamList, 'Themes'>;

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function OptionChip({ label, active, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.optionChip, active && styles.optionChipActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
      {active ? <Check size={16} color={COLORS.background} /> : null}
    </TouchableOpacity>
  );
}

export function ThemesScreen({ navigation }: ThemesScreenProps) {
  const { themeSettings, updateThemeSettings } = useAppContext();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Temalar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görünüm</Text>
          <OptionChip
            label="Sistem"
            active={themeSettings.appearance === 'system'}
            onPress={() => updateThemeSettings({ appearance: 'system' })}
          />
          <OptionChip
            label="Açık"
            active={themeSettings.appearance === 'light'}
            onPress={() => updateThemeSettings({ appearance: 'light' })}
          />
          <OptionChip
            label="Koyu"
            active={themeSettings.appearance === 'dark'}
            onPress={() => updateThemeSettings({ appearance: 'dark' })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesaj Balonu Stili</Text>
          <OptionChip
            label="Klasik"
            active={themeSettings.chatBubbleStyle === 'default'}
            onPress={() => updateThemeSettings({ chatBubbleStyle: 'default' })}
          />
          <OptionChip
            label="Minimal"
            active={themeSettings.chatBubbleStyle === 'minimal'}
            onPress={() => updateThemeSettings({ chatBubbleStyle: 'minimal' })}
          />
          <OptionChip
            label="Yuvarlatılmış"
            active={themeSettings.chatBubbleStyle === 'rounded'}
            onPress={() => updateThemeSettings({ chatBubbleStyle: 'rounded' })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yazı Boyutu</Text>
          <OptionChip
            label="Küçük"
            active={themeSettings.fontSize === 'small'}
            onPress={() => updateThemeSettings({ fontSize: 'small' })}
          />
          <OptionChip
            label="Orta"
            active={themeSettings.fontSize === 'medium'}
            onPress={() => updateThemeSettings({ fontSize: 'medium' })}
          />
          <OptionChip
            label="Büyük"
            active={themeSettings.fontSize === 'large'}
            onPress={() => updateThemeSettings({ fontSize: 'large' })}
          />
        </View>
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.background,
  },
});
