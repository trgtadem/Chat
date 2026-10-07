import { ColorSchemeName } from 'react-native';
import { ThemeSettings } from '../types';
import { Palette, darkPalette, lightPalette, amoledPalette } from './palettes';
import { radius, spacing, Radius, Spacing, fontScaleMap } from './tokens';

export type { Palette } from './palettes';
export { radius, spacing } from './tokens';

export type ResolvedMode = 'light' | 'dark' | 'amoled';

export type Theme = {
  mode: ResolvedMode;
  colors: Palette;
  radius: Radius;
  spacing: Spacing;
  fontScale: number;
  bubbleStyle: 'default' | 'minimal' | 'rounded';
};

// Kullanicinin secebilecegi vurgu (accent) renk paleti
export const ACCENT_SWATCHES: string[] = [
  '#3B82F6', // mavi
  '#2563EB', // koyu mavi
  '#8B5CF6', // mor
  '#EC4899', // pembe
  '#EF4444', // kirmizi
  '#F59E0B', // amber
  '#10B981', // yesil
  '#14B8A6', // teal
  '#06B6D4', // camgobegi
  '#F97316', // turuncu
];

// system modunu cihaz temasina gore coz
function resolveMode(mode: ThemeSettings['mode'], scheme: ColorSchemeName): ResolvedMode {
  if (mode === 'system') return scheme === 'light' ? 'light' : 'dark';
  return mode;
}

// Bir rengin uzerine gelecek metin/ikon icin siyah mi beyaz mi daha okunur?
function contrastOn(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#FFFFFF';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Algilanan parlaklik (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#0B1220' : '#FFFFFF';
}

const basePalettes: Record<ResolvedMode, Palette> = {
  light: lightPalette,
  dark: darkPalette,
  amoled: amoledPalette,
};

/**
 * Ayarlardan ve cihaz temasindan aktif Theme nesnesini uretir.
 * Accent rengi primary/accent/read/gonderen-balonu renklerine enjekte edilir.
 */
export function buildTheme(settings: ThemeSettings, scheme: ColorSchemeName): Theme {
  const mode = resolveMode(settings.mode, scheme);
  const base = basePalettes[mode];
  const accent = settings.accentColor || base.primary;
  const onAccent = contrastOn(accent);

  const colors: Palette = {
    ...base,
    primary: accent,
    accent,
    onAccent,
    read: accent,
    myMessageBubble: accent,
    myMessageText: onAccent,
  };

  const fontScale = fontScaleMap[settings.fontSize] ?? 1;

  return {
    mode,
    colors,
    radius,
    spacing,
    fontScale,
    bubbleStyle: settings.chatBubbleStyle,
  };
}
