import React, { useMemo } from 'react';
import { View, StyleSheet, ImageBackground, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle, Path } from 'react-native-svg';

import { WallpaperOption } from '../types';
import { Theme } from '../theme';

type ChatBackgroundProps = {
  wallpaper?: WallpaperOption;
  theme: Theme;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

// SVG desenlerini cizen yardimci bilesen
function PatternLayer({ pattern, color }: { pattern: string; color: string }) {
  const size = 24;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="p" patternUnits="userSpaceOnUse" width={size} height={size}>
          {pattern === 'dots' && <Circle cx={size / 2} cy={size / 2} r={1.6} fill={color} />}
          {pattern === 'grid' && (
            <Path d={`M ${size} 0 L 0 0 0 ${size}`} stroke={color} strokeWidth={1} fill="none" />
          )}
          {pattern === 'diagonal' && (
            <Path d={`M 0 ${size} L ${size} 0`} stroke={color} strokeWidth={1.4} fill="none" />
          )}
          {pattern === 'cross' && (
            <Path
              d={`M ${size / 2} ${size / 2 - 4} L ${size / 2} ${size / 2 + 4} M ${size / 2 - 4} ${size / 2} L ${size / 2 + 4} ${size / 2}`}
              stroke={color}
              strokeWidth={1.2}
              fill="none"
            />
          )}
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#p)" />
    </Svg>
  );
}

/**
 * Sohbet arka planini secili duvar kagidina gore cizer.
 * type: color | gradient | pattern | image. Deger yoksa tema arka plani kullanilir.
 */
export function ChatBackground({ wallpaper, theme, style, children }: ChatBackgroundProps) {
  const fallback = theme.colors.background;

  const content = useMemo(() => {
    if (!wallpaper) return null;

    if (wallpaper.type === 'gradient' && wallpaper.gradient && wallpaper.gradient.length >= 2) {
      return (
        <LinearGradient
          colors={wallpaper.gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      );
    }

    if (wallpaper.type === 'pattern') {
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.value || fallback }]}>
          <PatternLayer pattern={wallpaper.pattern ?? 'dots'} color={wallpaper.patternColor ?? theme.colors.border} />
        </View>
      );
    }

    if (wallpaper.type === 'image' && wallpaper.value) {
      return (
        <ImageBackground source={{ uri: wallpaper.value }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      );
    }

    // color
    if (wallpaper.type === 'color' && wallpaper.value) {
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.value }]} />;
    }

    return null;
  }, [wallpaper, fallback, theme.colors.border]);

  return (
    <View style={[{ flex: 1, backgroundColor: fallback }, style]}>
      {content}
      {children}
    </View>
  );
}
