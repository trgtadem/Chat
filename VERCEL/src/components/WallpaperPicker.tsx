import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Check, ImageIcon } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';
import { WallpaperOption } from '../types';

interface WallpaperPickerProps {
  selectedWallpaper?: WallpaperOption;
  onSelect: (wallpaper: WallpaperOption | undefined) => void;
  title?: string;
}

const defaultWallpapers: WallpaperOption[] = [
  { id: 'none', type: 'color', value: 'transparent', name: 'None' },
  { id: 'dark', type: 'color', value: '#0A0A0F', name: 'Dark' },
  { id: 'midnight', type: 'color', value: '#0F172A', name: 'Midnight' },
  { id: 'navy', type: 'color', value: '#1E3A5F', name: 'Navy' },
  { id: 'forest', type: 'color', value: '#1A2F1A', name: 'Forest' },
  { id: 'burgundy', type: 'color', value: '#3D1A2F', name: 'Burgundy' },
  { id: 'gradient-purple', type: 'gradient', value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', name: 'Purple Night' },
  { id: 'gradient-ocean', type: 'gradient', value: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', name: 'Ocean' },
  { id: 'gradient-sunset', type: 'gradient', value: 'linear-gradient(180deg, #2d1f3d 0%, #3d2f4d 100%)', name: 'Sunset' },
];

const gradientColors: Record<string, string[]> = {
  'gradient-purple': ['#1a1a2e', '#16213e'],
  'gradient-ocean': ['#0f2027', '#2c5364'],
  'gradient-sunset': ['#2d1f3d', '#3d2f4d'],
};

function WallpaperCard({
  wallpaper,
  isSelected,
  onPress,
}: {
  wallpaper: WallpaperOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const renderPreview = () => {
    if (wallpaper.id === 'none') {
      return (
        <View style={styles.nonePreview}>
          <View style={styles.nonePattern}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.noneLine} />
            ))}
          </View>
        </View>
      );
    }

    if (wallpaper.type === 'color') {
      return <View style={[styles.colorPreview, { backgroundColor: wallpaper.value }]} />;
    }

    if (wallpaper.type === 'gradient') {
      const gradColors = gradientColors[wallpaper.id] || ['#1a1a2e', '#16213e'];
      return (
        <View style={styles.gradientPreview}>
          <View style={[styles.gradientTop, { backgroundColor: gradColors[0] }]} />
          <View style={[styles.gradientBottom, { backgroundColor: gradColors[1] }]} />
        </View>
      );
    }

    if (wallpaper.type === 'image' && wallpaper.preview) {
      return <Image source={{ uri: wallpaper.preview }} style={styles.imagePreview} />;
    }

    return (
      <View style={styles.imagePlaceholder}>
        <ImageIcon size={24} color={colors.textTertiary} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.wallpaperCard, isSelected && styles.wallpaperCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.previewContainer}>{renderPreview()}</View>
      {isSelected && (
        <View style={styles.checkContainer}>
          <Check size={16} color={colors.textPrimary} />
        </View>
      )}
      <Text style={styles.wallpaperName} numberOfLines={1}>
        {wallpaper.name}
      </Text>
    </TouchableOpacity>
  );
}

export function WallpaperPicker({ selectedWallpaper, onSelect, title }: WallpaperPickerProps) {
  const handleSelect = (wallpaper: WallpaperOption) => {
    if (wallpaper.id === 'none') {
      onSelect(undefined);
    } else {
      onSelect(wallpaper);
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {defaultWallpapers.map((wallpaper) => (
          <WallpaperCard
            key={wallpaper.id}
            wallpaper={wallpaper}
            isSelected={
              wallpaper.id === 'none'
                ? !selectedWallpaper
                : selectedWallpaper?.id === wallpaper.id
            }
            onPress={() => handleSelect(wallpaper)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  wallpaperCard: {
    width: 80,
    alignItems: 'center',
  },
  wallpaperCardSelected: {
    opacity: 1,
  },
  previewContainer: {
    width: 70,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPreview: {
    flex: 1,
  },
  nonePreview: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonePattern: {
    width: '100%',
    height: '100%',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  noneLine: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  gradientPreview: {
    flex: 1,
  },
  gradientTop: {
    flex: 1,
  },
  gradientBottom: {
    flex: 1,
  },
  imagePreview: {
    flex: 1,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wallpaperName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default WallpaperPicker;
